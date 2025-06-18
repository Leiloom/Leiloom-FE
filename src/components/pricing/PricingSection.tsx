'use client'

import { CheckIcon } from '@heroicons/react/20/solid'

const tiers = [
  {
    name: 'Hobby',
    id: 'tier-hobby',
    href: '#',
    priceMonthly: 'R$29',
    description: "Plano ideal para quem está começando no Radar Leilão.",
    features: ['25 produtos', 'Até 10.000 leads', 'Dashboard detalhado', 'Suporte em até 24h'],
    featured: false,
  },
  {
    name: 'Profissional',
    id: 'tier-enterprise',
    href: '#',
    priceMonthly: 'R$99',
    description: 'Suporte dedicado e automações avançadas para empresas.',
    features: [
      'Produtos ilimitados',
      'Leads ilimitados',
      'Dashboard avançado',
      'Representante dedicado',
      'Automações de marketing',
      'Integrações personalizadas',
    ],
    featured: true,
  },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function PricingSection() {
  return (
    <div className="relative isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-base font-semibold text-indigo-600">Planos</h2>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
          Escolha o plano ideal pra você
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
          Tenha acesso às melhores funcionalidades para destacar seus leilões com praticidade e performance.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured ? 'relative bg-gray-900 shadow-2xl' : 'bg-white/60 sm:mx-8 lg:mx-0',
              tier.featured
                ? ''
                : tierIdx === 0
                ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl'
                : 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none',
              'rounded-3xl p-8 ring-1 ring-gray-900/10 sm:p-10'
            )}
          >
            <h3 className={classNames(tier.featured ? 'text-indigo-400' : 'text-indigo-600', 'text-base font-semibold')}>
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span className={classNames(tier.featured ? 'text-white' : 'text-gray-900', 'text-5xl font-semibold')}>
                {tier.priceMonthly}
              </span>
              <span className={classNames(tier.featured ? 'text-gray-400' : 'text-gray-500', 'text-base')}>
                /mês
              </span>
            </p>
            <p className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'mt-6')}>
              {tier.description}
            </p>
            <ul className={classNames(tier.featured ? 'text-gray-300' : 'text-gray-600', 'mt-8 space-y-3 text-sm')}>
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    aria-hidden="true"
                    className={classNames(tier.featured ? 'text-indigo-400' : 'text-indigo-600', 'h-6 w-5 flex-none')}
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={tier.href}
              aria-describedby={tier.id}
              className={classNames(
                tier.featured
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'text-indigo-600 ring-1 ring-indigo-200 hover:ring-indigo-300',
                'mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold'
              )}
            >
              Começar agora
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
