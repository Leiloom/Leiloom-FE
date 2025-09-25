import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333', 
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tokenBO = localStorage.getItem('backofficeToken')
    if (tokenBO) {
      config.headers.Authorization = `Bearer ${tokenBO}`
    }
    else {
    const tokenClient = localStorage.getItem('clientToken')
    if (tokenClient) {
      config.headers.Authorization = `Bearer ${tokenClient}`
    }
  }
  }
  return config
})