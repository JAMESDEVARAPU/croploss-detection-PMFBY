import { storage } from "../storage";
import { CropAnalysis, PMFBYRule } from "@shared/schema";

export interface PMFBYEligibilityResult {
  eligible: boolean;
  compensationAmount: number;
  reason: string;
  requirements: {
    minimumLossThreshold: boolean;
    policyStatus: boolean;
    areaCoverage: boolean;
    reportingWindow: boolean;
  };
}

export class PMFBYService {
  async checkEligibility(analysis: CropAnalysis): Promise<PMFBYEligibilityResult> {
    const rule = await storage.getPMFBYRule(analysis.cropType);
    
    if (!rule) {
      return {
        eligible: false,
        compensationAmount: 0,
        reason: "Crop type not covered under PMFBY",
        requirements: {
          minimumLossThreshold: false,
          policyStatus: false,
          areaCoverage: false,
          reportingWindow: false,
        }
      };
    }

    const requirements = {
      minimumLossThreshold: (analysis.lossPercentage || 0) >= rule.minimumLossThreshold,
      policyStatus: true, // Assume active policy for demo
      areaCoverage: true, // Assume area is covered
      reportingWindow: this.isWithinReportingWindow(analysis.analysisDate!),
    };

    const eligible = Object.values(requirements).every(req => req);
    
    let compensationAmount = 0;
    if (eligible && analysis.estimatedValue) {
      compensationAmount = Math.min(
        analysis.estimatedValue * rule.compensationRate,
        rule.maxCompensation || Infinity
      );
    }

    return {
      eligible,
      compensationAmount: Math.round(compensationAmount),
      reason: eligible ? "Eligible for compensation" : this.getIneligibilityReason(requirements),
      requirements,
    };
  }

  private isWithinReportingWindow(analysisDate: Date): boolean {
    const now = new Date();
    const daysDiff = Math.abs(now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 72; // 72 hour reporting window
  }

  private getIneligibilityReason(requirements: PMFBYEligibilityResult['requirements']): string {
    if (!requirements.minimumLossThreshold) return "Loss percentage below minimum threshold";
    if (!requirements.policyStatus) return "Policy not active";
    if (!requirements.areaCoverage) return "Area not covered under PMFBY";
    if (!requirements.reportingWindow) return "Outside reporting window";
    return "Unknown reason";
  }
}

export const pmfbyService = new PMFBYService();
