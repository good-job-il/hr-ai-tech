import { Injectable } from "@nestjs/common"

type MetricName =
  | "http_4xx"
  | "http_5xx"
  | "auth_failures"
  | "import_failures"
  | "imports_enqueued"
  | "queue_retries"

@Injectable()
export class OperationalMetricsService {
  private readonly counters: Record<MetricName, number> = {
    http_4xx: 0,
    http_5xx: 0,
    auth_failures: 0,
    import_failures: 0,
    imports_enqueued: 0,
    queue_retries: 0,
  }

  recordHttp(path: string, status: number) {
    if (status >= 500) {
      this.increment("http_5xx")
    } else if (status >= 400) {
      this.increment("http_4xx")
    }

    if (status >= 400 && path.startsWith("/api/auth/")) {
      this.increment("auth_failures")
    }
  }

  increment(name: MetricName) {
    this.counters[name] += 1
  }

  snapshot() {
    return { ...this.counters }
  }
}
