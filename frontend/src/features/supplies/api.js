import { api } from '../../lib/apiClient';

export const suppliesApi = {
	list: (params, signal) => api.get('/supplies', params, signal),
	get: (id, signal) => api.get(`/supplies/${id}`, undefined, signal),
	statusByBarcode: (barcode, signal) =>
		api.get(
			`/supplies/barcode/${encodeURIComponent(barcode)}`,
			undefined,
			signal,
		),
	create: (payload) => api.post('/supplies', payload),
	update: (id, payload) => api.put(`/supplies/${id}`, payload),
	deactivate: (id) => api.post(`/supplies/${id}/deactivate`),
	activate: (id) => api.post(`/supplies/${id}/activate`),
	remove: (id) => api.del(`/supplies/${id}`),
};
