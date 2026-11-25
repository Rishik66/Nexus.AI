import { ToolDefinition, ToolExecutionContext } from './types.js';
import { databaseSearchTool } from './implementations/databaseSearch.js';
import { databaseUpdateTool } from './implementations/databaseUpdate.js';
import { businessCalculatorTool } from './implementations/businessCalculator.js';
import { currencyConversionTool } from './implementations/currencyConversion.js';
import { emailNotificationTool } from './implementations/emailNotification.js';
import { documentAnalysisTool } from './implementations/documentAnalysis.js';
import { businessAnalyticsTool } from './implementations/businessAnalytics.js';
import { db } from '../database/db.js';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, ToolDefinition> = new Map();

  private constructor() {
    this.register(databaseSearchTool);
    this.register(databaseUpdateTool);
    this.register(businessCalculatorTool);
    this.register(currencyConversionTool);
    this.register(emailNotificationTool);
    this.register(documentAnalysisTool);
    this.register(businessAnalyticsTool);
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getGeminiFunctionDeclarations(): any[] {
    return Array.from(this.tools.values()).map(t => t.geminiFunctionDeclaration);
  }

  public async executeTool(
    name: string,
    rawInput: any,
    context: ToolExecutionContext
  ): Promise<{ success: boolean; output?: any; error?: string; durationMs: number }> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" is not registered in the NEXUS AI tool registry.`,
        durationMs: 0,
      };
    }

    const startTime = Date.now();
    try {
      // 1. Validate Input Schema with Zod
      const validatedInput = tool.inputSchema.parse(rawInput);

      // 2. Execute with safety timeout (15s)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Tool ${name} timed out after 15,000ms.`)), 15000)
      );

      const outputPromise = tool.execute(validatedInput, context);
      const rawOutput = await Promise.race([outputPromise, timeoutPromise]);

      // 3. Validate Output Schema with Zod
      const validatedOutput = tool.outputSchema.parse(rawOutput);
      const durationMs = Date.now() - startTime;

      // 4. Record execution in DB
      if (context.runId) {
        db.recordToolExecution({
          run_id: context.runId,
          step_id: context.stepId,
          tool_name: name,
          input: validatedInput,
          output: validatedOutput,
          status: 'SUCCESS',
          duration_ms: durationMs,
        });
      }

      return {
        success: true,
        output: validatedOutput,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err?.message || 'Tool execution encountered an unknown error.';

      if (context.runId) {
        db.recordToolExecution({
          run_id: context.runId,
          step_id: context.stepId,
          tool_name: name,
          input: rawInput,
          status: 'ERROR',
          duration_ms: durationMs,
          error_message: errorMessage,
        });
      }

      console.error(`[TOOL_REGISTRY] Error executing ${name}:`, err);
      return {
        success: false,
        error: errorMessage,
        durationMs,
      };
    }
  }
}

export const toolRegistry = ToolRegistry.getInstance();
