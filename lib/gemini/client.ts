import { GoogleGenAI, Type } from '@google/genai';
import { AILeadAnalysis, LeadInput, AIEmailDraft, Lead } from '@/types/lead';
import { aiLeadAnalysisSchema, aiEmailDraftSchema } from '@/lib/validations/lead';

/**
 * Initializes Google Gen AI SDK client.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your server environment variables.'
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Structured schema definition for Gemini lead analysis
 */
const leadAnalysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    service: {
      type: Type.STRING,
      description:
        'The primary service requested (e.g. Website Development, Branding & Design, Social Media, Digital Advertising, or Other)',
    },
    budget: {
      type: Type.NUMBER,
      description: 'The extracted numeric budget amount if specified, or null if unknown',
    },
    currency: {
      type: Type.STRING,
      description: 'The currency code (e.g., USD, EUR, GBP, CAD, AUD). Default to USD if unspecified.',
    },
    timeline: {
      type: Type.STRING,
      description: 'The extracted timeline (e.g., ASAP, Within 1 week, Within 1 month, 1-3 months, Flexible, or Unknown)',
    },
    intent: {
      type: Type.STRING,
      description:
        'Buying intent classification: High (ready to hire/clear purchase signal), Medium (exploring options/comparing), Low (casual inquiry/vague/spam)',
    },
    urgency: {
      type: Type.STRING,
      description:
        'Urgency level: High (urgent need/immediate deadline), Medium (standard schedule), Low (exploratory/flexible)',
    },
    company_identified: {
      type: Type.BOOLEAN,
      description: 'True if a legitimate company/business or brand name was explicitly identified or mentioned in the message/form',
    },
    specific_requirements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of specific features, pages, integrations, or deliverables explicitly requested by the lead',
    },
    summary: {
      type: Type.STRING,
      description: 'A concise 2-3 sentence executive business summary of what the lead wants and their context',
    },
    reasoning: {
      type: Type.STRING,
      description: 'Clear business explanation of the intent, urgency, and qualification signals detected in this lead',
    },
    missing_information: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'List of key missing pieces of information that the agency would need to quote or scope (e.g., preferred technology, brand guidelines, content readiness)',
    },
    recommended_action: {
      type: Type.STRING,
      description:
        'Concrete recommended next step for Northstar Studio (e.g., "Contact within 24 hours to schedule discovery call", "Request budget clarification", "Send portfolio samples")',
    },
  },
  required: [
    'service',
    'currency',
    'timeline',
    'intent',
    'urgency',
    'company_identified',
    'specific_requirements',
    'summary',
    'reasoning',
    'missing_information',
    'recommended_action',
  ],
};

/**
 * Structured schema definition for Gemini email reply draft
 */
const emailDraftResponseSchema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: 'A compelling, personalized, and professional email subject line for the initial agency reply (e.g. "Re: Website Development for Oak & Thread Apparel")',
    },
    body: {
      type: Type.STRING,
      description: 'The full personalized email body text, formatted cleanly with paragraph breaks, warm greeting, specific references to their inquiry, and sign-off from Northstar Studio.',
    },
  },
  required: ['subject', 'body'],
};

const SYSTEM_INSTRUCTION = `You are a senior lead qualification analyst for Northstar Studio, a premier American digital agency specializing in Website Development, Branding & Design, Social Media, and Digital Advertising.

Your job is to thoroughly and accurately analyze incoming business inquiries for agency sales leadership.

Guiding Principles:
1. Extract ONLY information supported by the lead's inquiry message and provided form fields.
2. DO NOT invent budgets, timelines, company names, services, or technical requirements that were not stated or strongly implied.
3. If critical information is missing (such as exact scope, budget, launch deadline, or tech stack), explicitly enumerate it under missing_information.
4. Distinguish carefully between:
   - What the lead explicitly stated
   - What can reasonably be inferred
   - What remains unknown
5. Intent classification:
   - "High": Ready to buy, has budget/timeline, specific scope, clear call to action.
   - "Medium": Exploring possibilities, asking general pricing, flexible timeline.
   - "Low": Vague, low commitment, student/solicitation/spam.
6. Urgency classification:
   - "High": Within 1 month, ASAP, immediate business need.
   - "Medium": 1-3 months, standard roadmap.
   - "Low": Flexible, distant future, or undecided.
7. Always provide actionable, concise, and business-focused summaries and recommendations for an American digital agency.`;

const EMAIL_DRAFT_SYSTEM_INSTRUCTION = `You are a professional, senior client strategist and sales director at Northstar Studio, a high-touch American digital marketing and development agency based in the US.

Your job is to craft a warm, highly personalized, concise, and professional initial response email to an incoming prospect.

STRICT WRITING RULES:
1. PERSONALIZED & SPECIFIC: Reference their specific brand/company name, requested service, and key requirements mentioned in their message (e.g., ecommerce functionality, checkout, product pages, brand identity).
2. ONLY USE FACTUAL INFORMATION: Only reference budget, timeline, and requirements that the prospect actually provided. If budget or timeline was NOT provided, DO NOT fabricate or invent numbers or dates.
3. PROHIBITED PHRASING & TOPICS:
   - NEVER mention AI, artificial intelligence, automated analysis, qualification scores, algorithms, or "LeadFlow AI".
   - NEVER claim that you or Northstar Studio have already spoken with them, met with them, or scheduled a meeting.
   - NEVER make binding financial guarantees, exact quote promises, or unsupported delivery commitments.
   - NEVER sound robotic or use boilerplate filler phrases.
4. TONE & STYLE: Warm, consultative, authoritative, helpful, and natural for an American creative agency.
5. CALL TO ACTION: Propose an easy next step (e.g., a brief 15-minute discovery call this week to discuss their goals, architecture, and timeline).
6. SIGN-OFF: Sign off warmly from the team at Northstar Studio (e.g. "Best regards,\\nThe Northstar Studio Team\\nhello@northstarstudio.com").`;

