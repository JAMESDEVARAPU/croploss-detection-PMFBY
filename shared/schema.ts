import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mobile: text("mobile").notNull(),
  language: text("language").notNull().default("en"),
});

export const cropAnalyses = pgTable("crop_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  fieldArea: real("field_area").notNull(),
  cropType: text("crop_type").notNull(),
  lossPercentage: real("loss_percentage"),
  ndviBefore: real("ndvi_before"),
  ndviCurrent: real("ndvi_current"),
  confidence: real("confidence"),
  affectedArea: real("affected_area"),
  estimatedValue: real("estimated_value"),
  damageCause: text("damage_cause"),
  pmfbyEligible: boolean("pmfby_eligible"),
  compensationAmount: real("compensation_amount"),
  analysisDate: timestamp("analysis_date").defaultNow(),
  satelliteImages: json("satellite_images"),
  smsStatus: text("sms_status").default("pending"),
});

export const pmfbyRules = pgTable("pmfby_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cropType: text("crop_type").notNull(),
  minimumLossThreshold: real("minimum_loss_threshold").notNull(),
  compensationRate: real("compensation_rate").notNull(),
  maxCompensation: real("max_compensation"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertCropAnalysisSchema = createInsertSchema(cropAnalyses).omit({
  id: true,
  userId: true,
  lossPercentage: true,
  ndviBefore: true,
  ndviCurrent: true,
  confidence: true,
  affectedArea: true,
  estimatedValue: true,
  damageCause: true,
  pmfbyEligible: true,
  compensationAmount: true,
  analysisDate: true,
  satelliteImages: true,
  smsStatus: true,
}).extend({
  mobile: z.string(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CropAnalysis = typeof cropAnalyses.$inferSelect;
export type InsertCropAnalysis = z.infer<typeof insertCropAnalysisSchema>;
export type PMFBYRule = typeof pmfbyRules.$inferSelect;
