import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * LlmService — replaces `base44.integrations.Core.InvokeLLM`.
 *
 * If OPENAI_API_KEY is configured, calls OpenAI chat completions in JSON
 * mode using the caller-supplied `response_json_schema` as a hint. Otherwise
 * returns a best-effort mock object so UI flows (e.g. MarketStats AI
 * insights) don't hard-fail in local/dev environments without an API key.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {}

  async invoke(prompt: string, responseSchema?: Record<string, any>, model?: string): Promise<any> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      return this.mockResponse(responseSchema);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || this.config.get<string>('OPENAI_MODEL', 'gpt-4o-mini'),
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: responseSchema
                ? `Reply ONLY with strict JSON matching this schema: ${JSON.stringify(responseSchema)}`
                : 'Reply with helpful, concise JSON.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      const json = (await response.json()) as any;
      const content = json?.choices?.[0]?.message?.content;
      if (!content) return this.mockResponse(responseSchema);
      return JSON.parse(content);
    } catch (err) {
      this.logger.warn(`LLM invocation failed, falling back to mock: ${(err as Error).message}`);
      return this.mockResponse(responseSchema);
    }
  }

  private mockResponse(schema?: Record<string, any>): any {
    if (!schema?.properties) return { message: 'AI insights unavailable (OPENAI_API_KEY not configured)' };

    const result: Record<string, any> = {};
    for (const [key, def] of Object.entries<any>(schema.properties)) {
      switch (def.type) {
        case 'number':
          result[key] = 0;
          break;
        case 'array':
          result[key] = [];
          break;
        case 'object':
          result[key] = {};
          break;
        default:
          result[key] = '';
      }
    }
    return result;
  }
}

