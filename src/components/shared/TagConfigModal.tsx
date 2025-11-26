import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'

interface TagConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tag: string) => void
  fieldLabel: string
  isLoading?: boolean
}

export default function TagConfigModal({
  isOpen,
  onClose,
  onSave,
  fieldLabel,
  isLoading = false
}: TagConfigModalProps) {
  const [tagInput, setTagInput] = useState('')

  // Reseta o input sempre que o modal abre
  useEffect(() => {
    if (isOpen) setTagInput('')
  }, [isOpen])

  // Listener para ESC (Embora o Dialog do Headless UI já faça isso, mantivemos para garantir a lógica original de verificar !isLoading)
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isLoading, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(tagInput)
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !isLoading && onClose()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">
                  {fieldLabel ? `Configurar Tag — ${fieldLabel}` : 'Configurar Tag'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="tag-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Tag
                    </label>
                    <Input
                      id="tag-input"
                      name="tag"
                      type="text"
                      placeholder="Digite uma tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Campo sem persistência por enquanto.</p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="neutral" onClick={onClose} disabled={isLoading}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" disabled={isLoading}>
                      Salvar Tag
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