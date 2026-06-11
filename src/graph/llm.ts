/**
 * LLM interface wrapper for semantic analysis
 */

/** LLM configuration */
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local'
  apiKey?: string
  model?: string
  baseUrl?: string
}

/** LLM response */
export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

/** LLM interface */
export interface LLMInterface {
  analyze(prompt: string): Promise<LLMResponse>
  analyzeBatch(prompts: string[]): Promise<LLMResponse[]>
}

/** Create LLM instance */
export function createLLM(config: LLMConfig): LLMInterface {
  switch (config.provider) {
    case 'openai':
      return new OpenAILLM(config)
    case 'anthropic':
      return new AnthropicLLM(config)
    case 'local':
      return new LocalLLM(config)
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`)
  }
}

/** OpenAI LLM implementation */
class OpenAILLM implements LLMInterface {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async analyze(prompt: string): Promise<LLMResponse> {
    // TODO: Implement OpenAI API call
    // For now, return a mock response
    return {
      content: JSON.stringify({
        summary: 'Mock summary',
        tags: ['mock'],
        topic: 'mock',
        category: 'mock',
        confidence: 0.5
      })
    }
  }

  async analyzeBatch(prompts: string[]): Promise<LLMResponse[]> {
    const results: LLMResponse[] = []
    for (const prompt of prompts) {
      results.push(await this.analyze(prompt))
    }
    return results
  }
}

/** Anthropic LLM implementation */
class AnthropicLLM implements LLMInterface {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async analyze(prompt: string): Promise<LLMResponse> {
    // TODO: Implement Anthropic API call
    return {
      content: JSON.stringify({
        summary: 'Mock summary',
        tags: ['mock'],
        topic: 'mock',
        category: 'mock',
        confidence: 0.5
      })
    }
  }

  async analyzeBatch(prompts: string[]): Promise<LLMResponse[]> {
    const results: LLMResponse[] = []
    for (const prompt of prompts) {
      results.push(await this.analyze(prompt))
    }
    return results
  }
}

/** Local LLM implementation */
class LocalLLM implements LLMInterface {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async analyze(prompt: string): Promise<LLMResponse> {
    // TODO: Implement local LLM call
    return {
      content: JSON.stringify({
        summary: 'Mock summary',
        tags: ['mock'],
        topic: 'mock',
        category: 'mock',
        confidence: 0.5
      })
    }
  }

  async analyzeBatch(prompts: string[]): Promise<LLMResponse[]> {
    const results: LLMResponse[] = []
    for (const prompt of prompts) {
      results.push(await this.analyze(prompt))
    }
    return results
  }
}

/** Build analysis prompt for a bookmark */
export function buildBookmarkAnalysisPrompt(bookmark: {
  name: string
  url: string
  folder?: string
}): string {
  return `Analyze this bookmark and provide structured information:

Bookmark:
- Name: ${bookmark.name}
- URL: ${bookmark.url}
- Folder: ${bookmark.folder || '(root)'}

Please provide:
1. summary: A 1-2 sentence description of what this bookmark is about
2. tags: 3-5 relevant keyword tags
3. topic: The main topic or subject area
4. category: The category (e.g., "documentation", "tool", "tutorial", "reference")
5. confidence: Your confidence level (0-1)

Respond in JSON format:
{
  "summary": "...",
  "tags": ["...", "..."],
  "topic": "...",
  "category": "...",
  "confidence": 0.8
}`
}

/** Parse LLM response */
export function parseBookmarkAnalysisResponse(response: string): {
  summary: string
  tags: string[]
  topic: string
  category: string
  confidence: number
} | null {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const data = JSON.parse(jsonMatch[0])

    return {
      summary: typeof data.summary === 'string' ? data.summary : '',
      tags: Array.isArray(data.tags) ? data.tags.filter((t: unknown) => typeof t === 'string') : [],
      topic: typeof data.topic === 'string' ? data.topic : '',
      category: typeof data.category === 'string' ? data.category : '',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.5
    }
  } catch {
    return null
  }
}
