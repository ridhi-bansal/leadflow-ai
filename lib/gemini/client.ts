import { GoogleGenAI, Type } from '@google/genai';
import { AILeadAnalysis, LeadInput, AIEmailDraft, Lead, ExtractedLeadData } from '@/types/lead';
import {
  aiLeadAnalysisSchema,
  aiEmailDraftSchema,
  extractedLeadSchema,
} from '@/lib/validations/lead';

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
      description:
        'A compelling, personalized, and professional email subject line for the initial agency reply (e.g. "Re: Website Development for Oak & Thread Apparel")',
    },
    body: {
      type: Type.STRING,
      description:
        'The full personalized email body in STRICT PLAIN TEXT ONLY. Must use standard double-newlines (\\n\\n) between paragraphs. Absolutely NO markdown links (e.g. [text](url)), NO mailto: links, NO html tags, and NO raw markdown formatting.',
    },
  },
  required: ['subject', 'body'],
};

/**
 * Structured schema definition for Gemini raw email lead extraction
 */
const extractLeadEmailResponseSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: 'The contact person\'s full name extracted from the email sender, greeting, or signature.',
    },
    email: {
      type: Type.STRING,
      description: 'The contact person\'s email address extracted from the header, From line, or text.',
    },
    company: {
      type: Type.STRING,
      description: 'The business, company, brand, or startup name mentioned in the email, or null if unknown.',
    },
    service: {
      type: Type.STRING,
      description:
        'The best matching agency service category: Website Development, Branding & Design, Social Media, Digital Advertising, or Other.',
    },
    budget: {
      type: Type.NUMBER,
      description: 'The numeric budget amount mentioned in the email (e.g. 8000 for $8,000), or null if none mentioned.',
    },
    currency: {
      type: Type.STRING,
      description: 'The currency code (USD, EUR, GBP, CAD, AUD). Default to USD if unspecified.',
    },
    timeline: {
      type: Type.STRING,
      description:
        'The requested timeline or launch date (e.g. "Within 1 month", "ASAP", "1–3 months", "Flexible", or null).',
    },
    message: {
      type: Type.STRING,
      description:
        'A clean, coherent, and complete extracted message describing their project needs and inquiry.',
    },
    specific_requirements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Key deliverables, features, or requirements mentioned in the email.',
    },
    notes: {
      type: Type.STRING,
      description: 'Any notable context or extraction observations for the sales team.',
    },
  },
  required: [
    'name',
    'email',
    'company',
    'service',
    'currency',
    'timeline',
    'message',
    'specific_requirements',
  ],
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

STRICT FORMATTING & WRITING RULES:
1. STRICT PLAIN TEXT ONLY:
   - Do NOT use markdown links like [Schedule a call](https://cal.com/northstar) or [email](mailto:...).
   - Do NOT use mailto: links.
   - Do NOT use HTML formatting (<p>, <a>, <br>).
   - Format paragraphs cleanly using double-newlines (\\n\\n).
   - Format the salutation on its own line followed by a blank line (e.g. "Hi Sarah,\\n\\n").
   - Format the closing and signature on separate clean lines (e.g. "\\n\\nBest regards,\\nAlex Morgan\\nClient Strategy Director, Northstar Studio\\nhello@northstarstudio.com").

2. PERSONALIZED & SPECIFIC: Reference their specific brand/company name, requested service, and key requirements mentioned in their message (e.g., ecommerce functionality, checkout, product pages, brand identity).

3. ONLY USE FACTUAL INFORMATION: Only reference budget, timeline, and requirements that the prospect actually provided. If budget or timeline was NOT provided, DO NOT fabricate or invent numbers or dates.

4. PROHIBITED PHRASING & TOPICS:
   - NEVER mention AI, artificial intelligence, automated analysis, qualification scores, algorithms, or "LeadFlow AI".
   - NEVER claim that you or Northstar Studio have already spoken with them, met with them, or scheduled a meeting.
   - NEVER make binding financial guarantees, exact quote promises, or unsupported delivery commitments.
   - NEVER sound robotic or use boilerplate filler phrases.

5. TONE & STYLE: Warm, consultative, authoritative, helpful, and natural for an American creative agency.

6. CALL TO ACTION: Propose an easy next step (e.g., a brief 15-minute discovery call this week to discuss their goals, architecture, and timeline).`;

const EXTRACT_LEAD_EMAIL_SYSTEM_INSTRUCTION = `You are an expert lead ingestion intelligence engine for Northstar Studio.
Your job is to extract structured lead information from raw, unformatted, or pasted prospect email inquiries.

EXTRACTION RULES:
1. Extract the sender's full name, email address, company/brand name, requested service, budget amount, currency, and timeline.
2. If the budget is mentioned (e.g., "$8k", "$8,000", "8000 USD", "around 10k euros"), convert it to an exact integer (e.g., 8000, 10000) and identify the currency (USD, EUR, GBP, CAD, AUD).
3. If no budget is specified, set budget to null.
4. If company name is not mentioned, set company to null.
5. If email address is not in the text or headers, set email to an empty string.
6. Service should be classified into one of: "Website Development", "Branding & Design", "Social Media", "Digital Advertising", or "Other".
7. Extract a clean, coherent message containing the core inquiry without email header clutter or disclaimers.
8. Extract specific deliverables or requirements into specific_requirements.
9. DO NOT invent facts not present in the raw email.`;

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

    // Clean plain text: remove any stray markdown links [text](url) -> text, and mailto: links
    const cleanBody = cleanPlainTextEmail(validated.data.body);

    return {
      subject: validated.data.subject.trim(),
      body: cleanBody,
    };
  } catch (error) {
    console.error('Error during Gemini email draft generation:', error);
    throw error;
  }
}

/**
 * Strips markdown links, mailto links, and HTML tags to enforce clean plain text.
 */
function cleanPlainTextEmail(text: string): string {
  if (!text) return '';

  return (
    text
      // Replace markdown link [Label](url) with Label (or url if label is URL)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
        if (label === url) return label;
        if (url.startsWith('mailto:')) return label;
        return `${label} (${url})`;
      })
      // Strip mailto: prefixes
      .replace(/mailto:/gi, '')
      // Strip any stray HTML tags
      .replace(/<[^>]*>/g, '')
      // Normalize multiple carriage returns
      .replace(/\r\n/g, '\n')
      // Remove trailing whitespace per line
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim()
  );
}

/**
 * Structured schema definition for Gemini follow-up email reply draft
 */
const FOLLOWUP_DRAFT_SYSTEM_INSTRUCTION = `You are a senior client strategist and sales director at Northstar Studio, a premier American digital agency.

Your job is to craft a concise, natural, warm, and highly professional follow-up email to a prospective client who has not yet responded to our previous message.

STRICT FORMATTING & WRITING RULES:
1. STRICT PLAIN TEXT ONLY:
   - Do NOT use markdown links like [Schedule a call](url).
   - Do NOT use mailto: links.
   - Do NOT use HTML tags.
   - Format paragraphs cleanly with double-newlines (\\n\\n).
   - Format closing and signature cleanly on separate lines.

2. CONCISE & RESPECTFUL:
   - Follow-up #1 should be much shorter than initial outreach (2 short paragraphs).
   - Follow-up #2 should be very brief and graceful (1-2 short paragraphs).
   - Reference their specific brand/company and project scope naturally.

3. PROHIBITED PHRASING & TOPICS:
   - NEVER mention AI, algorithms, automated follow-up sequences, or "LeadFlow AI".
   - NEVER sound aggressive, demanding, or guilty.
   - NEVER invent facts or budgets not in the original lead context.

4. CALL TO ACTION: A low-friction question (e.g., "Are you still aiming for a November launch?", "Would 15 minutes this week or next work to discuss your project?").`;

/**
 * Generates a concise follow-up email draft using Gemini.
 */
export async function generateFollowUpDraftWithGemini(
  lead: Lead,
  followUpNumber: number = 1,
  previousCommunications: { type: string; subject: string; body: string }[] = [],
  analysis?: AILeadAnalysis | null
): Promise<AIEmailDraft> {
  const ai = getGeminiClient();

  const prevContext = previousCommunications
    .map((c, i) => `--- PREVIOUS MESSAGE ${i + 1} (${c.type}) ---\nSubject: ${c.subject}\n\n${c.body}`)
    .join('\n\n');

  const userPrompt = `Craft Follow-up #${followUpNumber} email for this prospective client:

PROSPECT INFORMATION:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company || 'Not specified'}
- Requested Service: ${lead.service || analysis?.service || 'Digital Agency Services'}
- Target Timeline: ${lead.timeline || analysis?.timeline || 'Upcoming'}
- Original Inquiry:
"""
${lead.message}
"""

