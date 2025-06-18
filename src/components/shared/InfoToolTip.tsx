import { Info } from 'lucide-react'
import { ReactNode } from 'react'

interface InfoTooltipProps {
  text: ReactNode
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <div className="relative flex items-center group">
      <Info className="w-4 h-4 text-blue-600 cursor-pointer" />
      <div className="absolute left-full top-1/2 translate-y-[-50%] ml-2 hidden w-max max-w-xs px-3 py-2 rounded-lg bg-gray-800 text-white text-sm group-hover:block z-10">
        {text}
        <div className="absolute top-1/2 left-[-4px] -translate-y-1/2 w-2 h-2 rotate-45 bg-gray-800"></div>
      </div>
    </div>
  )
}
