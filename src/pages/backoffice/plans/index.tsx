'use client'
import Head from 'next/head'
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
import { ConfirmationModal } from '@/components/shared/ConfirmationModal'
import { usePagedData } from '@/hooks/usePagedData'
import { getAllPlans, createPlan, updatePlan, deletePlan, activatePlan, deactivatePlan } from '@/services/planService'
import { SearchBar } from '@/components/shared/SearchBar'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'
import { Plan } from '@/types/plan'

interface Props {
  user: TokenPayload
}

function PlansAdminPage({ user }: Props) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<'create' | 'edit'>('create')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)
  const [search, setSearch] = useState('')

  const [isTrialInForm, setIsTrialInForm] = useState(false)
  const [allowInstallmentsInForm, setAllowInstallmentsInForm] = useState(false)

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(search.toLowerCase()) ||
    plan.description?.toLowerCase().includes(search.toLowerCase())
  )
  const { currentPage, totalPages, paginatedData, goToPage, resetToFirstPage } = usePagedData(filteredPlans, 10)

  async function loadPlans() {
    setIsLoading(true)
    try {
      const data = await getAllPlans()
      setPlans(data)
      resetToFirstPage()
    } catch {
      toast.error('Erro ao carregar os planos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadPlans() }, [])

  function handleNewPlan() {
    setEditingPlan(null)
    setCurrentAction('create')
    setIsTrialInForm(false)
    setAllowInstallmentsInForm(false)
    setIsOpenModal(true)
  }

  function handleEditPlan(plan: Plan) {
    setEditingPlan(plan)
    setCurrentAction('edit')
    setIsTrialInForm(plan.isTrial)
    setAllowInstallmentsInForm(plan.allowInstallments ?? false)
    setIsOpenModal(true)
  }

  async function handleSave(data: Omit<Plan, 'id'>) {
    setIsLoading(true)
    try {
      if (editingPlan?.id) {
        await updatePlan(editingPlan.id, data)
        toast.success('Plano atualizado com sucesso!')
      } else {
        await createPlan(data)
        toast.success('Novo plano criado com sucesso!')
      }
      setIsOpenModal(false)
      loadPlans()
    } catch {
      toast.error('Erro ao salvar o plano')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleToggleActive(plan: Plan) {
    setIsLoading(true)
    try {
      if (plan.isActive) {
        await deactivatePlan(plan.id!)
        toast.success('Plano desativado com sucesso!')
      } else {
        await activatePlan(plan.id!)
        toast.success('Plano ativado com sucesso!')
      }
      loadPlans()
    } catch {
      toast.error('Erro ao alterar status do plano')
    } finally {
      setIsLoading(false)
    }
  }

  function handleDeleteConfirmation(plan: Plan) {
    setPlanToDelete(plan)
    setIsDeleteModalOpen(true)
  }

  async function handleDeletePlan() {
    if (!planToDelete?.id) return
    setIsLoading(true)
    try {
      await deletePlan(planToDelete.id)
      toast.success('Plano removido com sucesso!')
      setIsDeleteModalOpen(false)
      loadPlans()
    } catch {
      toast.error('Erro ao excluir o plano')
    } finally {
      setIsLoading(false)
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  function formatDuration(days: number) {
    if (days === 1) return '1 dia'
    if (days < 30) return `${days} dias`
    if (days < 365) return `${Math.floor(days / 30)} mês(es)`
    return `${Math.floor(days / 365)} ano(s)`
  }

  const columns = [
    { key: 'name', header: 'Nome' },
    { key: 'description', header: 'Descrição' },
    { key: 'price', header: 'Preço', render: (price: number) => formatCurrency(price) },
    { key: 'durationDays', header: 'Duração', render: (d: number) => formatDuration(d) },
    {
      key: 'allowInstallments', header: 'Parcelamento', render: (allow: boolean, plan: Plan) => {
        if (!allow) return <StatusBadge variant="warning">Não</StatusBadge>
        const taxInfo = plan.absorbTax ? ' (Taxa absorvida)' : ' (Taxa repassada)'
        return <StatusBadge variant="info">Até {plan.maxInstallments}x{taxInfo}</StatusBadge>
      }
    },
    {
      key: 'isTrial', header: 'Tipo', render: (t: boolean) => (
        <StatusBadge variant={t ? 'info' : 'success'}>{t ? 'Trial' : 'Normal'}</StatusBadge>
      )
    },
    {
      key: 'isActive', header: 'Situação', render: (a: boolean) => (
        <StatusBadge variant={a ? 'success' : 'error'}>{a ? 'Ativo' : 'Inativo'}</StatusBadge>
      )
    },
    {
      key: 'actions', header: 'Ações', render: (_: any, plan: Plan) => (
        <div className="flex space-x-2">
          <ActionButton variant="edit" onClick={() => handleEditPlan(plan)} disabled={isLoading} />
          {/* <ActionButton 
            variant="view"
            onClick={() => handleToggleActive(plan)} 
            disabled={isLoading}
          >
            {plan.isActive ? "Desativar" : "Ativar"}
          </ActionButton>
          <ActionButton variant="delete" onClick={() => handleDeleteConfirmation(plan)} disabled={isLoading} /> */}
        </div>
      )
    }
  ]

  return (
    <MainLayout>
      <Head>
        <title>Gerenciamento de Planos - Leiloom</title>
        <meta name="description" content="Gerencie os planos de assinatura disponíveis na plataforma Leiloom" />
      </Head>
      <div className="min-h-screen flex justify-center bg-gray-50">
        <div className="mx-auto py-4 px-4 w-full max-w-none">
          <PageHeader
            title="Gerenciamento de Planos"
            buttonText="Novo Plano"
            onButtonClick={handleNewPlan}
            isLoading={isLoading}
          />
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b px-6 py-4">
              <p className="text-sm text-gray-500">
                Gerencie os planos de assinatura disponíveis na plataforma.
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
              emptyStateTitle="Nenhum plano cadastrado."
              onCreateFirst={handleNewPlan}
              createFirstText="Criar o primeiro plano"
            />
          </div>
        </div>

        <Transition appear show={isOpenModal} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => !isLoading && setIsOpenModal(false)}>
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
                  <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-4"
                    >
                      {currentAction === 'create' ? 'Adicionar novo plano' : 'Editar plano'}
                    </Dialog.Title>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const formElement = e.currentTarget
                        const data = new FormData(formElement)

                        const formObj = {
                          name: data.get('name') as string,
                          description: data.get('description') as string,
                          price: isTrialInForm ? 0 : parseFloat(data.get('price') as string),
                          durationDays: parseInt(data.get('durationDays') as string),
                          numberOfUsers: parseInt(data.get('numberOfUsers') as string) || 1,
                          isTrial: isTrialInForm,
                          isActive: data.get('isActive') === 'on',
                          allowInstallments: isTrialInForm ? false : allowInstallmentsInForm,
                          maxInstallments: (!isTrialInForm && allowInstallmentsInForm) ? parseInt(data.get('maxInstallments') as string) || undefined : undefined,
                          absorbTax: (!isTrialInForm && allowInstallmentsInForm) ? data.get('absorbTax') === 'on' : false
                        }

                        handleSave(formObj)
                      }}
                      className="grid grid-cols-2 gap-x-6 gap-y-4"
                    >
                      <div className="col-span-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Plano</label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          required
                          placeholder="Ex: Plano Mensal"
                          defaultValue={editingPlan?.name || ''}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="col-span-2">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                          id="description"
                          name="description"
                          placeholder="Descrição do plano"
                          defaultValue={editingPlan?.description || ''}
                          rows={2}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-500 focus:ring-yellow-500 focus:border-yellow-500"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="col-span-2 flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="isTrial"
                            type="checkbox"
                            name="isTrial"
                            checked={isTrialInForm}
                            onChange={(e) => {
                              setIsTrialInForm(e.target.checked)
                              if (e.target.checked) {
                                setAllowInstallmentsInForm(false)
                              }
                            }}
                            disabled={isLoading}
                            className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="isTrial" className="font-medium text-gray-700">Este é um plano de teste (trial)</label>
                          <p className="text-gray-500">Planos de teste são gratuitos e não permitem parcelamento.</p>
                        </div>
                      </div>

                      {!isTrialInForm && (
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="0.00"
                            defaultValue={editingPlan?.price.toString()}
                            disabled={isLoading}
                          />
                        </div>
                      )}

                      <div>
                        <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">Duração (dias)</label>
                        <Input
                          id="durationDays"
                          name="durationDays"
                          type="number"
                          min="1"
                          required
                          placeholder="30"
                          defaultValue={editingPlan?.durationDays.toString() || '30'}
                          disabled={isLoading}
                        />
                      </div>

                      {!isTrialInForm && (
                        <div className="col-span-2 space-y-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="allowInstallments"
                                type="checkbox"
                                name="allowInstallments"
                                checked={allowInstallmentsInForm}
                                onChange={(e) => setAllowInstallmentsInForm(e.target.checked)}
                                disabled={isLoading}
                                className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="allowInstallments" className="font-medium text-gray-700">Permitir Parcelamento</label>
                              <p className="text-gray-500">Habilita o pagamento parcelado para este plano.</p>
                            </div>
                          </div>

                          {allowInstallmentsInForm && (
                            <div className="space-y-4">
                              <div>
                                <label htmlFor="maxInstallments" className="block text-sm font-medium text-gray-700 mb-1">Máximo de Parcelas</label>
                                <Input
                                  id="maxInstallments"
                                  name="maxInstallments"
                                  type="number" min="1" max="12"
                                  placeholder="Ex: 2"
                                  defaultValue={editingPlan?.maxInstallments?.toString() || ''}
                                  disabled={isLoading}
                                />
                              </div>
                              
                              <div className="flex items-start">
                                <div className="block text-sm font-medium text-gray-700 mb-1">
                                  <input
                                    id="absorbTax"
                                    type="checkbox"
                                    name="absorbTax"
                                    defaultChecked={editingPlan?.absorbTax || false}
                                    disabled={isLoading}
                                    className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="absorbTax" className="font-medium text-gray-700">Absorver taxa ou repassar taxa</label>
                                  <p className="text-gray-500">Se marcado, a empresa absorve a taxa. Se desmarcado, a taxa é repassada ao cliente.</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label htmlFor="numberOfUsers" className="block text-sm font-medium text-gray-700 mb-1">Qtd. de usuários</label>
                        <Input
                          id="numberOfUsers"
                          name="numberOfUsers"
                          type="number"
                          min="1"
                          required
                          placeholder="1"
                          defaultValue={editingPlan?.numberOfUsers?.toString() || '1'}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="col-span-2 flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="isActive"
                            type="checkbox"
                            name="isActive"
                            defaultChecked={editingPlan?.isActive ?? true}
                            disabled={isLoading}
                            className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="isActive" className="font-medium text-gray-700">Ativo</label>
                          <p className="text-gray-500">Define se o plano está disponível para seleção.</p>
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="neutral"
                          onClick={() => setIsOpenModal(false)}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
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

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeletePlan}
          title="Confirmar exclusão"
          message={`Tem certeza que deseja excluir o plano ${planToDelete?.name}?`}
          confirmButtonText="Excluir"
          isLoading={isLoading}
          variant="danger"
        />
      </div>
    </MainLayout>
  )
}

export default withBackofficeAuth(PlansAdminPage)