${prevContext ? `PREVIOUS OUTREACH HISTORY:\n${prevContext}\n` : ''}

GOAL:
Write a natural, concise, and compelling Follow-up #${followUpNumber} email.
${
  followUpNumber === 1
    ? 'Follow-up #1 should briefly check in, touch on their timeline, and ask if they are ready to connect.'
    : 'Follow-up #2 is a final courteous check-in acknowledging their busy schedule and keeping the door open.'
}

Generate structured JSON with subject and body.`;

  try {
    const response = await callGeminiWithModelFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: FOLLOWUP_DRAFT_SYSTEM_INSTRUCTION,
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
        `Gemini returned an empty follow-up draft response. Finish reason: ${candidate?.finishReason || 'UNKNOWN'}`
      );
    }

    const rawParsed = JSON.parse(responseText);
    const validated = aiEmailDraftSchema.safeParse(rawParsed);

    if (!validated.success) {
      console.error('Gemini follow-up draft validation errors:', validated.error.format());
      throw new Error('Gemini follow-up draft did not match the expected structure.');
    }

    const cleanBody = cleanPlainTextEmail(validated.data.body);

    return {
      subject: validated.data.subject.trim(),
      body: cleanBody,
    };
  } catch (error) {
    console.error(`Error during Gemini Follow-up #${followUpNumber} draft generation:`, error);
    throw error;
  }
}

/**
 * Extracts structured lead data from a pasted/raw prospect email using Gemini.
 */
export async function extractLeadFromPastedEmail(
  rawEmail: string
): Promise<ExtractedLeadData> {
  const ai = getGeminiClient();

  const userPrompt = `Please parse and extract structured lead details from the following incoming raw email inquiry for Northstar Studio:

RAW EMAIL CONTENT:
"""
${rawEmail}
"""

Extract the fields according to the schema rules and return structured JSON.`;

  try {
    const response = await callGeminiWithModelFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction: EXTRACT_LEAD_EMAIL_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: extractLeadEmailResponseSchema,
          temperature: 0.1,
        },
      });
    });

    const responseText = response.text;
    if (!responseText) {
      const candidate = response.candidates?.[0];
      throw new Error(
        `Gemini returned an empty email extraction response. Finish reason: ${candidate?.finishReason || 'UNKNOWN'}`
      );
    }

    const rawParsed = JSON.parse(responseText);
    const validated = extractedLeadSchema.safeParse(rawParsed);

    if (!validated.success) {
      console.error('Gemini lead extraction validation errors:', validated.error.format());
      throw new Error('Gemini lead extraction did not match the expected structure.');
    }

    return {
      ...validated.data,
      source: 'email',
    };
  } catch (error) {
    console.error('Error during Gemini email lead extraction:', error);
    throw error;
  }
}


