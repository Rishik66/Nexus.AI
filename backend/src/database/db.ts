import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import {
  User, Business, Supplier, Product, InventoryMovement, Customer,
  PurchaseOrder, PurchaseOrderItem, Invoice, InvoiceItem, Expense,
  Task, AgentRun, AgentStep, AgentMessage, ToolExecution, Approval,
  DocumentRecord, Workflow, AuditLog, Notification, Integration
} from './types.js';

interface DatabaseStore {
  users: User[];
  businesses: Business[];
  suppliers: Supplier[];
  products: Product[];
  inventory_movements: InventoryMovement[];
  customers: Customer[];
  purchase_orders: PurchaseOrder[];
  purchase_order_items: PurchaseOrderItem[];
  invoices: Invoice[];
  invoice_items: InvoiceItem[];
  expenses: Expense[];
  tasks: Task[];
  agent_runs: AgentRun[];
  agent_steps: AgentStep[];
  agent_messages: AgentMessage[];
  tool_executions: ToolExecution[];
  approvals: Approval[];
  documents: DocumentRecord[];
  workflows: Workflow[];
  audit_logs: AuditLog[];
  notifications: Notification[];
  integrations: Integration[];
}

const initialStore: DatabaseStore = {
  users: [],
  businesses: [],
  suppliers: [],
  products: [],
  inventory_movements: [],
  customers: [],
  purchase_orders: [],
  purchase_order_items: [],
  invoices: [],
  invoice_items: [],
  expenses: [],
  tasks: [],
  agent_runs: [],
  agent_steps: [],
  agent_messages: [],
  tool_executions: [],
  approvals: [],
  documents: [],
  workflows: [],
  audit_logs: [],
  notifications: [],
  integrations: [],
};

export class DatabaseService {
  private static instance: DatabaseService;
  private pgPool: Pool | null = null;
  private store: DatabaseStore = initialStore;
  private dataDir: string;
  private storeFilePath: string;
  private isPostgres: boolean = false;

