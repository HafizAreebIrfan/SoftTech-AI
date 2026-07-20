export interface BusinessInvoice {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
}

export interface BusinessTeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Offline';
}
