import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'nexus_ai_super_secure_jwt_secret_key_2026_hackathon_elite',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  exchangeRateApiUrl: process.env.EXCHANGE_RATE_API_URL || 'https://api.frankfurter.app',
  demoMode: process.env.DEMO_MODE !== 'false',
  enableHumanApproval: process.env.ENABLE_HUMAN_APPROVAL !== 'false',
  maxAgentTurns: parseInt(process.env.MAX_AGENT_TURNS || '10', 10),
};
