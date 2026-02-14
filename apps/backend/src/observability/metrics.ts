interface MetricsSnapshot {
  totalRequests: number;
  scanResolved: number;
  scanUnresolved: number;
  aggregationLatencyMs: {
    count: number;
    min: number;
    max: number;
    avg: number;
  };
}

class MetricsStore {
  private totalRequests = 0;
  private scanResolved = 0;
  private scanUnresolved = 0;
  private aggregationLatencies: number[] = [];

  incrementRequests(): void {
    this.totalRequests += 1;
  }

  recordAggregationLatency(ms: number): void {
    this.aggregationLatencies.push(ms);
    if (this.aggregationLatencies.length > 5000) {
      this.aggregationLatencies.shift();
    }
  }

  recordScan(status: "resolved" | "unresolved"): void {
    if (status === "resolved") {
      this.scanResolved += 1;
      return;
    }
    this.scanUnresolved += 1;
  }

  snapshot(): MetricsSnapshot {
    const values = this.aggregationLatencies;
    const count = values.length;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return {
      totalRequests: this.totalRequests,
      scanResolved: this.scanResolved,
      scanUnresolved: this.scanUnresolved,
      aggregationLatencyMs: {
        count,
        min: count ? Math.min(...values) : 0,
        max: count ? Math.max(...values) : 0,
        avg: count ? Math.round((sum / count) * 100) / 100 : 0
      }
    };
  }
}

export const metricsStore = new MetricsStore();
