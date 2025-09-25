import React from 'react'
import { BackButton } from './BackButton'
import { Button } from '@/components/shared/Button'

interface PageHeaderProps {
  title: string
  buttonText: string
  onButtonClick: () => void
  isLoading?: boolean
  isDetailsPage?: boolean
  isDisablesPage?: boolean
}

export function PageHeader({ title, buttonText, onButtonClick, isLoading = false, isDetailsPage = false, isDisablesPage = false }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      {isDetailsPage && <BackButton />}
      <h1 className="text-2xl font-bold text-gray-500">{title}</h1>
      <Button
      onClick={onButtonClick}
      variant='add'
      disabled={isLoading || isDisablesPage}
      >
      {buttonText}
      </Button>
    </div>
  )
}