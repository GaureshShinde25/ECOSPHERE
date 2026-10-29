import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface AIProviderResponse {
  content: string;
  isAvailable: boolean;
}

export class AIProvider {
  /**
   * Generates a grounded response using the configured AI vendor API or returns provider status
   */
  static async generateResponse(prompt: string, systemInstruction: string): Promise<AIProviderResponse> {
    const provider = (env.AI_PROVIDER || 'none').toLowerCase();
    const apiKey = env.AI_API_KEY || '';
    const model = env.AI_MODEL || 'gemini-1.5-flash';

    if (provider === 'none' || !apiKey) {
      return {
        content: 'AI Assistant is temporarily unavailable.',
        isAvailable: false,
      };
    }

    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
          }),
        });

        if (!response.ok) {
          logger.error('Gemini API request failed', { status: response.status });
          return { content: 'AI Assistant is temporarily unavailable.', isAvailable: false };
        }

        const data = (await response.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { content: text.trim(), isAvailable: true };
        }
      } else if (provider === 'openai') {
        const url = 'https://api.openai.com/v1/chat/completions';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt },
            ],
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          logger.error('OpenAI API request failed', { status: response.status });
          return { content: 'AI Assistant is temporarily unavailable.', isAvailable: false };
        }

        const data = (await response.json()) as any;
        const text = data?.choices?.[0]?.message?.content;
        if (text) {
          return { content: text.trim(), isAvailable: true };
        }
      }

      return { content: 'AI Assistant is temporarily unavailable.', isAvailable: false };
    } catch (error) {
      const err = error as Error;
      logger.error('AI provider communication failure', { error: err.message });
      return { content: 'AI Assistant is temporarily unavailable.', isAvailable: false };
    }
  }
}
