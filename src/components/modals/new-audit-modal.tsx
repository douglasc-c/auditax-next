import { useTranslations } from 'next-intl'
import { useState, useRef, useEffect } from 'react'
import ButtonGlobal from '../buttons/global'
import processApi from '@/lib/process-api'
import { useRouter, usePathname } from 'next/navigation'
import { Audit } from '@/types/audit'
import { PulseLoader } from 'react-spinners'
import Image from 'next/image'

interface FlagPercentage {
  brand: string
  product: string
  percentage: number
}

interface NewAuditModalProps {
  isOpen: boolean
  onClose: () => void
  establishmentId: string
  onSuccess?: (newAudit: Audit) => void
}

export function NewAuditModal({
  isOpen,
  onClose,
  establishmentId,
  onSuccess,
}: NewAuditModalProps) {
  const t = useTranslations('TextLang')
  const router = useRouter()
  const pathname = usePathname()
  const isAdmin = pathname.includes('/admin')
  const [files, setFiles] = useState<File[]>([])
  const [brandPercentages, setBrandPercentages] = useState<FlagPercentage[]>([
    { brand: '', product: '', percentage: 0 },
  ])
  const [loading, setLoading] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const clearForm = () => {
    setFiles([])
    setBrandPercentages([{ brand: '', product: '', percentage: 0 }])
  }

  const handleAddBrand = () => {
    setBrandPercentages([
      ...brandPercentages,
      { brand: '', product: '', percentage: 0 },
    ])
  }

  const handleRemoveBrand = (index: number) => {
    setBrandPercentages(brandPercentages.filter((_, i) => i !== index))
  }

  const handleBrandChange = (
    index: number,
    field: 'brand' | 'product' | 'percentage',
    value: string,
  ) => {
    const newBrandPercentages = [...brandPercentages]
    newBrandPercentages[index] = {
      ...newBrandPercentages[index],
      [field]: field === 'percentage' ? parseFloat(value) || 0 : value,
    }
    setBrandPercentages(newBrandPercentages)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles])
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  const handleRedirect = (id: number) => {
    router.push(isAdmin ? `/admin/audits/${id}` : `/audits/${id}`)
  }

  const handleSubmit = async () => {
    if (files.length === 0) return

    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()

      // Adicionar establishment_id
      formData.append('establishment_id', establishmentId)

      // Adicionar todos os arquivos
      files.forEach((file) => {
        formData.append('files', file)
      })

      // Converter array de flagPercentages para objeto agrupado por brand
      const brandPercentagesObject = brandPercentages.reduce(
        (acc, { brand, product, percentage }) => {
          if (brand && product && percentage > 0) {
            if (!acc[brand]) {
              acc[brand] = {}
            }
            acc[brand][product] = percentage
          }
          return acc
        },
        {} as Record<string, Record<string, number>>,
      )

      formData.append(
        'brand_percentages',
        JSON.stringify(brandPercentagesObject),
      )

      // Processar os arquivos e criar a auditoria
      let processResponse
      try {
        processResponse = await processApi.post('/audit/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } catch (processError) {
        console.error('Erro no processamento do Excel:', processError)
        throw new Error(
          'Falha no processamento da planilha. Verifique se os nomes das colunas estão corretos.',
        )
      }
      console.log(processResponse.data.audit_id)
      // Criar objeto audit com os dados retornados
      const audit: Audit = {
        id: processResponse.data.audit_id,
        exported: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        establishmentId: processResponse.data.establishment_id,
        summaryData: processResponse.data.summaryData,
      }

      const auditId = audit.id

      if (onSuccess) {
        onSuccess(audit)
      }

      clearForm()
      onClose()

      // Redirecionar para a página de detalhes da auditoria
      handleRedirect(auditId)
    } catch (error) {
      console.error('Erro ao criar auditoria:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro ao processar a auditoria.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    clearForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-2xl">
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-zinc-200">
            {t('newAudit')}
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-200"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-800 p-2 rounded-lg">
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className="flex items-center gap-2 text-zinc-200 hover:text-title"
              disabled={loading}
            >
              <span className="text-sm font-medium">
                {t('requiredColumns')}
              </span>
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  isHelpOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isHelpOpen && (
              <div
                ref={helpRef}
                className="mt-4 space-y-4 text-sm text-zinc-300"
              >
                <div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t('columnDataPagamento')}</li>
                    <li>{t('columnDataVenda')}</li>
                    <li>{t('columnNumeroEstabelecimento')}</li>
                    <li>{t('columnCodigoAutorizacao')}</li>
                    <li>{t('columnProduto')}</li>
                    <li>{t('columnTipoCartao')}</li>
                    <li>{t('columnBandeira')}</li>
                    <li>{t('columnStatusVenda')}</li>
                    <li>{t('columnValorBruto')}</li>
                    <li>{t('columnValorTaxa')}</li>
                    <li>{t('columnValorLiquido')}</li>
                    <li>{t('columnNumeroCartao')}</li>
                  </ul>
                  <p className="mt-4 text-yellow-400 font-medium">
                    {t('columnNamesWarning')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-2">
              {t('uploadFiles')} (.xlsx / .xls)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              multiple
              className="w-full p-2 bg-zinc-800 text-zinc-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-2 overflow-auto max-h-32 scrollbar-hide">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-zinc-800 rounded"
                  >
                    <span className="text-sm text-zinc-200 truncate">
                      {file.name}
                    </span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-zinc-400 hover:text-zinc-200 ml-2"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-zinc-200">
                  {t('flagPercentages')}
                </label>
                <div className="relative group">
                  <Image
                    src="/images/svg/warning.svg"
                    alt="Help"
                    width={16}
                    height={16}
                    className="cursor-help"
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block">
                    <div className="bg-zinc-700 text-zinc-200 text-sm font-semibold px-3 py-2 rounded-lg whitespace-wrap min-w-48">
                      {t('flagPercentagesWarning')}
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-zinc-700 rotate-45"></div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddBrand}
                className="text-sm text-title hover:text-amber-500"
                disabled={loading}
              >
                {t('addFlag')}
              </button>
            </div>
            <div className="space-y-2 overflow-auto max-h-56">
              {brandPercentages.map((brand, index) => (
                <div key={index} className="flex gap-2 h-8">
                  <input
                    type="text"
                    value={brand.brand}
                    onChange={(e) =>
                      handleBrandChange(index, 'brand', e.target.value)
                    }
                    placeholder={t('brand')}
                    className="flex-1 p-2 bg-zinc-800 text-zinc-200 rounded"
                  />
                  <input
                    type="text"
                    value={brand.product}
                    onChange={(e) =>
                      handleBrandChange(index, 'product', e.target.value)
                    }
                    placeholder={t('product')}
                    className="flex-1 p-2 bg-zinc-800 text-zinc-200 rounded"
                  />
                  <input
                    type="number"
                    value={brand.percentage}
                    onChange={(e) =>
                      handleBrandChange(index, 'percentage', e.target.value)
                    }
                    placeholder={t('percentage')}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-24 p-2 bg-zinc-800 text-zinc-200 rounded"
                  />
                  <button
                    onClick={() => handleRemoveBrand(index)}
                    className="text-zinc-400 hover:text-zinc-200"
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="bg-zinc-600 text-zinc-300 py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {t('cancel')}
          </button>
          <ButtonGlobal
            params={{
              title: loading ? (
                <PulseLoader
                  color="#fff"
                  loading={loading}
                  size={6}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              ) : (
                t('create')
              ),
              color: 'bg-title',
            }}
            onClick={handleSubmit}
            disabled={files.length === 0 || loading}
          />
        </div>
      </div>
    </div>
  )
}
