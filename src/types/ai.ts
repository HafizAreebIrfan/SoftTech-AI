export interface AIAgent {
  id: string;
  title: string;
  description: string;
  status: 'Idle' | 'Running' | 'Success' | 'Failed';
  successRate: number;
  lastExecutionStats: {
    duration: string;
    tokensUsed: number;
    cost: number;
  };
}

export interface AILog {
  id: string;
  agentId?: string; // Links log to specific agent, or "system" if undefined
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface AIProviderStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency: number;
  uptime: string;
}

export interface AIClientAccount {
  id: string;
  companyName: string;
  email: string;
  tier: 'Free' | 'Pro' | 'Enterprise';
  status: 'Active' | 'Suspended';
}
