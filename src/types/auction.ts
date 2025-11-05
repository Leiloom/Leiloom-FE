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
export interface AuctionImage {
  id: string
  url: string
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

  state?: string
  city?: string
  location?: string
  zipCode?: string
  lat?: number
  lng?: number
  images?: string[] | AuctionImage[]

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


  auction?: Auction
  items?: AuctionItem[]
}

export interface Auction {
  id: string
  name: string
  type: AuctionType
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
  auctionId: string
  title: string
  description?: string
  type: ItemType
  basePrice: number | string
  increment: number | string
  status?: ItemStatus

  state?: string
  city?: string
  location?: string
  zipCode?: string
  lat?: number
  lng?: number

  propertyDetails?: PropertyDetailsData

  images?: string[]
}


export interface UpdateAuctionData extends Partial<CreateAuctionData> {
  updatedBy?: string
  isActive?: boolean
  type?: AuctionType
}

export interface UpdateLotData extends Partial<CreateLotData> {}

export interface UpdateAuctionItemData extends Partial<CreateAuctionItemData> {
  images?: string[]
}
