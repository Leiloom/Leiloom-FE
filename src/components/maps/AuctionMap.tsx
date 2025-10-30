'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { Auction } from '@/types/auction'
import { useRouter } from 'next/navigation'

interface AuctionMapProps {
  auctions: Auction[]
}

type AuctionWithCoords = Auction & {
  coords?: { lat: number; lng: number } | null
}

const DynamicMap = dynamic(() => import('./AuctionMapClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-gray-100 rounded-lg text-gray-500">
      Carregando mapa...
    </div>
  ),
})

export default function AuctionMap({ auctions }: AuctionMapProps) {
  return <DynamicMap auctions={auctions} />
}