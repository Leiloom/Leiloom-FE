import { NextApiRequest, NextApiResponse } from 'next'
import { MercadoPagoConfig, Preference } from 'mercadopago'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

    // req.body já vem com todos os dados montados do front-end
    const preference = await new Preference(client).create({
      body: req.body
    })

    return res.status(200).json(preference)
  } catch (err) {
    console.error('Erro ao criar preferência Mercado Pago:', err)
    return res.status(500).json({ error: 'Erro ao criar preferência de pagamento' })
  }
}
