export interface DeploymentPort {
  deploy: () => Promise<{ status: string }>;
}
