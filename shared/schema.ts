import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  role: text("role", { enum: ["coach", "athlete"] }).notNull().default("athlete"),
  coachId: integer("coach_id"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  timezone: text("timezone"),
  currentPhase: text("current_phase", { enum: ["off-season", "bulking", "cutting", "maintenance", "prep", "peak week", "post-show"] }).default("off-season"),
  nextShowName: text("next_show_name"),
  nextShowDate: timestamp("next_show_date"),
  workoutPlan: text("workout_plan"), // Placeholder for now
  mealPlan: text("meal_plan"), // Placeholder for now
  // sport: text("sport"), // Deprecated: Athletes inherit from coachIndustry via effectiveIndustry
  coachIndustry: text("coach_industry", { enum: ["bodybuilding", "powerlifting", "endurance", "crossfit"] }), // Coach's selected industry - athletes inherit this
  billingMode: text("billing_mode", { enum: ["platform", "external"] }),
  profile: jsonb("profile").$type<Record<string, any>>(), // Sport-specific athlete profile fields
  paymentStatus: text("payment_status", { enum: ["trial", "active", "past_due", "unpaid", "incomplete", "canceled", "waiting_for_coach"] }).default("trial"), // Athlete subscription status
  locked: boolean("locked").notNull().default(false),
  stripeAccountId: text("stripe_account_id"), // Stripe Connect account (optional)
});

export const checkins = pgTable("checkins", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  weight: text("weight"),
  photos: jsonb("photos").$type<string[]>(), // Array of URLs
  posePhotos: jsonb("pose_photos").$type<Record<string, string>>(), // Pose key -> photo URL
  poseRatings: jsonb("pose_ratings").$type<Record<string, number>>(), // Pose key -> rating
  notes: text("notes"),
  programChanges: text("program_changes"),
  sleep: integer("sleep"),
  stress: integer("stress"),
  adherence: integer("adherence"),
  energy: integer("energy"),
  hunger: integer("hunger"),
  mood: integer("mood"),
  digestion: integer("digestion"),
  coachFeedback: text("coach_feedback"),
  coachChanges: jsonb("coach_changes").$type<string[]>(), // Audit log for coach edits
  status: text("status").default("new"),
  data: jsonb("data").$type<Record<string, any>>(), // Flexible storage for sport-specific checkin fields
});

export const trainingBlocks = pgTable("training_blocks", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  phase: text("phase"),
  name: text("name").notNull(),
  focus: text("focus"),
  notes: text("notes"),
});

export const weeklyTrainingPlans = pgTable("weekly_training_plans", {
  id: serial("id").primaryKey(),
  trainingBlockId: integer("training_block_id").notNull(),
  weekStartDate: timestamp("week_start_date").notNull(),
  planJson: jsonb("plan_json").$type<Record<string, unknown>>(),
});

export const nutritionPlans = pgTable("nutrition_plans", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  phase: text("phase"),
  weekStartDate: timestamp("week_start_date").notNull(),
  proteinG: integer("protein_g"),
  carbsG: integer("carbs_g"),
  fatsG: integer("fats_g"),
  calories: integer("calories"),
  notes: text("notes"),
});

export const protocols = pgTable("protocols", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  type: text("type", { enum: ["supplement", "compound"] }).notNull(),
  name: text("name").notNull(),
  dose: text("dose"),
  frequency: text("frequency"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
});

export const healthMarkers = pgTable("health_markers", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  restingHr: integer("resting_hr"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  subjectiveHealth: integer("subjective_health"),
  notes: text("notes"),
});

export const trainingCompletions = pgTable("training_completions", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  dateKey: text("date_key").notNull(), // yyyy-mm-dd
  dayKey: text("day_key").notNull(), // Monday, Tuesday, etc.
  completed: boolean("completed").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const billingProfiles = pgTable("billing_profiles", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  coachId: integer("coach_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeSubscriptionItemId: text("stripe_subscription_item_id"),
  currentPriceId: text("current_price_id"),
  currentAmountCents: integer("current_amount_cents"),
  currency: text("currency").default("usd"),
  paymentStatus: text("payment_status", { enum: ["active", "past_due", "unpaid", "incomplete", "canceled"] }).default("incomplete"),
  locked: boolean("locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  athleteId: integer("athlete_id").notNull(),
  coachId: integer("coach_id").notNull(),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripeChargeId: text("stripe_charge_id"),
  amountCents: integer("amount_cents"),
  currency: text("currency"),
  status: text("status", { enum: ["paid", "open", "void", "uncollectible", "failed"] }).notNull(),
  invoiceUrl: text("invoice_url"),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"), // 'image', 'video'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  coach: one(users, {
    fields: [users.coachId],
    references: [users.id],
    relationName: "coach_athletes",
  }),
  athletes: many(users, {
    relationName: "coach_athletes",
  }),
  checkins: many(checkins),
  billingProfiles: many(billingProfiles),
  payments: many(payments),
  sentMessages: many(messages, { relationName: "sent_messages" }),
  receivedMessages: many(messages, { relationName: "received_messages" }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sent_messages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "received_messages",
  }),
}));

export const checkinsRelations = relations(checkins, ({ one }) => ({
  athlete: one(users, {
    fields: [checkins.athleteId],
    references: [users.id],
  }),
}));

export const billingProfilesRelations = relations(billingProfiles, ({ one }) => ({
  athlete: one(users, {
    fields: [billingProfiles.athleteId],
    references: [users.id],
  }),
  coach: one(users, {
    fields: [billingProfiles.coachId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  athlete: one(users, {
    fields: [payments.athleteId],
    references: [users.id],
  }),
  coach: one(users, {
    fields: [payments.coachId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCheckinSchema = createInsertSchema(checkins).omit({ id: true, date: true });
export const insertTrainingBlockSchema = createInsertSchema(trainingBlocks).omit({ id: true });
export const insertWeeklyTrainingPlanSchema = createInsertSchema(weeklyTrainingPlans).omit({ id: true });
export const insertNutritionPlanSchema = createInsertSchema(nutritionPlans).omit({ id: true });
export const insertProtocolSchema = createInsertSchema(protocols).omit({ id: true });
export const insertHealthMarkerSchema = createInsertSchema(healthMarkers).omit({ id: true, date: true });
export const insertTrainingCompletionSchema = createInsertSchema(trainingCompletions).omit({ id: true, createdAt: true });
export const insertBillingProfileSchema = createInsertSchema(billingProfiles).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect & {
  effectiveIndustry?: string | null;
  coachBillingMode?: string | null;
};
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Checkin = typeof checkins.$inferSelect;
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type TrainingBlock = typeof trainingBlocks.$inferSelect;
export type InsertTrainingBlock = z.infer<typeof insertTrainingBlockSchema>;
export type WeeklyTrainingPlan = typeof weeklyTrainingPlans.$inferSelect;
export type InsertWeeklyTrainingPlan = z.infer<typeof insertWeeklyTrainingPlanSchema>;
export type NutritionPlan = typeof nutritionPlans.$inferSelect;
export type InsertNutritionPlan = z.infer<typeof insertNutritionPlanSchema>;
export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;
export type HealthMarker = typeof healthMarkers.$inferSelect;
export type InsertHealthMarker = z.infer<typeof insertHealthMarkerSchema>;
export type TrainingCompletion = typeof trainingCompletions.$inferSelect;
export type InsertTrainingCompletion = z.infer<typeof insertTrainingCompletionSchema>;
export type BillingProfile = typeof billingProfiles.$inferSelect;
export type InsertBillingProfile = z.infer<typeof insertBillingProfileSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
