import { Plan } from '@/types/plan' 

export type PaymentMethod = 
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'BANK_SLIP'
  | 'BANK_TRANSFER'

export type PaymentStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'REFUNDED'

export type InstallmentStatus = 
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'

export interface ClientPlan {
  id: string
  clientId: string
  planId: string
  current: boolean
  totalAmount: number
  installments: number
  paymentMethod: PaymentMethod
  createdOn: Date
  plan: Plan
  periods: ClientPeriodPlan[]
  payments: Payment[]
}

export interface ClientPeriodPlan {
  id: string
  clientPlanId: string
  startsAt: Date
  expiresAt: Date
  isTrial: boolean
  isCurrent: boolean
  wasConfirmed: boolean
  createdOn: Date
  renewedFromId?: string
  clientPlan: ClientPlan
}

export interface Payment {
  id: string
  clientPlanId: string
  clientId: string
  totalAmount: number
  paidAmount: number
  paymentMethod: PaymentMethod
  status: PaymentStatus
  externalId?: string
  gatewayResponse?: any
  dueDate?: Date
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
  installments: PaymentInstallment[]
  clientPlan: ClientPlan
}

export interface PaymentInstallment {
  id: string
  paymentId: string
  installmentNumber: number
  amount: number
  status: InstallmentStatus
  dueDate: Date
  paidAt?: Date
  externalId?: string
  gatewayResponse?: any
  createdAt: Date
  updatedAt: Date
  payment: Payment
}

// DTOs
export interface CreateSubscriptionDto {
  planId: string
  installments: number
  paymentMethod: PaymentMethod
}

export interface ProcessPaymentDto {
  installmentId: string
  externalId?: string
  gatewayResponse?: any
}

// Response Types
export interface SubscriptionResponse {
  clientPlan: ClientPlan
  payment: Payment
  message: string
}

export interface PaymentSummaryResponse {
  totalPayments: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  nextDueDate: Date | null
  nextInstallmentAmount: number
}

export interface DetailedPaymentSummaryResponse extends PaymentSummaryResponse {
  currentPlan: {
    id: string
    planName: string
    totalAmount: number
    installments: number
    paymentMethod: PaymentMethod
    period: {
      startsAt: Date
      expiresAt: Date
      isTrial: boolean
    } | null
  } | null
  upcomingInstallments: Array<{
    id: string
    installmentNumber: number
    amount: number
    dueDate: Date
    status: InstallmentStatus
    planName: string
  }>
}

// Dashboard Types
export interface DashboardAlert {
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  action: 'renew' | 'pay' | 'confirm' | 'view-payment' | 'contact-support'
  priority: number
}

export interface ClientStats {
  hasActivePlan: boolean
  isTrialUser: boolean
  daysUntilExpiration: number
  totalPlansUsed: number
  accountStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'INACTIVE'
  needsPaymentAttention: boolean
  upcomingPaymentAmount: number
  nextPaymentDate: Date | null
}

// Gateway Integration Types
export interface StripePaymentIntent {
  clientSecret: string
  paymentIntentId: string
}

export interface PagSeguroPayment {
  paymentId: string
  paymentUrl: string
}

export interface WebhookPayload {
  type: string
  data: {
    object: {
      id: string
      status: string
      amount?: number
      metadata?: Record<string, string>
    }
  }
  created: number
}

// Financial Report Types
export interface FinancialReportSummary {
  totalPayments: number
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  overdueAmount: number
  overdueCount: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
  payments: number
}

export interface FinancialReport {
  summary: FinancialReportSummary
  monthlyRevenue?: MonthlyRevenue[]
}

// Error Types
export interface PaymentError {
  code: string
  message: string
  details?: any
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaymentQueryParams {
  status?: PaymentStatus
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}