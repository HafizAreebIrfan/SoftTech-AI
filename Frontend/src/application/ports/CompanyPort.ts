export interface CompanyPort {
  getCompany: () => Promise<{ id: string; name: string }>;
}
