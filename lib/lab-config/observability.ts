export interface ObservabilityConfig {
  deployment: {
    status: "Ready" | "Building" | "Failed" | "Offline" | string;
    color: string;
    showPulse: boolean;
    error?: string | null;
  };
  dbPulse: {
    latency: string;
    status: string;
    color: string;
  };
}

export function getSystemObservability(): ObservabilityConfig {
  return {
    deployment: {
      status: "Offline",
      color: "bg-white/10",
      showPulse: false,
    },
    dbPulse: {
      latency: "14ms",
      status: "Online",
      color: "bg-emerald-500",
    },
  };
}
