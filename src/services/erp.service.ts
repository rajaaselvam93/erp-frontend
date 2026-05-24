import api from './api.service';

// ─── HRMS ──────────────────────────────────────────────────────────────────
export const hrmsApi = {
  getStats: () => api.get('/hrms/stats').then(r => r.data.data),
  getEmployees: (params?: Record<string, unknown>) => api.get('/hrms/employees', { params }).then(r => r.data),
  getEmployee: (id: string) => api.get(`/hrms/employees/${id}`).then(r => r.data.data),
  createEmployee: (data: Record<string, unknown>) => api.post('/hrms/employees', data).then(r => r.data.data),
  updateEmployee: (id: string, data: Record<string, unknown>) => api.put(`/hrms/employees/${id}`, data).then(r => r.data.data),
  deleteEmployee: (id: string) => api.delete(`/hrms/employees/${id}`),
  getDepartments: () => api.get('/hrms/departments').then(r => r.data.data),
  createDepartment: (data: Record<string, unknown>) => api.post('/hrms/departments', data).then(r => r.data.data),
  updateDepartment: (id: string, data: Record<string, unknown>) => api.put(`/hrms/departments/${id}`, data).then(r => r.data.data),
  deleteDepartment: (id: string) => api.delete(`/hrms/departments/${id}`),
};

