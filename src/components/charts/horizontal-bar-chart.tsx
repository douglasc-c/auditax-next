'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface HorizontalBarChartProps {
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

export function HorizontalBarChart({ data }: HorizontalBarChartProps) {
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

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number
            return value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#e2e8f0',
          callback: (value) => {
            return value.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#e2e8f0',
        },
      },
    },
  }

  return (
    <div className="h-[220px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  )
}
