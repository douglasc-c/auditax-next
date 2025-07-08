import axios from 'axios'

const processApi = axios.create({
  // baseURL: 'https://py.auditaxs.com.br/api',
  baseURL: 'http://127.0.0.1:8000/api',
})

export default processApi
