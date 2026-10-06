export type LeadStatus =
  | 'NEW'
  | 'AI_ANALYZED'
  | 'AI_ANALYSIS_FAILED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'CONTACTED'
  | 'CLOSED';

export type ResponseStatus = 'waiting' | 'replied' | 'no_response';

export type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'SKIPPED';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export type ServiceType =
  | 'Website Development'
  | 'Branding & Design'
  | 'Social Media'
  | 'Digital Advertising'
  | 'Other';

export type Timeline =
  | 'ASAP'
  | 'Within 1 week'
  | 'Within 1 month'
  | '1–3 months'
  | 'Flexible'
  | 'Not decided';

export type QualificationCategory = 'HIGH' | 'MEDIUM' | 'LOW';

export type CommunicationStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'SENT';

export type CommunicationType = 'initial_reply' | 'follow_up_1' | 'follow_up_2';

export interface LeadInput {
  name: string;
  email: string;
  company?: string;
  service?: ServiceType | string;
  budget?: number | null;
  currency: Currency;
  timeline?: Timeline | string;
  message: string;
  source?: string;
}

export interface ExtractedLeadData {
  name: string;
  email: string;
  company: string | null;
  service: string | null;
  budget: number | null;
  currency: Currency;
  timeline: string | null;
  message: string;
  specific_requirements: string[];
  notes?: string;
  source: 'email';
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  message: string;
  source: string;
  service: string | null;
  budget: number | null;
  currency: Currency;
  timeline: string | null;
  ai_score: number | null;
  qualification: QualificationCategory | null;
  intent: string | null;
  urgency: string | null;
  ai_summary: string | null;
  ai_reasoning: string | null;
  missing_information: string[] | null;
  recommended_action: string | null;
  status: LeadStatus;
  response_status?: ResponseStatus;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  follow_up_count?: number;
  created_at: string;
  updated_at: string;
  communications?: Communication[];
  follow_ups?: FollowUp[];
}

export interface AILeadAnalysis {
  service: string;
  budget: number | null;
  currency: string;
  timeline: string;
  intent: string;
  urgency: string;
  company_identified: boolean;
  specific_requirements: string[];
  summary: string;
  reasoning: string;
  missing_information: string[];
  recommended_action: string;
}

export interface ScoringFactor {
  name: string;
  points: number;
  maxPoints: number;
  met: boolean;
  description: string;
}

export interface QualificationResult {
  score: number;
  qualification: QualificationCategory;
  factors: ScoringFactor[];
  analysis: AILeadAnalysis;
}

export interface Communication {
  id: string;
  lead_id: string;
  type: CommunicationType | string;
  subject: string;
  body: string;
  status: CommunicationStatus;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  sent_at?: string | null;
  gmail_message_id?: string | null;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  follow_up_number: number;
  scheduled_for: string;
  status: FollowUpStatus;
  reason?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface FollowUpRecommendation {
  shouldFollowUp: boolean;
  followUpNumber: number | null;
  recommendedDate: string | null;
  recommendedDateFormatted: string | null;
  reason: string;
  nextAction: string;
  isDue: boolean;
  status: 'DUE' | 'UPCOMING' | 'PAUSED_REPLIED' | 'STOPPED_MAX' | 'PENDING_INITIAL';
}

export interface AIEmailDraft {
  subject: string;
  body: string;
}

export interface LeadActivityEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'intake' | 'analysis' | 'email_approved' | 'composer_opened' | 'response_recorded' | 'followup_recommended' | 'followup_approved';
}
