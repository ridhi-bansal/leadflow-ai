import {
  AILeadAnalysis,
  LeadInput,
  QualificationCategory,
  QualificationResult,
  ScoringFactor,
} from '@/types/lead';

/**
 * Service-specific budget thresholds for American digital marketing agencies.
 * Used for deterministic evaluation of the "Realistic budget" factor.
 */
export interface ServiceBudgetThreshold {
  min: number;
  max: number;
  typicalMin: number;
}

export const SERVICE_BUDGET_THRESHOLDS: Record<string, ServiceBudgetThreshold> = {
  'Website Development': { min: 2500, max: 150000, typicalMin: 4000 },
  'Branding & Design': { min: 1500, max: 60000, typicalMin: 2500 },
  'Social Media': { min: 1000, max: 35000, typicalMin: 1500 },
  'Digital Advertising': { min: 2000, max: 80000, typicalMin: 3000 },
  Other: { min: 1000, max: 100000, typicalMin: 2000 },
};

/**
 * Normalizes service string to match threshold keys
 */
function matchServiceKey(serviceName: string): string {
  const lower = serviceName.toLowerCase();
  if (lower.includes('web') || lower.includes('site') || lower.includes('ecommerce') || lower.includes('app')) {
    return 'Website Development';
  }
  if (lower.includes('brand') || lower.includes('design') || lower.includes('logo')) {
    return 'Branding & Design';
  }
  if (lower.includes('social') || lower.includes('content') || lower.includes('instagram')) {
    return 'Social Media';
  }
  if (lower.includes('ad') || lower.includes('ppc') || lower.includes('marketing') || lower.includes('seo')) {
    return 'Digital Advertising';
  }
  return 'Other';
}

/**
 * Checks if a budget is realistic based on the requested service.
 */
export function isBudgetRealistic(
  budget: number | null | undefined,
  serviceName: string,
  _currency: string = 'USD'
): { isRealistic: boolean; reason: string } {
  if (!budget || budget <= 0) {
    return { isRealistic: false, reason: 'No budget specified' };
  }

  // Handle USD and rough parity currencies
  const key = matchServiceKey(serviceName);
  const threshold = SERVICE_BUDGET_THRESHOLDS[key] || SERVICE_BUDGET_THRESHOLDS['Other'];

  if (budget >= threshold.min && budget <= threshold.max) {
    return {
      isRealistic: true,
      reason: `Budget of $${budget.toLocaleString('en-US')} is within the healthy agency range for ${key} ($${threshold.min.toLocaleString()}–$${threshold.max.toLocaleString()})`,
    };
  }

  if (budget < threshold.min) {
    return {
      isRealistic: false,
      reason: `Budget of $${budget.toLocaleString('en-US')} is below standard agency minimum for ${key} ($${threshold.min.toLocaleString()})`,
    };
  }

  return {
    isRealistic: true,
    reason: `Enterprise-tier budget ($${budget.toLocaleString('en-US')})`,
  };
}

/**
 * Deterministically computes the qualification score and breakdown.
 *
 * Scoring Rules (Max 100):
 * - Clear service requirement: +25
 * - Budget provided: +20
 * - Realistic budget: +15
 * - Clear timeline: +15
 * - Strong buying intent: +15
 * - Business/company identified: +5
 * - Specific requirements: +5
 */
