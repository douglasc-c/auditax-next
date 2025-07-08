import axios from 'axios'

export const api = axios.create({
  // baseURL: 'https://sys.auditaxs.com.br',
  baseURL: 'http://localhost:3333',
  timeout: 60000, // 60 segundos
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const cookies = document.cookie
    const token = cookies
      .split('; ')
      .find((row) => row.startsWith('auth-token='))
    if (token) {
      config.headers.Authorization = `Bearer ${token.split('=')[1]}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error(
        'Erro de conexão com o servidor. Verifique se o servidor está rodando.',
      )
    }
    return Promise.reject(error)
  },
)

export default api
