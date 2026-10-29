import { apiClient } from './apiClient';
import { AIInsight } from '../types';
import { mockAIInsights } from '../data/mockData';

export interface AISourceItem {
  type: string;
  id: string;
  title: string;
  details?: string;
  entityType?: string;
  metricLabel?: string;
}

export interface AIActionItem {
  type: 'NAVIGATE';
  target: string;
  params?: Record<string, any>;
  label: string;
  targetScreen?: string;
  targetParams?: Record<string, any>;
}

export interface AIAnalysisPayload {
  summary: string;
  evidence: Array<{ type: string; category: string; metric: string; value: string | number; confidence: string }>;
  comparison?: Array<{ category: string; demand: number; supply: number; ratio: number; score: number }>;
  recommendation?: string;
}

export interface StructuredAIResponseData {
  message: string;
  intent: string;
  confidence: number;
  grounded: boolean;
  sources: AISourceItem[];
  actions: AIActionItem[];
  analysis?: AIAnalysisPayload;
}

export const aiService = {
  async getInsights(): Promise<AIInsight[]> {
    return mockAIInsights;
  },

  async queryAIChat(prompt: string, conversationId?: string | null): Promise<StructuredAIResponseData> {
    try {
      const response = await apiClient.post<any>('/ai/chat', {
        message: prompt,
        conversationId: conversationId || null,
      });

      const data = response?.data?.data || response?.data || response;
      if (data && typeof data.message === 'string') {
        return {
          message: data.message,
          intent: data.intent || 'GENERAL_ECOSPHERE_HELP',
          confidence: typeof data.confidence === 'number' ? data.confidence : 0.9,
          grounded: Boolean(data.grounded),
          sources: Array.isArray(data.sources) ? data.sources : [],
          actions: Array.isArray(data.actions) ? data.actions : [],
          analysis: data.analysis,
        };
      }

      return {
        message: 'No response received from ECOSPHERE AI Copilot.',
        intent: 'GENERAL_ECOSPHERE_HELP',
        confidence: 0.5,
        grounded: false,
        sources: [],
        actions: [],
      };
    } catch (error: any) {
      console.error('Error querying AI Copilot:', error);
      const errMsg = error?.response?.data?.error?.message || error?.message || 'Failed to connect to ECOSPHERE AI Copilot.';
      return {
        message: errMsg.includes('401') ? 'Authentication required. Please log in.' : errMsg,
        intent: 'GENERAL_ECOSPHERE_HELP',
        confidence: 0.0,
        grounded: false,
        sources: [],
        actions: [],
      };
    }
  },
};
