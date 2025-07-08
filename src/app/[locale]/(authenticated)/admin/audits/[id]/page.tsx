'use client'

import { Loading } from '@/components/loading/loading'
import { SummaryDataTable } from '@/components/tables/summary-data'
import api from '@/lib/api'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Audit } from '@/types/audit'

export default function AuditDetails() {
  const params = useParams()
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await api.get(`/audits/${params.id}`)

        setAudit(response.data.audit)
      } catch (error) {
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
