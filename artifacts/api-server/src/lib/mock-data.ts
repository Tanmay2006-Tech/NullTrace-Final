export const SERVICES = [
  { name: "api-gateway", namespace: "production", replicas: 3 },
  { name: "auth-service", namespace: "production", replicas: 2 },
  { name: "checkout-service", namespace: "production", replicas: 4 },
  { name: "payment-service", namespace: "production", replicas: 2 },
  { name: "user-service", namespace: "production", replicas: 2 },
  { name: "notification-service", namespace: "production", replicas: 1 },
  { name: "postgres-primary", namespace: "database", replicas: 1 },
  { name: "redis-cache", namespace: "production", replicas: 2 },
  { name: "elasticsearch", namespace: "logging", replicas: 3 },
  { name: "kafka", namespace: "messaging", replicas: 3 },
  { name: "prometheus", namespace: "monitoring", replicas: 1 },
  { name: "grafana", namespace: "monitoring", replicas: 1 },
];

export const LOG_MESSAGES = [
  { level: "ERROR", service: "checkout-service", message: "Connection pool exhausted: too many clients" },
  { level: "ERROR", service: "auth-service", message: "JWT verification failed: token expired or invalid" },
  { level: "WARN", service: "api-gateway", message: "Request timeout exceeded 2000ms threshold" },
  { level: "ERROR", service: "payment-service", message: "Stripe webhook signature verification failed" },
  { level: "INFO", service: "user-service", message: "User session created successfully" },
  { level: "INFO", service: "api-gateway", message: "Health check passed: all upstream services responding" },
  { level: "WARN", service: "postgres-primary", message: "Slow query detected: 3.2s execution time on users table" },
  { level: "ERROR", service: "checkout-service", message: "Database connection refused: ECONNREFUSED 5432" },
  { level: "DEBUG", service: "notification-service", message: "Email delivery queued for user@example.com" },
  { level: "INFO", service: "redis-cache", message: "Cache hit ratio: 94.2% for session data" },
  { level: "WARN", service: "elasticsearch", message: "Index shard allocation delayed — disk usage at 82%" },
  { level: "ERROR", service: "auth-service", message: "Rate limit exceeded: 1000 requests/minute from 10.0.0.45" },
  { level: "FATAL", service: "checkout-service", message: "OOMKilled: container exceeded memory limit 512Mi" },
  { level: "INFO", service: "kafka", message: "Consumer group lag: 1,247 messages behind on checkout-events" },
  { level: "WARN", service: "payment-service", message: "Retry attempt 3/5 for transaction txn_abc123" },
  { level: "ERROR", service: "api-gateway", message: "Upstream 503: checkout-service health check failed" },
  { level: "INFO", service: "prometheus", message: "Scrape successful: 2,847 metrics collected" },
  { level: "WARN", service: "redis-cache", message: "Memory usage at 78% — approaching eviction threshold" },
  { level: "DEBUG", service: "user-service", message: "Profile update persisted to database" },
  { level: "ERROR", service: "postgres-primary", message: "Max connections reached: unable to accept new connections" },
];

export const INCIDENT_SEEDS = [
  {
    title: "PostgreSQL Connection Pool Exhaustion",
    description: "Database connection pool reached maximum capacity causing auth service timeout and checkout service failures",
    severity: "CRITICAL",
    status: "INVESTIGATING",
    affectedServices: ["checkout-service", "auth-service", "api-gateway"],
    rootCause: "PostgreSQL connection pool exhaustion caused authentication service timeout.",
    aiAnalysis: "High traffic on checkout flow exhausted the DB connection pool. Auth service timed out waiting for connections. Cascade failure propagated to API gateway.",
    confidence: 94,
    suggestedCommands: [
      "kubectl rollout restart deployment checkout-service -n production",
      "kubectl scale deployment auth-service --replicas=5 -n production",
      "kubectl exec -it postgres-primary-0 -n production -- psql -c 'ALTER SYSTEM SET max_connections=500;'",
    ],
  },
  {
    title: "Auth Service JWT Verification Failures",
    description: "Repeated JWT verification failures detected — 401 errors spiking across multiple endpoints",
    severity: "HIGH",
    status: "OPEN",
    affectedServices: ["auth-service", "user-service"],
    rootCause: null,
    aiAnalysis: null,
    confidence: null,
    suggestedCommands: [],
  },
  {
    title: "Checkout Service OOMKill Loop",
    description: "checkout-service pods being OOMKilled repeatedly — memory limit exceeded",
    severity: "CRITICAL",
    status: "OPEN",
    affectedServices: ["checkout-service", "payment-service"],
    rootCause: null,
    aiAnalysis: null,
    confidence: null,
    suggestedCommands: [],
  },
  {
    title: "API Gateway Elevated Latency",
    description: "P99 latency on API gateway increased from 120ms to 4200ms — upstream services slow",
    severity: "HIGH",
    status: "OPEN",
    affectedServices: ["api-gateway", "checkout-service"],
    rootCause: null,
    aiAnalysis: null,
    confidence: null,
    suggestedCommands: [],
  },
  {
    title: "Elasticsearch Shard Allocation Failure",
    description: "Elasticsearch cluster failed to allocate shards due to disk pressure",
    severity: "MEDIUM",
    status: "RESOLVED",
    affectedServices: ["elasticsearch", "notification-service"],
    rootCause: "Disk usage exceeded 85% watermark on elasticsearch nodes.",
    aiAnalysis: "Disk pressure triggered automatic shard relocation. Added 200GB to each node, resolved within 45 minutes.",
    confidence: 88,
    suggestedCommands: [
      "kubectl exec -it elasticsearch-0 -n logging -- curl -X PUT 'localhost:9200/_cluster/settings' -H 'Content-Type: application/json' -d '{\"transient\":{\"cluster.routing.allocation.disk.threshold_enabled\":false}}'",
    ],
  },
];

