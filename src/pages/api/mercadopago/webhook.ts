// pages/api/mercadopago/webhook.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const body = req.body
    console.log('🔔 Webhook MP recebido:', JSON.stringify(body, null, 2))

    // 1. Buscando paymentId (cobre os dois formatos)
    let paymentId: string | undefined = undefined
    if (body.type === 'payment') {
      paymentId = body.data?.id?.toString()
    } else if (body.resource) {
      // Notificação clássica do MP
      const match = body.resource.match(/\/v1\/payments\/(\d+)/)
      if (match) paymentId = match[1]
    } else if (body.data?.id) {
      paymentId = body.data.id.toString()
    }

    if (!paymentId) {
      console.log('❌ Payment ID não encontrado no webhook')
      return res.status(200).json({ received: true, message: 'No payment ID' })
    }

    console.log(`🔍 Buscando detalhes do pagamento ${paymentId} no MP...`)

    // 2. Buscar detalhes do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mpResponse.ok) {
      console.error('❌ Erro ao consultar MP:', mpResponse.status, mpResponse.statusText)
      return res.status(500).json({ error: 'Erro ao consultar Mercado Pago' })
    }

    const paymentData = await mpResponse.json()
    console.log('💳 Dados do pagamento MP:', JSON.stringify(paymentData, null, 2))

    // 3. Processar pagamento aprovado
    if (paymentData.status === 'approved') {
      console.log('✅ Pagamento aprovado! Processando...')

      const externalRef = paymentData.external_reference
      if (!externalRef || !externalRef.startsWith('payment_')) {
        console.log('❌ External reference inválida:', externalRef)
        return res.status(200).json({
          received: true,
          message: 'External reference não corresponde ao padrão'
        })
      }

      const internalPaymentId = externalRef.replace('payment_', '')
      console.log(`🎯 Processando pagamento interno: ${internalPaymentId}`)

      try {
        // Chamar backend para processar pagamento
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
        const backendResponse = await fetch(`${backendUrl}/payments/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: internalPaymentId,
            externalId: paymentData.id?.toString(),
            gatewayResponse: paymentData
          })
        })

        if (!backendResponse.ok) {
          const errorText = await backendResponse.text()
          console.error('❌ Erro no backend:', backendResponse.status, errorText)
          return res.status(500).json({
            error: 'Erro ao processar no backend',
            details: errorText
          })
        }

        const result = await backendResponse.json()
        console.log('🎉 Pagamento processado com sucesso:', result)

        return res.status(200).json({
          received: true,
          processed: true,
          message: 'Pagamento processado e plano ativado',
          paymentId: internalPaymentId
        })

      } catch (backendError: any) {
        console.error('💥 Erro ao chamar backend:', backendError)
        return res.status(500).json({
          error: 'Erro na comunicação com backend',
          details: backendError.message
        })
      }

    } else {
      console.log(`ℹ️ Pagamento com status: ${paymentData.status} - Não processando`)
      return res.status(200).json({
        received: true,
        message: `Pagamento com status ${paymentData.status}`
      })
    }

  } catch (error: any) {
    console.error('💥 Erro geral no webhook:', error)
    return res.status(500).json({
      error: 'Erro interno no webhook',
      details: error.message
    })
  }
}
