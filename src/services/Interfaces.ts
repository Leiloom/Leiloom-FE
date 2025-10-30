export default interface ClientUser {
  id?: string
  clientId: string
  name: string
  email: string
  cpfCnpj: string
  phone: string
  role: 'ClientOwner' | 'ClientAdmin' | 'ClientFinancial' | 'ClientOperator'
  status: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'EXCLUDED'
  confirmationCode?: string
  isConfirmed: boolean
  createdOn?: string
  updatedOn?: string
}

export default interface Client {
  id?: string
  name: string
  cpfCnpj: string
  email: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  country?: string
  status: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'EXCLUDED'
  confirmationCode?: string
  isConfirmed: boolean
  createdOn?: string
  updatedOn?: string
  clientUsers?: ClientUser[]
}

export default interface ClientReduced {
  id?: string
  name: string
  cpfCnpj: string
  email: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  country?: string
  status: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'EXCLUDED'
  confirmationCode?: string
  isConfirmed: boolean
  createdOn?: string
  updatedOn?: string
}

