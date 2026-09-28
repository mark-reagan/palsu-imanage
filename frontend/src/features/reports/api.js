import { api } from '../../lib/apiClient'

export const reportsApi = {
  dashboard: (signal) => api.get('/reports/dashboard', undefined, signal),
  equipment: (params, signal) => api.get('/reports/equipment', params, signal),
  supplies: (signal) => api.get('/reports/supplies', undefined, signal),
  supplyUsage: (params, signal) => api.get('/reports/supply-usage', params, signal),
  transactions: (signal) => api.get('/reports/transactions', undefined, signal),
  concerns: (params, signal) => api.get('/reports/concerns', params, signal),
}