/**
 * Get ordered candidate models (configured model first, followed by resilient active flash models).
 */
function getModelCandidates(): string[] {
  const configured = process.env.GEMINI_MODEL;
  const defaults = [
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ];

  if (configured) {
    return [configured, ...defaults.filter((m) => m !== configured)];
  }
  return defaults;
}

/**
 * Helper to execute Gemini calls with exponential backoff on transient errors (503, 429, high demand).
 */
async function callGeminiWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isTransient =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('network');

      if (!isTransient || attempt === maxRetries) {
        throw err;
      }

      const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 400;
      console.warn(
        `Gemini API transient spike (attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(delay)}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

/**
 * Executes a Gemini operation with candidate model fallback if quota or high demand is encountered.
 */
async function callGeminiWithModelFallback<T>(
  operation: (modelName: string) => Promise<T>
): Promise<T> {
  const models = getModelCandidates();
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await callGeminiWithRetry(() => operation(model), 2, 800);
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuotaOrSpike =
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('UNAVAILABLE');

      if (isQuotaOrSpike && i < models.length - 1) {
        console.warn(`Model ${model} unavailable/exhausted, trying fallback model ${models[i + 1]}...`);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * Analyzes a lead using the Google Gemini API with structured JSON output.
 */
export async function analyzeLeadWithGemini(
  leadInput: LeadInput
): Promise<AILeadAnalysis> {
  const ai = getGeminiClient();

  const userPrompt = `Please analyze the following incoming lead inquiry for Northstar Studio:

LEAD DETAILS:
- Contact Name: ${leadInput.name}
- Email: ${leadInput.email}
- Company / Business: ${leadInput.company || 'Not provided'}
- Selected Service: ${leadInput.service || 'Not specified'}
- Provided Budget: ${
    leadInput.budget ? `${leadInput.currency || 'USD'} ${leadInput.budget.toLocaleString('en-US')}` : 'Not provided'
  }
- Selected Timeline: ${leadInput.timeline || 'Not specified'}
- Natural Language Inquiry Message:
"""
${leadInput.message}
"""

Analyze this inquiry and return the structured JSON evaluation.`;

  try {
    const response = await callGeminiWithModelFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: leadAnalysisResponseSchema,
          temperature: 0.1,
        },
      });
    });

    const responseText = response.text;
    if (!responseText) {
      const candidate = response.candidates?.[0];
      throw new Error(
        `Gemini returned an empty response. Finish reason: ${candidate?.finishReason || 'UNKNOWN'}`
      );
    }

    const rawParsed = JSON.parse(responseText);
    const validated = aiLeadAnalysisSchema.safeParse(rawParsed);

    if (!validated.success) {
      console.error('Gemini response validation errors:', validated.error.format());
      throw new Error('Gemini response did not match the expected structure.');
    }

    return validated.data as AILeadAnalysis;
  } catch (error) {
    console.error('Error during Gemini lead analysis:', error);
    throw error;
  }
}

/**
 * Generates a personalized email reply draft using Gemini based on the lead's inquiry and qualification.
 */
export async function generateEmailDraftWithGemini(
  lead: Lead,
  analysis?: AILeadAnalysis | null
): Promise<AIEmailDraft> {
  const ai = getGeminiClient();

  const specificReqs = analysis?.specific_requirements?.length
    ? analysis.specific_requirements.join(', ')
    : 'Not detailed';

  const numBudget = lead.budget !== null && lead.budget !== undefined ? Number(lead.budget) : null;
  const formattedBudget = numBudget && !isNaN(numBudget)
    ? `${lead.currency || 'USD'} $${numBudget.toLocaleString('en-US')}`
    : 'Not specified';

  const userPrompt = `Craft a personalized initial reply email for the following client inquiry:

PROSPECT INFORMATION:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Not specified'}
- Service: ${lead.service || analysis?.service || 'Digital Agency Services'}
- Budget: ${formattedBudget}
- Timeline: ${lead.timeline || analysis?.timeline || 'Flexible'}
- Specific Requirements Identified: ${specificReqs}
- Original Message:
"""
${lead.message}
"""

Generate a natural, compelling, and professional email subject line and body. Return structured JSON.`;

  try {
    const response = await callGeminiWithModelFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: EMAIL_DRAFT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: emailDraftResponseSchema,
          temperature: 0.3,
        },
      });
    });

    const responseText = response.text;
    if (!responseText) {
      const candidate = response.candidates?.[0];
      throw new Error(
        `Gemini returned an empty email draft response. Finish reason: ${candidate?.finishReason || 'UNKNOWN'}`
      );
    }

    const rawParsed = JSON.parse(responseText);
    const validated = aiEmailDraftSchema.safeParse(rawParsed);

    if (!validated.success) {
      console.error('Gemini email draft validation errors:', validated.error.format());
      throw new Error('Gemini email draft did not match the expected structure.');
    }

    return validated.data;
  } catch (error) {
    console.error('Error during Gemini email draft generation:', error);
    throw error;
  }
}
