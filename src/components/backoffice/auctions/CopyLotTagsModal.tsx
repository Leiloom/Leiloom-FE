import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/shared/Button'
import { Lot } from '@/types/auction'

interface CopyLotTagsModalProps {
  isOpen: boolean
  onClose: () => void
  currentLot: Lot | null
  availableLots: Lot[]
  onConfirm: (sourceLotId: string) => void
  isLoading: boolean
}

export default function CopyLotTagsModal({
  isOpen,
  onClose,
  currentLot,
  availableLots,
  onConfirm,
  isLoading
}: CopyLotTagsModalProps) {
  const [selectedSourceLotId, setSelectedSourceLotId] = useState<string>('')

  // Filtrar os lotes disponíveis para remover o lote atual que estamos editando
  const otherLots = availableLots.filter(l => l.id !== currentLot?.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSourceLotId) return
    onConfirm(selectedSourceLotId)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={() => !isLoading && onClose()}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  Copiar Tags de Outro Lote
                </Dialog.Title>

                {otherLots.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Não há outros lotes disponíveis neste leilão para copiar as tags.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <p className="text-sm text-gray-600 mb-4">
                      Selecione um lote de origem. As configurações Master (Tags e URLs de scraping) serão copiadas para o lote atual (<strong>{currentLot?.identification}</strong>). 
                      <br /><br />
                      <span className="text-red-600 text-xs font-semibold">⚠️ ATENÇÃO: As tags atuais deste lote serão sobrescritas.</span>
                    </p>

                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2">
                      {otherLots.map((lot) => (
                        <label key={lot.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            name="source-lot"
                            value={lot.id}
                            checked={selectedSourceLotId === lot.id}
                            onChange={(e) => setSelectedSourceLotId(e.target.value)}
                            className="mr-3 cursor-pointer h-4 w-4 text-blue-600 focus:ring-blue-500"
                            disabled={isLoading}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{lot.identification}</p>
                            <p className="text-xs text-gray-500">
                              {lot.items?.length || 0} itens
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                      <Button type="button" variant="neutral" onClick={onClose} disabled={isLoading}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" disabled={isLoading || !selectedSourceLotId}>
                        Confirmar Cópia
                      </Button>
                    </div>
                  </form>
                )}
                
                {otherLots.length === 0 && (
                   <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                    <Button type="button" variant="primary" onClick={onClose} disabled={isLoading}>
                      Entendi
                    </Button>
                 </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
