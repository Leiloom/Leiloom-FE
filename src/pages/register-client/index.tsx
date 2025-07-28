'use client'
import Head from 'next/head'
import { useState } from 'react'
import { RegisterClientProvider } from '@/contexts/RegisterClientContext'
import StepOneForm from './StepOneForm'
import StepTwoEmailCode from './StepTwoEmailCode'
import StepThreeDetails from './StepThreeDetails'
import StepFourPlans from './StepFourPlans'
import StepFivePayment from './StepFivePayment'
import MainLayout from '@/layouts/MainLayout'
import { Plan } from '@/types/plan'

export default function RegisterClientPage() {
  return (
    <MainLayout>
      <RegisterClientProvider>
        <WizardContent />
      </RegisterClientProvider>
    </MainLayout>
  )
}

function WizardContent() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)


  function handleNextStep() {
    setStep(prev => prev + 1)
  }

  function handlePreviousStep() {
    setStep(prev => prev - 1)
  }

  function handlePlanSelected(plan: Plan, paymentId?: string) {
    setSelectedPlan(plan)
    if (paymentId) setPaymentId(paymentId)
    if (!plan.isTrial) {
      setStep(5)
    }
  }


  // Volta do step 5 para step 4
  function handleBackToPlans() {
    setStep(4)
    setSelectedPlan(null)
  }

  return (
    <>
      <Head>
        <title>Registrar Cliente - Leiloom</title>
        <meta name="description" content="Crie sua conta e escolha seu plano na plataforma Leiloom" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
            {step === 1 && 'Crie sua conta - Dados básicos'}
            {step === 2 && 'Verifique seu e-mail'}
            {step === 3 && 'Preencha seus dados pessoais'}
            {step === 4 && 'Escolha seu plano'}
            {step === 5 && 'Finalizar assinatura'}
          </h1>

          {step === 1 && <StepOneForm onNext={() => setStep(2)} />}
          {step === 2 && <StepTwoEmailCode onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepThreeDetails onNext={() => setStep(4)} />}
          {step === 4 && (
            <StepFourPlans
              onBack={() => setStep(3)}
              onNext={handlePlanSelected}
            />
          )}
          {step === 5 && selectedPlan && paymentId && (
            <StepFivePayment
              selectedPlan={selectedPlan}
              paymentId={paymentId}
              onBack={handleBackToPlans}
            />
          )}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-3 h-3 rounded-full ${s === step
                      ? 'bg-yellow-400'
                      : s < step
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}