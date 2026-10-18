export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  timestamp: string;
  uptime: number;
  services: {
    postgres: boolean;
    redis: boolean;
  };
}
