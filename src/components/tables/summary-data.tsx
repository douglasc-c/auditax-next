'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { SummaryData, YearData } from '@/types/audit'
import ButtonGlobal from '../buttons/global'
import { jsPDF as JSPDF, GState } from 'jspdf'
import * as XLSX from 'xlsx'
import autoTable from 'jspdf-autotable'
import { DoughnutChart } from '../charts/doughnut-chart'
import { BarChart } from '../charts/bar-chart'
import { HorizontalBarChart } from '../charts/horizontal-bar-chart'
import html2canvas from 'html2canvas'
import { toast } from 'react-hot-toast'
import api from '@/lib/api'
import { usePathname } from 'next/navigation'

type TableRow = {
  brand: string
  product: string
  percent: string
  [year: string]: string
}

interface SummaryDataTableProps {
  data: SummaryData[]
  auditId?: string
}

interface EstablishmentData {
  companyName: string
  cnpj: string
  responsible: string
}

interface DetailsDataRow {
  id: string
  auditId: string
  establishment_code: string
  acquirer: string
  sale_date: string
  sale_status: string
  nsu: string
  card_brand: string
  payment_method: string
  product: string
  sale_amount: string
  fee_amount: string
  net_amount: string
  reference_rate: string
  card_number: string
  receipt_date: string
  audited_rate: string
  audited_fee_amount: string
  amount_difference: string
  created_at: string
}

