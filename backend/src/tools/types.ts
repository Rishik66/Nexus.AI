import { z } from 'zod';
import { RiskLevel } from '../database/types.js';

export interface ToolExecutionContext {
  businessId: string;
  userId?: string;
  agentName: string;
  runId?: string;
  stepId?: string;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  name: string;
  description: string;
  riskLevel: RiskLevel;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  geminiFunctionDeclaration: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
  execute: (input: TInput, context: ToolExecutionContext) => Promise<TOutput>;
}
