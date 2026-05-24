import { logger } from "./logger";
import { groq, CHAT_MODEL, FAST_MODEL } from "./groq-client";

interface IncidentContext {
  title?: string;
  description?: string;
  affectedServices?: string[];
  severity?: string;
  logs?: Array<{
    level?: string;
    service?: string;
    message?: string;
    timestamp?: Date;
  }>;
}

interface AnalysisResult {
  rootCause: string;
  whyItHappened: string;
  humanExplanation: string;
  suggestedSolutions: string[];
  suggestedCommands: string[];
  confidence: number;
  severity: string;
  affectedServices: string[];
  insights: string[];
}

export async function generateRCA(
  context: IncidentContext
): Promise<AnalysisResult> {
  logger.info(
    { title: context?.title || "Unknown Incident" },
    "Generating AI root cause analysis via Groq"
  );

  const prompt = `You are an expert Site Reliability Engineer (SRE) analyzing a production incident. Provide a structured root cause analysis in JSON format.

Incident Details:
- Title: ${context?.title || "Unknown Incident"}
- Description: ${context?.description || "No description provided"}
- Severity: ${context?.severity || "MEDIUM"}
- Affected Services: ${
    context?.affectedServices?.join(", ") || "None"
  }
${
  context?.logs?.length
    ? `- Recent Logs:\n${context.logs
        .slice(0, 5)
        .map(
          (l) =>
            `  [${l?.level || "INFO"}] ${
              l?.service || "unknown"
            }: ${l?.message || "No message"}`
        )
        .join("\n")}`
    : ""
}

Respond with ONLY valid JSON matching this exact structure:
{
  "rootCause": "One sentence technical root cause",
  "whyItHappened": "2-3 sentence technical explanation of why this failure mode occurred",
  "humanExplanation": "1-2 sentence plain English explanation for non-technical stakeholders",
  "suggestedSolutions": ["solution 1", "solution 2", "solution 3"],
  "suggestedCommands": ["kubectl command 1", "kubectl command 2"],
  "confidence": 85,
  "insights": ["specific metric insight 1", "specific metric insight 2"]
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content =
      completion?.choices?.[0]?.message?.content ?? "{}";

    const parsed = JSON.parse(content);

    return {
      rootCause:
        parsed?.rootCause ||
        "Unable to determine root cause",

      whyItHappened:
        parsed?.whyItHappened || "",

      humanExplanation:
        parsed?.humanExplanation || "",

      suggestedSolutions: Array.isArray(
        parsed?.suggestedSolutions
      )
        ? parsed.suggestedSolutions
        : [],

      suggestedCommands: Array.isArray(
        parsed?.suggestedCommands
      )
        ? parsed.suggestedCommands
        : [],

      confidence:
        typeof parsed?.confidence === "number"
          ? Math.min(
              99,
              Math.max(50, parsed.confidence)
            )
          : 75,

      severity:
        context?.severity || "MEDIUM",

      affectedServices:
        context?.affectedServices?.length
          ? context.affectedServices
          : ["api-gateway"],

      insights: Array.isArray(parsed?.insights)
        ? parsed.insights
        : [],
    };
  } catch (err) {
    logger.error(
      { err },
      "Groq RCA generation failed, using fallback"
    );

    return {
      rootCause: `${
        context?.title || "Unknown Incident"
      } — automated analysis unavailable`,

      whyItHappened:
        context?.description ||
        "No description available",

      humanExplanation:
        "An incident occurred affecting your services. Manual investigation is recommended.",

      suggestedSolutions: [
        "Check service logs",
        "Review recent deployments",
        "Verify resource limits",
      ],

      suggestedCommands: [
        `kubectl get pods -n production | grep -v Running`,
        `kubectl logs deployment/${
          context?.affectedServices?.[0] ||
          "api-gateway"
        } -n production --since=30m`,
      ],

      confidence: 50,

      severity:
        context?.severity || "MEDIUM",

      affectedServices:
        context?.affectedServices || [
          "api-gateway",
        ],

      insights: ["Manual review required"],
    };
  }
}

export async function generateAiChatResponse(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<{
  response: string;
  suggestedPrompts: string[];
}> {
  const systemPrompt = `You are NullTrace AI, an expert DevOps observability assistant embedded in the NullTrace platform.

Current infrastructure context:
- Platform: Kubernetes (production namespace)
- Active incidents: PostgreSQL connection pool exhaustion (CRITICAL), auth failures spike (HIGH)
- Degraded services: checkout-service, auth-service, payment-service
- System health score: 84%

Be concise, technical, and actionable.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },

    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),

    { role: "user", content: message },
  ];

  try {
    const completion =
      await groq.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 1024,
      });

    const response =
      completion?.choices?.[0]?.message
        ?.content ??
      "I was unable to generate a response.";

    const suggestedPrompts = [
      "Why did checkout fail?",
      "Which service is most unstable?",
      "Explain the latest outage",
      "Show me failed pods",
      "How do I fix DB connection exhaustion?",
    ];

    return {
      response,
      suggestedPrompts,
    };
  } catch (err) {
    logger.error(
      { err },
      "Groq chat generation failed"
    );

    return {
      response:
        "I'm having trouble connecting to the AI backend right now.",

      suggestedPrompts: [
        "Why did checkout fail?",
        "Show failed pods",
      ],
    };
  }
}

export function generateAiInsights(): Array<{
  id: string;
  message: string;
  severity: string;
  service: string;
  timestamp: string;
}> {
  const insights = [
    {
      message:
        "Memory usage increased 34% in the last hour.",
      severity: "HIGH",
      service: "checkout-service",
    },

    {
      message:
        "Repeated authentication failures detected.",
      severity: "CRITICAL",
      service: "auth-service",
    },

    {
      message:
        "API latency exceeded 2s threshold.",
      severity: "HIGH",
      service: "api-gateway",
    },

    {
      message:
        "Database connection wait time elevated.",
      severity: "HIGH",
      service: "postgres-primary",
    },

    {
      message:
        "Pod restart loop detected.",
      severity: "CRITICAL",
      service: "checkout-service",
    },
  ];

  const selected = [...insights]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);

  return selected.map((insight, i) => ({
    id: `insight-${Date.now()}-${i}`,
    ...insight,
    timestamp: new Date(
      Date.now() - i * 3 * 60 * 1000
    ).toISOString(),
  }));
}