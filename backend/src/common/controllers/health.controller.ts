import { Controller, Get, ServiceUnavailableException } from "@nestjs/common"
import { DataSource } from "typeorm"
import { Public } from "../decorators/public.decorator"
import { OperationalMetricsService } from "../monitoring/operational-metrics.service"

@Controller("health")
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly metrics: OperationalMetricsService,
  ) {}

  @Get()
  @Public()
  async check() {
    try {
      await this.dataSource.query("SELECT 1")

      const rows: Array<{ status: string; count: string | number }> = await this.dataSource.query(
        "SELECT status, COUNT(*) AS count FROM background_jobs GROUP BY status",
      )

      return {
        status: "ok",
        database: "ok",
        background_jobs: Object.fromEntries(rows.map((row) => [row.status, Number(row.count)])),
        monitoring: this.metrics.snapshot(),
        timestamp: new Date().toISOString(),
      }
    } catch {
      throw new ServiceUnavailableException("Database health check failed")
    }
  }
}
