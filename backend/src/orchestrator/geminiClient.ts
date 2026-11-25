import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { toolRegistry } from '../tools/registry.js';

export interface GeminiAgentCallResult {
  thought: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
  };
  finalAnswer?: string;
  source: 'GEMINI_API' | 'AUTONOMOUS_DEMO_ENGINE';
}

export class GeminiClient {
  private static instance: GeminiClient;
  private genAI: GoogleGenerativeAI | null = null;

  private constructor() {
    if (config.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
        console.log('[GEMINI] Initialized Google Gemini client successfully.');
      } catch (err) {
        console.warn('[GEMINI] Failed to initialize Gemini SDK, falling back to autonomous demo engine:', err);
      }
    } else {
      console.log('[GEMINI] No GEMINI_API_KEY provided. Operating in autonomous demo mode with full multi-agent simulation.');
    }
  }

  public static getInstance(): GeminiClient {
    if (!GeminiClient.instance) {
      GeminiClient.instance = new GeminiClient();
    }
    return GeminiClient.instance;
  }

  public reinit(apiKey?: string, model?: string): void {
    if (apiKey) config.geminiApiKey = apiKey;
    if (model) config.geminiModel = model;
    if (config.geminiApiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
        console.log('[GEMINI] Live Google Gemini client re-initialized with model:', config.geminiModel);
      } catch (err) {
        console.warn('[GEMINI] Failed to re-initialize Gemini SDK:', err);
      }
    }
  }

  public isLiveAvailable(): boolean {
    return !!this.genAI && !!config.geminiApiKey;
  }

  /**
   * Run agent step with function calling
   */
  public async executeAgentTurn(
    agentName: string,
    systemPrompt: string,
    history: Array<{ role: 'user' | 'model'; parts: any[] }>,
    currentTask: string,
    permittedTools: string[] = []
  ): Promise<GeminiAgentCallResult> {
    if (this.genAI && config.geminiApiKey) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: config.geminiModel,
          systemInstruction: systemPrompt,
        });

        // Filter permitted tools for this agent
        const declarations = toolRegistry.getGeminiFunctionDeclarations()
          .filter(d => permittedTools.includes(d.name));

        const chat = model.startChat({
          history,
          tools: declarations.length > 0 ? [{ functionDeclarations: declarations }] : undefined,
        });

        const result = await chat.sendMessage(currentTask);
        const response = result.response;
        const candidate = response.candidates?.[0];
        const contentPart = candidate?.content?.parts?.[0];

        if (contentPart?.functionCall) {
          return {
            thought: `I should execute ${contentPart.functionCall.name} to gather required operational data.`,
            toolCall: {
              name: contentPart.functionCall.name,
              args: (contentPart.functionCall.args as Record<string, any>) || {},
            },
            source: 'GEMINI_API',
          };
        }

        const text = response.text();
        return {
          thought: 'Synthesizing final findings based on gathered observations.',
          finalAnswer: text,
          source: 'GEMINI_API',
        };
      } catch (err) {
        console.warn(`[GEMINI] Live API call failed for ${agentName}, falling back to autonomous engine:`, err);
      }
    }

    // High-level autonomous demo engine fallback
    return this.generateAutonomousAgentTurn(agentName, currentTask);
  }

  /**
   * Fallback engine for offline testing and guaranteed hackathon reliability
   */
  private generateAutonomousAgentTurn(agentName: string, currentTask: string): GeminiAgentCallResult {
    const taskLower = currentTask.toLowerCase();

    if (agentName === 'ATLAS') {
      if (taskLower.includes('low stock') || taskLower.includes('inventory') || taskLower.includes('restock')) {
        return {
          thought: 'I will query the inventory database for products depleted below their reorder threshold.',
          toolCall: {
            name: 'DATABASE_SEARCH',
            args: { entity: 'products', filter: { low_stock: true } },
          },
          source: 'AUTONOMOUS_DEMO_ENGINE',
        };
      }
      if (taskLower.includes('supplier') || taskLower.includes('purchase order')) {
        return {
          thought: 'I will search for approved suppliers to draft replenishment orders.',
          toolCall: {
            name: 'DATABASE_SEARCH',
            args: { entity: 'suppliers' },
          },
          source: 'AUTONOMOUS_DEMO_ENGINE',
        };
      }
      return {
        thought: 'Auditing operational metrics and warehouse movement history.',
        toolCall: {
          name: 'DATABASE_SEARCH',
          args: { entity: 'inventory', limit: 10 },
        },
        source: 'AUTONOMOUS_DEMO_ENGINE',
      };
    }

    if (agentName === 'NOVA') {
      if (taskLower.includes('overdue') || taskLower.includes('invoice') || taskLower.includes('receivable')) {
        return {
          thought: 'I will retrieve all overdue accounts receivable invoices to analyze cash-flow drag.',
          toolCall: {
            name: 'DATABASE_SEARCH',
            args: { entity: 'invoices', filter: { status: 'OVERDUE' } },
          },
          source: 'AUTONOMOUS_DEMO_ENGINE',
        };
      }
      if (taskLower.includes('expense') || taskLower.includes('spending') || taskLower.includes('cost')) {
        return {
          thought: 'I will extract categorized business expenses to audit anomalies and cost drivers.',
          toolCall: {
            name: 'DATABASE_SEARCH',
            args: { entity: 'expenses', limit: 20 },
          },
          source: 'AUTONOMOUS_DEMO_ENGINE',
        };
      }
      return {
        thought: 'Calculating revenue, expenses, and net operating margin.',
        toolCall: {
          name: 'BUSINESS_ANALYTICS',
          args: { metrics: ['REVENUE_EXPENSES', 'RECEIVABLES_AUDIT'] },
        },
        source: 'AUTONOMOUS_DEMO_ENGINE',
      };
    }

    if (agentName === 'SAGE') {
      if (taskLower.includes('document') || taskLower.includes('pdf') || taskLower.includes('invoice image')) {
        return {
          thought: 'I will analyze the uploaded document using multimodal extraction.',
          toolCall: {
            name: 'DOCUMENT_ANALYSIS',
            args: { documentType: 'INVOICE' },
          },
          source: 'AUTONOMOUS_DEMO_ENGINE',
        };
      }
      return {
        thought: 'Synthesizing strategic business recommendations and competitive insights.',
        toolCall: {
          name: 'BUSINESS_ANALYTICS',
          args: { metrics: ['ALL'] },
        },
        source: 'AUTONOMOUS_DEMO_ENGINE',
      };
    }

    if (agentName === 'HERMES') {
      if (taskLower.includes('email') || taskLower.includes('message') || taskLower.includes('remind') || taskLower.includes('outreach')) {
        return {
          thought: 'Drafting targeted customer communication for accounts receivable recovery and engagement.',
          toolCall: {
            name: 'EMAIL_NOTIFICATION',
            args: { to: 'customer@enterprise-partner.com', subject: 'Account Status & Invoice Notice', body: 'Friendly reminder regarding outstanding account balances.' },
          },
          source: 'AUTONOMOUS_DEMO_ENGINE',
        };
      }
      return {
        thought: 'Querying customer directory to review engagement history and payment statuses.',
        toolCall: {
          name: 'DATABASE_SEARCH',
          args: { entity: 'CUSTOMERS', query: {} },
        },
        source: 'AUTONOMOUS_DEMO_ENGINE',
      };
    }

    if (agentName === 'APEX') {
      return {
        thought: 'Synthesizing executive market trends and modeling quarterly growth trajectories.',
        toolCall: {
          name: 'BUSINESS_ANALYTICS',
          args: { metrics: ['REVENUE_EXPENSES', 'RUNWAY_ANALYSIS', 'INVENTORY_METRICS'] },
        },
        source: 'AUTONOMOUS_DEMO_ENGINE',
      };
    }

    // Default response
    return {
      thought: `Agent ${agentName} evaluating operational context.`,
      finalAnswer: `Task completed by ${agentName} according to plan criteria.`,
      source: 'AUTONOMOUS_DEMO_ENGINE',
    };
  }
}

export const geminiClient = GeminiClient.getInstance();
