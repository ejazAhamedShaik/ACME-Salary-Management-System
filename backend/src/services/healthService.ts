export interface HealthStatus {
  status: "ok";
}

export interface HealthService {
  getStatus(): HealthStatus;
}

export function createHealthService(): HealthService {
  return {
    getStatus(): HealthStatus {
      return { status: "ok" };
    },
  };
}
