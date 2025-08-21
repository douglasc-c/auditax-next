'use client'

import { useTranslations } from 'next-intl'
import { Audit } from '@/types/audit'
import { useRouter, usePathname } from 'next/navigation'
import ButtonGlobal from '../buttons/global'
import { NewAuditModal } from '../modals/new-audit-modal'
import { useState } from 'react'
import api from '@/lib/api'
import DeleteModal from '../modals/delete'
import { toast } from 'react-hot-toast'

interface AuditsProps {
  audits?: Audit[]
  establishmentId?: number
  onNewAudit?: (newAudit: Audit) => void
}

export function Audits({
  audits = [],
  establishmentId,
  onNewAudit,
}: AuditsProps) {
  const t = useTranslations('TextLang')
  const router = useRouter()
  const pathname = usePathname()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [auditToDelete, setAuditToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<
    number | null
  >(null)

  const isAdmin = pathname.includes('/admin')

  const handleSeeMore = (id: number) => {
    router.push(isAdmin ? `/admin/audits/${id}` : `/audits/${id}`)
  }

  const handleNewAudit = (establishmentId: number) => {
    setSelectedEstablishmentId(establishmentId)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    setAuditToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!auditToDelete) return

    setIsDeleting(true)
    try {
      const response = await api.delete(`/audits/${auditToDelete}`)

      // Só recarrega se a operação foi bem-sucedida
      if (response.status === 200 || response.status === 204) {
        toast.success(t('auditDeletedSuccess'))
        window.location.reload()
      } else {
        toast.error(t('auditDeleteError'))
      }
    } catch (error) {
      console.error('Erro ao excluir auditoria:', error)
      toast.error(t('auditDeleteError'))
      // Em caso de erro, não recarrega a página
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
      setAuditToDelete(null)
    }
  }

  return (
    <>
      <div className="h-auto w-full p-4 bg-primary antialiased rounded-xl">
        <div className="flex justify-between items-center">
          {establishmentId && (
            <>
              <h2 className="text-lg font-semibold text-zinc-200">
                {t('audits')}
              </h2>
              <div className="flex gap-2">
                <ButtonGlobal
                  params={{ title: t('newAudit'), color: 'bg-title' }}
                  onClick={() => handleNewAudit(establishmentId)}
                />
              </div>
            </>
          )}
        </div>
        <section className="h-auto w-full antialiased text-textPrimary">
          <div className="custom-scroll max-h-[40rem]">
            {!audits || audits.length === 0 ? (
              <div className="flex justify-center items-center p-8">
                <p className="text-zinc-400">{t('noAudits')}</p>
              </div>
            ) : (
              <table className="table-auto w-full border-collapse text-sm">
                <thead className="uppercase border-b border-zinc-500">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium">
                      {t('id')}
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium">
                      {t('createdAt')}
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium">
                      {t('establishment')}
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium">
                      {t('shares')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((audit) => (
                    <tr key={audit.id} className="border-b border-border">
                      <td className="px-4 py-2 text-left text-xs font-medium">
                        {audit.id}
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-medium">
                        {new Date(audit.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-medium">
                        {audit.establishment?.companyName || '-'}
                      </td>
                      <td className="px-4 py-2 text-center text-xs font-medium">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleSeeMore(audit.id)}
                            className="rounded-full hover:bg-title hover:text-primary py-1 px-4 bg-transparent"
                          >
                            {t('seeMore')}
                          </button>
                          <button
                            onClick={() => handleDelete(String(audit.id))}
                            className="rounded-full hover:text-red-500 py-1 px-2 bg-transparent"
                            title={t('delete')}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                          {!establishmentId && audit.establishmentId && (
                            <ButtonGlobal
                              params={{
                                title: t('newAudit'),
                                color: 'bg-title',
                              }}
                              onClick={() =>
                                handleNewAudit(audit.establishmentId)
                              }
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <NewAuditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        establishmentId={selectedEstablishmentId?.toString() || ''}
        onSuccess={onNewAudit}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setAuditToDelete(null)
        }}
        handleSubmit={confirmDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