export function generateMetricsTimeSeries(points: number, baseValue: number, variance: number, spikeAt?: number) {
  const now = Date.now();
  const interval = 60000; // 1 minute per point
  return Array.from({ length: points }, (_, i) => {
    const timestamp = new Date(now - (points - i) * interval).toISOString();
    let value = baseValue + (Math.random() - 0.5) * variance;
    if (spikeAt && i >= spikeAt && i <= spikeAt + 10) {
      value = baseValue * (1.8 + Math.random() * 0.8);
    }
    return { timestamp, value: Math.max(0, Math.round(value * 10) / 10) };
  });
}

export const PODS = [
  { name: "api-gateway-7d8f9b-xkp2m", namespace: "production", status: "Running", service: "api-gateway", cpu: 42, memory: 61, restarts: 0, age: "12d", node: "node-1" },
  { name: "api-gateway-7d8f9b-nz4qw", namespace: "production", status: "Running", service: "api-gateway", cpu: 38, memory: 58, restarts: 0, age: "12d", node: "node-2" },
  { name: "auth-service-5c6d7e-wp8rx", namespace: "production", status: "Running", service: "auth-service", cpu: 67, memory: 74, restarts: 2, age: "8d", node: "node-1" },
  { name: "auth-service-5c6d7e-mn3qt", namespace: "production", status: "Running", service: "auth-service", cpu: 71, memory: 78, restarts: 1, age: "8d", node: "node-3" },
  { name: "checkout-service-9a1b2c-lm3kt", namespace: "production", status: "CrashLoopBackOff", service: "checkout-service", cpu: 0, memory: 0, restarts: 5, age: "2h", node: "node-2" },
  { name: "checkout-service-9a1b2c-pq7rs", namespace: "production", status: "Error", service: "checkout-service", cpu: 0, memory: 0, restarts: 3, age: "2h", node: "node-3" },
  { name: "checkout-service-9a1b2c-uv1wx", namespace: "production", status: "Running", service: "checkout-service", cpu: 89, memory: 91, restarts: 1, age: "1h", node: "node-1" },
  { name: "payment-service-3e4f5g-ab6cd", namespace: "production", status: "Pending", service: "payment-service", cpu: 0, memory: 0, restarts: 0, age: "15m", node: "node-2" },
  { name: "payment-service-3e4f5g-ef7gh", namespace: "production", status: "Running", service: "payment-service", cpu: 34, memory: 49, restarts: 0, age: "15d", node: "node-3" },
  { name: "user-service-6h7i8j-ij9kl", namespace: "production", status: "Running", service: "user-service", cpu: 22, memory: 35, restarts: 0, age: "20d", node: "node-1" },
  { name: "postgres-primary-0", namespace: "database", status: "Running", service: "postgres-primary", cpu: 78, memory: 84, restarts: 0, age: "30d", node: "node-2" },
  { name: "redis-cache-0", namespace: "production", status: "Running", service: "redis-cache", cpu: 15, memory: 67, restarts: 0, age: "30d", node: "node-3" },
  { name: "redis-cache-1", namespace: "production", status: "Running", service: "redis-cache", cpu: 18, memory: 71, restarts: 0, age: "30d", node: "node-1" },
];
