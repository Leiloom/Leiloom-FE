export enum ScrapingFieldType {
  // Campos de Auction
  AUCTION_NAME = 'AUCTION_NAME',
  AUCTION_TYPE = 'AUCTION_TYPE',
  AUCTION_URL = 'AUCTION_URL',
  AUCTION_OPENING_DATE = 'AUCTION_OPENING_DATE',
  AUCTION_CLOSING_DATE = 'AUCTION_CLOSING_DATE',
  
  // Campos de AuctionItem
  ITEM_TITLE = 'ITEM_TITLE',
  ITEM_TYPE = 'ITEM_TYPE',
  ITEM_DESCRIPTION = 'ITEM_DESCRIPTION',
  ITEM_BASE_PRICE = 'ITEM_BASE_PRICE',
  ITEM_INCREMENT = 'ITEM_INCREMENT',
  ITEM_STATE = 'ITEM_STATE',
  ITEM_CITY = 'ITEM_CITY',
  ITEM_LOCATION = 'ITEM_LOCATION',
  ITEM_ZIP_CODE = 'ITEM_ZIP_CODE',
  ITEM_STATUS = 'ITEM_STATUS',
  ITEM_IMAGES = 'ITEM_IMAGES',
  
  // Campos de PropertyAuction
  PROPERTY_TYPE = 'PROPERTY_TYPE',
  PROPERTY_AREA = 'PROPERTY_AREA',
  PROPERTY_BEDROOMS = 'PROPERTY_BEDROOMS',
  PROPERTY_PARKING_SPOTS = 'PROPERTY_PARKING_SPOTS',
}

export interface CreateScrapingConfigDto {
  auctionId: string
  itemId?: string | null
  fieldName: string
  selector: string
}

export interface ScrapingConfigResponse {
  id: string
  auctionId: string
  itemId: string | null
  fieldType: ScrapingFieldType
  selector: string
  createdOn: Date
  updatedOn: Date
  item?: {
    id: string
    title: string
  }
}