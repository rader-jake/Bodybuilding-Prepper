import { db } from "./db";
import {
  users,
  checkins,
  trainingBlocks,
  weeklyTrainingPlans,
  nutritionPlans,
  protocols,
  healthMarkers,
  trainingCompletions,
  messages,
  type User,
  type InsertUser,
  type Checkin,
  type InsertCheckin,
  type TrainingBlock,
  type InsertTrainingBlock,
  type WeeklyTrainingPlan,
  type InsertWeeklyTrainingPlan,
  type NutritionPlan,
  type InsertNutritionPlan,
  type Protocol,
  type InsertProtocol,
  type HealthMarker,
  type InsertHealthMarker,
  type TrainingCompletion,
  type InsertTrainingCompletion,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { eq, desc, inArray, and, or } from "drizzle-orm";

export interface IStorage {
  // User/Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getAthletesByCoach(coachId: number): Promise<User[]>;

  // Checkins
  createCheckin(checkin: InsertCheckin): Promise<Checkin>;
  getCheckinsByAthlete(athleteId: number): Promise<Checkin[]>;
  updateCheckin(id: number, checkin: Partial<InsertCheckin> & { coachFeedback?: string }): Promise<Checkin>;
  getCheckin(id: number): Promise<Checkin | undefined>;
  getCheckinsForCoach(coachId: number): Promise<Checkin[]>;

  // Training blocks
  getTrainingBlocksByAthlete(athleteId: number): Promise<TrainingBlock[]>;
  createTrainingBlock(block: InsertTrainingBlock): Promise<TrainingBlock>;
  updateTrainingBlock(id: number, block: Partial<InsertTrainingBlock>): Promise<TrainingBlock>;
  getTrainingBlock(id: number): Promise<TrainingBlock | undefined>;

  // Weekly training plans
  getWeeklyTrainingPlansByAthlete(athleteId: number, weekStartDate?: Date): Promise<WeeklyTrainingPlan[]>;
  createWeeklyTrainingPlan(plan: InsertWeeklyTrainingPlan): Promise<WeeklyTrainingPlan>;
  updateWeeklyTrainingPlan(id: number, plan: Partial<InsertWeeklyTrainingPlan>): Promise<WeeklyTrainingPlan>;
  getWeeklyTrainingPlan(id: number): Promise<WeeklyTrainingPlan | undefined>;

  // Nutrition plans
  getNutritionPlansByAthlete(athleteId: number, weekStartDate?: Date): Promise<NutritionPlan[]>;
  createNutritionPlan(plan: InsertNutritionPlan): Promise<NutritionPlan>;
  updateNutritionPlan(id: number, plan: Partial<InsertNutritionPlan>): Promise<NutritionPlan>;
  getNutritionPlan(id: number): Promise<NutritionPlan | undefined>;

  // Protocols
  getProtocolsByAthlete(athleteId: number): Promise<Protocol[]>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: number, protocol: Partial<InsertProtocol>): Promise<Protocol>;
  getProtocol(id: number): Promise<Protocol | undefined>;

  // Health markers
  getHealthMarkersByAthlete(athleteId: number): Promise<HealthMarker[]>;
  createHealthMarker(marker: InsertHealthMarker): Promise<HealthMarker>;
  updateHealthMarker(id: number, marker: Partial<InsertHealthMarker>): Promise<HealthMarker>;
  getHealthMarker(id: number): Promise<HealthMarker | undefined>;

  // Training completions
  getTrainingCompletionsByAthlete(athleteId: number, dateKey?: string): Promise<TrainingCompletion[]>;
  getTrainingCompletionsForCoach(coachId: number, dateKey?: string): Promise<TrainingCompletion[]>;
  createTrainingCompletion(completion: InsertTrainingCompletion): Promise<TrainingCompletion>;
  updateTrainingCompletion(id: number, completion: Partial<InsertTrainingCompletion>): Promise<TrainingCompletion>;
  getTrainingCompletion(id: number): Promise<TrainingCompletion | undefined>;

  // Messages
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageRead(id: number): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAthletesByCoach(coachId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.coachId, coachId));
  }

  async createCheckin(checkin: InsertCheckin): Promise<Checkin> {
    const [newCheckin] = await db.insert(checkins).values(checkin as any).returning();
    return newCheckin;
  }

  async getCheckinsByAthlete(athleteId: number): Promise<Checkin[]> {
    return await db.select().from(checkins).where(eq(checkins.athleteId, athleteId)).orderBy(desc(checkins.date));
  }

  async updateCheckin(id: number, checkin: Partial<InsertCheckin> & { coachFeedback?: string }): Promise<Checkin> {
    const [updated] = await db.update(checkins).set(checkin as any).where(eq(checkins.id, id)).returning();
    return updated;
  }

  async getCheckin(id: number): Promise<Checkin | undefined> {
    const [checkin] = await db.select().from(checkins).where(eq(checkins.id, id));
    return checkin;
  }

  async getCheckinsForCoach(coachId: number): Promise<Checkin[]> {
    const athletes = await this.getAthletesByCoach(coachId);
    const athleteIds = athletes.map((athlete) => athlete.id);
    if (athleteIds.length === 0) return [];
    return await db.select().from(checkins).where(inArray(checkins.athleteId, athleteIds)).orderBy(desc(checkins.date));
  }

  async getTrainingBlocksByAthlete(athleteId: number): Promise<TrainingBlock[]> {
    return await db.select().from(trainingBlocks).where(eq(trainingBlocks.athleteId, athleteId));
  }

  async createTrainingBlock(block: InsertTrainingBlock): Promise<TrainingBlock> {
    const [created] = await db.insert(trainingBlocks).values(block).returning();
    return created;
  }

  async updateTrainingBlock(id: number, block: Partial<InsertTrainingBlock>): Promise<TrainingBlock> {
    const [updated] = await db.update(trainingBlocks).set(block).where(eq(trainingBlocks.id, id)).returning();
    return updated;
  }

  async getTrainingBlock(id: number): Promise<TrainingBlock | undefined> {
    const [block] = await db.select().from(trainingBlocks).where(eq(trainingBlocks.id, id));
    return block;
  }

  async getWeeklyTrainingPlansByAthlete(athleteId: number, weekStartDate?: Date): Promise<WeeklyTrainingPlan[]> {
    const blocks = await this.getTrainingBlocksByAthlete(athleteId);
    const blockIds = blocks.map((block) => block.id);
    if (blockIds.length === 0) return [];
    if (!weekStartDate) {
      return await db
        .select()
        .from(weeklyTrainingPlans)
        .where(inArray(weeklyTrainingPlans.trainingBlockId, blockIds))
        .orderBy(desc(weeklyTrainingPlans.weekStartDate));
    }
    return await db
      .select()
      .from(weeklyTrainingPlans)
      .where(
        and(
          inArray(weeklyTrainingPlans.trainingBlockId, blockIds),
          eq(weeklyTrainingPlans.weekStartDate, weekStartDate)
        )
      );
  }

  async createWeeklyTrainingPlan(plan: InsertWeeklyTrainingPlan): Promise<WeeklyTrainingPlan> {
    const [created] = await db.insert(weeklyTrainingPlans).values(plan).returning();
    return created;
  }

  async updateWeeklyTrainingPlan(id: number, plan: Partial<InsertWeeklyTrainingPlan>): Promise<WeeklyTrainingPlan> {
    const [updated] = await db.update(weeklyTrainingPlans).set(plan).where(eq(weeklyTrainingPlans.id, id)).returning();
    return updated;
  }

  async getWeeklyTrainingPlan(id: number): Promise<WeeklyTrainingPlan | undefined> {
    const [plan] = await db.select().from(weeklyTrainingPlans).where(eq(weeklyTrainingPlans.id, id));
    return plan;
  }

  async getNutritionPlansByAthlete(athleteId: number, weekStartDate?: Date): Promise<NutritionPlan[]> {
    if (!weekStartDate) {
      return await db
        .select()
        .from(nutritionPlans)
        .where(eq(nutritionPlans.athleteId, athleteId))
        .orderBy(desc(nutritionPlans.weekStartDate));
    }
    return await db
      .select()
      .from(nutritionPlans)
      .where(
        and(
          eq(nutritionPlans.athleteId, athleteId),
          eq(nutritionPlans.weekStartDate, weekStartDate)
        )
      );
  }

  async createNutritionPlan(plan: InsertNutritionPlan): Promise<NutritionPlan> {
    const [created] = await db.insert(nutritionPlans).values(plan).returning();
    return created;
  }

  async updateNutritionPlan(id: number, plan: Partial<InsertNutritionPlan>): Promise<NutritionPlan> {
    const [updated] = await db.update(nutritionPlans).set(plan).where(eq(nutritionPlans.id, id)).returning();
    return updated;
  }

  async getNutritionPlan(id: number): Promise<NutritionPlan | undefined> {
    const [plan] = await db.select().from(nutritionPlans).where(eq(nutritionPlans.id, id));
    return plan;
  }

  async getProtocolsByAthlete(athleteId: number): Promise<Protocol[]> {
    return await db.select().from(protocols).where(eq(protocols.athleteId, athleteId)).orderBy(desc(protocols.startDate));
  }

  async createProtocol(protocol: InsertProtocol): Promise<Protocol> {
    const [created] = await db.insert(protocols).values(protocol).returning();
    return created;
  }

  async updateProtocol(id: number, protocol: Partial<InsertProtocol>): Promise<Protocol> {
    const [updated] = await db.update(protocols).set(protocol).where(eq(protocols.id, id)).returning();
    return updated;
  }

  async getProtocol(id: number): Promise<Protocol | undefined> {
    const [protocol] = await db.select().from(protocols).where(eq(protocols.id, id));
    return protocol;
  }

  async getHealthMarkersByAthlete(athleteId: number): Promise<HealthMarker[]> {
    return await db.select().from(healthMarkers).where(eq(healthMarkers.athleteId, athleteId)).orderBy(desc(healthMarkers.date));
  }

  async createHealthMarker(marker: InsertHealthMarker): Promise<HealthMarker> {
    const [created] = await db.insert(healthMarkers).values(marker).returning();
    return created;
  }

  async updateHealthMarker(id: number, marker: Partial<InsertHealthMarker>): Promise<HealthMarker> {
    const [updated] = await db.update(healthMarkers).set(marker).where(eq(healthMarkers.id, id)).returning();
    return updated;
  }

  async getHealthMarker(id: number): Promise<HealthMarker | undefined> {
    const [marker] = await db.select().from(healthMarkers).where(eq(healthMarkers.id, id));
    return marker;
  }

  async getTrainingCompletionsByAthlete(athleteId: number, dateKey?: string): Promise<TrainingCompletion[]> {
    if (!dateKey) {
      return await db.select().from(trainingCompletions).where(eq(trainingCompletions.athleteId, athleteId)).orderBy(desc(trainingCompletions.createdAt));
    }
    return await db
      .select()
      .from(trainingCompletions)
      .where(and(eq(trainingCompletions.athleteId, athleteId), eq(trainingCompletions.dateKey, dateKey)))
      .orderBy(desc(trainingCompletions.createdAt));
  }

  async getTrainingCompletionsForCoach(coachId: number, dateKey?: string): Promise<TrainingCompletion[]> {
    const athletes = await this.getAthletesByCoach(coachId);
    const athleteIds = athletes.map((athlete) => athlete.id);
    if (athleteIds.length === 0) return [];
    if (!dateKey) {
      return await db.select().from(trainingCompletions).where(inArray(trainingCompletions.athleteId, athleteIds)).orderBy(desc(trainingCompletions.createdAt));
    }
    return await db
      .select()
      .from(trainingCompletions)
      .where(
        and(
          inArray(trainingCompletions.athleteId, athleteIds),
          eq(trainingCompletions.dateKey, dateKey)
        )
      )
      .orderBy(desc(trainingCompletions.createdAt));
  }

  async createTrainingCompletion(completion: InsertTrainingCompletion): Promise<TrainingCompletion> {
    const [created] = await db.insert(trainingCompletions).values(completion).returning();
    return created;
  }

  async updateTrainingCompletion(id: number, completion: Partial<InsertTrainingCompletion>): Promise<TrainingCompletion> {
    const [updated] = await db.update(trainingCompletions).set(completion).where(eq(trainingCompletions.id, id)).returning();
    return updated;
  }

  async getTrainingCompletion(id: number): Promise<TrainingCompletion | undefined> {
    const [completion] = await db.select().from(trainingCompletions).where(eq(trainingCompletions.id, id));
    return completion;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
          and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db.insert(messages).values(message).returning();
    return created;
  }

  async markMessageRead(id: number): Promise<Message> {
    const [updated] = await db.update(messages).set({ readAt: new Date() }).where(eq(messages.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