export function calculateQualificationScore(
  input: LeadInput,
  aiAnalysis: AILeadAnalysis
): QualificationResult {
  const factors: ScoringFactor[] = [];
  let totalScore = 0;

  // 1. Clear service requirement (+25)
  const hasService = Boolean(
    (input.service && input.service !== 'Other' && input.service.trim() !== '') ||
      (aiAnalysis.service &&
        aiAnalysis.service.toLowerCase() !== 'unknown' &&
        aiAnalysis.service.toLowerCase() !== 'other' &&
        aiAnalysis.service.trim() !== '')
  );
  const detectedService = input.service || aiAnalysis.service || 'General Inquiry';
  factors.push({
    name: 'Clear Service Requirement',
    points: hasService ? 25 : 0,
    maxPoints: 25,
    met: hasService,
    description: hasService
      ? `Clear project focus identified: ${detectedService}`
      : 'Service requested is vague or unspecified',
  });
  if (hasService) totalScore += 25;

  // 2. Budget provided (+20)
  const numericBudget = input.budget ?? aiAnalysis.budget;
  const hasBudget = typeof numericBudget === 'number' && numericBudget > 0;
  factors.push({
    name: 'Budget Provided',
    points: hasBudget ? 20 : 0,
    maxPoints: 20,
    met: hasBudget,
    description: hasBudget
      ? `Specified budget: ${input.currency || aiAnalysis.currency || 'USD'} ${numericBudget.toLocaleString('en-US')}`
      : 'No budget indicated by prospect',
  });
  if (hasBudget) totalScore += 20;

  // 3. Realistic budget (+15)
  const budgetEvaluation = isBudgetRealistic(numericBudget, detectedService, input.currency);
  const hasRealisticBudget = hasBudget && budgetEvaluation.isRealistic;
  factors.push({
    name: 'Budget Appears Realistic',
    points: hasRealisticBudget ? 15 : 0,
    maxPoints: 15,
    met: hasRealisticBudget,
    description: budgetEvaluation.reason,
  });
  if (hasRealisticBudget) totalScore += 15;

  // 4. Clear timeline (+15)
  const timelineValue = input.timeline || aiAnalysis.timeline;
  const hasTimeline = Boolean(
    timelineValue &&
      timelineValue.trim() !== '' &&
      timelineValue.toLowerCase() !== 'not decided' &&
      timelineValue.toLowerCase() !== 'unknown' &&
      timelineValue.toLowerCase() !== 'unspecified'
  );
  factors.push({
    name: 'Clear Timeline',
    points: hasTimeline ? 15 : 0,
    maxPoints: 15,
    met: hasTimeline,
    description: hasTimeline
      ? `Defined timeframe: ${timelineValue}`
      : 'Timeline is flexible, unstated, or undecided',
  });
  if (hasTimeline) totalScore += 15;

  // 5. Strong buying intent (+15)
  const isHighIntent =
    aiAnalysis.intent.toLowerCase().includes('high') ||
    aiAnalysis.intent.toLowerCase().includes('ready');
  factors.push({
    name: 'Strong Buying Intent',
    points: isHighIntent ? 15 : 0,
    maxPoints: 15,
    met: isHighIntent,
    description: isHighIntent
      ? `High intent signals detected (${aiAnalysis.intent})`
      : `Moderate or exploratory intent (${aiAnalysis.intent})`,
  });
  if (isHighIntent) totalScore += 15;

  // 6. Business/company identified (+5)
  const hasCompany = Boolean(
    (input.company && input.company.trim().length > 0) || aiAnalysis.company_identified
  );
  factors.push({
    name: 'Business/Company Identified',
    points: hasCompany ? 5 : 0,
    maxPoints: 5,
    met: hasCompany,
    description: hasCompany
      ? `Company verified: ${input.company || 'Identified from inquiry'}`
      : 'No registered company or business name provided',
  });
  if (hasCompany) totalScore += 5;

  // 7. Specific requirements (+5)
  const hasRequirements =
    Array.isArray(aiAnalysis.specific_requirements) &&
    aiAnalysis.specific_requirements.length > 0;
  factors.push({
    name: 'Specific Requirements',
    points: hasRequirements ? 5 : 0,
    maxPoints: 5,
    met: hasRequirements,
    description: hasRequirements
      ? `${aiAnalysis.specific_requirements.length} clear feature/deliverable requirements noted`
      : 'No detailed technical or deliverable specs outlined',
  });
  if (hasRequirements) totalScore += 5;

  // Final category
  let qualification: QualificationCategory = 'LOW';
  if (totalScore >= 80) {
    qualification = 'HIGH';
  } else if (totalScore >= 50) {
    qualification = 'MEDIUM';
  } else {
    qualification = 'LOW';
  }

  return {
    score: totalScore,
    qualification,
    factors,
    analysis: aiAnalysis,
  };
}