  private constructor() {
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.SERVERLESS_BUNDLE);
    if (isServerless) {
      this.dataDir = path.join(os.tmpdir(), 'nexus_data');
    } else {
      this.dataDir = path.resolve(process.cwd(), 'data');
    }
    this.storeFilePath = path.join(this.dataDir, 'nexus_store.json');
    this.init();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private init() {
    // Check if DATABASE_URL or SUPABASE_URL is configured
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.startsWith('postgres')) {
      try {
        this.pgPool = new Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });
        this.isPostgres = true;
        console.log('[DATABASE] Connected to PostgreSQL / Supabase instance');
      } catch (err) {
        console.warn('[DATABASE] PostgreSQL connection failed, falling back to local persistent store', err);
        this.initLocalStore();
      }
    } else {
      this.initLocalStore();
    }
  }

  private initLocalStore() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (e) {
      console.warn('[DATABASE] Could not create dataDir:', this.dataDir, e);
    }

    // Try finding existing seed data from candidate locations
    const candidatePaths = [
      this.storeFilePath,
      path.resolve(process.cwd(), 'data', 'nexus_store.json'),
      path.resolve(process.cwd(), 'backend', 'data', 'nexus_store.json'),
      path.resolve(process.cwd(), '..', 'backend', 'data', 'nexus_store.json'),
    ];

    let loaded = false;
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            this.store = { ...initialStore, ...parsed };
            console.log('[DATABASE] Loaded persistent store from', p);
            loaded = true;
            break;
          }
        }
      } catch (err) {
        // continue to next candidate
      }
    }

    if (!loaded) {
      this.store = { ...initialStore };
      console.log('[DATABASE] Initialized in-memory store');
    }

    // Ensure all legacy users have a valid business_id assigned
    const defaultBiz = this.store.businesses.find(b => b.is_demo) || this.store.businesses[0];
    if (defaultBiz) {
      let usersMigrated = false;
      this.store.users.forEach(u => {
        if (!u.business_id) {
          u.business_id = defaultBiz.id;
          usersMigrated = true;
        }
      });
      if (usersMigrated) {
        this.persist();
      }
    }
  }

  public persist() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.storeFilePath, JSON.stringify(this.store, null, 2), 'utf-8');
    } catch (err) {
      // In-memory store continues functioning even if disk writes fail in constrained environments
      console.warn('[DATABASE] Persistent write to disk skipped/failed:', err);
    }
  }

  public isUsingPostgres(): boolean {
    return this.isPostgres;
  }

  // --- Generic accessors ---
  public getStore(): DatabaseStore {
    return this.store;
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.store.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.store.users.find(u => u.id === id);
  }

  public createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...user,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.users.push(newUser);
    this.persist();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const userIndex = this.store.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    this.store.users[userIndex] = {
      ...this.store.users[userIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.users[userIndex];
  }

  private otpMap: Map<string, { otp: string; expiresAt: number }> = new Map();

  public saveOtp(email: string, otp: string, ttlMinutes: number = 15): void {
    const key = email.toLowerCase().trim();
    this.otpMap.set(key, {
      otp: otp.trim(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    });
  }

  public verifyOtp(email: string, otp: string): boolean {
    const key = email.toLowerCase().trim();
    const entry = this.otpMap.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.otpMap.delete(key);
      return false;
    }
    return entry.otp === otp.trim();
  }

  public clearOtp(email: string): void {
    const key = email.toLowerCase().trim();
    this.otpMap.delete(key);
  }

  // --- Businesses ---
  public getBusinesses(): Business[] {
    return this.store.businesses;
  }

  public getBusinessById(id: string): Business | undefined {
    return this.store.businesses.find(b => b.id === id);
  }

  public getDemoBusiness(): Business | undefined {
    return this.store.businesses.find(b => b.is_demo) || this.store.businesses[0];
  }

  public createBusiness(b: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Business {
    const newBiz: Business = {
      ...b,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.businesses.push(newBiz);
    this.persist();
    return newBiz;
  }

  public updateBusiness(id: string, updates: Partial<Business>): Business | undefined {
    const idx = this.store.businesses.findIndex(b => b.id === id);
    if (idx === -1) {
      // If business does not exist yet in memory store, create it
      const newBiz: Business = {
        id,
        name: updates.name || 'Enterprise Organization',
        type: updates.type || 'TECHNOLOGY',
        currency: updates.currency || 'USD',
        address: updates.address,
        phone: updates.phone,
        is_demo: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.store.businesses.push(newBiz);
      this.persist();
      return newBiz;
    }
    this.store.businesses[idx] = {
      ...this.store.businesses[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.businesses[idx];
  }

  // --- Products ---
  public getProducts(businessId: string): Product[] {
    return this.store.products.filter(p => p.business_id === businessId);
  }

  public getProductById(id: string): Product | undefined {
    return this.store.products.find(p => p.id === id);
  }

  public getLowStockProducts(businessId: string): Product[] {
    return this.store.products.filter(p => p.business_id === businessId && p.stock_quantity <= p.reorder_threshold);
  }

  public createProduct(p: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const newProduct: Product = {
      ...p,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.products.push(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const idx = this.store.products.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.store.products[idx] = {
      ...this.store.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.products[idx];
  }

  // --- Inventory Movements ---
  public recordInventoryMovement(m: Omit<InventoryMovement, 'id' | 'created_at'>): InventoryMovement {
    const movement: InventoryMovement = {
      ...m,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.inventory_movements.push(movement);
    this.persist();
    return movement;
  }

  public getInventoryMovements(businessId: string, limit: number = 20): InventoryMovement[] {
    return this.store.inventory_movements
      .filter(m => m.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // --- Suppliers ---
  public getSuppliers(businessId: string): Supplier[] {
    return this.store.suppliers.filter(s => s.business_id === businessId);
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.store.suppliers.find(s => s.id === id);
  }

  public createSupplier(s: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Supplier {
    const newSupplier: Supplier = {
      ...s,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.suppliers.push(newSupplier);
    this.persist();
    return newSupplier;
  }

  // --- Customers ---
  public getCustomers(businessId: string): Customer[] {
    return this.store.customers.filter(c => c.business_id === businessId);
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.store.customers.find(c => c.id === id);
  }

  public createCustomer(c: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer {
    const newCustomer: Customer = {
      ...c,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.customers.push(newCustomer);
    this.persist();
    return newCustomer;
  }

  // --- Purchase Orders ---
  public getPurchaseOrders(businessId: string): PurchaseOrder[] {
    const orders = this.store.purchase_orders.filter(po => po.business_id === businessId);
    return orders.map(po => {
      const items = this.store.purchase_order_items.filter(poi => poi.purchase_order_id === po.id);
      const supplier = this.store.suppliers.find(s => s.id === po.supplier_id);
      return {
        ...po,
        items,
        supplier_name: supplier?.name,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createPurchaseOrder(
    po: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>,
    items: Array<Omit<PurchaseOrderItem, 'id' | 'purchase_order_id' | 'created_at'>> = []
  ): PurchaseOrder {
    const id = uuidv4();
    const newPo: PurchaseOrder = {
      ...po,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.purchase_orders.push(newPo);

    for (const item of items) {
      const product = this.store.products.find(p => p.id === item.product_id);
      this.store.purchase_order_items.push({
        ...item,
        id: uuidv4(),
        purchase_order_id: id,
        product_name: product?.name,
        sku: product?.sku,
        created_at: new Date().toISOString(),
      });
    }

    this.persist();
    return {
      ...newPo,
      items: this.store.purchase_order_items.filter(poi => poi.purchase_order_id === id),
    };
  }

  public updatePurchaseOrderStatus(id: string, status: PurchaseOrder['status'], approvedBy?: string): PurchaseOrder | undefined {
    const idx = this.store.purchase_orders.findIndex(po => po.id === id);
    if (idx === -1) return undefined;
    this.store.purchase_orders[idx] = {
      ...this.store.purchase_orders[idx],
      status,
      approved_by: approvedBy || this.store.purchase_orders[idx].approved_by,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.purchase_orders[idx];
  }

  // --- Invoices ---
  public getInvoices(businessId: string): Invoice[] {
    const invoices = this.store.invoices.filter(inv => inv.business_id === businessId);
    return invoices.map(inv => {
      const items = this.store.invoice_items.filter(ii => ii.invoice_id === inv.id);
      const customer = this.store.customers.find(c => c.id === inv.customer_id);
      return {
        ...inv,
        items,
        customer_name: customer?.name,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOverdueInvoices(businessId: string): Invoice[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getInvoices(businessId).filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.due_date < today);
  }

  public createInvoice(
    inv: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
    items: Array<Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>> = []
  ): Invoice {
    const id = uuidv4();
    const newInv: Invoice = {
      ...inv,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.invoices.push(newInv);

    for (const item of items) {
      this.store.invoice_items.push({
        ...item,
        id: uuidv4(),
        invoice_id: id,
        created_at: new Date().toISOString(),
      });
    }

    this.persist();
    return {
      ...newInv,
      items: this.store.invoice_items.filter(ii => ii.invoice_id === id),
    };
  }

  public updateInvoiceStatus(id: string, status: Invoice['status']): Invoice | undefined {
    const idx = this.store.invoices.findIndex(inv => inv.id === id);
    if (idx === -1) return undefined;
    this.store.invoices[idx] = {
      ...this.store.invoices[idx],
      status,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.invoices[idx];
  }

  // --- Expenses ---
  public getExpenses(businessId: string): Expense[] {
    return this.store.expenses
      .filter(e => e.business_id === businessId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public createExpense(exp: Omit<Expense, 'id' | 'created_at'>): Expense {
    const newExpense: Expense = {
      ...exp,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.expenses.push(newExpense);
    this.persist();
    return newExpense;
  }

  // --- Tasks ---
  public getTasks(businessId: string): Task[] {
    return this.store.tasks
      .filter(t => t.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createTask(t: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
    const newTask: Task = {
      ...t,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.tasks.push(newTask);
    this.persist();
    return newTask;
  }

  public updateTaskStatus(id: string, status: Task['status']): Task | undefined {
    const idx = this.store.tasks.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    this.store.tasks[idx] = {
      ...this.store.tasks[idx],
      status,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.tasks[idx];
  }

  // --- Agent Runs & Trace ---
  public createAgentRun(run: Omit<AgentRun, 'id' | 'created_at' | 'updated_at'>): AgentRun {
    const newRun: AgentRun = {
      ...run,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.agent_runs.push(newRun);
    this.persist();
    return newRun;
  }

  public getAgentRunById(id: string): AgentRun | undefined {
    const run = this.store.agent_runs.find(r => r.id === id);
    if (!run) return undefined;
    const steps = this.store.agent_steps.filter(s => s.run_id === id).sort((a, b) => a.step_index - b.step_index);
    const messages = this.store.agent_messages.filter(m => m.run_id === id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return {
      ...run,
      steps,
      messages,
    };
  }

  public getAgentRuns(businessId: string, limit: number = 20): AgentRun[] {
    return this.store.agent_runs
      .filter(r => r.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  public updateAgentRun(id: string, updates: Partial<AgentRun>): AgentRun | undefined {
    const idx = this.store.agent_runs.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.store.agent_runs[idx] = {
      ...this.store.agent_runs[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.agent_runs[idx];
  }

  public addAgentStep(step: Omit<AgentStep, 'id' | 'created_at'>): AgentStep {
    const newStep: AgentStep = {
      ...step,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.agent_steps.push(newStep);
    this.persist();
    return newStep;
  }

  public updateAgentStep(id: string, updates: Partial<AgentStep>): AgentStep | undefined {
    const idx = this.store.agent_steps.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.store.agent_steps[idx] = {
      ...this.store.agent_steps[idx],
      ...updates,
    };
    this.persist();
    return this.store.agent_steps[idx];
  }

  public addAgentMessage(msg: Omit<AgentMessage, 'id' | 'created_at'>): AgentMessage {
    const newMsg: AgentMessage = {
      ...msg,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.agent_messages.push(newMsg);
    this.persist();
    return newMsg;
  }

  public recordToolExecution(exec: Omit<ToolExecution, 'id' | 'created_at'>): ToolExecution {
    const newExec: ToolExecution = {
      ...exec,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.tool_executions.push(newExec);
    this.persist();
    return newExec;
  }

  public getToolExecutions(runId?: string): ToolExecution[] {
    if (runId) {
      return this.store.tool_executions.filter(te => te.run_id === runId);
    }
    return this.store.tool_executions.slice(-50).reverse();
  }

  // --- Approvals ---
  public createApproval(appr: Omit<Approval, 'id' | 'created_at'>): Approval {
    const newAppr: Approval = {
      ...appr,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.approvals.push(newAppr);
    this.persist();
    return newAppr;
  }

  public getApprovals(businessId: string): Approval[] {
    return this.store.approvals
      .filter(a => a.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getPendingApprovals(businessId: string): Approval[] {
    return this.store.approvals.filter(a => a.business_id === businessId && a.status === 'PENDING');
  }

  public updateApproval(id: string, status: Approval['status'], reason?: string, decidedBy?: string): Approval | undefined {
    const idx = this.store.approvals.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    this.store.approvals[idx] = {
      ...this.store.approvals[idx],
      status,
      decision_reason: reason,
      decided_by: decidedBy || 'User',
      decided_at: new Date().toISOString(),
    };
    this.persist();
    return this.store.approvals[idx];
  }

  // --- Documents ---
  public createDocument(doc: Omit<DocumentRecord, 'id' | 'created_at'>): DocumentRecord {
    const newDoc: DocumentRecord = {
      ...doc,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.documents.push(newDoc);
    this.persist();
    return newDoc;
  }

  public getDocuments(businessId: string): DocumentRecord[] {
    return this.store.documents
      .filter(d => d.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getDocumentById(id: string): DocumentRecord | undefined {
    return this.store.documents.find(d => d.id === id);
  }

  public updateDocument(id: string, updates: Partial<DocumentRecord>): DocumentRecord | undefined {
    const idx = this.store.documents.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.store.documents[idx] = {
      ...this.store.documents[idx],
      ...updates,
    };
    this.persist();
    return this.store.documents[idx];
  }

  // --- Workflows ---
  public getWorkflows(businessId: string): Workflow[] {
    return this.store.workflows.filter(w => w.business_id === businessId);
  }

  public createWorkflow(wf: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Workflow {
    const newWf: Workflow = {
      ...wf,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.store.workflows.push(newWf);
    this.persist();
    return newWf;
  }

  // --- Audit Logs ---
  public logAudit(entry: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const log: AuditLog = {
      ...entry,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.audit_logs.push(log);
    this.persist();
    return log;
  }

  public getAuditLogs(businessId: string, limit: number = 100): AuditLog[] {
    return this.store.audit_logs
      .filter(l => l.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // --- Notifications ---
  public createNotification(notif: Omit<Notification, 'id' | 'created_at'>): Notification {
    const newNotif: Notification = {
      ...notif,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    this.store.notifications.push(newNotif);
    this.persist();
    return newNotif;
  }

  public getNotifications(businessId: string): Notification[] {
    return this.store.notifications
      .filter(n => n.business_id === businessId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.store.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.is_read = true;
    this.persist();
    return true;
  }

  // --- Integrations ---
  public getIntegrations(businessId: string): Integration[] {
    return this.store.integrations.filter(i => i.business_id === businessId);
  }

  public setIntegration(businessId: string, provider: Integration['provider'], status: Integration['status'], config?: any): Integration {
    const idx = this.store.integrations.findIndex(i => i.business_id === businessId && i.provider === provider);
    const updated: Integration = {
      id: idx >= 0 ? this.store.integrations[idx].id : uuidv4(),
      business_id: businessId,
      provider,
      status,
      config: config || {},
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      this.store.integrations[idx] = updated;
    } else {
      this.store.integrations.push(updated);
    }
    this.persist();
    return updated;
  }
}

export const db = DatabaseService.getInstance();
