import { api } from '../../lib/apiClient';

export const equipmentApi = {
	list: (params, signal) => api.get('/equipment', params, signal),
	get: (id, signal) => api.get(`/equipment/${id}`, undefined, signal),
	create: (payload) => api.post('/equipment', payload),
	update: (id, payload) => api.put(`/equipment/${id}`, payload),
	deactivate: (id) => api.post(`/equipment/${id}/deactivate`),
	activate: (id) => api.post(`/equipment/${id}/activate`),
	remove: (id) => api.del(`/equipment/${id}`),
	statusByBarcode: (barcode, signal) =>
		api.get(
			`/equipment/barcode/${encodeURIComponent(barcode)}`,
			undefined,
			signal,
		),
};
