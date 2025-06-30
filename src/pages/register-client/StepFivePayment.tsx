'use client'

import { useRegisterClient } from '@/contexts/RegisterClientContext'
import { loginClient } from '@/services/authService'
import { acceptTerms, getCurrentTerms } from '@/services/termsService'
import { createSubscriptionOnly } from '@/services/paymentService'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { updateClientUser, updateClient } from '@/services/clientService'
import { useAuthContext } from '@/contexts/AuthContext'
import { PaymentMethod } from '@/types/payment'
import { Plan } from '@/types/plan'
import { CreditCard, DollarSign, CheckCircle } from 'lucide-react'

interface StepFivePaymentProps {
    selectedPlan: Plan
    onBack: () => void
}

export default function StepFivePayment({ selectedPlan, onBack }: StepFivePaymentProps) {
    const { formData } = useRegisterClient()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [selectedInstallments, setSelectedInstallments] = useState(1)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD')
    const { login } = useAuthContext()

    // ✅ CORREÇÃO: Verificação de segurança para evitar erro de SSR
    if (!selectedPlan) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-gray-600">Carregando informações do plano...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mt-4"></div>
                </div>
                <div className="flex justify-between pt-4">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        )
    }

    function formatPrice(price: number): string {
        if (price === 0) return 'Grátis'
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price)
    }

    function calculateTotalPrice(plan: Plan, installments: number): number {
        if (!plan) return 0

        // Se é à vista (1x), sempre usa o preço normal
        if (installments === 1) {
            return plan.price
        }

        // Se é parcelado E tem installmentPrice definido, usa ele (com juros)
        if (installments > 1 && plan.installmentPrice) {
            return plan.installmentPrice
        }

        // Se é parcelado mas sem installmentPrice, usa preço normal (sem juros)
        return plan.price
    }

    function calculateInstallmentValue(plan: Plan, installments: number): number {
        const totalPrice = calculateTotalPrice(plan, installments)
        return totalPrice / installments
    }

    function getInstallmentOptions(plan: Plan): number[] {
        if (!plan || !plan.allowInstallments) return [1]
        const maxInstallments = plan.maxInstallments || 1
        return Array.from({ length: maxInstallments }, (_, i) => i + 1)
    }

    function hasInterest(plan: Plan, installments: number): boolean {
        if (installments === 1) return false
        return typeof plan.installmentPrice === 'number' && plan.installmentPrice > plan.price
    }

    function getInterestRate(plan: Plan): number {
        if (!plan.installmentPrice || plan.installmentPrice <= plan.price) return 0
        return ((plan.installmentPrice - plan.price) / plan.price) * 100
    }

    async function handlePaymentSubmit() {
        setLoading(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 2000))

            setCurrentStep(4)

            setTimeout(async () => {
                await handleCreateSubscription()
            }, 2000)
        } catch (error) {
            toast.error('Erro no processamento do pagamento')
            setLoading(false)
        }
    }

    async function handleCreateSubscription() {
        try {
            // ✅ OTIMIZADO: Removidas operações redundantes feitas no Step 3
            // Faz login
            const token = await loginClient({
                login: formData.email,
                password: formData.password,
                context: 'CLIENT',
            })

            login(token, 'CLIENT')

            // Cria assinatura paga
            const subscriptionData = await createSubscriptionOnly({
                planId: selectedPlan.id,
                installments: selectedInstallments,
                paymentMethod: selectedPaymentMethod
            })

            router.push(`/dashboard-client?newSubscription=${subscriptionData.payment?.id || 'created'}`)
        } catch (err: any) {
            console.error('Erro no registro:', err)
            toast.error(err?.message || 'Erro ao concluir o cadastro.')
        } finally {
            setLoading(false)
        }
    }

    // Step 1: Seleção de parcelamento
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Escolha o Parcelamento
                </h2>
                <p className="text-gray-600">
                    Como você gostaria de pagar seu plano {selectedPlan.name}?
                </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">{selectedPlan.name}</h3>
                <p className="text-sm text-yellow-700 mb-2">
                    {selectedPlan.description}
                </p>
                <div className="text-sm text-yellow-700">
                    <strong>Preço à vista:</strong> {formatPrice(selectedPlan.price)}
                    {selectedPlan.installmentPrice && selectedPlan.installmentPrice > selectedPlan.price && (
                        <>
                            <br />
                            <strong>Preço parcelado:</strong> {formatPrice(selectedPlan.installmentPrice)}
                            <span className="text-yellow-600"> (+{getInterestRate(selectedPlan).toFixed(1)}% juros)</span>
                        </>
                    )}
                </div>
            </div>

            {selectedPlan.allowInstallments ? (
                <div className="space-y-4">

                    <div>
                        <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">
                            Selecione o número de parcelas:
                        </label>
                        <select
                            id="installments"
                            name="installments"
                            value={selectedInstallments || ''}
                            onChange={(e) => setSelectedInstallments(parseInt(e.target.value))}
                            className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                            <option value="" disabled>
                                Selecione o número de parcelas
                            </option>
                            {getInstallmentOptions(selectedPlan).map((installment) => (
                                <option key={installment} value={installment}>
                                    {installment}x de {formatPrice(calculateInstallmentValue(selectedPlan, installment))}
                                </option>
                            ))}
                        </select>

                    </div>


                    {selectedInstallments > 1 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-sm text-blue-700">
                                <strong>Resumo do parcelamento:</strong>
                                <br />
                                {selectedInstallments}x de {formatPrice(calculateInstallmentValue(selectedPlan, selectedInstallments))} = {formatPrice(calculateTotalPrice(selectedPlan, selectedInstallments))}
                                {hasInterest(selectedPlan, selectedInstallments) && (
                                    <span className="text-orange-600">
                                        <br />
                                        <strong>Economia à vista:</strong> {formatPrice(calculateTotalPrice(selectedPlan, selectedInstallments) - selectedPlan.price)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-3xl font-bold text-gray-900">
                        {formatPrice(selectedPlan.price)}
                    </div>
                    <p className="text-gray-600 mt-2">Pagamento único</p>
                </div>
            )}

            <div className="flex justify-between pt-4">
                <button
                    onClick={onBack}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                    Voltar
                </button>
                <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition"
                >
                    Continuar
                </button>
            </div>
        </div>
    )

    // Step 2: Método de pagamento
    const renderStep2 = () => {
        const totalPrice = calculateTotalPrice(selectedPlan, selectedInstallments)
        const installmentValue = calculateInstallmentValue(selectedPlan, selectedInstallments)

        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Método de Pagamento
                    </h2>
                    <p className="text-gray-600">
                        Como você gostaria de pagar?
                    </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700">
                            {selectedInstallments === 1 ? 'À vista:' : `${selectedInstallments}x de:`}
                        </span>
                        <span className="font-bold text-xl text-black">
                            {selectedInstallments === 1 ? formatPrice(totalPrice) : formatPrice(installmentValue)}
                        </span>
                    </div>
                    {selectedInstallments > 1 && (
                        <div className="flex items-center justify-between text-sm mt-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium text-black">
                                {formatPrice(totalPrice)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                        Escolha seu método de pagamento:
                    </label>

                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => setSelectedPaymentMethod('CREDIT_CARD')}
                            className={`w-full p-4 border rounded-lg text-left transition ${selectedPaymentMethod === 'CREDIT_CARD'
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <CreditCard className="h-6 w-6 text-gray-600" />
                                <div>
                                    <p className="font-medium text-gray-900">Cartão de Crédito</p>
                                    <p className="text-sm text-gray-600">Cobrança recorrente automática</p>
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedPaymentMethod('PIX')}
                            className={`w-full p-4 border rounded-lg text-left transition ${selectedPaymentMethod === 'PIX'
                                ? 'border-yellow-500 bg-yellow-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <DollarSign className="h-6 w-6 text-gray-600" />
                                <div>
                                    <p className="font-medium text-gray-900">PIX</p>
                                    <p className="text-sm text-gray-600">Pagamento via PIX (renovação manual)</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                    <button
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                    >
                        Voltar
                    </button>
                    <button
                        onClick={() => setCurrentStep(3)}
                        className="px-6 py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 transition"
                    >
                        Continuar
                    </button>
                </div>
            </div>
        )
    }

    // Step 3: Dados do pagamento
    const renderStep3 = () => {
        const totalPrice = calculateTotalPrice(selectedPlan, selectedInstallments)
        const installmentValue = calculateInstallmentValue(selectedPlan, selectedInstallments)

        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedPaymentMethod === 'CREDIT_CARD' ? 'Dados do Cartão' : 'Pagamento via PIX'}
                    </h2>
                    <p className="text-gray-600">
                        {selectedPaymentMethod === 'CREDIT_CARD'
                            ? 'Insira os dados do seu cartão de crédito'
                            : 'Escaneie o QR Code ou copie o código PIX'
                        }
                    </p>
                </div>

                {selectedPaymentMethod === 'CREDIT_CARD' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Número do Cartão
                            </label>
                            <input
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Validade
                                </label>
                                <input
                                    type="text"
                                    placeholder="MM/AA"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CVV
                                </label>
                                <input
                                    type="text"
                                    placeholder="123"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome no Cartão
                            </label>
                            <input
                                type="text"
                                placeholder="João Silva"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="bg-gray-100 rounded-lg p-8">
                            <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center">
                                <p className="text-gray-500">QR Code PIX</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">Código PIX:</p>
                            <p className="font-mono text-sm bg-white p-2 rounded border break-all">
                                00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000...
                            </p>
                            <button className="mt-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                                Copiar código
                            </button>
                        </div>

                        <p className="text-sm text-gray-600">
                            Valor: <strong>{selectedInstallments === 1 ? formatPrice(totalPrice) : formatPrice(installmentValue)}</strong>
                        </p>
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <button
                        onClick={() => setCurrentStep(2)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                    >
                        Voltar
                    </button>
                    <button
                        onClick={handlePaymentSubmit}
                        disabled={loading}
                        className={`px-6 py-2 rounded-lg transition ${loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-400 text-black hover:bg-yellow-300'
                            }`}
                    >
                        {loading ? 'Processando...' : selectedPaymentMethod === 'CREDIT_CARD' ? 'Confirmar Pagamento' : 'Confirmar PIX'}
                    </button>
                </div>
            </div>
        )
    }

    // Step 4: Sucesso
    const renderStep4 = () => (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
            </div>

            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Pagamento Confirmado!
                </h2>
                <p className="text-gray-600">
                    Seu plano foi ativado com sucesso. Redirecionando para o dashboard...
                </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                    {selectedPlan.name} - Ativo
                </h3>
                <p className="text-sm text-green-700">
                    Próximo vencimento: {new Date(Date.now() + selectedPlan.durationDays * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
            </div>

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-center space-x-2 mb-8">
                {[1, 2, 3, 4].map((step) => (
                    <div
                        key={step}
                        className={`w-3 h-3 rounded-full ${step === currentStep
                            ? 'bg-yellow-400'
                            : step < currentStep
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}
                    />
                ))}
            </div>

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
        </div>
    )
}