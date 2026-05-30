export interface IntegrationPort {
  listIntegrations: () => Promise<unknown[]>;
}
