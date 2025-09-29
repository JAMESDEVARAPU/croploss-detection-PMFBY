import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), 'data');

export async function ensureStorageDir() {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  }
}

export async function saveAnalysisData(analysisId: string, data: any) {
  await ensureStorageDir();
  const filePath = path.join(STORAGE_DIR, `analysis_${analysisId}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  return filePath;
}

export async function loadAnalysisData(analysisId: string) {
  const filePath = path.join(STORAGE_DIR, `analysis_${analysisId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveImageData(imageId: string, imageBuffer: Buffer, mimeType: string) {
  await ensureStorageDir();
  const extension = mimeType.split('/')[1] || 'jpg';
  const filePath = path.join(STORAGE_DIR, `image_${imageId}.${extension}`);
  await fs.writeFile(filePath, imageBuffer);
  return filePath;
}

export async function loadImageData(imageId: string) {
  const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  for (const ext of extensions) {
    const filePath = path.join(STORAGE_DIR, `image_${imageId}.${ext}`);
    try {
      const data = await fs.readFile(filePath);
      return data;
    } catch {
      continue;
    }
  }
  
  return null;
}

export const storage = {
  users: new Map(),
  analyses: new Map(),
  
  async getUserByMobile(mobile: string) {
    return Array.from(this.users.values()).find((user: any) => user.mobile === mobile);
  },
  
  async createUser(userData: any) {
    const id = Date.now().toString();
    const user = { id, ...userData, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  },
  
  async updateUser(id: string, updates: any) {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, updates);
      return user;
    }
    return null;
  },
  
  async createCropAnalysis(data: any) {
    const id = Date.now().toString();
    const analysis = { id, ...data, createdAt: new Date() };
    this.analyses.set(id, analysis);
    return analysis;
  },
  
  async getCropAnalysis(id: string) {
    return this.analyses.get(id);
  },
  
  async updateCropAnalysis(id: string, updates: any) {
    const analysis = this.analyses.get(id);
    if (analysis) {
      Object.assign(analysis, updates);
      return analysis;
    }
    return null;
  },
  
  async getCropAnalysesByUser(userId: string) {
    return Array.from(this.analyses.values()).filter((analysis: any) => analysis.userId === userId);
  },
  
  async getUser(id: string) {
    return this.users.get(id);
  },
  
  async getAllPMFBYRules() {
    return [];
  }
};