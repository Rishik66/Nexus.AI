import axios from 'axios';

const api = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_URL as string) || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export interface Business {
  id: string;
  name: string;
  type: string;
  currency: string;
  address?: string;
  phone?: string;
  is_demo: boolean;
}

export interface AgentDescriptor {
  name: 'ORION' | 'ATLAS' | 'NOVA' | 'SAGE' | 'SENTINEL';
  role: string;
  tagline: string;
  avatarColor: string;
  capabilities: string[];
  permittedTools: string[];
}

export interface PlanStep {
  id: string;
  stepIndex: number;
  agentName: 'ORION' | 'ATLAS' | 'NOVA' | 'SAGE' | 'SENTINEL';
  description: string;
  toolName?: string;
  suggestedInput?: any;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dependencies: number[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';
  output?: any;
}

export interface ExecutionPlan {
  goal: string;
  summary: string;
  targetAgents: string[];
  steps: PlanStep[];
  estimatedTurns: number;
}

export interface AgentRun {
  id: string;
  business_id: string;
  goal: string;
  status: 'PLANNING' | 'EXECUTING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  current_agent: string;
  plan?: ExecutionPlan;
  results?: any;
  steps?: any[];
  messages?: any[];
  created_at: string;
}

export interface Approval {
  id: string;
  business_id: string;
  run_id?: string;
  step_id?: string;
  requesting_agent: string;
  action_type: string;
  description: string;
  risk_level: 'MEDIUM' | 'HIGH';
  payload: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  decision_reason?: string;
  decided_by?: string;
  created_at: string;
}

// API methods
export const ApiService = {
  // Auth
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  // Business
  getCurrentBusiness: async () => {
    const res = await api.get('/businesses/current');
    return res.data.business;
  },

  // Dashboard
  getDashboardMetrics: async () => {
    const res = await api.get('/dashboard/metrics');
    return res.data;
  },
  getDashboardCharts: async () => {
    const res = await api.get('/dashboard/charts');
    return res.data;
  },

  // Agents & Runs
  getAgents: async (): Promise<AgentDescriptor[]> => {
    const res = await api.get('/agents');
    return res.data.agents;
  },
  planGoal: async (goal: string): Promise<ExecutionPlan> => {
    const res = await api.post('/agent-runs/plan', { goal });
    return res.data.plan;
  },
  executePlan: async (goal: string, plan?: ExecutionPlan): Promise<{ runId: string; status: string; plan: ExecutionPlan }> => {
    const res = await api.post('/agent-runs/execute', { goal, plan });
    return res.data;
  },
  getAgentRuns: async (): Promise<AgentRun[]> => {
    const res = await api.get('/agent-runs');
    return res.data.runs;
  },
  getAgentRun: async (id: string): Promise<AgentRun> => {
    const res = await api.get(`/agent-runs/${id}`);
    return res.data.run;
  },
  stopExecution: async (id: string) => {
    const res = await api.post(`/agent-runs/${id}/stop`);
    return res.data;
  },

  // Products & Inventory
  getProducts: async (params?: Record<string, any>) => {
    const res = await api.get('/products', { params });
    return res.data;
  },
  getInventoryMovements: async () => {
    const res = await api.get('/inventory/movements');
    return res.data.movements;
  },
  adjustInventory: async (data: { product_id: string; quantity: number; reason: string }) => {
    const res = await api.post('/inventory/adjust', data);
    return res.data;
  },

  // Customers & Suppliers
  getCustomers: async () => {
    const res = await api.get('/customers');
    return res.data.customers;
  },
  getSuppliers: async () => {
    const res = await api.get('/suppliers');
    return res.data.suppliers;
  },

  // Purchase Orders & Invoices
  getPurchaseOrders: async () => {
    const res = await api.get('/orders');
    return res.data.orders;
  },
  getInvoices: async () => {
    const res = await api.get('/invoices');
    return res.data.invoices;
  },
  getOverdueInvoices: async () => {
    const res = await api.get('/invoices/overdue');
    return res.data;
  },

  // Expenses & Tasks
  getExpenses: async () => {
    const res = await api.get('/expenses');
    return res.data;
  },
  getTasks: async () => {
    const res = await api.get('/tasks');
    return res.data.tasks;
  },
  updateTaskStatus: async (id: string, status: string) => {
    const res = await api.patch(`/tasks/${id}/status`, { status });
    return res.data.task;
  },

  // Workflows
  getWorkflows: async () => {
    const res = await api.get('/workflows');
    return res.data.workflows;
  },
  triggerWorkflow: async (id: string) => {
    const res = await api.post(`/workflows/${id}/trigger`);
    return res.data;
  },

  // Approvals
  getApprovals: async (): Promise<{ approvals: Approval[]; pendingCount: number }> => {
    const res = await api.get('/approvals');
    return res.data;
  },
  decideApproval: async (id: string, decision: 'APPROVED' | 'REJECTED' | 'MODIFIED', reason?: string) => {
    const res = await api.post(`/approvals/${id}/decide`, { decision, reason });
    return res.data;
  },

  // Documents
  uploadDocument: async (formData: FormData) => {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getDocuments: async () => {
    const res = await api.get('/documents');
    return res.data.documents;
  },

  // Tools & Integrations
  getTools: async () => {
    const res = await api.get('/tools');
    return res.data.tools;
  },
  getIntegrations: async () => {
    const res = await api.get('/integrations');
    return res.data.integrations;
  },
  getAuditLogs: async (params?: Record<string, any>) => {
    const res = await api.get('/audit-logs', { params });
    return res.data.logs;
  },
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },

  // Supabase Integration Services
  getSupabaseStatus: async () => {
    const res = await api.get('/supabase/status');
    return res.data;
  },
  testSupabase: async (payload: { supabaseUrl: string; supabaseAnonKey?: string; supabaseServiceRoleKey?: string; databaseUrl?: string }) => {
    const res = await api.post('/supabase/test', payload);
    return res.data;
  },
  connectSupabase: async (payload: { supabaseUrl: string; supabaseAnonKey?: string; supabaseServiceRoleKey?: string; databaseUrl?: string }) => {
    const res = await api.post('/supabase/connect', payload);
    return res.data;
  },
  syncSupabaseSeed: async () => {
    const res = await api.post('/supabase/sync-seed');
    return res.data;
  },
  getSupabaseMigrationSql: async () => {
    const res = await api.get('/supabase/migration-sql');
    return res.data.sql;
  },
};

export default api;
