export type UserRole = 'owner' | 'manager' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  activeBusinessId?: string;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  phone: string;
  address: string;
  city: string;
  currency: string;
  slogan?: string;
  createdAt: string;
}

export interface Membership {
  id: string;
  businessId: string;
  userId: string;
  userEmail: string;
  role: UserRole;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  totalCredit: number;
  totalPaid: number;
  currentDebt: number;
  creditLimit?: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export type CreditStatus = 'active' | 'paid' | 'overdue';

export interface Credit {
  id: string;
  reference: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  description: string;
  amount: number;
  initialPayment: number;
  totalPaid: number;
  remainingAmount: number;
  creditDate: string;
  dueDate?: string;
  status: CreditStatus;
  notes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'orange_money' | 'moov_money' | 'wave' | 'bank_transfer' | 'other';

export interface Payment {
  id: string;
  reference: string;
  businessId: string;
  customerId: string;
  customerName: string;
  creditId: string;
  creditReference?: string;
  creditDescription?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  remainingAfter: number;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalRemainingDebt: number;
  totalCreditGranted: number;
  totalRefundsReceived: number;
  debtorCustomersCount: number;
  overdueCreditsCount: number;
}
