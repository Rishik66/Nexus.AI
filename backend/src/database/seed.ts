import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function seedDatabase() {
  console.log('[SEED] Seeding database with realistic enterprise business operations data...');

  const store = db.getStore();
  // Clear existing demo data to ensure a fresh, consistent state
  store.users = [];
  store.businesses = [];
  store.suppliers = [];
  store.products = [];
  store.inventory_movements = [];
  store.customers = [];
  store.purchase_orders = [];
  store.purchase_order_items = [];
  store.invoices = [];
  store.invoice_items = [];
  store.expenses = [];
  store.tasks = [];
  store.agent_runs = [];
  store.agent_steps = [];
  store.agent_messages = [];
  store.tool_executions = [];
  store.approvals = [];
  store.documents = [];
  store.workflows = [];
  store.audit_logs = [];
  store.notifications = [];
  store.integrations = [];

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('nexus123', salt);

  // 1. Create Users
  const adminUser = db.createUser({
    email: 'admin@nexus.ai',
    password_hash: passwordHash,
    full_name: 'Alexandra Vance (Lead Architect)',
    role: 'ADMIN',
  });

  const managerUser = db.createUser({
    email: 'manager@nexus.ai',
    password_hash: passwordHash,
    full_name: 'Marcus Brody (Operations Manager)',
    role: 'MANAGER',
  });

  const employeeUser = db.createUser({
    email: 'employee@nexus.ai',
    password_hash: passwordHash,
    full_name: 'Elena Rostova (Infrastructure Specialist)',
    role: 'EMPLOYEE',
  });

  // 2. Create Enterprise Business (Consulting / Cloud / Technology Services)
  const demoBiz = db.createBusiness({
    name: 'Apex Global Technologies & Enterprise Solutions',
    type: 'SERVICE',
    currency: 'USD',
    address: '450 Innovation Parkway, Suite 800, Silicon Valley, CA 94025',
    phone: '+1 (555) 839-2041',
    is_demo: true,
  });

  // 3. Create Technology Vendors & Infrastructure Partners
  const supCloud = db.createSupplier({
    business_id: demoBiz.id,
    name: 'CloudScale Infrastructure Partners',
    contact_person: 'David Chen',
    email: 'procurement@cloudscaleglobal.com',
    phone: '+1 (555) 234-8891',
    address: '100 Silicon Way, San Jose, CA',
    rating: 4.9,
    lead_time_days: 1,
  });

  const supSecurity = db.createSupplier({
    business_id: demoBiz.id,
    name: 'CyberShield Systems & Networks',
    contact_person: 'Sarah Miller',
    email: 'enterprise@cybershield.com',
    phone: '+1 (555) 892-1144',
    address: '74 Cyber Parkway, Austin, TX',
    rating: 4.8,
    lead_time_days: 2,
  });

  const supHardware = db.createSupplier({
    business_id: demoBiz.id,
    name: 'Enterprise Workstations & Hardware Ltd',
    contact_person: 'Robert Kim',
    email: 'hardware@techworkstations.com',
    phone: '+1 (555) 471-9920',
    address: '88 Foundry St, Detroit, MI',
    rating: 4.6,
    lead_time_days: 4,
  });

  const supSaaS = db.createSupplier({
    business_id: demoBiz.id,
    name: 'Global SaaS & Cloud Licensing Direct',
    contact_person: 'Amanda Cruz',
    email: 'licensing@globalsaas.com',
    phone: '+1 (555) 332-7711',
    address: '12 Innovation Park, Chicago, IL',
    rating: 4.7,
    lead_time_days: 1,
  });

  // 4. Create Operational IT Assets & Equipment
  const p1 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supHardware.id,
    sku: 'WS-PRO-M3',
    name: 'Developer Workstation Ultra (M3/64GB)',
    category: 'Hardware Infrastructure',
    description: 'High-performance engineering workstation for deployment pipelines.',
    unit_price: 2899.00,
    cost_price: 1950.00,
    stock_quantity: 3, // LOW ASSETS (Threshold 10)
    reorder_threshold: 10,
  });

  const p2 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supSecurity.id,
    sku: 'FW-ENT-500',
    name: 'Next-Gen Enterprise Security Gateway Firewall',
    category: 'Security & Networks',
    description: 'Hardware firewall appliances with zero-trust packet inspection.',
    unit_price: 1850.00,
    cost_price: 1100.00,
    stock_quantity: 4, // LOW ASSETS (Threshold 12)
    reorder_threshold: 12,
  });

  const p3 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supCloud.id,
    sku: 'SRV-NODE-DED',
    name: 'Dedicated Private Cloud Server Node (64 Core)',
    category: 'Cloud Infrastructure',
    description: 'Enterprise virtualization hypervisor compute node.',
    unit_price: 3400.00,
    cost_price: 2200.00,
    stock_quantity: 2, // LOW ASSETS (Threshold 8)
    reorder_threshold: 8,
  });

  const p4 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supHardware.id,
    sku: 'MON-4K-ULTRA',
    name: '4K Ultra-Wide Curved Conferencing Monitor (38-inch)',
    category: 'Hardware Infrastructure',
    description: 'Executive video conferencing and development display units.',
    unit_price: 899.00,
    cost_price: 520.00,
    stock_quantity: 5, // LOW ASSETS (Threshold 15)
    reorder_threshold: 15,
  });

  const p5 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supSaaS.id,
    sku: 'LIC-ENT-DEV',
    name: 'Enterprise Cloud IDE & AI Gateway Seat Licenses (50 Pack)',
    category: 'Software & SaaS',
    description: 'Annual enterprise multi-seat cloud developer licenses.',
    unit_price: 4500.00,
    cost_price: 3200.00,
    stock_quantity: 28, // Healthy
    reorder_threshold: 10,
  });

  const p6 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supSecurity.id,
    sku: 'SW-MGMT-48',
    name: '48-Port Managed Gigabit PoE+ Layer 3 Switch',
    category: 'Security & Networks',
    description: 'High-throughput rackmount distribution switch for server clusters.',
    unit_price: 950.00,
    cost_price: 580.00,
    stock_quantity: 22, // Healthy
    reorder_threshold: 6,
  });

  const p7 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supHardware.id,
    sku: 'UPS-3000-IND',
    name: 'Smart 3000VA Enterprise Rackmount UPS Power Backup',
    category: 'Hardware Infrastructure',
    description: 'Pure sine-wave emergency power protection for server racks.',
    unit_price: 1250.00,
    cost_price: 780.00,
    stock_quantity: 16, // Healthy
    reorder_threshold: 5,
  });

  // Record asset allocation movement
  db.recordInventoryMovement({
    business_id: demoBiz.id,
    product_id: p1.id,
    type: 'SALE',
    quantity: -6,
    previous_quantity: 9,
    new_quantity: 3,
    reason: 'Deployed to new client engineering team (FinTech Horizons Project)',
    reference_id: 'ALLOC-2026-88',
  });

  // 5. Create Enterprise Clients
  const c1 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'FinTech Horizons Global Inc.',
    email: 'accounts@fintechhorizons.com',
    phone: '+1 (555) 711-2099',
    company: 'FinTech Horizons Financial',
    status: 'ACTIVE',
    total_spend: 84200.00,
  });

  const c2 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'MedTech Systems & BioResearch',
    email: 'billing@medtechsystems.org',
    phone: '+1 (555) 882-9011',
    company: 'MedTech Diagnostics',
    status: 'ACTIVE',
    total_spend: 48450.00,
  });

  const c3 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'HyperScale Logistics Group',
    email: 'finance@hyperscalelogistics.com',
    phone: '+1 (555) 663-1288',
    company: 'HyperScale Global Freight',
    status: 'ACTIVE',
    total_spend: 62100.00,
  });

  const c4 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'Urban Media & Digital Interactive',
    email: 'procurement@urbanmedia.io',
    phone: '+1 (555) 991-4402',
    company: 'Urban Media Digital',
    status: 'ACTIVE',
    total_spend: 29400.00,
  });

  // 6. Create Client Invoices (Paid vs Overdue for NOVA to analyze)
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c1.id,
    invoice_number: 'INV-2026-001',
    status: 'PAID',
    issue_date: '2026-10-01',
    due_date: '2026-10-31',
    subtotal: 18500.00,
    tax_amount: 1480.00,
    total_amount: 19980.00,
    notes: 'Q4 Enterprise Cloud Architecture Retainer',
  });

  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c2.id,
    invoice_number: 'INV-2026-002',
    status: 'PAID',
    issue_date: '2026-10-15',
    due_date: '2026-11-14',
    subtotal: 12200.00,
    tax_amount: 976.00,
    total_amount: 13176.00,
    notes: 'Biosecurity Data Pipeline Implementation',
  });

  // OVERDUE CLIENT INVOICE 1
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c3.id,
    invoice_number: 'INV-2026-004',
    status: 'OVERDUE',
    issue_date: '2026-10-20',
    due_date: '2026-11-10', // 15 days overdue
    subtotal: 9500.00,
    tax_amount: 760.00,
    total_amount: 10260.00,
    notes: 'Custom ERP Logistics Automation Delivery',
  });

  // OVERDUE CLIENT INVOICE 2
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c4.id,
    invoice_number: 'INV-2026-007',
    status: 'OVERDUE',
    issue_date: '2026-10-28',
    due_date: '2026-11-18', // 7 days overdue
    subtotal: 4800.00,
    tax_amount: 384.00,
    total_amount: 5184.00,
    notes: 'Digital Platform Performance Optimization Retainer',
  });

  // PENDING CLIENT INVOICE
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c1.id,
    invoice_number: 'INV-2026-010',
    status: 'ISSUED',
    issue_date: '2026-11-15',
    due_date: '2026-12-15',
    subtotal: 6500.00,
    tax_amount: 520.00,
    total_amount: 7020.00,
    notes: 'Dedicated Cloud Compute Hypervisor Provisioning',
  });

  // 7. Create Operating Expenses (with deliberate anomalous spike in Software Licensing for NOVA to detect!)
  const expensesList = [
    { category: 'OPERATIONAL', description: 'Headquarters Facility Lease & Utilities', amount: 5800.00, date: '2026-11-01', payment_method: 'ACH_TRANSFER' },
    { category: 'PAYROLL', description: 'Engineering & Operations Team Payroll', amount: 14500.00, date: '2026-11-05', payment_method: 'DIRECT_DEPOSIT' },
    { category: 'UTILITIES', description: 'Data Center High-Capacity Power & Cooling', amount: 1850.00, date: '2026-11-08', payment_method: 'CREDIT_CARD' },
    // ANOMALOUS EXPENSE: Sudden unbudgeted SaaS seat overage
    { category: 'SOFTWARE', description: 'Enterprise Cloud Hyperscaler Emergency Over-Quota Surcharge (Anomalous Surge)', amount: 6250.00, date: '2026-11-18', payment_method: 'WIRE_TRANSFER' },
    { category: 'SOFTWARE', description: 'Standard ERP & Development Tool SaaS Licenses', amount: 1200.00, date: '2026-11-10', payment_method: 'CREDIT_CARD' },
    { category: 'MARKETING', description: 'B2B Tech Solutions Demand Generation', amount: 2100.00, date: '2026-11-12', payment_method: 'CREDIT_CARD' },
    { category: 'LOGISTICS', description: 'Hardware Courier & Dedicated White-Glove Dispatch', amount: 850.00, date: '2026-11-14', payment_method: 'ACH_TRANSFER' },
    { category: 'MISC', description: 'SOC2 Type II Annual Compliance Audit Retainer', amount: 1500.00, date: '2026-11-16', payment_method: 'CREDIT_CARD' },
  ];

  for (const exp of expensesList) {
    db.createExpense({
      business_id: demoBiz.id,
      category: exp.category as any,
      description: exp.description,
      amount: exp.amount,
      date: exp.date,
      payment_method: exp.payment_method,
    });
  }

  // 8. Create Tasks
  db.createTask({
    business_id: demoBiz.id,
    title: 'Audit Hardware Assets & Procure Engineering Workstations',
    description: 'Reconcile developer workstation inventory (WS-PRO-M3) and prepare procurement draft with Enterprise Workstations Ltd.',
    assigned_to: 'Elena Rostova',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    due_date: '2026-11-28',
    created_by_agent: 'ATLAS',
  });

  db.createTask({
    business_id: demoBiz.id,
    title: 'Follow Up Overdue Client Invoice INV-2026-004 ($10,260.00)',
    description: 'Contact HyperScale Logistics regarding past-due payment for ERP custom automation delivery.',
    assigned_to: 'Marcus Brody',
    priority: 'HIGH',
    status: 'PENDING',
    due_date: '2026-11-26',
    created_by_agent: 'NOVA',
  });

  db.createTask({
    business_id: demoBiz.id,
    title: 'Investigate $6,250 Cloud Hyperscaler Surcharge Spike',
    description: 'Review compute quota utilization logs from Nov 18 to isolate unbudgeted cluster scaling.',
    assigned_to: 'Alexandra Vance',
    priority: 'MEDIUM',
    status: 'PENDING',
    due_date: '2026-11-30',
    created_by_agent: 'SENTINEL',
  });

  // 9. Create Workflows
  db.createWorkflow({
    business_id: demoBiz.id,
    name: 'Autonomous Infrastructure Asset & Procurement Audit',
    description: 'Audits physical and cloud infrastructure assets against operational minimums, prepares vendor procurement drafts, and enforces human manager approval gates.',
    trigger_type: 'SCHEDULED',
    trigger_config: { frequency: 'DAILY', time: '08:00 AM' },
    steps: [
      { agent: 'ORION', action: 'Initialize infrastructure audit' },
      { agent: 'ATLAS', action: 'Scan hardware & cloud assets via DATABASE_SEARCH' },
      { agent: 'ATLAS', action: 'Calculate replenishment units via BUSINESS_CALCULATOR' },
      { agent: 'SENTINEL', action: 'Verify risk level and mandate human authorization for PO draft' },
      { agent: 'ATLAS', action: 'Stage vendor procurement order' },
    ],
    is_active: true,
  });

  db.createWorkflow({
    business_id: demoBiz.id,
    name: 'Enterprise Financial Health & Budget Leakage Audit',
    description: 'Analyzes revenue vs expenses, audits accounts receivable aging, detects SaaS and cloud overage spikes, and calculates the holistic Business Health Score.',
    trigger_type: 'SCHEDULED',
    trigger_config: { frequency: 'WEEKLY', day: 'MONDAY' },
    steps: [
      { agent: 'ORION', action: 'Decompose fiscal audit goal' },
      { agent: 'NOVA', action: 'Retrieve client invoices and expenses via DATABASE_SEARCH' },
      { agent: 'NOVA', action: 'Detect spending anomalies and calculate cash-flow impact' },
      { agent: 'SENTINEL', action: 'Audit calculation sanity and validate claims' },
      { agent: 'SAGE', action: 'Synthesize actionable enterprise recommendations' },
    ],
    is_active: true,
  });

  db.createWorkflow({
    business_id: demoBiz.id,
    name: 'Multimodal Statement & Contract Document Intake',
    description: 'Extracts vendor contracts, statements, or invoices, verifies vendor credentials against database records, checks arithmetic, and drafts verified entries.',
    trigger_type: 'EVENT',
    trigger_config: { event: 'DOCUMENT_UPLOADED' },
    steps: [
      { agent: 'SAGE', action: 'Analyze document with DOCUMENT_ANALYSIS' },
      { agent: 'SENTINEL', action: 'Present extracted form for user verification' },
      { agent: 'ATLAS', action: 'Cross-reference vendor records via DATABASE_SEARCH' },
      { agent: 'NOVA', action: 'Verify totals with BUSINESS_CALCULATOR' },
      { agent: 'ORION', action: 'Register record into enterprise database' },
    ],
    is_active: true,
  });

  // 10. Integrations Status
  db.setIntegration(demoBiz.id, 'GEMINI', process.env.GEMINI_API_KEY ? 'CONNECTED' : 'DEMO_MODE', {
    model: 'gemini-1.5-pro',
    features: ['Native Function Calling', 'Multimodal Vision Extraction', 'Plan Generation'],
  });
  db.setIntegration(demoBiz.id, 'SUPABASE', process.env.DATABASE_URL ? 'CONNECTED' : 'DEMO_MODE', {
    engine: process.env.DATABASE_URL ? 'PostgreSQL (Supabase Cloud)' : 'High-Performance Local Relational Store (Supabase-Compatible)',
  });
  db.setIntegration(demoBiz.id, 'RESEND', process.env.RESEND_API_KEY ? 'CONNECTED' : 'DEMO_MODE', {
    status: process.env.RESEND_API_KEY ? 'Active' : 'Simulated Sandbox Dispatch (Ready for API Key)',
  });
  db.setIntegration(demoBiz.id, 'FRANKFURTER', 'CONNECTED', {
    endpoint: 'https://api.frankfurter.app',
    status: 'Live Real-Time Forex API',
  });

  // 11. Initial Audit Logs
  db.logAudit({
    business_id: demoBiz.id,
    user_id: adminUser.id,
    agent_name: 'SYSTEM',
    action: 'SYSTEM_INITIALIZATION',
    entity_type: 'PLATFORM',
    entity_id: 'NEXUS-V1',
    details: { message: 'NEXUS AI enterprise operations platform initialized.' },
  });

  db.persist();
  console.log('[SEED] Enterprise database seeding complete! Admin: admin@nexus.ai / nexus123');
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().catch(console.error);
}
