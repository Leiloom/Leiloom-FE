// pages/api/mercadopago/create-preference.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    if (!process.env.MP_ACCESS_TOKEN) {
      return res.status(500).json({ error: 'Configuração do Mercado Pago não encontrada' })
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
      options: {
        timeout: 5000,
        idempotencyKey: `preference_${Date.now()}_${Math.random()}`
      }
    })

    const {
      items,
      payer,
      back_urls,
      external_reference,
      notification_url,
      payment_methods,
      metadata
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items são obrigatórios' })
    }

    if (!external_reference) {
      return res.status(400).json({ error: 'External reference é obrigatória' })
    }

    let normalizedEmail = payer?.email || ''
    if (normalizedEmail.includes('+')) {
      const [localPart] = normalizedEmail.split('+')
      if (localPart === 'matheushyy7') {
        normalizedEmail = 'mathheus.souza@outlook.com'
        console.log('📧 Email normalizado para teste:', normalizedEmail)
      }
    }

    const itemList = items.map((item: any, index: number) => {
      const value = Number(item.unit_price)
      const valid = !isNaN(value) && typeof value === 'number'
      if (!valid) {
        throw new Error(`item[${index}].unit_price inválido: ${item.unit_price}`)
      }

      return {
        id: `item_${Date.now()}_${index}`,
        title: item.title || 'Produto Leiloom',
        quantity: item.quantity || 1,
        unit_price: value,
        currency_id: 'BRL',
        category_id: 'services'
      }
    })
    const preferenceData = {
      items: itemList,
      payer: {
        name: payer?.name || 'Cliente',
        surname: payer?.surname || 'Leiloom',
        email: normalizedEmail
      },
      back_urls: {
        success: back_urls?.success || `${req.headers.origin}/payment-success`,
        failure: back_urls?.failure || `${req.headers.origin}/payment-failure`,
        pending: back_urls?.pending || `${req.headers.origin}/payment-pending`
      },
      external_reference,
      notification_url: notification_url || `${process.env.NEXT_PUBLIC_MP_URL}/api/mercadopago/webhook`,
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },
          { id: 'atm' }
        ],
        installments: payment_methods?.installments || 1,
      },
      auto_return: 'approved',
      metadata: {
        ...metadata,
        source: 'leiloom_app',
        version: '1.0'
      },
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      binary_mode: false,
      additional_info: 'Assinatura Leiloom',
      marketplace: 'NONE',
      marketplace_fee: 0
    }
    const preference = await new Preference(client).create({ body: preferenceData })

    return res.status(200).json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    })

  } catch (err: any) {

    if (err.response) {
      console.error('📋 Erro detalhado MP:', JSON.stringify(err.response.data, null, 2))
      return res.status(err.response.status || 500).json({
        error: 'Erro na API do Mercado Pago',
        message: err.response.data?.message || err.message,
        cause: err.response.data?.cause || null
      })
    }
    return res.status(500).json({
      error: 'Erro interno ao criar preferência',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
  }
}
