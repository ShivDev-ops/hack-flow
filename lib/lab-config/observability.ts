export interface ObservabilityConfig {
  deployment: {
    status: string;
    color: string;
    showPulse: boolean;
  };
  dbPulse: {
    latency: string;
    status: string;
    color: string;
  };
}

export function getSystemObservability(): ObservabilityConfig {
  // In a real app, this could fetch from an API or env vars
  return {
    deployment: {
      status: "Ready",
      color: "bg-blue-500",
      showPulse: true,
    },
    dbPulse: {
      latency: "14ms",
      status: "Online",
      color: "bg-emerald-500",
    },
  };
}
