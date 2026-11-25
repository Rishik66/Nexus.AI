import bcrypt from 'bcryptjs';
import { db } from './db.js';

export async function seedDatabase() {
  console.log('[SEED] Seeding database with realistic demo business data...');

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
    full_name: 'Elena Rostova (Inventory Specialist)',
    role: 'EMPLOYEE',
  });

  // 2. Create Demo Business
  const demoBiz = db.createBusiness({
    name: 'Apex Retail & Distribution Co.',
    type: 'DISTRIBUTOR',
    currency: 'USD',
    address: '450 Innovation Parkway, Suite 800, Silicon Valley, CA 94025',
    phone: '+1 (555) 839-2041',
    is_demo: true,
  });

  // 3. Create Suppliers
  const supTech = db.createSupplier({
    business_id: demoBiz.id,
    name: 'TechSupply Global',
    contact_person: 'David Chen',
    email: 'orders@techsupplyglobal.com',
    phone: '+1 (555) 234-8891',
    address: '100 Silicon Way, San Jose, CA',
    rating: 4.8,
    lead_time_days: 2,
  });

  const supPackaging = db.createSupplier({
    business_id: demoBiz.id,
    name: 'EcoPackaging Solutions',
    contact_person: 'Sarah Miller',
    email: 'support@ecopackaging.com',
    phone: '+1 (555) 892-1144',
    address: '74 Industrial Blvd, Portland, OR',
    rating: 4.6,
    lead_time_days: 4,
  });

  const supHardware = db.createSupplier({
    business_id: demoBiz.id,
    name: 'Precision Hardware Ltd',
    contact_person: 'Robert Kim',
    email: 'sales@precisionhardware.com',
    phone: '+1 (555) 471-9920',
    address: '88 Foundry St, Detroit, MI',
    rating: 4.4,
    lead_time_days: 5,
  });

  const supOffice = db.createSupplier({
    business_id: demoBiz.id,
    name: 'OfficePro Direct',
    contact_person: 'Amanda Cruz',
    email: 'b2b@officeprodirect.com',
    phone: '+1 (555) 332-7711',
    address: '12 Logistics Park, Chicago, IL',
    rating: 4.7,
    lead_time_days: 3,
  });

  // 4. Create Products (including deliberate low stock items for ATLAS to detect!)
  const p1 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supTech.id,
    sku: 'WBS-200',
    name: 'Wireless Barcode Scanner Pro',
    category: 'Electronics',
    description: 'High-speed 2D handheld wireless barcode scanner with Bluetooth base.',
    unit_price: 189.99,
    cost_price: 95.00,
    stock_quantity: 4, // LOW STOCK (Threshold 15)
    reorder_threshold: 15,
  });

  const p2 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supOffice.id,
    sku: 'TRP-80M',
    name: 'Thermal POS Receipt Paper (80mm x 50 Rolls)',
    category: 'Office Supplies',
    description: 'Premium BPA-free thermal paper rolls for POS printers.',
    unit_price: 49.50,
    cost_price: 22.00,
    stock_quantity: 6, // LOW STOCK (Threshold 25)
    reorder_threshold: 25,
  });

  const p3 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supPackaging.id,
    sku: 'IHT-500',
    name: 'Heavy-Duty Industrial Packing Tape (6 Pack)',
    category: 'Packaging',
    description: 'Commercial grade shipping and carton sealing tape.',
    unit_price: 34.00,
    cost_price: 14.50,
    stock_quantity: 8, // LOW STOCK (Threshold 30)
    reorder_threshold: 30,
  });

  const p4 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supHardware.id,
    sku: 'EMA-101',
    name: 'Ergonomic Gas-Spring Monitor Arm',
    category: 'Hardware',
    description: 'Full motion dual monitor desk mount for warehouse checkouts.',
    unit_price: 129.00,
    cost_price: 68.00,
    stock_quantity: 3, // LOW STOCK (Threshold 10)
    reorder_threshold: 10,
  });

  const p5 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supTech.id,
    sku: 'POS-900',
    name: 'Smart Android POS Terminal Elite',
    category: 'Electronics',
    description: '10-inch touchscreen smart point-of-sale terminal with integrated printer.',
    unit_price: 649.00,
    cost_price: 380.00,
    stock_quantity: 24, // Healthy
    reorder_threshold: 8,
  });

  const p6 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supPackaging.id,
    sku: 'PME-100',
    name: 'Self-Seal Poly Mailers 10x13 (Pack of 500)',
    category: 'Packaging',
    description: 'Waterproof tear-resistant mailers for e-commerce shipments.',
    unit_price: 75.00,
    cost_price: 35.00,
    stock_quantity: 320, // Healthy
    reorder_threshold: 80,
  });

  const p7 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supPackaging.id,
    sku: 'CSB-M1',
    name: 'Corrugated Shipping Boxes Medium (25 Pack)',
    category: 'Packaging',
    description: 'Heavy duty 14x14x12 corrugated cardboard boxes.',
    unit_price: 62.50,
    cost_price: 28.00,
    stock_quantity: 180, // Healthy
    reorder_threshold: 40,
  });

  const p8 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supTech.id,
    sku: 'BLP-400',
    name: 'Direct Thermal Shipping Label Printer',
    category: 'Electronics',
    description: '4x6 commercial shipping label printer with USB and Ethernet.',
    unit_price: 219.00,
    cost_price: 110.00,
    stock_quantity: 18, // Healthy
    reorder_threshold: 5,
  });

  const p9 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supOffice.id,
    sku: 'LBL-406',
    name: 'Fanfold 4x6 Direct Thermal Labels (4000 Labels)',
    category: 'Office Supplies',
    description: 'Standard perforated shipping barcode labels.',
    unit_price: 58.00,
    cost_price: 24.00,
    stock_quantity: 75, // Healthy
    reorder_threshold: 20,
  });

  const p10 = db.createProduct({
    business_id: demoBiz.id,
    supplier_id: supTech.id,
    sku: 'UCH-701',
    name: 'Industrial 7-Port USB 3.0 Powered Hub',
    category: 'Electronics',
    description: 'Rugged metal chassis USB hub for distribution workstations.',
    unit_price: 89.00,
    cost_price: 42.00,
    stock_quantity: 42, // Healthy
    reorder_threshold: 12,
  });

  // Record historical inventory movements
  db.recordInventoryMovement({
    business_id: demoBiz.id,
    product_id: p1.id,
    type: 'SALE',
    quantity: -10,
    previous_quantity: 14,
    new_quantity: 4,
    reason: 'Customer bulk order fulfilled (MegaMart Superstores)',
    reference_id: 'SO-9921',
  });

  db.recordInventoryMovement({
    business_id: demoBiz.id,
    product_id: p2.id,
    type: 'SALE',
    quantity: -24,
    previous_quantity: 30,
    new_quantity: 6,
    reason: 'Weekly dispatch to retail branches',
    reference_id: 'DISP-4401',
  });

  // 5. Create Customers
  const c1 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'MegaMart Superstores',
    email: 'procurement@megamart.com',
    phone: '+1 (555) 711-2099',
    company: 'MegaMart Retail Holdings',
    status: 'ACTIVE',
    total_spend: 54200.00,
  });

  const c2 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'Urban Boutique LLC',
    email: 'orders@urbanboutique.com',
    phone: '+1 (555) 882-9011',
    company: 'Urban Retailers',
    status: 'ACTIVE',
    total_spend: 18450.00,
  });

  const c3 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'SwiftDeliver Couriers',
    email: 'ops@swiftdeliver.com',
    phone: '+1 (555) 663-1288',
    company: 'SwiftDeliver Logistics',
    status: 'ACTIVE',
    total_spend: 32100.00,
  });

  const c4 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'Nova Cafe Chain',
    email: 'finance@novacafe.com',
    phone: '+1 (555) 991-4402',
    company: 'Nova Hospitality Group',
    status: 'ACTIVE',
    total_spend: 14200.00,
  });

  const c5 = db.createCustomer({
    business_id: demoBiz.id,
    name: 'PrimeTech Solutions',
    email: 'billing@primetech.io',
    phone: '+1 (555) 304-7120',
    company: 'PrimeTech Systems Inc.',
    status: 'ACTIVE',
    total_spend: 41800.00,
  });

  // 6. Create Invoices (some paid, some overdue for NOVA to analyze)
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c1.id,
    invoice_number: 'INV-2026-001',
    status: 'PAID',
    issue_date: '2026-10-01',
    due_date: '2026-10-31',
    subtotal: 12500.00,
    tax_amount: 1000.00,
    total_amount: 13500.00,
    notes: 'Q4 Batch Fulfillment',
  });

  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c5.id,
    invoice_number: 'INV-2026-002',
    status: 'PAID',
    issue_date: '2026-10-15',
    due_date: '2026-11-14',
    subtotal: 8200.00,
    tax_amount: 656.00,
    total_amount: 8856.00,
    notes: 'Workstation hardware upgrade',
  });

  // OVERDUE INVOICE 1
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c3.id,
    invoice_number: 'INV-2026-004',
    status: 'OVERDUE',
    issue_date: '2026-10-20',
    due_date: '2026-11-10', // 15 days overdue
    subtotal: 4500.00,
    tax_amount: 350.00,
    total_amount: 4850.00,
    notes: 'Dispatch supplies & barcode scanners',
  });

  // OVERDUE INVOICE 2
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c2.id,
    invoice_number: 'INV-2026-007',
    status: 'OVERDUE',
    issue_date: '2026-10-28',
    due_date: '2026-11-18', // 7 days overdue
    subtotal: 1980.00,
    tax_amount: 140.00,
    total_amount: 2120.00,
    notes: 'Packaging mailers and labels',
  });

  // PENDING ISSUED INVOICE
  db.createInvoice({
    business_id: demoBiz.id,
    customer_id: c4.id,
    invoice_number: 'INV-2026-010',
    status: 'ISSUED',
    issue_date: '2026-11-15',
    due_date: '2026-12-15',
    subtotal: 3100.00,
    tax_amount: 248.00,
    total_amount: 3348.00,
    notes: 'POS terminals and receipt rolls',
  });

  // 7. Create Expenses (with deliberate anomalous spike in Logistics for NOVA to detect!)
  const expensesList = [
    { category: 'OPERATIONAL', description: 'Warehouse Facility Lease', amount: 4800.00, date: '2026-11-01', payment_method: 'ACH_TRANSFER' },
    { category: 'PAYROLL', description: 'Bi-Weekly Warehouse Staff Wages', amount: 8900.00, date: '2026-11-05', payment_method: 'DIRECT_DEPOSIT' },
    { category: 'UTILITIES', description: 'Industrial Power & HVAC Utility', amount: 1150.00, date: '2026-11-08', payment_method: 'CREDIT_CARD' },
    { category: 'SOFTWARE', description: 'ERP Cloud & Inventory SaaS Licenses', amount: 620.00, date: '2026-11-10', payment_method: 'CREDIT_CARD' },
    { category: 'MARKETING', description: 'B2B Digital Lead Generation Ads', amount: 1400.00, date: '2026-11-12', payment_method: 'CREDIT_CARD' },
    // ANOMALOUS EXPENSE: Logistics surge
    { category: 'LOGISTICS', description: 'Urgent Expedited Air Freight Surcharge (Anomalous Surge)', amount: 4850.00, date: '2026-11-18', payment_method: 'WIRE_TRANSFER' },
    { category: 'LOGISTICS', description: 'Standard Ground Pallet Courier', amount: 950.00, date: '2026-11-03', payment_method: 'INVOICE' },
    { category: 'INVENTORY', description: 'Packaging Restocking (EcoPackaging)', amount: 1200.00, date: '2026-11-14', payment_method: 'ACH_TRANSFER' },
    { category: 'MISC', description: 'Warehouse Safety Inspection Fee', amount: 350.00, date: '2026-11-16', payment_method: 'CREDIT_CARD' },
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
    title: 'Audit Low Stock Scanners & Prepare Reorder',
    description: 'Verify shelf count for SKU WBS-200 and coordinate restocking order with TechSupply Global.',
    assigned_to: 'Elena Rostova',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    due_date: '2026-11-28',
    created_by_agent: 'ATLAS',
  });

  db.createTask({
    business_id: demoBiz.id,
    title: 'Follow Up Overdue Invoice INV-2026-004',
    description: 'Contact SwiftDeliver Couriers regarding unpaid balance of $4,850.00 due on Nov 10.',
    assigned_to: 'Marcus Brody',
    priority: 'HIGH',
    status: 'PENDING',
    due_date: '2026-11-26',
    created_by_agent: 'NOVA',
  });

  db.createTask({
    business_id: demoBiz.id,
    title: 'Investigate Expedited Air Freight Surcharge',
    description: 'Review invoice from carrier for anomalous $4,850 charge logged on Nov 18.',
    assigned_to: 'Alexandra Vance',
    priority: 'MEDIUM',
    status: 'PENDING',
    due_date: '2026-11-30',
    created_by_agent: 'SENTINEL',
  });

  // 9. Create Workflows
  db.createWorkflow({
    business_id: demoBiz.id,
    name: 'Autonomous Low-Stock Detection & Restock PO',
    description: 'Continuously audits inventory against reorder thresholds, selects optimal suppliers, and prepares purchase order drafts for human approval.',
    trigger_type: 'SCHEDULED',
    trigger_config: { frequency: 'DAILY', time: '08:00 AM' },
    steps: [
      { agent: 'ORION', action: 'Initialize operational audit' },
      { agent: 'ATLAS', action: 'Scan stock levels via DATABASE_SEARCH' },
      { agent: 'ATLAS', action: 'Calculate optimal restocking units via BUSINESS_CALCULATOR' },
      { agent: 'SENTINEL', action: 'Verify risk level and trigger human approval for PO generation' },
      { agent: 'ATLAS', action: 'Generate purchase order draft' },
    ],
    is_active: true,
  });

  db.createWorkflow({
    business_id: demoBiz.id,
    name: 'Financial Health & Expense Anomaly Audit',
    description: 'Analyzes revenue vs expenses, identifies overdue receivables, detects unusual spending spikes, and generates executive health metrics.',
    trigger_type: 'SCHEDULED',
    trigger_config: { frequency: 'WEEKLY', day: 'MONDAY' },
    steps: [
      { agent: 'ORION', action: 'Decompose financial audit goal' },
      { agent: 'NOVA', action: 'Retrieve invoices and expenses via DATABASE_SEARCH' },
      { agent: 'NOVA', action: 'Detect spending anomalies and calculate ratios' },
      { agent: 'SENTINEL', action: 'Audit calculation sanity and validate claims' },
      { agent: 'SAGE', action: 'Synthesize actionable recommendations' },
    ],
    is_active: true,
  });

  db.createWorkflow({
    business_id: demoBiz.id,
    name: 'Multimodal Invoice Document Processing',
    description: 'Extracts supplier, line items, and totals from uploaded invoice documents/images, verifies supplier existence, and drafts invoice records.',
    trigger_type: 'EVENT',
    trigger_config: { event: 'DOCUMENT_UPLOADED' },
    steps: [
      { agent: 'SAGE', action: 'Analyze document with DOCUMENT_ANALYSIS' },
      { agent: 'SENTINEL', action: 'Present extracted form for user verification' },
      { agent: 'ATLAS', action: 'Cross-reference supplier records via DATABASE_SEARCH' },
      { agent: 'NOVA', action: 'Verify arithmetic with BUSINESS_CALCULATOR' },
      { agent: 'ORION', action: 'Draft invoice into database' },
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
    details: { message: 'NEXUS AI platform initialized with enterprise multi-agent subsystem.' },
  });

  db.persist();
  console.log('[SEED] Database seeding complete! Admin: admin@nexus.ai / nexus123');
}

// Execute if run directly
if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase().catch(console.error);
}
