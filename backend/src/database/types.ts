export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  business_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  type: 'RETAIL' | 'SUPERMARKET' | 'ECOMMERCE' | 'SME' | 'SERVICE' | 'DISTRIBUTOR' | 'STARTUP' | 'GENERAL';
  currency: string;
  address?: string;
  phone?: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  business_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating: number;
  lead_time_days: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  supplier_id?: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  reorder_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  business_id: string;
  product_id: string;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  reference_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'ACTIVE' | 'INACTIVE';
  total_spend: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  business_id: string;
  supplier_id: string;
  supplier_name?: string;
  order_number: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  notes?: string;
  created_by?: string;
  approved_by?: string;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  business_id: string;
  customer_id?: string;
  customer_name?: string;
  invoice_number: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  items?: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  business_id: string;
  category: 'OPERATIONAL' | 'PAYROLL' | 'UTILITIES' | 'MARKETING' | 'INVENTORY' | 'LOGISTICS' | 'SOFTWARE' | 'MISC';
  description: string;
  amount: number;
  date: string;
  payment_method: string;
  receipt_url?: string;
  created_at: string;
}

export interface Task {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  due_date?: string;
  created_by_agent?: string;
  created_at: string;
  updated_at: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AgentName = 'ORION' | 'ATLAS' | 'NOVA' | 'SAGE' | 'SENTINEL';

export interface AgentStep {
  id: string;
  run_id: string;
  step_index: number;
  agent_name: AgentName;
  description: string;
  tool_name?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';
  input?: any;
  output?: any;
  risk_level: RiskLevel;
  duration_ms: number;
  created_at: string;
}

export interface AgentMessage {
  id: string;
  run_id: string;
  sender_agent: AgentName;
  recipient_agent?: AgentName | 'USER';
  content: string;
  message_type: 'THOUGHT' | 'PLAN' | 'DELEGATION' | 'OBSERVATION' | 'CRITIQUE' | 'REPORT' | 'APPROVAL_REQUEST';
  metadata?: any;
  created_at: string;
}

export interface AgentRun {
  id: string;
  business_id: string;
  user_id?: string;
  goal: string;
  plan?: any;
  status: 'PLANNING' | 'EXECUTING' | 'WAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'STOPPED';
  current_agent: AgentName;
  results?: any;
  steps?: AgentStep[];
  messages?: AgentMessage[];
  created_at: string;
  updated_at: string;
}

export interface ToolExecution {
  id: string;
  run_id: string;
  step_id?: string;
  tool_name: string;
  input: any;
  output?: any;
  status: 'SUCCESS' | 'ERROR' | 'BLOCKED';
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

export interface Approval {
  id: string;
  business_id: string;
  run_id?: string;
  step_id?: string;
  requesting_agent: AgentName;
  action_type: string;
  description: string;
  risk_level: 'MEDIUM' | 'HIGH';
  payload: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  decision_reason?: string;
  decided_by?: string;
  decided_at?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  business_id: string;
  original_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  extracted_data?: any;
  status: 'UPLOADED' | 'ANALYZING' | 'EXTRACTED' | 'VERIFIED' | 'FAILED';
  created_at: string;
}

export interface Workflow {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  trigger_type: 'MANUAL' | 'SCHEDULED' | 'EVENT';
  trigger_config?: any;
  steps: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id?: string;
  agent_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  business_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'APPROVAL_REQUIRED';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface Integration {
  id: string;
  business_id: string;
  provider: 'GEMINI' | 'SUPABASE' | 'RESEND' | 'FRANKFURTER';
  status: 'CONNECTED' | 'DISCONNECTED' | 'DEMO_MODE';
  config?: any;
  updated_at: string;
}
