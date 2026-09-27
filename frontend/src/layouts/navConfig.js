import { ROLES } from '../lib/constants';

/**
 * Centralized nav config so the sidebar and route guards stay in sync.
 * `roles: null` means visible/allowed to every authenticated role.
 */
export const NAV_ITEMS = [
	{ to: '/', label: 'Dashboard', roles: null, icon: 'home' },
	{ to: '/notifications', label: 'Notifications', roles: null, icon: 'bell' },
	{
		to: '/equipment',
		label: 'Equipment',
		roles: [ROLES.ADMIN, ROLES.FACULTY, ROLES.OUTSIDER],
		icon: 'box',
	},
	{
		to: '/supplies',
		label: 'Supplies',
		roles: [ROLES.ADMIN, ROLES.FACULTY],
		icon: 'archive',
	},
	{
		to: '/equipment-requests',
		label: 'Equipment Requests',
		roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.FACULTY, ROLES.OUTSIDER],
		icon: 'clipboard',
	},
	{
		to: '/supply-requests',
		label: 'Supply Requests',
		roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.FACULTY],
		icon: 'clipboard-list',
	},
	{
		to: '/release-return',
		label: 'Release & Return',
		roles: [ROLES.ADMIN, ROLES.STAFF],
		icon: 'exchange',
	},
	{
		to: '/qr-scan',
		label: 'QR Scan',
		roles: [ROLES.ADMIN, ROLES.STAFF],
		icon: 'camera',
	},
	{
		to: '/concerns',
		label: 'Damage & Concerns',
		roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.FACULTY, ROLES.OUTSIDER],
		icon: 'alert',
	},
	{
		to: '/users',
		label: 'User Management',
		roles: [ROLES.ADMIN],
		icon: 'users',
	},
	{
		to: '/reports',
		label: 'Reports',
		roles: [ROLES.ADMIN],
		icon: 'chart',
	},
];
