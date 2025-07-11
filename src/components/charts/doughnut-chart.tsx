'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  data: {
    labels: string[]
    values: number[]
  }
}

// Função para gerar cores HSL com boa distinção visual
function generateColors(count: number) {
  const colors = []
  const borderColors = []

  for (let i = 0; i < count; i++) {
    // Distribuir as cores uniformemente no espectro HSL
    const hue = (i * 360) / count
    const saturation = 70 + (i % 20) // Varia entre 70-90%
    const lightness = 50 + (i % 15) // Varia entre 50-65%

    // Cor de fundo com transparência
    const backgroundColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`
    // Cor da borda sem transparência
    const borderColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`

    colors.push(backgroundColor)
    borderColors.push(borderColor)
  }

  return { colors, borderColors }
}

export function DoughnutChart({ data }: DoughnutChartProps) {
  const { colors, borderColors } = generateColors(
    Math.max(data.labels.length, 100),
  )

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: colors.slice(0, data.labels.length),
        borderColor: borderColors.slice(0, data.labels.length),
        borderWidth: 1,
      },
    ],
  }

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#e2e8f0',
          font: {
            size: 9,
          },
          padding: 8,
          generateLabels: (chart) => {
            const datasets = chart.data.datasets
            const labels = chart.data.labels as string[]
            return labels.map((label, i) => {
              const backgroundColor = Array.isArray(datasets[0].backgroundColor)
                ? datasets[0].backgroundColor[i]
                : datasets[0].backgroundColor
              const borderColor = Array.isArray(datasets[0].borderColor)
                ? datasets[0].borderColor[i]
                : datasets[0].borderColor
              return {
                text: label,
                fillStyle: backgroundColor as string,
                strokeStyle: borderColor as string,
                lineWidth: 1,
                hidden: false,
                index: i,
                fontColor: '#e2e8f0',
              }
            })
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.raw as number
            const total = (context.dataset.data as number[]).reduce(
              (a, b) => a + b,
              0,
            )
            const percentage = ((value / total) * 100).toFixed(2)
            return `${label}: ${value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })} (${percentage}%)`
          },
        },
      },
    },
    cutout: '70%',
  }

  return (
    <div className="h-[220px] w-full">
      <Doughnut data={chartData} options={options} />
    </div>
  )
}
