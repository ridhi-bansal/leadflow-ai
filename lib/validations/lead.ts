import { z } from 'zod';

export const leadInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email address'),
  company: z.string().trim().optional().or(z.literal('')),
  service: z
    .enum([
      'Website Development',
      'Branding & Design',
      'Social Media',
      'Digital Advertising',
      'Other',
    ])
    .optional()
    .or(z.literal('')),
  budget: z
    .union([z.number().positive('Budget must be greater than 0'), z.nan(), z.null()])
    .optional()
    .transform((val) => (val === null || (typeof val === 'number' && isNaN(val)) ? null : val)),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  timeline: z
    .enum([
      'ASAP',
      'Within 1 week',
      'Within 1 month',
      '1–3 months',
      'Flexible',
      'Not decided',
    ])
    .optional()
    .or(z.literal('')),
  message: z.string().trim().min(10, 'Please provide a descriptive message (at least 10 characters)'),
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
export type AILeadAnalysisSchemaType = z.infer<typeof aiLeadAnalysisSchema>;
export type AIEmailDraftSchemaType = z.infer<typeof aiEmailDraftSchema>;
export type UpdateCommunicationSchemaType = z.infer<typeof updateCommunicationSchema>;
