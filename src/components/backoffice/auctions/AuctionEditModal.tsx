import React, { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'

interface AuctionEditModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (auctionData: any) => void
    auction: any
    isLoading?: boolean
}

export default function AuctionEditModal({
    isOpen,
    onClose,
    onSave,
    auction,
    isLoading = false
}: AuctionEditModalProps) {
    const [formData, setFormData] = useState({
        name: auction?.name || '',
        type: auction?.type || 'ONLINE',
        location: auction?.location || '',
        url: auction?.url || '',
        openingDate: auction?.openingDate ? new Date(auction.openingDate).toISOString().slice(0, 16) : '',
        closingDate: auction?.closingDate ? new Date(auction.closingDate).toISOString().slice(0, 16) : ''
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            ...formData,
            openingDate: new Date(formData.openingDate).toISOString(),
            closingDate: new Date(formData.closingDate).toISOString(),
            updatedBy: 'system'
        })
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog
                as="div"
                className="relative z-10"
                onClose={() => !isLoading && onClose()}
            >
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
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-semibold text-gray-900"
                                    >
                                        Editar Leilão
                                    </Dialog.Title>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                    {/* Informações Básicas */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-medium text-gray-900">Informações Básicas</h4>

                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                Nome do Leilão *
                                            </label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                required
                                                disabled={isLoading}
                                                placeholder="Nome do leilão" name={''} />
                                        </div>

                                        <div>
                                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                                                Tipo do Leilão *
                                            </label>
                                            <select
                                                id="type"
                                                value={formData.type}
                                                onChange={(e) => handleInputChange('type', e.target.value)}
                                                required
                                                className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                                disabled={isLoading}
                                            >
                                                <option value="ONLINE">Online</option>
                                                <option value="LOCAL">Presencial</option>
                                            </select>
                                        </div>

                                        {formData.type === 'LOCAL' ? (
                                            <div>
                                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Local do Leilão
                                                </label>
                                                <Input
                                                    id="location"
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                                    disabled={isLoading}
                                                    placeholder="Endereço do local do leilão" name={''} />
                                            </div>
                                        ) : (
                                            <div>
                                                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                                                    URL do Leilão
                                                </label>
                                                <Input
                                                    id="url"
                                                    type="url"
                                                    value={formData.url}
                                                    onChange={(e) => handleInputChange('url', e.target.value)}
                                                    disabled={isLoading}
                                                    placeholder="https://..." name={''} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Datas */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-medium text-gray-900">Período do Leilão</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="openingDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Data/Hora de Abertura *
                                                </label>
                                                <Input
                                                    id="openingDate"
                                                    type="datetime-local"
                                                    value={formData.openingDate}
                                                    onChange={(e) => handleInputChange('openingDate', e.target.value)}
                                                    required
                                                    disabled={isLoading} name={''}                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                    Data/Hora de Encerramento *
                                                </label>
                                                <Input
                                                    id="closingDate"
                                                    type="datetime-local"
                                                    value={formData.closingDate}
                                                    onChange={(e) => handleInputChange('closingDate', e.target.value)}
                                                    required
                                                    disabled={isLoading} name={''}                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botões */}
                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                                        <Button
                                            type="button"
                                            onClick={onClose}
                                            variant="neutral"
                                            disabled={isLoading}
                                        >
                                            Cancelar
                                        </Button>

                                        <Button
                                            type="submit"
                                            variant="primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
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
