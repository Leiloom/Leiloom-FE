import { api } from './api'
import { handleAuthError } from './authService'

export interface CreateSubscriptionPayload {
    clientId: string
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
        absorbTax: boolean // ✅ NOVO
        maxInstallments: number // ✅ NOVO
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
            maxInstallments: number
            isTrial: boolean
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

export async function updatePaymentPreference(paymentId: string, preferenceId: string) {
    try {
        const response = await api.patch(`/payments/${paymentId}/preference`, {
            preferenceId
        })
        return response.data
    } catch (error: any) {
        console.warn('Erro ao atualizar preference ID:', error)
        // Não falhar, é apenas tracking
        return { error: error.message }
    }
}

export async function createMercadoPagoPreference(paymentData: {
    paymentId: string
    planName: string
    totalAmount: number
    installments: number
    userEmail: string
    userName: string
    clientId: string
    absorbTax: boolean
}) {
    try {
        const preferenceData = {
            items: [
                {
                    title: `Assinatura - ${paymentData.planName}`,
                    quantity: 1,
                    unit_price: paymentData.totalAmount,
                    currency_id: 'BRL'
                }
            ],
            payer: {
                name: paymentData.userName?.split(' ')[0] || 'Cliente',
                surname: paymentData.userName?.split(' ').slice(1).join(' ') || 'Leiloom',
                email: paymentData.userEmail
            },
            back_urls: {
                success: `${window.location.origin}/payment-success`,
                failure: `${window.location.origin}/payment-failure`,
                pending: `${window.location.origin}/payment-pending`
            },
            external_reference: `payment_${paymentData.paymentId}`,
            notification_url: `${process.env.NEXT_PUBLIC_API_URL}/payments/webhook`,
            statement_descriptor: 'Leiloom',
            payment_methods: {
                excluded_payment_types: [],
                excluded_payment_methods: [],
                installments: paymentData.installments || 1
            },
            metadata: {
                plan_name: paymentData.planName,
                user_email: paymentData.userEmail,
                payment_id: paymentData.paymentId,
                client_id: paymentData.clientId,
                installments: paymentData.installments,
                absorb_tax: paymentData.absorbTax
            }
        }

        console.log('🔧 Criando preferência MP:', preferenceData)

        const response = await fetch('/api/mercadopago/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(preferenceData)
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.details || errorData.error || `Erro HTTP: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Preferência criada:', result)

        return result
    } catch (error: any) {
        console.error('❌ Erro ao criar preferência:', error)
        throw error
    }
}

export async function getAllPaymentsByClient(): Promise<PendingPayment[]> {
    try {
        const response = await api.get('/payments/allbyclient')
        return response.data.map((payment: any) => ({
            ...payment,
            dueDate: new Date(payment.dueDate),
            createdAt: new Date(payment.createdAt)
        }))
    } catch (error: any) {
        return handleAuthError(error, 'Erro ao buscar pagamentos.')
    }
}

