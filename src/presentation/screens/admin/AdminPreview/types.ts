export interface ApiItem {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  baseUrl: string;
  endpoint: string;
  authtype: string;
  status: "Active" | "Testing" | "Inactive";
}

export interface OnboardingStep {
  id: number;
  title: string;
  desc: string;
  completed: boolean;
}

export interface McpParameter {
  name: string;
  type: string;
  desc: string;
  required: boolean;
}

export interface McpTool {
  id: string;
  name: string;
  desc: string;
  enabled: boolean;
  params: McpParameter[];
}

export interface TerminalLog {
  time: string;
  type: "info" | "success" | "warning" | "command";
  text: string;
}
