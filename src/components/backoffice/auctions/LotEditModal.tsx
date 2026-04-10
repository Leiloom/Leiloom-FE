import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Lot } from '@/types/auction'
import { Cog, Check, X as XIcon } from 'lucide-react'

// Mapa de Labels
const ITEM_FIELD_LABELS: Record<string, string> = {
  title: 'Título do Item',
  itemType: 'Tipo do Item',
  description: 'Descrição',
  basePrice: 'Preço Base',
  increment: 'Incremento',
  state: 'Estado',
  city: 'Cidade',
  location: 'Endereço',
  zipCode: 'CEP',
  status: 'Status do Item',
  images: 'Links das Imagens',
  
  propertyType: 'Tipo de Imóvel',
  area: 'Área',
  bedrooms: 'Quartos',
  parkingSpots: 'Vagas',
  condition: 'Condição de Uso',
  financing: 'Apto p/ Financiamento',
  additionalExpensesDescription: 'Desc. Despesas',
  additionalExpensesValue: 'Valor Despesas',
  auctioneeerCommission: 'Comissão',
  
  yearManufacturing: 'Ano Fabricação',
  yearModel: 'Ano Modelo',
  brand: 'Marca',
  model: 'Modelo',
  color: 'Cor',
  kilometers: 'Quilometragem',
  damage: 'Sinistro'
}

interface LotEditModalProps {
  isOpen: boolean
  onClose: () => void
  action: 'create' | 'edit'
  lot: Lot | null
  onSave: (data: Partial<Lot>) => void
  isLoading: boolean
  
  // Props para gestão de tags
  lotTags: Record<string, string> // Mapeamento "campo" -> "seletor"
  onOpenTagModal: (field: string) => void
  onCopyTagsRequest?: () => void
}

export default function LotEditModal({
  isOpen,
  onClose,
  action,
  lot,
  onSave,
  isLoading,
  lotTags,
  onOpenTagModal,
  onCopyTagsRequest
}: LotEditModalProps) {
  
  const [identification, setIdentification] = useState('')

  useEffect(() => {
    if (isOpen) {
      setIdentification(lot?.identification || '')
    }
  }, [isOpen, lot])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      identification
    })
  }

  const renderStatusIcon = (fieldName: string) => {
    const isConfigured = !!lotTags[fieldName]
    if (isConfigured) {
      return <Check className="h-3 w-3 text-blue-900 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
    }
    return <XIcon className="h-3 w-3 text-red-900 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
  }

  const renderCogButton = (fieldName: string) => (
    <div className="relative inline-block ml-3">
        <button type="button" className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none" onClick={() => onOpenTagModal(fieldName)}>
            <Cog className="h-4 w-4" />
        </button>
        {renderStatusIcon(fieldName)}
    </div>
  )

  const renderFieldWithConfig = (fieldName: string) => (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition-colors">
      <span className="text-sm font-medium text-gray-700">{ITEM_FIELD_LABELS[fieldName]}</span>
      <div className="flex items-center">
        {lotTags[fieldName] && (
          <span className="text-xs text-gray-400 truncate max-w-[120px] mr-2" title={lotTags[fieldName]}>
            {lotTags[fieldName]}
          </span>
        )}
        {renderCogButton(fieldName)}
      </div>
    </div>
  )

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !isLoading && onClose()}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {action === 'create' ? 'Adicionar Lote' : 'Editar Lote'}
                  </Dialog.Title>
                  
                  {action === 'edit' && onCopyTagsRequest && (
                    <Button type="button" variant="add3" onClick={onCopyTagsRequest} disabled={isLoading}>
                      Copiar Tags de Outro Lote
                    </Button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Seção 1: Dados Básicos */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider bg-gray-50 p-2 rounded">Dados do Lote</h4>
                    <div className="grid grid-cols-1 gap-4 px-2">
                        <div className="col-span-1">
                          <label htmlFor="identification" className="block text-sm font-medium text-gray-700 mb-1">Identificação do Lote <span className="text-red-500">*</span></label>
                          <Input id="identification" name="identification" type="text" placeholder="Ex: Lote 001" value={identification} onChange={e => setIdentification(e.target.value)} required disabled={isLoading} />
                        </div>
                    </div>
                  </div>

                  {/* Seção 2: Tags Master (Só para edição) */}
                  {action === 'edit' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Tags Master do Lote</h4>
                        <span className="text-xs text-gray-500">Estas tags serão herdadas por todos os itens deste lote.</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-2 px-2 max-h-60 overflow-y-auto">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-400 mb-2 border-b pb-1">Geral / Comum</div>
                          {renderFieldWithConfig('title')}
                          {renderFieldWithConfig('itemType')}
                          {renderFieldWithConfig('description')}
                          {renderFieldWithConfig('basePrice')}
                          {renderFieldWithConfig('increment')}
                          {renderFieldWithConfig('status')}
                          {renderFieldWithConfig('images')}
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-400 mb-2 border-b pb-1">Localização & Imóveis</div>
                          {renderFieldWithConfig('state')}
                          {renderFieldWithConfig('city')}
                          {renderFieldWithConfig('zipCode')}
                          {renderFieldWithConfig('location')}
                          <div className="mt-4 text-xs font-bold text-gray-400 mb-2 border-b pb-1">Detalhes Imóvel</div>
                          {renderFieldWithConfig('propertyType')}
                          {renderFieldWithConfig('area')}
                          {renderFieldWithConfig('bedrooms')}
                          {renderFieldWithConfig('parkingSpots')}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-gray-400 mb-2 border-b pb-1">Veículos & Outros</div>
                          {renderFieldWithConfig('yearManufacturing')}
                          {renderFieldWithConfig('yearModel')}
                          {renderFieldWithConfig('brand')}
                          {renderFieldWithConfig('model')}
                          {renderFieldWithConfig('color')}
                          {renderFieldWithConfig('kilometers')}
                          {renderFieldWithConfig('damage')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                      <p className="text-sm text-yellow-800 text-center">
                        Salve o lote primeiro para poder configurar as <b>Tags Master</b> e habilitar a herança para os itens.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                    <Button type="button" onClick={onClose} variant="neutral" disabled={isLoading}>Cancelar</Button>
                    <Button type="submit" variant={action === 'create' ? 'add' : 'primary'} disabled={isLoading}>
                      {action === 'create' ? 'Adicionar Lote' : 'Atualizar Lote e Fechar'}
                    </Button>
                  </div>
                </form>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
