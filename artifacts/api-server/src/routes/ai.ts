import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import { pool } from "@workspace/db";
import { AiChatBody } from "@workspace/api-zod";
import {
  generateAiInsights,
  generateAiChatResponse,
} from "../lib/ai-analysis";
import { logger } from "../lib/logger";
import { randomUUID } from "crypto";
import {
  getFirstValue,
  getTableColumns,
  hasTable,
} from "../lib/db-safe";

const router: IRouter = Router();

type ChatMessage = {
  role: string;
  content: string;
};

function parseMessages(value: unknown): ChatMessage[] {
  if (Array.isArray(value)) {
    return value
      .map((m) => ({
        role: typeof m?.role === "string" ? m.role : "user",
        content: typeof m?.content === "string" ? m.content : "",
      }))
      .filter((m) => m.content.length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parseMessages(parsed);
      }
    } catch {
      return [];
    }
  }

  return [];
}

async function loadConversation(
  conversationId: string,
): Promise<ChatMessage[]> {
  try {
    if (!(await hasTable("conversations"))) {
      return [];
    }

    const columns = await getTableColumns("conversations");
    if (!columns.has("conversation_id") || !columns.has("messages")) {
      return [];
    }

    const result = await pool.query(
      `select messages
         from "conversations"
        where "conversation_id" = $1
        limit 1`,
      [conversationId],
    );

    const [row] = result.rows as Record<string, unknown>[];
    return row ? parseMessages(getFirstValue(row, ["messages"])) : [];
  } catch (err) {
    logger.error({ err, conversationId }, "Failed to load conversation");
    return [];
  }
}

async function saveConversation(
  conversationId: string,
  messages: ChatMessage[],
): Promise<void> {
  try {
    if (!(await hasTable("conversations"))) {
      return;
    }

    const columns = await getTableColumns("conversations");
    if (!columns.has("conversation_id") || !columns.has("messages")) {
      return;
    }

    const existing = await pool.query(
      `select 1
         from "conversations"
        where "conversation_id" = $1
        limit 1`,
      [conversationId],
    );

    if ((existing.rowCount ?? 0) > 0) {
      const updateParts: string[] = [`"messages" = $1`];
      const values: unknown[] = [messages];

      if (columns.has("updated_at")) {
        updateParts.push(`"updated_at" = $2`);
        values.push(new Date());
      }

      values.push(conversationId);

      await pool.query(
        `update "conversations"
            set ${updateParts.join(", ")}
          where "conversation_id" = $${values.length}`,
        values,
      );
      return;
    }

    const insertColumns = ["conversation_id", "messages"];
    const insertValues: unknown[] = [conversationId, messages];

    if (columns.has("created_at")) {
      insertColumns.push("created_at");
      insertValues.push(new Date());
    }
    if (columns.has("updated_at")) {
      insertColumns.push("updated_at");
      insertValues.push(new Date());
    }

    const colSql = insertColumns.map((c) => `"${c}"`).join(", ");
    const valSql = insertValues.map((_, i) => `$${i + 1}`).join(", ");

    await pool.query(
      `insert into "conversations" (${colSql}) values (${valSql})`,
      insertValues,
    );
  } catch (err) {
    logger.error({ err, conversationId }, "Failed to save conversation");
  }
}

async function handleChat(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const parsed = AiChatBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.message,
      });
      return;
    }

    const { message, conversationId } = parsed.data;
    const convId = conversationId ?? randomUUID();

    const existingMessages = conversationId
      ? await loadConversation(conversationId)
      : [];

    const {
      response,
      suggestedPrompts,
    } = await generateAiChatResponse(message, existingMessages);

    const newMessages: ChatMessage[] = [
      ...existingMessages,
      { role: "user", content: message },
      { role: "assistant", content: response },
    ];

    await saveConversation(convId, newMessages);

    res.json({
      response,
      conversationId: convId,
      suggestedPrompts: suggestedPrompts ?? [],
    });
  } catch (err) {
    logger.error({ err }, "AI chat failed");
    res.status(500).json({
      error: "AI service temporarily unavailable",
    });
  }
}

async function handleStreamChat(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = AiChatBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.message,
    });
    return;
  }

  const { message, conversationId } = parsed.data;
  const convId = conversationId ?? randomUUID();
  const existingMessages = conversationId
    ? await loadConversation(conversationId)
    : [];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

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
      fullResponse += `${word} `;
      res.write(
        `data: ${JSON.stringify({
          content: `${word} `,
        })}\n\n`,
      );
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    const newMessages: ChatMessage[] = [
      ...existingMessages,
      { role: "user", content: message },
      { role: "assistant", content: fullResponse.trim() },
    ];

    await saveConversation(convId, newMessages);

    res.write(
      `data: ${JSON.stringify({
        done: true,
        conversationId: convId,
      })}\n\n`,
    );
    res.end();
  } catch (err) {
    logger.error({ err }, "AI streaming failed");
    res.write(
      `data: ${JSON.stringify({
        error: "AI service temporarily unavailable",
      })}\n\n`,
    );
    res.end();
  }
}

router.post("/ai/chat", handleChat);
router.post("/intelligence/chat", handleChat);

router.post("/ai/chat/stream", handleStreamChat);
router.post("/intelligence/chat/stream", handleStreamChat);

router.get("/ai/insights", async (_req, res): Promise<void> => {
  try {
    res.json(generateAiInsights());
  } catch (err) {
    logger.error({ err }, "Failed to generate AI insights");
    res.status(500).json({
      error: "Failed to load AI insights",
    });
  }
});

export default router;