export function SummaryDataTable({ data, auditId }: SummaryDataTableProps) {
  const t = useTranslations('TextLang')
  const pathname = usePathname()
  const isSummaryRoute = pathname.includes('/summary/')
  const doughnutChartRef = useRef<HTMLDivElement>(null)
  const barChartRef = useRef<HTMLDivElement>(null)
  const horizontalBarChartRef = useRef<HTMLDivElement>(null)
  const flagDropdownRef = useRef<HTMLDivElement>(null)
  const methodDropdownRef = useRef<HTMLDivElement>(null)
  const [establishmentData, setEstablishmentData] =
    useState<EstablishmentData | null>(null)

  // Estados para os filtros
  const [selectedFlags, setSelectedFlags] = useState<string[]>([])
  const [selectedMethods, setSelectedMethods] = useState<string[]>([])
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)
  const [isFlagDropdownOpen, setIsFlagDropdownOpen] = useState(false)
  const [isMethodDropdownOpen, setIsMethodDropdownOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Transformar dados da nova estrutura para a estrutura esperada
  const transformedData = useMemo(() => {
    if (!Array.isArray(data)) return []

    // Primeiro, coletar todos os anos únicos de todos os itens
    const allYears = new Set<string>()
    data.forEach((item) => {
      if (item.years && Array.isArray(item.years)) {
        item.years.forEach((yearData: YearData) => {
          allYears.add(yearData.year.toString())
        })
      }
    })

    const sortedYears = Array.from(allYears).sort()

    return data.map((item): TableRow => {
      if (item.years && Array.isArray(item.years)) {
        const transformedItem: TableRow = {
          brand: item.brand,
          product: item.product,
          percent: item.percentage,
        }

        // Preencher todos os anos, mesmo os que não existem no item atual
        sortedYears.forEach((year) => {
          const yearData = item.years?.find(
            (yd: YearData) => yd.year.toString() === year,
          )
          transformedItem[year] = yearData ? yearData.value : '0,00'
        })

        return transformedItem
      }
      return item as unknown as TableRow
    })
  }, [data])

  // Garantir que transformedData seja um array
  const safeData = useMemo(
    () => (Array.isArray(transformedData) ? transformedData : []),
    [transformedData],
  )

  // Extrair anos únicos dos dados
  const years = useMemo(() => {
    if (safeData.length === 0) return []

    // Coletar todos os anos únicos de todos os itens
    const allYears = new Set<string>()

    safeData.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (
          key !== 'brand' &&
          key !== 'product' &&
          key !== 'percent' &&
          key !== 'Total Geral'
        ) {
          allYears.add(key)
        }
      })
    })

    return Array.from(allYears).sort()
  }, [safeData])

  // Extrair bandeiras e métodos únicos
  const uniqueFlags = useMemo(() => {
    const flags = new Set(safeData.map((row) => row.brand))
    return Array.from(flags).sort()
  }, [safeData])

  const uniqueMethods = useMemo(() => {
    const methods = new Set(safeData.map((row) => row.product))
    return Array.from(methods).sort()
  }, [safeData])

  // Filtrar dados
  const filteredData = useMemo(() => {
    return safeData.filter((row) => {
      const flagMatch =
        selectedFlags.length === 0 || selectedFlags.includes(row.brand)
      const methodMatch =
        selectedMethods.length === 0 || selectedMethods.includes(row.product)
      return flagMatch && methodMatch
    })
  }, [safeData, selectedFlags, selectedMethods])

  const formatValue = (value: string | undefined | null) => {
    if (!value) return '0,00'

    // Remove os pontos de separador de milhar
    const cleanValue = value.replace(/\./g, '')
    // Substitui a vírgula por ponto para conversão
    const numericValue = cleanValue.replace(',', '.')
    const number = Number(numericValue)
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Função para converter string formatada em número
  const parseValue = (value: string | undefined | null): number => {
    if (!value) return 0
    // Remove pontos e substitui vírgula por ponto para converter para número
    const cleanValue = value.toString().replace(/\./g, '').replace(',', '.')
    return parseFloat(cleanValue) || 0
  }

  // Função para calcular o total de uma linha (versão para TableRow)
  const calculateRowTotalForTableRow = (row: TableRow): number => {
    return years.reduce((sum, year) => {
      return sum + parseValue(row[year])
    }, 0)
  }

  // Função para formatar número com vírgula
  const formatNumberBR = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Buscar dados do estabelecimento
  useEffect(() => {
    const fetchEstablishmentData = async () => {
      if (!auditId) return
      try {
        const response = await api.get(`/audits/${auditId}`)
        setEstablishmentData(response.data.audit.establishment)
      } catch (error) {
        console.error('Erro ao buscar dados do estabelecimento:', error)
      }
    }
    fetchEstablishmentData()
  }, [auditId])

  const handleExportExcel = async () => {
    if (!data) return

    try {
      // Buscar todos os dados para exportação
      const response = await api.get(`/audits/${auditId}/details?allItems=true`)
      const allData = response.data.detailsData

      if (!allData || !Array.isArray(allData)) return

      // Processar dados em lotes para evitar estouro de memória
      const batchSize = 1000
      const processedData: Record<string, string>[] = []

      for (let i = 0; i < allData.length; i += batchSize) {
        const batch = allData.slice(i, i + batchSize)

        const batchData = batch.map((row: DetailsDataRow) => ({
          [t('establishmentCode')]: row.establishment_code,
          [t('acquirer')]: row.acquirer,
          [t('saleDate')]: row.sale_date,
          [t('status')]: row.sale_status,
          [t('nsu')]: row.nsu,
          [t('flag')]: row.card_brand,
          [t('paymentMethod')]: row.payment_method,
          [t('product')]: row.product,
          [t('saleValue')]: formatValue(row.sale_amount),
          [t('taxValue')]: formatValue(row.fee_amount),
          [t('netValue')]: formatValue(row.net_amount),
          [t('referencedTax')]: row.reference_rate + '%',
          [t('cardNumber')]: row.card_number,
          [t('receiptDate')]: row.receipt_date,
          [t('auditedTax')]: row.audited_rate + '%',
          [t('auditedTaxValue')]: formatValue(row.audited_fee_amount),
          [t('differenceToReceive')]: formatValue(row.amount_difference),
        }))

        processedData.push(...batchData)
      }

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(processedData)

      // Calcular largura das colunas de forma otimizada
      const columnKeys = Object.keys(processedData[0] || {})
      const colWidths = columnKeys.map((key) => {
        let maxWidth = key.length

        // Calcular largura máxima apenas para os primeiros 100 registros para otimização
        const sampleSize = Math.min(100, processedData.length)
        for (let i = 0; i < sampleSize; i++) {
          const cellValue = String(processedData[i][key] || '')
          maxWidth = Math.max(maxWidth, cellValue.length)
        }

        // Definir largura mínima e máxima
        return {
          wch: Math.min(Math.max(maxWidth, 10), 50),
        }
      })

      ws['!cols'] = colWidths

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, t('detailsData'))

      // Salvar o arquivo
      XLSX.writeFile(
        wb,
        `${t('analytics')}-${new Date().toISOString().split('T')[0]}.xlsx`,
      )
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
    }
  }

  const handleExportPDF = async () => {
    const doc = new JSPDF()

    // Adicionar marca d'água
    doc.saveGraphicsState()
    doc.setGState(new GState({ opacity: 0.1 }))
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(150)
    doc.text('AUDITAXS', 23, 250, { angle: 45 })
    doc.restoreGraphicsState()

    // Configurar o título e ID lado a lado
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 41, 41)

    // Adicionar logo
    try {
      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = '/images/svg/logoBlack.svg'
      })

      // Criar um canvas para converter SVG em PNG
      const canvas = document.createElement('canvas')
      canvas.width = logoImg.width
      canvas.height = logoImg.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(logoImg, 0, 0)
        const pngData = canvas.toDataURL('image/png')
        doc.addImage(pngData, 'PNG', 10, 10, 70, 15)
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error)
    }

    // Configurar o título e ID lado a lado
    doc.setFontSize(16)
    const titleText = t('summaryData')
    const titleWidth = doc.getTextWidth(titleText)
    doc.text(titleText, 10, 35)

    // Adicionar ID com cor de fundo
    doc.setTextColor(231, 146, 4) // Cor #e79204
    doc.setFontSize(12)
    doc.text(`#${auditId}`, titleWidth + 12, 35)

    // Resetar cor do texto para preto
    doc.setTextColor(41, 41, 41)

    if (establishmentData) {
      doc.setFontSize(10)

      // Adicionar os dados em linhas separadas
      doc.setFont('helvetica', 'normal')
      doc.text(`${t('establishment')}:`, 10, 45)
      doc.setFont('helvetica', 'bold')
      doc.text(establishmentData.companyName, 10, 50)

      doc.setFont('helvetica', 'normal')
      doc.text(`${t('cnpj')}:`, 10, 55)
      doc.setFont('helvetica', 'bold')
      doc.text(establishmentData.cnpj, 10, 60)

      doc.setFont('helvetica', 'normal')
      doc.text(`${t('responsible')}:`, 10, 65)
      doc.setFont('helvetica', 'bold')
      doc.text(establishmentData.responsible, 10, 70)
    }

    // Adicionar linha separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(10, 75, 200, 75)

    // Capturar os gráficos como imagens
    const doughnutCanvas = await html2canvas(doughnutChartRef.current!)
    const barCanvas = await html2canvas(barChartRef.current!)
    const horizontalBarCanvas = await html2canvas(
      horizontalBarChartRef.current!,
    )

    // Adicionar os gráficos ao PDF
    const doughnutImgData = doughnutCanvas.toDataURL('image/png')
    const barImgData = barCanvas.toDataURL('image/png')
    const horizontalBarImgData = horizontalBarCanvas.toDataURL('image/png')

    // Adicionar o gráfico de pizza
    doc.addImage(doughnutImgData, 'PNG', 10, 80, 60, 48)

    // Adicionar o gráfico de barras
    doc.addImage(barImgData, 'PNG', 75, 80, 60, 48)

    // Adicionar o gráfico de barras horizontais
    doc.addImage(horizontalBarImgData, 'PNG', 140, 80, 60, 48)

    // Preparar os dados para a tabela
    const tableData = [
      ...filteredData.map((row) => [
        row.brand,
        row.product,
        row.percent,
        ...years.map((year) => formatValue(row[year])),
        formatNumberBR(calculateRowTotalForTableRow(row)),
      ]),
      // Adiciona linha de total
      [
        t('totalGeneral'),
        '-',
        '-',
        ...years.map((year) =>
          formatNumberBR(
            filteredData.reduce((sum, row) => sum + parseValue(row[year]), 0),
          ),
        ),
        formatNumberBR(
          filteredData.reduce(
            (sum, row) => sum + calculateRowTotalForTableRow(row),
            0,
          ),
        ),
      ],
    ]

    // Configurar as colunas
    const columns = [
      t('brand'),
      t('product'),
      t('fee') + ' (%)',
      ...years,
      t('total') + ' (R$)',
    ]

    // Adicionar a tabela ao PDF
    autoTable(doc, {
      head: [columns],
      body: tableData,
      startY: 132,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: 'helvetica',
        fillColor: false,
      },
      headStyles: {
        fillColor: [41, 41, 41],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      // Estilizar a última linha (totais)
      didParseCell: function (data) {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 9
        }
      },
      margin: { top: 20, left: 10, right: 10 },
    })

    // Adicionar rodapé
    const pageCount = doc.getNumberOfPages()
    const date = new Date()
    const months = [
      'janeiro',
      'fevereiro',
      'março',
      'abril',
      'maio',
      'junho',
      'julho',
      'agosto',
      'setembro',
      'outubro',
      'novembro',
      'dezembro',
    ]
    const currentDate = `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`
    const currentTime = date.toLocaleTimeString('pt-BR')

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)

      // Adicionar linha separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(
        10,
        doc.internal.pageSize.height - 15,
        200,
        doc.internal.pageSize.height - 15,
      )

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(128, 128, 128)

      // Informações do rodapé
      const footerText = `Auditaxs | ${currentDate} - ${currentTime}, Curitiba, Paraná, Brasil | ID: ${auditId}`

      // Adicionar paginação à esquerda
      doc.text(
        `Página ${i} de ${pageCount}`,
        10,
        doc.internal.pageSize.height - 10,
        { align: 'left' },
      )

      // Adicionar informações à direita
      doc.text(
        footerText,
        doc.internal.pageSize.width - 10,
        doc.internal.pageSize.height - 10,
        { align: 'right' },
      )
    }

    // Salvar o PDF
    doc.save(`sintese-${establishmentData?.companyName}.pdf`)
  }

  const handleShareSummary = () => {
    if (!auditId) return

    const locale = window.location.pathname.split('/')[1]
    const summaryUrl = `${window.location.origin}/${locale}/summary/${auditId}`

    navigator.clipboard
      .writeText(summaryUrl)
      .then(() => {
        console.log('Link copiado:', summaryUrl)
        toast.success(t('summaryLinkCopied'))

        // Mostrar mensagem na tela
        setShowCopiedMessage(true)

        // Esconder a mensagem após 3 segundos
        setTimeout(() => {
          setShowCopiedMessage(false)
        }, 3000)
      })
      .catch((err) => {
        console.error('Erro ao copiar link:', err)
        toast.error('Erro ao copiar link')
      })
  }

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        flagDropdownRef.current &&
        !flagDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFlagDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Adicionar useEffect para o dropdown de métodos
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        methodDropdownRef.current &&
        !methodDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMethodDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="p-8">
      {showCopiedMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out">
          {t('summaryLinkCopied')}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 justify-between items-center mb-6 gap-2">
        <h1 className="text-lg font-semibold text-zinc-200 w-full">
          {t('summaryData')} <span className="text-title">#{auditId}</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {/* Filtro de bandeiras com seleção múltipla */}
          <div className="relative w-full md:w-auto" ref={flagDropdownRef}>
            <button
              onClick={() => setIsFlagDropdownOpen(!isFlagDropdownOpen)}
              className="bg-zinc-800 text-zinc-200 text-sm rounded-lg p-2 border border-zinc-700 flex items-center justify-between w-full md:min-w-[150px]"
            >
              <span>
                {selectedFlags.length === 0
                  ? t('allFlags')
                  : selectedFlags.length === 1
                    ? selectedFlags[0]
                    : `${selectedFlags.length} ${t('flags')}`}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isFlagDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isFlagDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedFlags.length === 0}
                      onChange={() => setSelectedFlags([])}
                      className="custom-checkbox"
                    />
                    <span className="checkbox-label">{t('allFlags')}</span>
                  </div>
                  {uniqueFlags.map((flag) => (
                    <div key={flag} className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedFlags.includes(flag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFlags([...selectedFlags, flag])
                          } else {
                            setSelectedFlags(
                              selectedFlags.filter((f) => f !== flag),
                            )
                          }
                        }}
                        className="custom-checkbox"
                      />
                      <span className="checkbox-label">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative w-full md:w-auto" ref={methodDropdownRef}>
            <button
              onClick={() => setIsMethodDropdownOpen(!isMethodDropdownOpen)}
              className="bg-zinc-800 text-zinc-200 text-sm rounded-lg p-2 border border-zinc-700 flex items-center justify-between w-full md:min-w-[150px]"
            >
              <span>
                {selectedMethods.length === 0
                  ? t('allMethods')
                  : selectedMethods.length === 1
                    ? selectedMethods[0]
                    : `${selectedMethods.length} ${t('methods')}`}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isMethodDropdownOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isMethodDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedMethods.length === 0}
                      onChange={() => setSelectedMethods([])}
                      className="custom-checkbox"
                    />
                    <span className="checkbox-label">{t('allMethods')}</span>
                  </div>
                  {uniqueMethods.map((method) => (
                    <div key={method} className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMethods([...selectedMethods, method])
                          } else {
                            setSelectedMethods(
                              selectedMethods.filter((m) => m !== method),
                            )
                          }
                        }}
                        className="custom-checkbox"
                      />
                      <span className="checkbox-label">{method}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative dropdown-container w-full md:w-auto">
            <ButtonGlobal
              params={{
                title: t('share'),
                color: 'bg-title',
                // icon: (
                //   <Image
                //     src="/images/svg/share.svg"
                //     alt="share"
                //     width={20}
                //     height={20}
                //   />
                // ),
              }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />
            {isDropdownOpen && (
              <div className="absolute mt-2 md:right-0 w-48 rounded-md shadow-lg bg-zinc-800 border border-zinc-700 z-10">
                <div className="">
                  <button
                    onClick={handleShareSummary}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                  >
                    {t('shareSummary')}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                  >
                    {t('exportPDF')}
                  </button>
                  {!isSummaryRoute && (
                    <button
                      onClick={handleExportExcel}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
                    >
                      {t('exportExcel')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-zinc-800 p-4 rounded-lg" ref={doughnutChartRef}>
          <h3 className="text-zinc-200 text-sm font-medium mb-2">
            Distribuição por Bandeira
          </h3>
          <DoughnutChart
            data={{
              labels: uniqueFlags,
              values: uniqueFlags.map((flag) =>
                filteredData
                  .filter((row) => row.brand === flag)
                  .reduce(
                    (sum, row) => sum + calculateRowTotalForTableRow(row),
                    0,
                  ),
              ),
            }}
          />
        </div>
        <div className="bg-zinc-800 p-4 rounded-lg" ref={barChartRef}>
          <h3 className="text-zinc-200 text-sm font-medium mb-2">
            Valores por Ano
          </h3>
          <BarChart
            data={{
              labels: years,
              values: years.map((year) =>
                filteredData.reduce(
                  (sum, row) => sum + parseValue(row[year]),
                  0,
                ),
              ),
            }}
          />
        </div>
        <div className="bg-zinc-800 p-4 rounded-lg" ref={horizontalBarChartRef}>
          <h3 className="text-zinc-200 text-sm font-medium mb-2">
            Valores por Produto
          </h3>
          <HorizontalBarChart
            data={{
              labels: uniqueMethods,
              values: uniqueMethods.map((method) =>
                filteredData
                  .filter((row) => row.product === method)
                  .reduce(
                    (sum, row) => sum + calculateRowTotalForTableRow(row),
                    0,
                  ),
              ),
            }}
          />
        </div>
      </div>

      <section className="h-auto w-full antialiased text-textPrimary bg-zinc-800 rounded-lg">
        <div className="custom-scroll max-h-[31rem]">
          <table className="table-auto w-full border-collapse text-sm">
            <thead className="uppercase border-b border-zinc-500">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium">
                  {t('brand')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium">
                  {t('product')}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium">
                  {t('fee')} (%)
                </th>
                {years.map((year) => (
                  <th
                    key={year}
                    className="px-4 py-2 text-left text-xs font-medium"
                  >
                    {year}
                  </th>
                ))}
                <th className="px-4 py-2 text-left text-xs font-medium">
                  {t('total') + ' (R$)'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr
                  key={`${row.brand}-${row.product}-${row.percent}-${index}`}
                  className={`${
                    index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800'
                  }`}
                >
                  <td className="px-4 py-2 text-left text-xs font-medium">
                    {row.brand}
                  </td>
                  <td className="px-4 py-2 text-left text-xs font-medium">
                    {row.product}
                  </td>
                  <td className="px-4 py-2 text-left text-xs font-medium">
                    {`${row.percent}`}
                  </td>
                  {years.map((year) => (
                    <td
                      key={`${row.brand}-${row.product}-${row.percent}-${year}`}
                      className="px-4 py-2 text-left text-xs font-medium"
                    >
                      {formatValue(row[year])}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-left text-xs font-medium">
                    {formatNumberBR(calculateRowTotalForTableRow(row))}
                  </td>
                </tr>
              ))}
              {/* Linha de total */}
              <tr className="font-bold">
                <td className="px-4 py-2 text-left text-sm font-bold">
                  {t('totalGeneral')}
                </td>
                <td className="px-4 py-2 text-left text-xs font-medium">-</td>
                <td className="px-4 py-2 text-left text-xs font-medium">-</td>
                {years.map((year) => (
                  <td
                    key={year}
                    className="px-4 py-2 text-left text-xs font-bold"
                  >
                    {formatNumberBR(
                      filteredData.reduce(
                        (sum, row) => sum + parseValue(row[year]),
                        0,
                      ),
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 text-left text-sm font-bold">
                  {formatNumberBR(
                    filteredData.reduce(
                      (sum, row) => sum + calculateRowTotalForTableRow(row),
                      0,
                    ),
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
