import { api } from '../../lib/apiClient';

export const notificationsApi = {
	list: (params, signal) => api.get('/notifications', params, signal),
	unread: (signal) => api.get('/notifications/unread', undefined, signal),
	markRead: (id) => api.post(`/notifications/${id}/read`),
	markAllRead: () => api.post('/notifications/read-all'),
	deleteRead: () => api.del('/notifications/read'),
};