// ─── CRM ───────────────────────────────────────────────────────────────────
export const crmApi = {
  getStats: () => api.get('/crm/stats').then(r => r.data.data),
  getCustomers: (params?: Record<string, unknown>) => api.get('/crm/customers', { params }).then(r => r.data),
  getCustomer: (id: string) => api.get(`/crm/customers/${id}`).then(r => r.data.data),
  createCustomer: (data: Record<string, unknown>) => api.post('/crm/customers', data).then(r => r.data.data),
  updateCustomer: (id: string, data: Record<string, unknown>) => api.put(`/crm/customers/${id}`, data).then(r => r.data.data),
  deleteCustomer: (id: string) => api.delete(`/crm/customers/${id}`),
  getLeads: (params?: Record<string, unknown>) => api.get('/crm/leads', { params }).then(r => r.data),
  getLead: (id: string) => api.get(`/crm/leads/${id}`).then(r => r.data.data),
  createLead: (data: Record<string, unknown>) => api.post('/crm/leads', data).then(r => r.data.data),
  updateLead: (id: string, data: Record<string, unknown>) => api.put(`/crm/leads/${id}`, data).then(r => r.data.data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  convertLead: (id: string) => api.post(`/crm/leads/${id}/convert`).then(r => r.data.data),
};

// ─── Procurement ───────────────────────────────────────────────────────────
export const procurementApi = {
  getStats: () => api.get('/procurement/stats').then(r => r.data.data),
  getVendors: (params?: Record<string, unknown>) => api.get('/procurement/vendors', { params }).then(r => r.data),
  getVendor: (id: string) => api.get(`/procurement/vendors/${id}`).then(r => r.data.data),
  createVendor: (data: Record<string, unknown>) => api.post('/procurement/vendors', data).then(r => r.data.data),
  updateVendor: (id: string, data: Record<string, unknown>) => api.put(`/procurement/vendors/${id}`, data).then(r => r.data.data),
  deleteVendor: (id: string) => api.delete(`/procurement/vendors/${id}`),
  getPurchaseOrders: (params?: Record<string, unknown>) => api.get('/procurement/purchase-orders', { params }).then(r => r.data),
  getPurchaseOrder: (id: string) => api.get(`/procurement/purchase-orders/${id}`).then(r => r.data.data),
  createPurchaseOrder: (data: Record<string, unknown>) => api.post('/procurement/purchase-orders', data).then(r => r.data.data),
  updatePurchaseOrder: (id: string, data: Record<string, unknown>) => api.put(`/procurement/purchase-orders/${id}`, data).then(r => r.data.data),
  approvePurchaseOrder: (id: string) => api.put(`/procurement/purchase-orders/${id}/approve`).then(r => r.data.data),
  deletePurchaseOrder: (id: string) => api.delete(`/procurement/purchase-orders/${id}`),
};

// ─── Inventory ─────────────────────────────────────────────────────────────
export const inventoryApi = {
  getStats: () => api.get('/inventory/stats').then(r => r.data.data),
  getItems: (params?: Record<string, unknown>) => api.get('/inventory/items', { params }).then(r => r.data),
  getItem: (id: string) => api.get(`/inventory/items/${id}`).then(r => r.data.data),
  createItem: (data: Record<string, unknown>) => api.post('/inventory/items', data).then(r => r.data.data),
  updateItem: (id: string, data: Record<string, unknown>) => api.put(`/inventory/items/${id}`, data).then(r => r.data.data),
  deleteItem: (id: string) => api.delete(`/inventory/items/${id}`),
  addTransaction: (id: string, data: Record<string, unknown>) => api.post(`/inventory/items/${id}/transactions`, data).then(r => r.data.data),
  getWarehouses: () => api.get('/inventory/warehouses').then(r => r.data.data),
  createWarehouse: (data: Record<string, unknown>) => api.post('/inventory/warehouses', data).then(r => r.data.data),
};

// ─── Sales ─────────────────────────────────────────────────────────────────
export const salesApi = {
  getStats: () => api.get('/sales/stats').then(r => r.data.data),
  getSalesOrders: (params?: Record<string, unknown>) => api.get('/sales/orders', { params }).then(r => r.data),
  getSalesOrder: (id: string) => api.get(`/sales/orders/${id}`).then(r => r.data.data),
  createSalesOrder: (data: Record<string, unknown>) => api.post('/sales/orders', data).then(r => r.data.data),
  updateSalesOrder: (id: string, data: Record<string, unknown>) => api.put(`/sales/orders/${id}`, data).then(r => r.data.data),
  deleteSalesOrder: (id: string) => api.delete(`/sales/orders/${id}`),
  getInvoices: (params?: Record<string, unknown>) => api.get('/sales/invoices', { params }).then(r => r.data),
  createInvoice: (data: Record<string, unknown>) => api.post('/sales/invoices', data).then(r => r.data.data),
  updateInvoice: (id: string, data: Record<string, unknown>) => api.put(`/sales/invoices/${id}`, data).then(r => r.data.data),
  recordPayment: (id: string, amount: number) => api.post(`/sales/invoices/${id}/payment`, { amount }).then(r => r.data.data),
};

// ─── Finance ───────────────────────────────────────────────────────────────
export const financeApi = {
  getStats: () => api.get('/finance/stats').then(r => r.data.data),
  getAccounts: (params?: Record<string, unknown>) => api.get('/finance/accounts', { params }).then(r => r.data.data),
  createAccount: (data: Record<string, unknown>) => api.post('/finance/accounts', data).then(r => r.data.data),
  updateAccount: (id: string, data: Record<string, unknown>) => api.put(`/finance/accounts/${id}`, data).then(r => r.data.data),
  deleteAccount: (id: string) => api.delete(`/finance/accounts/${id}`),
  getJournalEntries: (params?: Record<string, unknown>) => api.get('/finance/journal-entries', { params }).then(r => r.data),
  getJournalEntry: (id: string) => api.get(`/finance/journal-entries/${id}`).then(r => r.data.data),
  createJournalEntry: (data: Record<string, unknown>) => api.post('/finance/journal-entries', data).then(r => r.data.data),
  postJournalEntry: (id: string) => api.put(`/finance/journal-entries/${id}/post`).then(r => r.data.data),
};

// ─── Projects ──────────────────────────────────────────────────────────────
export const projectsApi = {
  getStats: () => api.get('/projects/stats').then(r => r.data.data),
  getProjects: (params?: Record<string, unknown>) => api.get('/projects', { params }).then(r => r.data),
  getProject: (id: string) => api.get(`/projects/${id}`).then(r => r.data.data),
  createProject: (data: Record<string, unknown>) => api.post('/projects', data).then(r => r.data.data),
  updateProject: (id: string, data: Record<string, unknown>) => api.put(`/projects/${id}`, data).then(r => r.data.data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
  getTasks: (projectId: string) => api.get(`/projects/${projectId}/tasks`).then(r => r.data.data),
  createTask: (projectId: string, data: Record<string, unknown>) => api.post(`/projects/${projectId}/tasks`, data).then(r => r.data.data),
  updateTask: (projectId: string, taskId: string, data: Record<string, unknown>) => api.put(`/projects/${projectId}/tasks/${taskId}`, data).then(r => r.data.data),
  deleteTask: (projectId: string, taskId: string) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
};
