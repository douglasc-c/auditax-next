'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useState } from 'react'
import DeleteModal from '../modals/delete'

interface Establishment {
  id: number
  tradeName: string
  companyName: string
  cnpj: string
  phone: string
  responsible: string
  address?: {
    street: string
    number: string
    zipCode: string
    complement: string
    city: string
    state: string
    country: string
  }
}

interface EstablishmentsTableProps {
  data: Establishment[]
}

export function EstablishmentsTable({ data }: EstablishmentsTableProps) {
  const t = useTranslations('TextLang')
  const router = useRouter()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [establishmentToDelete, setEstablishmentToDelete] = useState<
    string | null
  >(null)

  const handleSeeMore = (establishment: Establishment) => {
    const isAdmin = window.location.pathname.includes('/admin/')
    router.push(`${isAdmin ? '/admin' : ''}/establishments/${establishment.id}`)
  }

  const handleDelete = async (id: string) => {
    setEstablishmentToDelete(id)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!establishmentToDelete) return

    try {
      await api.delete(`/establishments/${establishmentToDelete}`)

      window.location.reload()
    } catch (error) {
      console.error('Erro ao excluir estabelecimento:', error)
    } finally {
      setIsDeleteModalOpen(false)
      setEstablishmentToDelete(null)
    }
  }

  return (
    <>
      <section className="h-auto w-full p-4 bg-primary antialiased text-textPrimary rounded-lg">
        <div className="custom-scroll max-h-[40rem]">
          <table className="table-auto w-full border-collapse text-sm">
            <thead className="uppercase border-b border-zinc-500">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium">
                  {t('tradeName')}
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium">
                  {t('companyName')}
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium">
                  {t('cnpj')}
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium">
                  {t('phone')}
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium">
                  {t('responsible')}
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium">
                  {t('shares')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700">
              {data.map((establishment) => (
                <tr key={establishment.id} className="">
                  <td className="px-4 py-2 text-xs text-left">
                    {establishment.tradeName}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {establishment.companyName}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {establishment.cnpj}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {establishment.phone}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    {establishment.responsible}
                  </td>
                  <td className="px-4 py-2 text-xs text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleSeeMore(establishment)}
                        className="rounded-full hover:bg-title hover:text-primary py-1 px-4 bg-transparent"
                      >
                        {t('seeMore')}
                      </button>
                      <button
                        onClick={() => handleDelete(String(establishment.id))}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setEstablishmentToDelete(null)
        }}
        handleSubmit={confirmDelete}
      />
    </>
  )
}
