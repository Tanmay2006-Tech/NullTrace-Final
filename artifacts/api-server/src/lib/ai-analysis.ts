import { logger } from "./logger";
import { groq, CHAT_MODEL, FAST_MODEL } from "./groq-client";

interface IncidentContext {
  title: string;
  description: string;
  affectedServices: string[];
  severity: string;
  logs?: Array<{ level: string; service: string; message: string; timestamp: Date }>;
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

export async function generateRCA(context: IncidentContext): Promise<AnalysisResult> {
  logger.info({ title: context.title }, "Generating AI root cause analysis via Groq");

  const prompt = `You are an expert Site Reliability Engineer (SRE) analyzing a production incident. Provide a structured root cause analysis in JSON format.

Incident Details:
- Title: ${context.title}
- Description: ${context.description}
- Severity: ${context.severity}
- Affected Services: ${context.affectedServices.join(", ")}
${context.logs?.length ? `- Recent Logs:\n${context.logs.slice(0, 5).map(l => `  [${l.level}] ${l.service}: ${l.message}`).join("\n")}` : ""}

Respond with ONLY valid JSON matching this exact structure:
{
  "rootCause": "One sentence technical root cause",
  "whyItHappened": "2-3 sentence technical explanation of why this failure mode occurred",
  "humanExplanation": "1-2 sentence plain English explanation for non-technical stakeholders",
  "suggestedSolutions": ["solution 1", "solution 2", "solution 3", "solution 4", "solution 5"],
  "suggestedCommands": ["kubectl command 1", "kubectl command 2", "kubectl command 3", "kubectl command 4"],
  "confidence": 85,
  "insights": ["specific metric insight 1", "specific metric insight 2", "specific metric insight 3"]
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);

    return {
      rootCause: parsed.rootCause ?? "Unable to determine root cause",
      whyItHappened: parsed.whyItHappened ?? "",
      humanExplanation: parsed.humanExplanation ?? "",
      suggestedSolutions: Array.isArray(parsed.suggestedSolutions) ? parsed.suggestedSolutions : [],
      suggestedCommands: Array.isArray(parsed.suggestedCommands) ? parsed.suggestedCommands : [],
      confidence: typeof parsed.confidence === "number" ? Math.min(99, Math.max(50, parsed.confidence)) : 75,
      severity: context.severity,
      affectedServices: context.affectedServices.length > 0 ? context.affectedServices : ["api-gateway"],
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    };
  } catch (err) {
    logger.error({ err }, "Groq RCA generation failed, using fallback");
    return {
      rootCause: `${context.title} — automated analysis unavailable`,
      whyItHappened: context.description,
      humanExplanation: "An incident occurred affecting your services. Manual investigation is recommended.",
      suggestedSolutions: ["Check service logs", "Review recent deployments", "Verify resource limits"],
      suggestedCommands: [
        `kubectl get pods -n production | grep -v Running`,
        `kubectl logs deployment/${context.affectedServices[0] ?? "api-gateway"} -n production --since=30m`,
      ],
      confidence: 50,
      severity: context.severity,
      affectedServices: context.affectedServices,
      insights: ["Manual review required"],
    };
  }
}

export async function generateAiChatResponse(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<{ response: string; suggestedPrompts: string[] }> {
  const systemPrompt = `You are NullTrace AI, an expert DevOps observability assistant embedded in the NullTrace platform. You help SRE and DevOps engineers diagnose incidents, analyze logs, understand Kubernetes cluster state, and resolve production issues fast.

Current infrastructure context:
- Platform: Kubernetes (production namespace)
- Active incidents: PostgreSQL connection pool exhaustion (CRITICAL), auth failures spike (HIGH)  
- Degraded services: checkout-service, auth-service, payment-service
- System health score: 84%
- Key metrics: checkout error rate 12.3%, DB pool at 91%, auth failure rate elevated

Be concise, technical, and actionable. Use markdown for structure. Always include runnable kubectl commands when relevant. Format code blocks with triple backticks. Keep responses under 600 words unless deep analysis is required.`;

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.5,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content ?? "I was unable to generate a response. Please try again.";

    const suggestedPrompts = [
      "Why did checkout fail?",
      "Which service is most unstable?",
      "Explain the latest outage",
      "Show me failed pods",
      "How do I fix DB connection exhaustion?",
      "What caused the auth failures?",
      "How do I scale the API gateway?",
    ];

    return { response, suggestedPrompts };
  } catch (err) {
    logger.error({ err }, "Groq chat generation failed");
    return {
      response: "I'm having trouble connecting to the AI backend right now. Please try again in a moment.",
      suggestedPrompts: ["Why did checkout fail?", "Show failed pods", "Explain latest outage"],
    };
  }
}

export function generateAiInsights(): Array<{ id: string; message: string; severity: string; service: string; timestamp: string }> {
  const insights = [
    { message: "Memory usage increased 34% in the last hour before incident threshold.", severity: "HIGH", service: "checkout-service" },
    { message: "Repeated authentication failures detected — 847 failed attempts in 10 minutes.", severity: "CRITICAL", service: "auth-service" },
    { message: "API latency exceeded 2s threshold on 3 endpoints — p99 at 4.2s.", severity: "HIGH", service: "api-gateway" },
    { message: "Database connection wait time elevated — pool saturation at 91%.", severity: "HIGH", service: "postgres-primary" },
    { message: "Pod restart loop detected — checkout-service restarted 5 times in 20 minutes.", severity: "CRITICAL", service: "checkout-service" },
    { message: "Error rate spike: 12.3% of requests returning 5xx across payment-service.", severity: "HIGH", service: "payment-service" },
    { message: "CPU throttling on 3 worker nodes — consider scaling cluster.", severity: "MEDIUM", service: "worker-node-2" },
    { message: "Network packet loss detected between service mesh nodes — 0.8% loss.", severity: "MEDIUM", service: "service-mesh" },
    { message: "Disk I/O saturation on primary postgres node — 94% utilization.", severity: "HIGH", service: "postgres-primary" },
    { message: "Anomalous traffic pattern — 340% above baseline on /api/checkout.", severity: "MEDIUM", service: "api-gateway" },
  ];

  const selected = [...insights].sort(() => Math.random() - 0.5).slice(0, 5);
  return selected.map((insight, i) => ({
    id: `insight-${Date.now()}-${i}`,
    ...insight,
    timestamp: new Date(Date.now() - i * 3 * 60 * 1000).toISOString(),
  }));
}
