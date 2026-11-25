import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';
import { db } from './db.js';
import fs from 'fs';
import path from 'path';

export interface SupabaseConfigPayload {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  databaseUrl?: string;
}

export interface SupabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  supabaseUrl: string;
  hasServiceRoleKey: boolean;
  hasAnonKey: boolean;
  hasDatabaseUrl: boolean;
  message: string;
  details?: any;
}

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient | null = null;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  public initClient(): void {
    const url = config.supabaseUrl;
    const key = config.supabaseServiceRoleKey || config.supabaseAnonKey;

    if (url && key && url.startsWith('http')) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        console.log('[SUPABASE] Initialized Supabase client for URL:', url);
      } catch (err) {
        console.warn('[SUPABASE] Failed to create Supabase client:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public async getStatus(): Promise<SupabaseStatus> {
    const isConfigured = Boolean(config.supabaseUrl && (config.supabaseServiceRoleKey || config.supabaseAnonKey));
    const hasDatabaseUrl = Boolean(config.databaseUrl);

    if (!isConfigured && !hasDatabaseUrl) {
      return {
        isConfigured: false,
        isConnected: false,
        supabaseUrl: '',
        hasServiceRoleKey: false,
        hasAnonKey: false,
        hasDatabaseUrl: false,
        message: 'Supabase is not yet configured. Running on zero-dependency local relational engine (Supabase-compatible).',
      };
    }

    // Try testing connection
    const testResult = await this.testConnection();

    return {
      isConfigured: true,
      isConnected: testResult.success,
      supabaseUrl: config.supabaseUrl || (config.databaseUrl ? 'Direct PostgreSQL Pool' : ''),
      hasServiceRoleKey: Boolean(config.supabaseServiceRoleKey),
      hasAnonKey: Boolean(config.supabaseAnonKey),
      hasDatabaseUrl,
      message: testResult.message,
      details: testResult.details,
    };
  }

  public async testConnection(overridePayload?: SupabaseConfigPayload): Promise<{ success: boolean; message: string; details?: any }> {
    const testUrl = overridePayload?.supabaseUrl || config.supabaseUrl;
    const testKey = overridePayload?.supabaseServiceRoleKey || overridePayload?.supabaseAnonKey || config.supabaseServiceRoleKey || config.supabaseAnonKey;

    if (!testUrl || !testKey) {
      return {
        success: false,
        message: 'Supabase URL and API Key are required to establish connection.',
      };
    }

    try {
      const testClient = createClient(testUrl, testKey, {
        auth: { persistSession: false },
      });

      // Try checking if a standard table or auth health check works
      const { data, error } = await testClient.from('businesses').select('id, name').limit(1);

      if (error) {
        // If table doesn't exist yet, but client got response from Supabase, credentials are valid!
        if (error.code === '42P01' || error.message.includes('relation "businesses" does not exist') || error.code === 'PGRST204') {
          return {
            success: true,
            message: 'Connected to Supabase project successfully! Note: Tables are not yet created. Run the SQL Migration to initialize schema.',
            details: { schemaNeeded: true, code: error.code },
          };
        }
        return {
          success: false,
          message: `Supabase returned error: ${error.message} (${error.code || 'UNKNOWN'})`,
          details: error,
        };
      }

      return {
        success: true,
        message: `Successfully connected to Supabase Cloud! Found ${data?.length || 0} business record(s).`,
        details: { businessesFound: data?.length || 0 },
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection failed: ${err.message || 'Unknown network error'}`,
        details: err,
      };
    }
  }

  public async saveConfiguration(payload: SupabaseConfigPayload): Promise<{ success: boolean; message: string }> {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const updates: Record<string, string | undefined> = {
      SUPABASE_URL: payload.supabaseUrl?.trim(),
      SUPABASE_ANON_KEY: payload.supabaseAnonKey?.trim(),
      SUPABASE_SERVICE_ROLE_KEY: payload.supabaseServiceRoleKey?.trim(),
      DATABASE_URL: payload.databaseUrl?.trim(),
    };

    // Update config in-memory
    if (updates.SUPABASE_URL !== undefined) config.supabaseUrl = updates.SUPABASE_URL;
    if (updates.SUPABASE_ANON_KEY !== undefined) config.supabaseAnonKey = updates.SUPABASE_ANON_KEY;
    if (updates.SUPABASE_SERVICE_ROLE_KEY !== undefined) config.supabaseServiceRoleKey = updates.SUPABASE_SERVICE_ROLE_KEY;
    if (updates.DATABASE_URL !== undefined) config.databaseUrl = updates.DATABASE_URL;

    // Write back to .env
    const lines = envContent.split(/\r?\n/);
    const updatedKeys = new Set<string>();

    const newLines = lines.map((line) => {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && updates[match[1]] !== undefined) {
        updatedKeys.add(match[1]);
        return `${match[1]}=${updates[match[1]]}`;
      }
      return line;
    });

    // Add keys that were not present in .env
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && !updatedKeys.has(key)) {
        newLines.push(`${key}=${value}`);
      }
    }

    fs.writeFileSync(envPath, newLines.join('\n'), 'utf-8');

    // Re-initialize client
    this.initClient();

    return {
      success: true,
      message: 'Supabase configuration saved and client re-initialized.',
    };
  }

  public async syncSeedDataToSupabase(): Promise<{ success: boolean; message: string; stats?: any }> {
    if (!this.client) {
      throw new Error('Supabase client is not connected. Configure Supabase credentials first.');
    }

    const store = db.getStore();
    const stats: Record<string, number> = {};

    try {
      // 1. Sync Businesses
      if (store.businesses?.length) {
        const { error: bError } = await this.client
          .from('businesses')
          .upsert(store.businesses, { onConflict: 'id' });
        if (bError) throw new Error(`Failed to sync businesses: ${bError.message}`);
        stats.businesses = store.businesses.length;
      }

      // 2. Sync Users
      if (store.users?.length) {
        const { error: uError } = await this.client
          .from('users')
          .upsert(store.users, { onConflict: 'id' });
        if (uError) throw new Error(`Failed to sync users: ${uError.message}`);
        stats.users = store.users.length;
      }

      // 3. Sync Suppliers
      if (store.suppliers?.length) {
        const { error: sError } = await this.client
          .from('suppliers')
          .upsert(store.suppliers, { onConflict: 'id' });
        if (sError) throw new Error(`Failed to sync suppliers: ${sError.message}`);
        stats.suppliers = store.suppliers.length;
      }

      // 4. Sync Products / Assets (deduplicate by sku)
      if (store.products?.length) {
        const uniqueProductsMap = new Map();
        for (const p of store.products) {
          if (!uniqueProductsMap.has(p.sku)) {
            uniqueProductsMap.set(p.sku, p);
          }
        }
        const uniqueProducts = Array.from(uniqueProductsMap.values());
        const { error: pError } = await this.client
          .from('products')
          .upsert(uniqueProducts, { onConflict: 'business_id, sku' });
        if (pError) throw new Error(`Failed to sync assets/products: ${pError.message}`);
        stats.products = uniqueProducts.length;
      }

      // 5. Sync Customers
      if (store.customers?.length) {
        const { error: cError } = await this.client
          .from('customers')
          .upsert(store.customers, { onConflict: 'id' });
        if (cError) throw new Error(`Failed to sync customers: ${cError.message}`);
        stats.customers = store.customers.length;
      }

      // 6. Sync Invoices
      if (store.invoices?.length) {
        const cleanInvoices = store.invoices.map((inv: any) => ({
          id: inv.id,
          business_id: inv.business_id,
          customer_id: inv.customer_id,
          invoice_number: inv.invoice_number,
          status: inv.status,
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          subtotal: inv.subtotal,
          tax_amount: inv.tax_amount,
          total_amount: inv.total_amount,
          notes: inv.notes,
          created_at: inv.created_at,
          updated_at: inv.updated_at,
        }));
        const { error: iError } = await this.client
          .from('invoices')
          .upsert(cleanInvoices, { onConflict: 'id' });
        if (iError) throw new Error(`Failed to sync invoices: ${iError.message}`);
        stats.invoices = cleanInvoices.length;
      }

      // 7. Sync Expenses
      if (store.expenses?.length) {
        const { error: eError } = await this.client
          .from('expenses')
          .upsert(store.expenses, { onConflict: 'id' });
        if (eError) throw new Error(`Failed to sync expenses: ${eError.message}`);
        stats.expenses = store.expenses.length;
      }

      return {
        success: true,
        message: 'Successfully synchronized all enterprise seed data into Supabase Cloud tables.',
        stats,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Sync failed: ${err.message}`,
        stats,
      };
    }
  }

  public getMigrationSql(): string {
    const migrationPath = path.resolve(process.cwd(), '../database/migrations/001_initial_schema.sql');
    const altPath = path.resolve(process.cwd(), 'database/migrations/001_initial_schema.sql');

    if (fs.existsSync(migrationPath)) {
      return fs.readFileSync(migrationPath, 'utf-8');
    }
    if (fs.existsSync(altPath)) {
      return fs.readFileSync(altPath, 'utf-8');
    }
    return '-- Migration file not found on disk.';
  }
}

export const supabaseService = SupabaseService.getInstance();
