'use client'

import ButtonGlobal from '@/components/buttons/global'
import { Loading } from '@/components/loading/loading'
import AddEstablishmentModal from '@/components/modals/add-establishment'
import Search from '@/components/searchs/search'
import { EstablishmentsTable } from '@/components/tables/establishments'
import api from '@/lib/api'
import axios from 'axios'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

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
  audits?: {
    exported: boolean
  }[]
}

interface FormData {
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

export default function Establishments() {
  const t = useTranslations('TextLang')
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingButton, setLoadingButton] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredEstablishments, setFilteredEstablishments] =
    useState<Establishment[]>(establishments)

  const [formData, setFormData] = useState<FormData>({
    tradeName: '',
    companyName: '',
    cnpj: '',
    phone: '',
    responsible: '',
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const results = establishments.filter(
      (establishment) =>
        establishment.tradeName.toLowerCase().includes(query.toLowerCase()) ||
        establishment.companyName.toLowerCase().includes(query.toLowerCase()) ||
        establishment.cnpj.toLowerCase().includes(query.toLowerCase()) ||
        establishment.phone.toLowerCase().includes(query.toLowerCase()) ||
        establishment.responsible.toLowerCase().includes(query.toLowerCase()),
    )
    setFilteredEstablishments(results)
  }

  const handleInputChange = (
    field: string,
    value: string | number | boolean | File[] | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    setLoadingButton(true)
    e.preventDefault()
    try {
      const response = await api.post('/establishments', formData)
      if (response.status === 201) {
        const newEstablishment = response.data
        setEstablishments((prevEstablishments) => [
          ...prevEstablishments,
          newEstablishment,
        ])
        setFilteredEstablishments((prevFilteredEstablishments) => [
          ...prevFilteredEstablishments,
          newEstablishment,
        ])
        closeModal()
      } else {
        setError(
          response.data.message ||
            t('errorAddingEstablishment') ||
            'Erro ao adicionar estabelecimento',
        )
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          error.response &&
          error.response.data &&
          typeof error.response.data.error === 'string'
        ) {
          setError(error.response.data.error)
        } else {
          setError(error.response?.data.message)
        }
      } else {
        setError('Erro inesperado ao conectar ao servidor.')
      }
      console.error('Erro na requisição:', error)
    } finally {
      fetchEstablishments()
      setLoadingButton(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setError(null)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const fetchEstablishments = async () => {
    try {
      const response = await api.get('/establishments')

      const fetchedEstablishments: Establishment[] =
        response.data.establishments

      setEstablishments(fetchedEstablishments)
      setFilteredEstablishments(fetchedEstablishments)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (
          error.response &&
          error.response.data &&
          typeof error.response.data.error === 'string'
        ) {
          setError(error.response.data.error)
        } else {
          setError(error.response?.data.message)
        }
      } else {
        setError('Erro inesperado ao conectar ao servidor.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstablishments()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen ">
        <Loading loading={loading} width={300} />
      </div>
    )
  }

  return (
    <main className="m-4 md:ml-0 mt-0 bg-gray border border-zinc-700 min-h-[calc(100vh-5rem)] flex flex-col items-start md:p-10 p-4 rounded-lg space-y-4 antialiased">
      <div className="grid md:grid-cols-3 grid-cols-2 items-center gap-4 w-full">
        <div className="col-span-2">
          <Search
            placeholder="Buscar estabelecimentos..."
            searchQuery={searchQuery}
            onSearch={handleSearch}
          />
        </div>
        <div className="flex justify-center items-center">
          <ButtonGlobal
            type="button"
            params={{ title: t('addEstablishment'), color: 'bg-primary' }}
            onClick={openModal}
          />
        </div>
      </div>
      <section className="flex flex-col w-full rounded-xl bg-zinc-300 space-y-4">
        <EstablishmentsTable data={filteredEstablishments} />
      </section>
      {isModalOpen && (
        <AddEstablishmentModal
          isOpen={isModalOpen}
          formData={formData}
          error={error}
          loading={loadingButton}
          handleChange={handleInputChange}
          handleSubmit={handleSubmit}
          closeModal={closeModal}
        />
      )}
    </main>
  )
}
