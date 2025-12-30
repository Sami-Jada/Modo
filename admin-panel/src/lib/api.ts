const API_BASE = '/api/admin'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || 'Request failed')
  }
  
  return res.json()
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ id: string; email: string; name: string; role: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ id: string; email: string; name: string; role: string }>('/auth/me'),
  },
  
  applications: {
    list: (status?: string) => request<Application[]>(`/applications${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<Application>(`/applications/${id}`),
    approve: (id: string, reason: string) =>
      request<Application>(`/applications/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    reject: (id: string, reason: string) =>
      request<Application>(`/applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  },
  
  electricians: {
    list: (status?: string) => request<Electrician[]>(`/electricians${status ? `?status=${status}` : ''}`),
    get: (id: string) => request<Electrician>(`/electricians/${id}`),
    updateStatus: (id: string, status: string, reason: string) =>
      request<Electrician>(`/electricians/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      }),
  },
  
  jobs: {
    list: (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters)
      return request<Job[]>(`/jobs${params.toString() ? `?${params}` : ''}`)
    },
    get: (id: string) => request<Job>(`/jobs/${id}`),
    addEvent: (id: string, status: string, reason: string, metadata?: Record<string, unknown>) =>
      request<Job>(`/jobs/${id}/event`, {
        method: 'POST',
        body: JSON.stringify({ status, reason, metadata }),
      }),
  },
  
  disputes: {
    list: (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters)
      return request<Dispute[]>(`/disputes${params.toString() ? `?${params}` : ''}`)
    },
    get: (id: string) => request<Dispute>(`/disputes/${id}`),
    update: (id: string, updates: Partial<Dispute> & { reason: string }) =>
      request<Dispute>(`/disputes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
  },
  
  customers: {
    list: () => request<Customer[]>('/customers'),
    get: (id: string) => request<Customer>(`/customers/${id}`),
    adjustBalance: (id: string, amount: number, reason: string) =>
      request<Customer>(`/customers/${id}/adjust-balance`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      }),
    adjustCredits: (id: string, amount: number, reason: string) =>
      request<Customer>(`/customers/${id}/adjust-credits`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      }),
  },
  
  transactions: {
    list: (entityType?: string, entityId?: string) => {
      const params = new URLSearchParams()
      if (entityType) params.set('entityType', entityType)
      if (entityId) params.set('entityId', entityId)
      return request<BalanceTransaction[]>(`/transactions${params.toString() ? `?${params}` : ''}`)
    },
  },
  
  configs: {
    list: () => request<Config[]>('/configs'),
    get: (key: string) => request<Config>(`/configs/${key}`),
    history: (key: string) => request<Config[]>(`/configs/${key}/history`),
    set: (key: string, value: unknown, reason: string) =>
      request<Config>(`/configs/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value, reason }),
      }),
  },
  
  auditLogs: {
    list: (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters)
      return request<AuditLog[]>(`/audit-logs${params.toString() ? `?${params}` : ''}`)
    },
  },
  
  metrics: {
    get: () => request<Metrics>('/metrics'),
  },
}

export interface Application {
  id: string
  name: string
  email: string
  phone: string
  nationalId: string
  specializations: string[]
  yearsExperience: number
  certifications: string[]
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewReason: string | null
}

export interface Electrician {
  id: string
  applicationId: string
  name: string
  email: string
  phone: string
  nationalId: string
  specializations: string[]
  yearsExperience: number
  certifications: string[]
  status: 'active' | 'suspended' | 'inactive'
  rating: number
  totalJobs: number
  completedJobs: number
  cancelledJobs: number
  balance: number
  createdAt: string
}

export interface JobEvent {
  id: string
  jobId: string
  status: string
  timestamp: string
  actorType: 'system' | 'customer' | 'electrician' | 'admin'
  actorId: string | null
  metadata?: Record<string, unknown>
}

export interface Job {
  id: string
  customerId: string
  customerName: string
  customerPhone: string
  electricianId: string | null
  electricianName: string | null
  serviceType: string
  description: string
  address: string
  latitude: number | null
  longitude: number | null
  quotedPrice: number
  finalPrice: number | null
  status: string
  createdAt: string
  completedAt: string | null
  timeline: JobEvent[]
}

export interface Dispute {
  id: string
  jobId: string
  customerId: string
  customerName: string
  electricianId: string | null
  electricianName: string | null
  type: string
  description: string
  status: 'open' | 'investigating' | 'resolved' | 'escalated' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  resolution: string | null
  assignedTo: string | null
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  balance: number
  credits: number
  totalJobs: number
  createdAt: string
}

export interface BalanceTransaction {
  id: string
  entityType: 'customer' | 'electrician'
  entityId: string
  type: 'credit' | 'debit' | 'adjustment' | 'payout' | 'refund'
  amount: number
  balanceBefore: number
  balanceAfter: number
  reason: string
  adminId: string | null
  jobId: string | null
  timestamp: string
}

export interface Config {
  id: string
  key: string
  value: unknown
  version: number
  updatedBy: string
  updatedAt: string
  reason: string
}

export interface AuditLog {
  id: string
  adminId: string
  adminEmail: string
  action: string
  entityType: string
  entityId: string | null
  reason: string
  details?: Record<string, unknown>
  timestamp: string
  ipAddress: string | null
}

export interface Metrics {
  totalElectricians: number
  activeElectricians: number
  pendingApplications: number
  totalJobs: number
  completedJobs: number
  cancelledJobs: number
  averageRating: number
  openDisputes: number
  totalRevenue: number
  averageJobValue: number
}
