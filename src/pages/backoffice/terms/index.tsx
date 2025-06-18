'use client'

import { useEffect, useState, Fragment } from 'react'
import { toast } from 'react-toastify'
import { Dialog, Transition } from '@headlessui/react'
import MainLayout from '@/layouts/MainLayout'
import { withBackofficeAuth } from '@/hooks/withBackofficeAuth'
import { TokenPayload } from '@/utils/jwtUtils'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ActionButton } from '@/components/shared/ActionButton'
import { usePagedData } from '@/hooks/usePagedData'
import { getTerms, uploadTerm, updateTerm } from '@/services/termsService'
import { SearchBar } from '@/components/shared/SearchBar'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'

interface Term {
  id: string
  fileUrl: string
  description: string
  isCurrent: boolean
  uploadedById: string
}

interface Props {
  user: TokenPayload
}

function TermsAdminPage({ user }: Props) {
  const [terms, setTerms] = useState<Term[]>([])
  const [editingTerm, setEditingTerm] = useState<Term | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<'create' | 'edit'>('create')
  const [search, setSearch] = useState('')
  const filtered = terms.filter(term =>
  term.fileUrl.toLowerCase().includes(search.toLowerCase()) ||
  term.description?.toLowerCase().includes(search.toLowerCase())
)

  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } = usePagedData(filtered, 10)

  async function loadTerms() {
    setIsLoading(true)
    try {
      const data = await getTerms()
      setTerms(data)
      resetToFirstPage()
    } catch {
      toast.error('Erro ao carregar os termos de uso')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadTerms() }, [])

  function handleNewTerm() {
    setEditingTerm(null)
    setCurrentAction('create')
    setIsOpenModal(true)
  }

  function handleEditTerm(term: Term) {
    setEditingTerm(term)
    setCurrentAction('edit')
    setIsOpenModal(true)
  }

  async function handleSave(data: Omit<Term, 'id' | 'uploadedById'>) {
    setIsLoading(true)
    const payload = { ...data, uploadedById: user.sub }
    try {
      if (editingTerm) {
        await updateTerm(editingTerm.id, payload)
        toast.success('Termo atualizado com sucesso!')
      } else {
        await uploadTerm(payload)
        toast.success('Novo termo criado com sucesso!')
      }
      setIsOpenModal(false)
      loadTerms()
    } catch {
      toast.error('Erro ao salvar o termo de uso. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    { key: 'description', header: 'Descrição' },
    { key: 'fileUrl', header: 'Link', render: (url: string) => (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
        <span>Visualizar</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
          <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
        </svg>
      </a>
    )},
    { key: 'isCurrent', header: 'Atual', render: (cur: boolean) => (
      cur ? <StatusBadge variant="success">Ativo</StatusBadge> : null
    )},
    { key: 'actions', header: 'Ações', render: (_: any, term: Term) => (
      <ActionButton variant="edit" onClick={() => handleEditTerm(term)} disabled={isLoading} />
    )}
  ]
  /**
   * Fecha o modal
   */
  function closeModal() {
    setIsOpenModal(false)
  }

  return (
    <MainLayout>
      <div className="min-h-screen flex justify-center bg-gray-50">
      <div className="mx-auto py-4 px-4 w-full max-w-none">
        <PageHeader 
          title="Gerenciamento de Termos de Uso"
          buttonText="Novo Termo"
          onButtonClick={handleNewTerm}
          isLoading={isLoading}
        />
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b px-6 py-4">
              <p className="text-sm text-gray-500">
                Gerencie os termos de uso da plataforma. O termo marcado como atual será exibido para os usuários.
              </p>
            </div>
            <SearchBar value={search} onChange={setSearch} />
            <DataTable
              data={paginatedData}
              columns={columns}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={10}
              onPageChange={goToPage}
              isLoading={isLoading}
              emptyStateTitle="Nenhum termo de uso cadastrado."
              onCreateFirst={handleNewTerm}
              createFirstText="Criar o primeiro termo"
          />
        </div>

      </div>

      {/* Modal para adicionar/editar termos */}
      <Transition appear show={isOpenModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => !isLoading && closeModal()}>
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
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    {currentAction === 'create' ? 'Adicionar novo termo' : 'Editar termo'}
                  </Dialog.Title>
                  
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formElement = e.currentTarget
                      const data = new FormData(formElement)
                      
                      const formObj = {
                        fileUrl: data.get('fileUrl') as string,
                        description: data.get('description') as string,
                        isCurrent: data.get('isCurrent') === 'on'
                      }
                      
                      handleSave(formObj)
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="fileUrl" className="block text-sm font-medium text-gray-700 mb-1">URL do Arquivo</label>
                      <Input 
                        id="fileUrl"
                        name="fileUrl" 
                        type="url"
                        required
                        placeholder="https://exemplo.com/termos.pdf"
                        defaultValue={editingTerm?.fileUrl || ''} 
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                      <Input 
                        id="description"
                        name="description" 
                        required
                        placeholder="Ex: Termos de Uso v1.0"
                        defaultValue={editingTerm?.description || ''} 
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input 
                          id="isCurrent"
                          type="checkbox" 
                          name="isCurrent" 
                          defaultChecked={editingTerm?.isCurrent} 
                          disabled={isLoading}
                          className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="isCurrent" className="font-medium text-gray-700">Este é o termo atual</label>
                        <p className="text-gray-500">Apenas um termo pode ser marcado como atual.</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        onClick={closeModal}
                        disabled={isLoading}
                        variant='neutral'
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        variant='primary'
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                          </>
                        ) : currentAction === 'create' ? 'Adicionar' : 'Atualizar'}
                      </Button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(TermsAdminPage)