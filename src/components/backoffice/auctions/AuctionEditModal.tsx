import React, { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Calendar, Clock, X, Cog } from 'lucide-react'
// Importações Refatoradas
import { useTagModal } from '../../../hooks/useTagModel'
import TagConfigModal from '@/components/shared/TagConfigModal'

// Mapa de Labels
const AUCTION_FIELD_LABELS: Record<string, string> = {
    name: 'Nome',
    type: 'Tipo',
    url: 'URL (opcional)',
    openingDate: 'Data de Abertura',
    closingDate: 'Data de Encerramento'
}

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
    isLoading = false,
}: AuctionEditModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'ONLINE',
        url: '',
        openingDate: '',
        closingDate: '',
    })

    // --- HOOK DE TAG MODAL (REFATORADO) ---
    const { 
        isOpen: isTagModalOpen, 
        selectedField: selectedTagField, 
        openTagModal, 
        closeTagModal 
    } = useTagModal()

    // 🔹 Atualiza o form quando o auction mudar
    useEffect(() => {
        if (auction) {
            setFormData({
                name: auction.name || '',
                type: auction.type || 'ONLINE',
                url: auction.url || '',
                openingDate: auction.openingDate
                    ? new Date(auction.openingDate).toISOString().slice(0, 16)
                    : '',
                closingDate: auction.closingDate
                    ? new Date(auction.closingDate).toISOString().slice(0, 16)
                    : '',
            })
        }
    }, [auction])

    const handleSaveTag = (tagValue: string) => {
        console.log('Tag saved for auction field (no-op):', selectedTagField, tagValue)
        closeTagModal()
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({
            ...formData,
            openingDate: new Date(formData.openingDate).toISOString(),
            closingDate: new Date(formData.closingDate).toISOString(),
            updatedBy: 'system',
        })
    }

    return (
        <>
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
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <Dialog.Title
                                                as="h3"
                                                className="text-lg font-semibold text-gray-900"
                                            >
                                                Editar Leilão
                                            </Dialog.Title>
                                            <button
                                                onClick={onClose}
                                                className="text-gray-400 hover:text-gray-500 transition-colors"
                                                disabled={isLoading}
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                        {/* 🧾 Informações Básicas */}
                                        <div className="space-y-4">
                                            <h4 className="text-md font-medium text-gray-900 pb-2 border-b border-gray-200">
                                                Informações Básicas
                                            </h4>

                                            {/* Nome */}
                                            <div>
                                                <div className='flex items-center justify-between mb-1'>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Nome do Leilão *
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="text-gray-500 hover:text-gray-700 p-1 ml-3"
                                                        title="Configurar tag: Nome"
                                                        onClick={() => openTagModal('name')}
                                                    >
                                                        <Cog className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            {/* Tipo */}
                                            <div>
                                                <div className='flex items-center justify-between mb-1'>
                                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                                                        Tipo do Leilão *
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="text-gray-500 hover:text-gray-700 p-1 ml-3"
                                                        title="Configurar tag: Tipo"
                                                        onClick={() => openTagModal('type')}
                                                    >
                                                        <Cog className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <select
                                                    id="type"
                                                    value={formData.type}
                                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    className="w-full border border-gray-300 rounded-md shadow-sm text-gray-700 p-2 focus:ring-yellow-500 focus:border-yellow-500"
                                                >
                                                    <option value="ONLINE">Online</option>
                                                    <option value="LOCAL">Presencial</option>
                                                </select>
                                            </div>

                                            {/* URL */}
                                            <div>
                                                <div className='flex items-center justify-between mb-1'>
                                                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                                                        URL
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="text-gray-500 hover:text-gray-700 p-1 ml-3"
                                                        title="Configurar tag: URL"
                                                        onClick={() => openTagModal('url')}
                                                    >
                                                        <Cog className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <Input
                                                    id="url"
                                                    name="url"
                                                    type="url"
                                                    value={formData.url}
                                                    onChange={(e) => handleInputChange('url', e.target.value)}
                                                    disabled={isLoading}
                                                    placeholder="https://exemplo.com/leilao"
                                                />
                                            </div>
                                        </div>

                                        {/* 🗓️ Datas */}
                                        <div className="space-y-4">
                                            <h4 className="text-md font-medium text-gray-900 pb-2 border-b border-gray-200">
                                                <Calendar className="inline h-4 w-4 mr-2" />
                                                Período do Leilão
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className='flex items-center justify-between mb-1'>
                                                        <label htmlFor="openingDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                            <Clock className="inline h-4 w-4 mr-1" />
                                                            Data/Hora de Abertura *
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="text-gray-500 hover:text-gray-700 p-1 ml-3"
                                                            title="Configurar tag: Data de Abertura"
                                                            onClick={() => openTagModal('openingDate')}
                                                        >
                                                            <Cog className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <Input
                                                        id="openingDate"
                                                        name="openingDate"
                                                        type="datetime-local"
                                                        value={formData.openingDate}
                                                        onChange={(e) => handleInputChange('openingDate', e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
                                                </div>
                                                <div>
                                                    <div className='flex items-center justify-between mb-1'>
                                                        <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 mb-1">
                                                            <Clock className="inline h-4 w-4 mr-1" />
                                                            Data/Hora de Encerramento *
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="text-gray-500 hover:text-gray-700 p-1 ml-3"
                                                            title="Configurar tag: Data de Encerramento"
                                                            onClick={() => openTagModal('closingDate')}
                                                        >
                                                            <Cog className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <Input
                                                        id="closingDate"
                                                        name="closingDate"
                                                        type="datetime-local"
                                                        value={formData.closingDate}
                                                        onChange={(e) => handleInputChange('closingDate', e.target.value)}
                                                        required
                                                        disabled={isLoading}
                                                    />
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

            {/* 🔹 Componente Refatorado do Modal de Tag */}
            <TagConfigModal
                isOpen={isTagModalOpen}
                onClose={closeTagModal}
                onSave={handleSaveTag}
                fieldLabel={selectedTagField ? AUCTION_FIELD_LABELS[selectedTagField] : ''}
                isLoading={isLoading}
            />
        </>
    )
}