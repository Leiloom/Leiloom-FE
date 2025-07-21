import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Webhook MP recebido:', body)

    // Verificar se é notificação de pagamento
    if (body.type === 'payment') {
      const paymentId = body.data.id
      
      // Buscar detalhes do pagamento no MP
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      })

      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json()
        console.log('Dados do pagamento:', paymentData)

        // Aqui você processaria o pagamento no seu sistema
        // Exemplo: ativar plano, enviar email, etc.
        
        if (paymentData.status === 'approved') {
          console.log('Pagamento aprovado:', paymentData.external_reference)
          
          // Extrair informações da external_reference
          const externalRef = paymentData.external_reference
          if (externalRef && externalRef.includes('plan_')) {
            const parts = externalRef.split('_')
            const planId = parts[1]
            
            // Aqui você faria a chamada para seu backend para ativar o plano
            // await activatePlan(planId, paymentData)
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
