import { api } from './api'
import { handleAuthError } from './authService'

export interface CreateSubscriptionPayload {
    planId: string
    installments: number
    paymentMethod: 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD' | 'BANK_SLIP' | 'BANK_TRANSFER'
}

export interface PaymentSummary {
    totalPayments: number
    paidAmount: number
    pendingAmount: number
    overdueAmount: number
    nextDueDate: Date | null
    nextPaymentAmount: number
    hasActivePlan: boolean
}

export interface DetailedPaymentSummary extends PaymentSummary {
    currentPlan: {
        id: string
        planName: string
        totalAmount: number
        installments: number
        paymentMethod: string
        numberOfUsers: number
        period: {
            startsAt: Date
            expiresAt: Date
            isTrial: boolean
        } | null
    } | null
    recentPayments: Array<{
        id: string
        totalAmount: number
        installments: number
        paymentMethod: string
        status: string
        createdAt: Date
        planName: string
        absorbTax: boolean
    }>
}

export interface PendingPayment {
    id: string
    totalAmount: number
    installments: number
    paymentMethod: string
    status: string
    dueDate: Date
    createdAt: Date
    clientPlan: {
        plan: {
            name: string
        }
    }
    absorbTax: boolean
}

export async function createSubscriptionOnly(data: CreateSubscriptionPayload) {
    try {
        const response = await api.post('/payments/subscription', data)
        return response.data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao criar assinatura.')
    }
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
    try {
        const response = await api.get('/payments/summary')
        const data = response.data
        if (data.nextDueDate) {
            data.nextDueDate = new Date(data.nextDueDate)
        }
        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar resumo financeiro.')
    }
}

export async function getDetailedPaymentSummary(): Promise<DetailedPaymentSummary> {
    try {
        const response = await api.get('/payments/summary/detailed')
        const data = response.data
        
        if (data.nextDueDate) {
            data.nextDueDate = new Date(data.nextDueDate)
        }

        if (data.currentPlan?.period) {
            data.currentPlan.period.startsAt = new Date(data.currentPlan.period.startsAt)
            data.currentPlan.period.expiresAt = new Date(data.currentPlan.period.expiresAt)
        }

        data.recentPayments = data.recentPayments.map((payment: any) => ({
            ...payment,
            createdAt: new Date(payment.createdAt)
        }))
        
        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar resumo detalhado.')
    }
}

export async function getPendingPayments(): Promise<PendingPayment[]> {
    try {
        const response = await api.get('/payments/pending')
        return response.data.map((payment: any) => ({
            ...payment,
            dueDate: new Date(payment.dueDate),
            createdAt: new Date(payment.createdAt)
        }))
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar pagamentos pendentes.')
    }
}

export async function getPaymentDetails(paymentId: string) {
    try {
        const response = await api.get(`/payments/${paymentId}`)
        const data = response.data
        
        if (data.dueDate) data.dueDate = new Date(data.dueDate)
        if (data.paidAt) data.paidAt = new Date(data.paidAt)
        if (data.createdAt) data.createdAt = new Date(data.createdAt)
        if (data.updatedAt) data.updatedAt = new Date(data.updatedAt)

        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar detalhes do pagamento.')
    }
}

export async function processPayment(data: {
    paymentId: string
    externalId: string
    gatewayResponse: any
}) {
    try {
        const response = await api.post('/payments/webhook', data)
        return response.data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao processar pagamento.')
    }
}

export async function cancelPayment(paymentId: string, reason?: string) {
    try {
        const response = await api.delete(`/payments/${paymentId}`, {
            data: { reason }
        })
        return response.data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao cancelar pagamento.')
    }
}

export async function getClientPaymentSummary(clientId: string): Promise<DetailedPaymentSummary> {
    try {
        const response = await api.get(`/payments/admin/client/${clientId}/summary`)
        const data = response.data
        
        if (data.nextDueDate) {
            data.nextDueDate = new Date(data.nextDueDate)
        }

        if (data.currentPlan?.period) {
            data.currentPlan.period.startsAt = new Date(data.currentPlan.period.startsAt)
            data.currentPlan.period.expiresAt = new Date(data.currentPlan.period.expiresAt)
        }

        data.recentPayments = data.recentPayments.map((payment: any) => ({
            ...payment,
            createdAt: new Date(payment.createdAt)
        }))
        
        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar resumo financeiro do cliente.')
    }
}