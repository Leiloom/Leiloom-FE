import React, { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/shared/Button'
import { Input } from '@/components/shared/Input'
import { Calendar, Clock, X, Cog, Check, X as XIcon } from 'lucide-react'
import { useTagModal } from '../../../hooks/useTagModel'
import TagConfigModal from '@/components/shared/TagConfigModal'
import { saveScrapingConfig, getAllScrapingConfigs, deleteScrapingConfig } from '@/services/scrapingConfigService'
import { toast } from 'react-toastify'

const AUCTION_FIELD_LABELS: Record<string, string> = {
  name: 'Nome do Leilão',
  type: 'Tipo do Leilão',
  url: 'URL',
  openingDate: 'Data/Hora de Abertura',
  closingDate: 'Data/Hora de Encerramento'
}

const FIELD_ENUM_MAP: Record<string, string> = {
    name: 'AUCTION_NAME',
    type: 'AUCTION_TYPE',
    url: 'AUCTION_URL',
    openingDate: 'AUCTION_OPENING_DATE',
    closingDate: 'AUCTION_CLOSING_DATE'
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

    const [isSavingTag, setIsSavingTag] = useState(false)
    const [existingConfigs, setExistingConfigs] = useState<any[]>([])

    const { 
        isOpen: isTagModalOpen, 
        selectedField: selectedTagField, 
        openTagModal, 
        closeTagModal 
    } = useTagModal()

    const loadConfigs = async () => {
        if (auction?.id) {
            try {
                const configs = await getAllScrapingConfigs(auction.id)
                setExistingConfigs(configs.filter((c: any) => !c.itemId))
            } catch (error) {
                console.error('Erro ao carregar configs', error)
            }
        }
    }

    useEffect(() => {
        if (isOpen && auction) loadConfigs()
    }, [isOpen, auction])

    useEffect(() => {
        if (auction) {
            setFormData({
                name: auction.name || '',
                type: auction.type || 'ONLINE',
                url: auction.url || '',
                openingDate: auction.openingDate ? new Date(auction.openingDate).toISOString().slice(0, 16) : '',
                closingDate: auction.closingDate ? new Date(auction.closingDate).toISOString().slice(0, 16) : '',
            })
        }
    }, [auction])

    // 🔹 Lógica Padronizada: Salvar ou Deletar Tag
    const handleSaveTag = async (tagValue: string) => {
        if (!auction?.id) return
        if (!selectedTagField) return

        setIsSavingTag(true)
        try {
            if (!tagValue || tagValue.trim() === '') {
                // Se vazio, tenta deletar se existir
                const enumType = FIELD_ENUM_MAP[selectedTagField]
                const configToDelete = existingConfigs.find((c: any) => c.fieldType === enumType)
                if (configToDelete) {
                    await deleteScrapingConfig(configToDelete.id)
                    toast.info(`Tag para "${AUCTION_FIELD_LABELS[selectedTagField]}" removida.`)
                }
            } else {
                // Se tem valor, salva/atualiza
                await saveScrapingConfig({
                    auctionId: auction.id,
                    itemId: null,
                    fieldName: selectedTagField,
                    selector: tagValue
                })
                toast.success(`Tag para "${AUCTION_FIELD_LABELS[selectedTagField]}" salva com sucesso!`)
            }
            await loadConfigs()
        } catch (error) {
            toast.error('Erro ao salvar tag.')
        } finally {
            setIsSavingTag(false)
            closeTagModal()
        }
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // 🔹 Validação Manual de Datas
        if (!formData.openingDate) {
            toast.warning('A Data de Abertura é obrigatória.')
            return
        }
        if (!formData.closingDate) {
            toast.warning('A Data de Encerramento é obrigatória.')
            return
        }

        const start = new Date(formData.openingDate)
        const end = new Date(formData.closingDate)

        if (start >= end) {
            toast.warning('A Data de Abertura não pode ser maior ou igual à Data de Encerramento.')
            formData.closingDate = ''
            return
        }

        onSave({
            ...formData,
            openingDate: new Date(formData.openingDate).toISOString(),
            closingDate: new Date(formData.closingDate).toISOString(),
            updatedBy: 'system',
        })
    }

    const getCurrentSelector = () => {
        if (!selectedTagField) return ''
        const enumType = FIELD_ENUM_MAP[selectedTagField]
        const config = existingConfigs.find((c: any) => c.fieldType === enumType)
        return config ? config.selector : ''
    }

    const renderStatusIcon = (fieldName: string) => {
        const enumType = FIELD_ENUM_MAP[fieldName]
        const isConfigured = existingConfigs.some((c: any) => c.fieldType === enumType)
        if (isConfigured) return <Check className="h-3 w-3 text-green-600 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
        return <XIcon className="h-3 w-3 text-red-500 absolute -top-1 -right-1 bg-white rounded-full border border-gray-100 shadow-sm" />
    }

    const renderCogButton = (fieldName: string) => (
        <div className="relative inline-block ml-3">
            <button type="button" className="text-gray-500 hover:text-gray-700 p-1 focus:outline-none" onClick={() => openTagModal(fieldName)}>
                <Cog className="h-4 w-4" />
            </button>
            {renderStatusIcon(fieldName)}
        </div>
    )

    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={() => !isLoading && onClose()}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-gray-900 text-left align-middle shadow-xl transition-all">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">Editar Leilão</Dialog.Title>
                                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500" disabled={isLoading}><X className="h-5 w-5" /></button>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-md font-medium text-gray-900 pb-2 border-b border-gray-200">Informações Básicas</h4>
                                            <div>
                                                <div className='flex items-center justify-between mb-1'>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Leilão <span className="text-red-500">*</span></label>
                                                    {renderCogButton('name')}
                                                </div>
                                                <Input id="name" name="name" type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required disabled={isLoading} />
                                            </div>

                                            <div>
                                                <div className='flex items-center justify-between mb-1'>
                                                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo do Leilão</label>
                                                    {renderCogButton('type')}
                                                </div>
                                                <select id="type" value={formData.type} onChange={(e) => handleInputChange('type', e.target.value)} required disabled={isLoading} className="w-full border border-gray-300 rounded-md shadow-sm text-gray-900 p-2 focus:ring-yellow-500 focus:border-yellow-500">
                                                    <option value="ONLINE">Online</option>
                                                    <option value="LOCAL">Presencial</option>
                                                </select>
                                            </div>

                                            <div>
                                                <div className='flex items-center justify-between mb-1'>
                                                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                                    {renderCogButton('url')}
                                                </div>
                                                <Input id="url" name="url" type="url" value={formData.url} onChange={(e) => handleInputChange('url', e.target.value)} disabled={isLoading} placeholder="https://exemplo.com/leilao" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-md font-medium text-gray-900 pb-2 border-b border-gray-200"><Calendar className="inline h-4 w-4 mr-2" /> Período do Leilão</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className='flex items-center justify-between mb-1'>
                                                        <label htmlFor="openingDate" className="block text-sm font-medium text-gray-700 mb-1"><Clock className="inline h-4 w-4 mr-1" />Data/Hora de Abertura <span className="text-red-500">*</span></label>
                                                        {renderCogButton('openingDate')}
                                                    </div>
                                                    <Input id="openingDate" name="openingDate" type="datetime-local" value={formData.openingDate} onChange={(e) => handleInputChange('openingDate', e.target.value)} required disabled={isLoading} />
                                                </div>
                                                <div>
                                                    <div className='flex items-center justify-between mb-1'>
                                                        <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 mb-1"><Clock className="inline h-4 w-4 mr-1" />Data/Hora de Encerramento <span className="text-red-500">*</span></label>
                                                        {renderCogButton('closingDate')}
                                                    </div>
                                                    <Input id="closingDate" name="closingDate" type="datetime-local" value={formData.closingDate} onChange={(e) => handleInputChange('closingDate', e.target.value)} required disabled={isLoading} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                                            <Button type="button" onClick={onClose} variant="neutral" disabled={isLoading}>Cancelar</Button>
                                            <Button type="submit" variant="primary" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Alterações'}</Button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <TagConfigModal 
                isOpen={isTagModalOpen} 
                onClose={closeTagModal} 
                onSave={handleSaveTag} 
                fieldLabel={selectedTagField ? AUCTION_FIELD_LABELS[selectedTagField] : ''} 
                isLoading={isLoading || isSavingTag}
                initialValue={getCurrentSelector()} 
            />
        </>
    )
}