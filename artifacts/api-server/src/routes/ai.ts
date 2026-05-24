import { Router, type IRouter } from "express";
import { db, conversationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AiChatBody } from "@workspace/api-zod";
import { generateAiInsights, generateAiChatResponse } from "../lib/ai-analysis";
import { groq, CHAT_MODEL } from "../lib/groq-client";
import { logger } from "../lib/logger";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, conversationId } = parsed.data;

  let convId = conversationId ?? randomUUID();
  let existingMessages: { role: string; content: string }[] = [];

  if (conversationId) {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.conversationId, conversationId));
    if (conv) {
      existingMessages = conv.messages as { role: string; content: string }[];
    }
  }

  const { response, suggestedPrompts } = await generateAiChatResponse(message, existingMessages);

  const newMessages = [
    ...existingMessages,
    { role: "user", content: message },
    { role: "assistant", content: response },
  ];

  const existing = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.conversationId, convId));

  if (existing.length > 0) {
    await db
      .update(conversationsTable)
      .set({ messages: newMessages, updatedAt: new Date() })
      .where(eq(conversationsTable.conversationId, convId));
  } else {
    await db.insert(conversationsTable).values({
      conversationId: convId,
      messages: newMessages,
    });
  }

  res.json({ response, conversationId: convId, suggestedPrompts });
});

router.post("/ai/chat/stream", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, conversationId } = parsed.data;

  let convId = conversationId ?? randomUUID();
  let existingMessages: { role: string; content: string }[] = [];

  if (conversationId) {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.conversationId, conversationId));
    if (conv) {
      existingMessages = conv.messages as { role: string; content: string }[];
    }
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const systemPrompt = `You are NullTrace AI, an expert DevOps observability assistant embedded in the NullTrace platform. You help SRE and DevOps engineers diagnose incidents, analyze logs, understand Kubernetes cluster state, and resolve production issues fast.

Current infrastructure context:
- Platform: Kubernetes (production namespace)
- Active incidents: PostgreSQL connection pool exhaustion (CRITICAL), auth failures spike (HIGH)
- Degraded services: checkout-service, auth-service, payment-service
- System health score: 84%
- Key metrics: checkout error rate 12.3%, DB pool at 91%, auth failure rate elevated

Be concise, technical, and actionable. Use markdown for structure. Always include runnable kubectl commands when relevant. Format code blocks with triple backticks. Keep responses under 600 words unless deep analysis is required.`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...existingMessages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  let fullResponse = "";

  try {
    const stream = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 1024,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    const newMessages = [
      ...existingMessages,
      { role: "user", content: message },
      { role: "assistant", content: fullResponse },
    ];

    const existing = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.conversationId, convId));

    if (existing.length > 0) {
      await db
        .update(conversationsTable)
        .set({ messages: newMessages, updatedAt: new Date() })
        .where(eq(conversationsTable.conversationId, convId));
    } else {
      await db.insert(conversationsTable).values({
        conversationId: convId,
        messages: newMessages,
      });
    }

    res.write(`data: ${JSON.stringify({ done: true, conversationId: convId })}\n\n`);
    res.end();
  } catch (err) {
    logger.error({ err }, "Groq streaming chat failed");
    res.write(`data: ${JSON.stringify({ error: "AI service temporarily unavailable" })}\n\n`);
    res.end();
  }
});

router.get("/ai/insights", async (_req, res): Promise<void> => {
  res.json(generateAiInsights());
});

export default router;
