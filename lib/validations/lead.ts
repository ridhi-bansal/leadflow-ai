import { z } from 'zod';
import {
  normalizeService,
  normalizeCurrency,
  normalizeTimeline,
} from './normalization';

export const leadInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email address'),
  company: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => val || null),
  service: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val ? normalizeService(val) : null)),
  budget: z
    .union([z.number().positive('Budget must be greater than 0'), z.nan(), z.null(), z.string()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'number' ? val : Number(val);
      return isNaN(num) || num <= 0 ? null : num;
    }),
  currency: z
    .string()
    .optional()
    .default('USD')
    .transform((val) => normalizeCurrency(val)),
  timeline: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val ? normalizeTimeline(val) : null)),
  message: z.string().trim().min(10, 'Please provide a descriptive message (at least 10 characters)'),
  source: z.string().optional().default('form'),
});

export const extractEmailInputSchema = z.object({
  rawEmail: z.string().trim().min(10, 'Please paste a valid email inquiry (at least 10 characters)'),
});

export const extractedLeadSchema = z.object({
  name: z.string().default(''),
  email: z.string().default(''),
  company: z
    .string()
    .nullable()
    .default(null)
    .transform((val) => val || null),
  service: z
    .string()
    .nullable()
    .default('Website Development')
    .transform((val) => (val ? normalizeService(val) : 'Website Development')),
  budget: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'number' ? val : Number(val);
      return isNaN(num) || num <= 0 ? null : num;
    }),
  currency: z
    .string()
    .optional()
    .default('USD')
    .transform((val) => normalizeCurrency(val)),
  timeline: z
    .string()
    .nullable()
    .default(null)
    .transform((val) => (val ? normalizeTimeline(val) : null)),
  message: z.string().default(''),
  specific_requirements: z.array(z.string()).default([]),
  notes: z.string().optional().default(''),
  source: z.literal('email').default('email'),
});

export const aiLeadAnalysisSchema = z.object({
  service: z.string().default('Unknown'),
  budget: z.number().nullable().default(null),
  currency: z.string().default('USD'),
  timeline: z.string().default('Unspecified'),
  intent: z.string().default('Medium'),
  urgency: z.string().default('Medium'),
  company_identified: z.boolean().default(false),
  specific_requirements: z.array(z.string()).default([]),
  summary: z.string().default(''),
  reasoning: z.string().default(''),
  missing_information: z.array(z.string()).default([]),
  recommended_action: z.string().default('Review inquiry'),
});

export const aiEmailDraftSchema = z.object({
  subject: z.string().min(1, 'Subject line is required'),
  body: z.string().min(10, 'Email body is required'),
});

export const updateCommunicationSchema = z.object({
  subject: z.string().trim().min(1, 'Subject line cannot be empty'),
  body: z.string().trim().min(10, 'Email body cannot be empty'),
});

export type LeadInputSchemaType = z.infer<typeof leadInputSchema>;
export type ExtractEmailInputSchemaType = z.infer<typeof extractEmailInputSchema>;
export type ExtractedLeadSchemaType = z.infer<typeof extractedLeadSchema>;
export type AILeadAnalysisSchemaType = z.infer<typeof aiLeadAnalysisSchema>;
export type AIEmailDraftSchemaType = z.infer<typeof aiEmailDraftSchema>;
export type UpdateCommunicationSchemaType = z.infer<typeof updateCommunicationSchema>;
