import { AgentName, RiskLevel } from '../database/types.js';

export interface AgentDescriptor {
  name: AgentName;
  role: string;
  tagline: string;
  avatarColor: string;
  capabilities: string[];
  systemPrompt: string;
  permittedTools: string[];
}

export interface PlanStep {
  id: string;
  stepIndex: number;
  agentName: AgentName;
  description: string;
  toolName?: string;
  suggestedInput?: any;
  riskLevel: RiskLevel;
  dependencies: number[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'WAITING_APPROVAL';
  output?: any;
  error?: string;
}

export interface ExecutionPlan {
  goal: string;
  summary: string;
  targetAgents: AgentName[];
  steps: PlanStep[];
  estimatedTurns: number;
}
