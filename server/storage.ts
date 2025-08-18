import { type User, type InsertUser, type CropAnalysis, type InsertCropAnalysis, type PMFBYRule } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  // Crop Analyses
  getCropAnalysis(id: string): Promise<CropAnalysis | undefined>;
  getCropAnalysesByUser(userId: string): Promise<CropAnalysis[]>;
  createCropAnalysis(analysis: Omit<InsertCropAnalysis, 'mobile'> & { userId: string }): Promise<CropAnalysis>;
  updateCropAnalysis(id: string, analysis: Partial<CropAnalysis>): Promise<CropAnalysis | undefined>;

  // PMFBY Rules
  getPMFBYRule(cropType: string): Promise<PMFBYRule | undefined>;
  getAllPMFBYRules(): Promise<PMFBYRule[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cropAnalyses: Map<string, CropAnalysis>;
  private pmfbyRules: Map<string, PMFBYRule>;

  constructor() {
    this.users = new Map();
    this.cropAnalyses = new Map();
    this.pmfbyRules = new Map();

    // Initialize PMFBY rules
    this.initializePMFBYRules();
  }

  private initializePMFBYRules() {
    const rules: PMFBYRule[] = [
      { id: randomUUID(), cropType: "rice", minimumLossThreshold: 33, compensationRate: 0.75, maxCompensation: 50000 },
      { id: randomUUID(), cropType: "wheat", minimumLossThreshold: 33, compensationRate: 0.75, maxCompensation: 45000 },
      { id: randomUUID(), cropType: "cotton", minimumLossThreshold: 33, compensationRate: 0.80, maxCompensation: 60000 },
      { id: randomUUID(), cropType: "sugarcane", minimumLossThreshold: 33, compensationRate: 0.70, maxCompensation: 80000 },
      { id: randomUUID(), cropType: "maize", minimumLossThreshold: 33, compensationRate: 0.75, maxCompensation: 40000 },
    ];

    rules.forEach(rule => this.pmfbyRules.set(rule.cropType, rule));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.mobile === mobile);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      language: insertUser.language || "en"
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCropAnalysis(id: string): Promise<CropAnalysis | undefined> {
    return this.cropAnalyses.get(id);
  }

  async getCropAnalysesByUser(userId: string): Promise<CropAnalysis[]> {
    return Array.from(this.cropAnalyses.values())
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => new Date(b.analysisDate!).getTime() - new Date(a.analysisDate!).getTime());
  }

  async createCropAnalysis(analysisData: Omit<InsertCropAnalysis, 'mobile'> & { userId: string }): Promise<CropAnalysis> {
    const id = randomUUID();
    const analysis: CropAnalysis = {
      ...analysisData,
      id,
      analysisDate: new Date(),
      lossPercentage: null,
      ndviBefore: null,
      ndviCurrent: null,
      confidence: null,
      affectedArea: null,
      estimatedValue: null,
      damageCause: null,
      pmfbyEligible: null,
      compensationAmount: null,
      satelliteImages: null,
      acquisitionDates: null,
      smsStatus: "pending",
    };
    this.cropAnalyses.set(id, analysis);
    return analysis;
  }

  async updateCropAnalysis(id: string, updateData: Partial<CropAnalysis>): Promise<CropAnalysis | undefined> {
    const analysis = this.cropAnalyses.get(id);
    if (!analysis) return undefined;

    const updatedAnalysis = { ...analysis, ...updateData };
    this.cropAnalyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async getPMFBYRule(cropType: string): Promise<PMFBYRule | undefined> {
    return this.pmfbyRules.get(cropType);
  }

  async getAllPMFBYRules(): Promise<PMFBYRule[]> {
    return Array.from(this.pmfbyRules.values());
  }
}

export const storage = new MemStorage();
