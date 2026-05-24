import { Router, type IRouter } from "express";
import { db, conversationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AiChatBody } from "@workspace/api-zod";
import {
  generateAiInsights,
  generateAiChatResponse,
} from "../lib/ai-analysis";
import { logger } from "../lib/logger";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.message,
    });

    return;
  }

  const { message, conversationId } = parsed.data;

  let convId = conversationId ?? randomUUID();

  let existingMessages: {
    role: string;
    content: string;
  }[] = [];

  if (conversationId) {
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(
        eq(
          conversationsTable.conversationId,
          conversationId
        )
      );

    if (conv) {
      existingMessages = conv.messages as {
        role: string;
        content: string;
      }[];
    }
  }

  const {
    response,
    suggestedPrompts,
  } = await generateAiChatResponse(
    message,
    existingMessages
  );

  const newMessages = [
    ...existingMessages,
    {
      role: "user",
      content: message,
    },
    {
      role: "assistant",
      content: response,
    },
  ];

  const existing = await db
    .select()
    .from(conversationsTable)
    .where(
      eq(
        conversationsTable.conversationId,
        convId
      )
    );

  if (existing.length > 0) {
    await db
      .update(conversationsTable)
      .set({
        messages: newMessages,
        updatedAt: new Date(),
      })
      .where(
        eq(
          conversationsTable.conversationId,
          convId
        )
      );
  } else {
    await db
      .insert(conversationsTable)
      .values({
        conversationId: convId,
        messages: newMessages,
      });
  }

  res.json({
    response,
    conversationId: convId,
    suggestedPrompts,
  });
});

router.post(
  "/ai/chat/stream",
  async (req, res): Promise<void> => {
    const parsed = AiChatBody.safeParse(
      req.body
    );

    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.message,
      });

      return;
    }

    const { message, conversationId } =
      parsed.data;

    let convId =
      conversationId ?? randomUUID();

    let existingMessages: {
      role: string;
      content: string;
    }[] = [];

    if (conversationId) {
      const [conv] = await db
        .select()
        .from(conversationsTable)
        .where(
          eq(
            conversationsTable.conversationId,
            conversationId
          )
        );

      if (conv) {
        existingMessages =
          conv.messages as {
            role: string;
            content: string;
          }[];
      }
    }

    res.setHeader(
      "Content-Type",
      "text/event-stream"
    );

    res.setHeader(
      "Cache-Control",
      "no-cache"
    );

    res.setHeader(
      "Connection",
      "keep-alive"
    );

    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );

    try {
      const fakeResponse = `
# NullTrace AI Analysis

Incident analysis completed successfully.

## Findings
- PostgreSQL latency elevated
- API response times degraded
- Redis memory pressure detected

## Recommended Commands

\`\`\`bash
kubectl get pods -A
kubectl top pods
kubectl logs deployment/api-server
\`\`\`

## Suggested Fix
- Restart affected pods
- Scale deployment replicas
- Clear Redis cache
      `.trim();

      const words = fakeResponse.split(" ");

      let fullResponse = "";

      for (const word of words) {
        fullResponse += word + " ";

        res.write(
          \`data: \${JSON.stringify({
            content: word + " ",
          })}\n\n\`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 25)
        );
      }

      const newMessages = [
        ...existingMessages,
        {
          role: "user",
          content: message,
        },
        {
          role: "assistant",
          content: fullResponse,
        },
      ];

      const existing = await db
        .select()
        .from(conversationsTable)
        .where(
          eq(
            conversationsTable.conversationId,
            convId
          )
        );

      if (existing.length > 0) {
        await db
          .update(conversationsTable)
          .set({
            messages: newMessages,
            updatedAt: new Date(),
          })
          .where(
            eq(
              conversationsTable.conversationId,
              convId
            )
          );
      } else {
        await db
          .insert(conversationsTable)
          .values({
            conversationId: convId,
            messages: newMessages,
          });
      }

      res.write(
        \`data: \${JSON.stringify({
          done: true,
          conversationId: convId,
        })}\n\n\`
      );

      res.end();
    } catch (err) {
      logger.error(
        { err },
        "AI streaming failed"
      );

      res.write(
        \`data: \${JSON.stringify({
          error:
            "AI service temporarily unavailable",
        })}\n\n\`
      );

      res.end();
    }
  }
);

router.get(
  "/ai/insights",
  async (_req, res): Promise<void> => {
    res.json(generateAiInsights());
  }
);

export default router;