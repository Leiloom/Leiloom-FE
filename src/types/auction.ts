export enum AuctionType {
  ONLINE = 'ONLINE',
  LOCAL = 'LOCAL'
}

export enum ItemType {
  IMOVEL = 'IMOVEL',
  VEICULO = 'VEICULO',
  OUTROS = 'OUTROS'
}

export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED'
}

export interface PropertyAuction {
  id: string
  auctionItemId: string
  type: string 
  bedrooms?: number
  parkingSpots?: number
  area?: number 
}

export interface AuctionItem {
  id: string
  auctionId: string
  lotId: string
  title: string
  description?: string
  type: ItemType
  basePrice: number
  increment: number
  status: ItemStatus
  createdOn: string
  updatedOn: string
  
  // Relacionamentos
  auction?: Auction
  lot?: Lot
  propertyDetails?: PropertyAuction
}

export interface Lot {
  id: string
  auctionId: string
  identification: string
  createdOn: string
  updatedOn: string
  
  // Relacionamentos
  auction?: Auction
  items?: AuctionItem[]
}

export interface Auction {
  id: string
  name: string
  type: AuctionType
  location?: string
  url?: string
  openingDate: string
  closingDate: string
  isActive: boolean
  createdBy: string
  createdOn: string
  updatedBy?: string
  updatedOn?: string
  
  lots?: Lot[]
  items?: AuctionItem[] 
}

export interface CreateAuctionData {
  name: string
  type: AuctionType
  location?: string
  url?: string
  openingDate: string
  closingDate: string
  createdBy?: string
}

export interface CreateLotData {
  auctionId: string
  identification: string
}

export interface PropertyDetailsData {
  type: string
  bedrooms?: number
  parkingSpots?: number
  area?: number
}

export interface CreateAuctionItemData {
  lotId: string
  title: string
  description?: string
  type: ItemType
  basePrice: number | string
  increment: number | string
  status?: ItemStatus
  propertyDetails?: PropertyDetailsData
}

// DTOs para atualização
export interface UpdateAuctionData extends Partial<CreateAuctionData> {
  updatedBy?: string
}

export interface UpdateLotData extends Partial<CreateLotData> {}

export interface UpdateAuctionItemData extends Partial<CreateAuctionItemData> {}