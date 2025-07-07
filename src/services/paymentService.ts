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
    nextInstallmentAmount: number
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
    upcomingInstallments: Array<{
        id: string
        installmentNumber: number
        amount: number
        dueDate: Date
        status: string
        planName: string
    }>
}

export interface PendingInstallment {
    id: string
    installmentNumber: number
    amount: number
    dueDate: Date
    status: string
    payment: {
        id: string
        totalAmount: number
        clientPlan: {
            plan: {
                name: string
            }
        }
    }
}

/**
 * Cria nova assinatura com pagamento
 */
export async function createSubscriptionOnly(data: CreateSubscriptionPayload) {
    try {
        const response = await api.post('/payments/subscription', data)
        return response.data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao criar assinatura.')
    }
}

/**
 * Busca resumo financeiro do cliente
 */
export async function getPaymentSummary(): Promise<PaymentSummary> {
    try {
        const response = await api.get('/payments/summary')

        // Converte strings de data para Date objects
        const data = response.data
        if (data.nextDueDate) {
            data.nextDueDate = new Date(data.nextDueDate)
        }

        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar resumo financeiro.')
    }
}

/**
 * Busca resumo financeiro detalhado do cliente
 */
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

        data.upcomingInstallments = data.upcomingInstallments.map((installment: any) => ({
            ...installment,
            dueDate: new Date(installment.dueDate)
        }))
        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar resumo detalhado.')
    }
}

/**
 * Busca parcelas pendentes do cliente
 */
export async function getPendingInstallments(): Promise<PendingInstallment[]> {
    try {
        const response = await api.get('/payments/installments/pending')

        return response.data.map((installment: any) => ({
            ...installment,
            dueDate: new Date(installment.dueDate)
        }))
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar parcelas pendentes.')
    }
}

/**
 * Busca detalhes de um pagamento específico
 */
export async function getPaymentDetails(paymentId: string) {
    try {
        const response = await api.get(`/payments/${paymentId}`)

        // Converte datas
        const data = response.data
        if (data.dueDate) data.dueDate = new Date(data.dueDate)
        if (data.paidAt) data.paidAt = new Date(data.paidAt)

        data.installments = data.installments.map((installment: any) => ({
            ...installment,
            dueDate: new Date(installment.dueDate),
            paidAt: installment.paidAt ? new Date(installment.paidAt) : null
        }))

        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar detalhes do pagamento.')
    }
}

/**
 * Processa pagamento de uma parcela (usado por webhooks)
 */
export async function processPayment(data: {
    installmentId: string
    externalId?: string
    gatewayResponse?: any
}) {
    try {
        const response = await api.post('/payments/process', data)
        return response.data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao processar pagamento.')
    }
}

/**
 * Cancela um pagamento
 */
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

/**
 * Busca todas as parcelas do cliente (pendentes, pagas, em atraso, etc.)
 */
export async function getAllInstallments(): Promise<PendingInstallment[]> {
    try {
        const response = await api.get('/payments/installments/all')

        return response.data.map((installment: any) => ({
            ...installment,
            dueDate: new Date(installment.dueDate),
            paidAt: installment.paidAt ? new Date(installment.paidAt) : null,
            createdAt: new Date(installment.createdAt),
            updatedAt: new Date(installment.updatedAt)
        }))
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar todas as parcelas.')
    }
}

/**
 * Busca todas as parcelas de um cliente específico (BackOffice)
 */
export async function getClientInstallments(clientId: string): Promise<PendingInstallment[]> {
    try {
        const response = await api.get(`/payments/admin/client/${clientId}/installments`)

        return response.data.map((installment: any) => ({
            ...installment,
            dueDate: new Date(installment.dueDate),
            paidAt: installment.paidAt ? new Date(installment.paidAt) : null,
            createdAt: installment.createdAt ? new Date(installment.createdAt) : null,
            updatedAt: installment.updatedAt ? new Date(installment.updatedAt) : null
        }))
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar parcelas do cliente.')
    }
}

/**
 * Atualiza o status de uma parcela específica (BackOffice)
 * Usa o endpoint admin para alterar status
 */
export async function updateInstallmentStatus(installmentId: string, status: string) {
    try {
        const response = await api.patch(`/payments/admin/installments/${installmentId}/status`, {
            status: status
        })
        return response.data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao atualizar status da parcela.')
    }
}

/**
 * Busca resumo financeiro de um cliente específico (BackOffice)
 */
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

        data.upcomingInstallments = data.upcomingInstallments.map((installment: any) => ({
            ...installment,
            dueDate: new Date(installment.dueDate)
        }))
        
        return data
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar resumo financeiro do cliente.')
    }
}


