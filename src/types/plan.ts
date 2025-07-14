export interface Plan {
  id?: string
  name: string
  description?: string
  price: number
  durationDays: number
  numberOfUsers?: number
  isTrial: boolean
  allowInstallments?: boolean
  maxInstallments?: number
  absorbTax?: boolean
  isActive?: boolean
  createdOn?: Date
  updatedOn?: Date
}