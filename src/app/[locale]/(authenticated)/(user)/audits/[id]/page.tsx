'use client'

import { Loading } from '@/components/loading/loading'
import { SummaryDataTable } from '@/components/tables/summary-data'
import api from '@/lib/api'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Audit } from '@/types/audit'
import { useTranslations } from 'next-intl'

export default function AuditDetails() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('TextLang')
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        console.log('Fetching audit with ID:', params.id)
        const response = await api.get(`/audits/${params.id}`)
        console.log('Audit response:', response.data)
        setAudit(response.data.audit)
      } catch (error) {
        console.error('Error fetching audit:', error)
        if (axios.isAxiosError(error)) {
          setError(error.response?.data.message || 'Erro ao carregar auditoria')
        } else {
          setError('Erro inesperado ao conectar ao servidor.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAudit()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading loading={loading} width={300} />
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">{error || 'Auditoria não encontrada'}</p>
      </div>
    )
  }

  return (
    <main className="m-4 md:ml-0 mt-0 bg-gray border border-zinc-700 min-h-[calc(100vh-5rem)] flex flex-col items-start rounded-lg space-y-4 antialiased">
      <div className="w-full h-full flex flex-col">
        {/* Botão Voltar */}
        <div className="p-4 border-b border-zinc-700">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('back')}
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {audit.summaryData && (
            <SummaryDataTable
              data={audit.summaryData}
              auditId={String(audit.id)}
            />
          )}
        </div>
      </div>
    </main>
  )
}
