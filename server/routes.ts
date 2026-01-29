import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { log } from "./index";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import crypto from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);
const MemoryStoreSession = MemoryStore(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new MemoryStoreSession({ checkPeriod: 86400000 }),
      resave: false,
      saveUninitialized: false,
      secret: "keyboard cat",
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) return res.status(400).json({ message: "Username exists" });

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout(() => res.sendStatus(200));
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.patch(api.auth.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const input = api.auth.update.input.parse(req.body);
    const updates = {
      displayName: input.displayName,
      bio: input.bio,
      timezone: input.timezone,
      avatarUrl: input.avatarUrl,
    };
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    const updated = await storage.updateUser(user.id, sanitizedUpdates);
    res.json(updated);
  });

  app.post(api.cloudinary.sign.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let apiKey = process.env.CLOUDINARY_API_KEY;
    let apiSecret = process.env.CLOUDINARY_API_SECRET;

    if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
      try {
        const cloudinaryUrl = new URL(process.env.CLOUDINARY_URL);
        cloudName = cloudinaryUrl.hostname;
        apiKey = cloudinaryUrl.username;
        apiSecret = cloudinaryUrl.password;
      } catch (error) {
        log(`Cloudinary configuration error: Invalid CLOUDINARY_URL format`, "error");
        return res.status(500).json({ message: "Invalid CLOUDINARY_URL format" });
      }
    }
    if (!cloudName || !apiKey || !apiSecret) {
      log(`Cloudinary configuration error: Missing credentials`, "error");
      return res.status(500).json({ message: "Cloudinary is not configured" });
    }

    try {
      const input = api.cloudinary.sign.input.parse(req.body);
      const timestamp = Math.floor(Date.now() / 1000);
      const params = new URLSearchParams();
      if (input.folder) params.append("folder", input.folder);
      params.append("timestamp", String(timestamp));
      const signature = crypto.createHash("sha1").update(params.toString() + apiSecret).digest("hex");

      res.json({
        signature,
        timestamp,
        cloudName,
        apiKey,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // App Routes
  app.get(api.athletes.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'coach') return res.sendStatus(403);
    const athletes = await storage.getAthletesByCoach(user.id);
    res.json(athletes);
  });

  app.post(api.athletes.create.path, async (req, res) => {
    // Coach adding an athlete account
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== 'coach') return res.sendStatus(403);

    try {
      const input = api.athletes.create.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "An athlete with that username already exists." });
      }

      const hashedPassword = await hashPassword(input.password);
      const athlete = await storage.createUser({
        ...input,
        password: hashedPassword,
        coachId: user.id,
        role: 'athlete'
      });
      res.status(201).json(athlete);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.athletes.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);

    const athleteId = Number(req.params.id);
    const athlete = await storage.getUser(athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);

    const input = api.athletes.update.input.parse(req.body);
    const updates = {
      workoutPlan: input.workoutPlan,
      mealPlan: input.mealPlan,
      nextShowName: input.nextShowName,
      nextShowDate: input.nextShowDate,
      currentPhase: input.currentPhase,
    };
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    const updated = await storage.updateUser(athleteId, sanitizedUpdates);
    res.json(updated);
  });

  app.get(api.checkins.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = req.query.athleteId ? Number(req.query.athleteId) : user.id;

    // Security: Only view own checkins or if coach of that athlete
    if (user.role === 'athlete' && athleteId !== user.id) return res.sendStatus(403);
    if (user.role === 'coach') {
      const athlete = await storage.getUser(athleteId);
      if (athlete?.coachId !== user.id) return res.sendStatus(403);
    }

    const checkins = await storage.getCheckinsByAthlete(athleteId);
    res.json(checkins);
  });

  app.get(api.checkins.queue.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const checkins = await storage.getCheckinsForCoach(user.id);
    res.json(checkins);
  });

  app.post(api.checkins.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    // Only athletes create checkins for themselves for now
    const input = api.checkins.create.input.parse(req.body);
    const checkin = await storage.createCheckin({ ...input, athleteId: user.id });
    res.status(201).json(checkin);
  });

  app.patch(api.checkins.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const checkinId = Number(req.params.id);
    const checkin = await storage.getCheckin(checkinId);

    if (!checkin) return res.sendStatus(404);

    // Coach can update feedback, Athlete can update data (maybe restricted logic later)
    // For MVP, allow both to update relevant parts
    const input = api.checkins.update.input.parse(req.body);
    const updated = await storage.updateCheckin(checkinId, input);
    res.json(updated);
  });

  app.get(api.trainingBlocks.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = req.query.athleteId ? Number(req.query.athleteId) : user.id;
    if (user.role === "athlete" && athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const blocks = await storage.getTrainingBlocksByAthlete(athleteId);
    res.json(blocks);
  });

  app.post(api.trainingBlocks.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.trainingBlocks.create.input.parse(req.body);
    const athlete = await storage.getUser(input.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const created = await storage.createTrainingBlock(input);
    res.status(201).json(created);
  });

  app.patch(api.trainingBlocks.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.trainingBlocks.update.input.parse(req.body);
    const blockId = Number(req.params.id);
    const block = await storage.getTrainingBlock(blockId);
    if (!block) return res.sendStatus(404);
    const athlete = await storage.getUser(block.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const updated = await storage.updateTrainingBlock(blockId, input);
    res.json(updated);
  });

  app.get(api.weeklyTrainingPlans.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = req.query.athleteId ? Number(req.query.athleteId) : user.id;
    if (user.role === "athlete" && athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const weekStartDate = req.query.weekStartDate ? new Date(String(req.query.weekStartDate)) : undefined;
    const plans = await storage.getWeeklyTrainingPlansByAthlete(athleteId, weekStartDate);
    res.json(plans);
  });

  app.post(api.weeklyTrainingPlans.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.weeklyTrainingPlans.create.input.parse(req.body);
    const block = await storage.getTrainingBlock(input.trainingBlockId);
    if (!block) return res.sendStatus(404);
    const athlete = await storage.getUser(block.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const created = await storage.createWeeklyTrainingPlan(input);
    res.status(201).json(created);
  });

  app.patch(api.weeklyTrainingPlans.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.weeklyTrainingPlans.update.input.parse(req.body);
    const planId = Number(req.params.id);
    const existing = await storage.getWeeklyTrainingPlan(planId);
    if (!existing) return res.sendStatus(404);
    const block = await storage.getTrainingBlock(existing.trainingBlockId);
    if (!block) return res.sendStatus(404);
    const athlete = await storage.getUser(block.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const updated = await storage.updateWeeklyTrainingPlan(planId, input);
    res.json(updated);
  });

  app.get(api.nutritionPlans.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = req.query.athleteId ? Number(req.query.athleteId) : user.id;
    if (user.role === "athlete" && athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const weekStartDate = req.query.weekStartDate ? new Date(String(req.query.weekStartDate)) : undefined;
    const plans = await storage.getNutritionPlansByAthlete(athleteId, weekStartDate);
    res.json(plans);
  });

  app.post(api.nutritionPlans.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.nutritionPlans.create.input.parse(req.body);
    const athlete = await storage.getUser(input.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const created = await storage.createNutritionPlan(input);
    res.status(201).json(created);
  });

  app.patch(api.nutritionPlans.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.nutritionPlans.update.input.parse(req.body);
    const planId = Number(req.params.id);
    const existing = await storage.getNutritionPlan(planId);
    if (!existing) return res.sendStatus(404);
    const athlete = await storage.getUser(existing.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const updated = await storage.updateNutritionPlan(planId, input);
    res.json(updated);
  });

  app.get(api.protocols.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = req.query.athleteId ? Number(req.query.athleteId) : user.id;
    if (user.role === "athlete" && athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const items = await storage.getProtocolsByAthlete(athleteId);
    res.json(items);
  });

  app.post(api.protocols.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const input = api.protocols.create.input.parse(req.body);
    if (user.role === "athlete" && input.athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(input.athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const created = await storage.createProtocol(input);
    res.status(201).json(created);
  });

  app.patch(api.protocols.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const input = api.protocols.update.input.parse(req.body);
    const protocol = await storage.getProtocol(Number(req.params.id));
    if (!protocol) return res.sendStatus(404);
    if (user.role === "athlete" && protocol.athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(protocol.athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const updated = await storage.updateProtocol(Number(req.params.id), input);
    res.json(updated);
  });

  app.get(api.healthMarkers.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = req.query.athleteId ? Number(req.query.athleteId) : user.id;
    if (user.role === "athlete" && athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const markers = await storage.getHealthMarkersByAthlete(athleteId);
    res.json(markers);
  });

  app.post(api.healthMarkers.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const input = api.healthMarkers.create.input.parse(req.body);
    if (user.role === "athlete" && input.athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(input.athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const created = await storage.createHealthMarker(input);
    res.status(201).json(created);
  });

  app.patch(api.healthMarkers.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const input = api.healthMarkers.update.input.parse(req.body);
    const marker = await storage.getHealthMarker(Number(req.params.id));
    if (!marker) return res.sendStatus(404);
    if (user.role === "athlete" && marker.athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(marker.athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const updated = await storage.updateHealthMarker(Number(req.params.id), input);
    res.json(updated);
  });

  app.get(api.trainingCompletions.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const athleteId = req.query.athleteId ? Number(req.query.athleteId) : user.id;
    const dateKey = req.query.dateKey ? String(req.query.dateKey) : undefined;
    if (user.role === "athlete" && athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      if (req.query.athleteId) {
        const athlete = await storage.getUser(athleteId);
        if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
        const items = await storage.getTrainingCompletionsByAthlete(athleteId, dateKey);
        return res.json(items);
      }
      const items = await storage.getTrainingCompletionsForCoach(user.id, dateKey);
      return res.json(items);
    }
    const items = await storage.getTrainingCompletionsByAthlete(athleteId, dateKey);
    res.json(items);
  });

  app.post(api.trainingCompletions.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const input = api.trainingCompletions.create.input.parse(req.body);
    if (user.role === "athlete" && input.athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(input.athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const created = await storage.createTrainingCompletion(input);
    res.status(201).json(created);
  });

  app.patch(api.trainingCompletions.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const input = api.trainingCompletions.update.input.parse(req.body);
    const completion = await storage.getTrainingCompletion(Number(req.params.id));
    if (!completion) return res.sendStatus(404);
    if (user.role === "athlete" && completion.athleteId !== user.id) return res.sendStatus(403);
    if (user.role === "coach") {
      const athlete = await storage.getUser(completion.athleteId);
      if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    }
    const updated = await storage.updateTrainingCompletion(Number(req.params.id), input);
    res.json(updated);
  });

  // Message Routes
  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const otherUserId = Number(req.params.otherUserId);

    // Security: Athletes can only message their coach. Coaches can only message their athletes.
    if (user.role === 'athlete') {
      if (otherUserId !== user.coachId) return res.sendStatus(403);
    } else if (user.role === 'coach') {
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser || otherUser.coachId !== user.id) return res.sendStatus(403);
    }

    const messages = await storage.getMessagesBetweenUsers(user.id, otherUserId);
    res.json(messages);
  });

  app.post(api.messages.send.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;

    try {
      const input = api.messages.send.input.parse(req.body);

      if (input.senderId !== user.id) return res.sendStatus(403);

      // Security: same as list
      if (user.role === 'athlete') {
        if (input.receiverId !== user.coachId) return res.sendStatus(403);
      } else if (user.role === 'coach') {
        const receiver = await storage.getUser(input.receiverId);
        if (!receiver || receiver.coachId !== user.id) return res.sendStatus(403);
      }

      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.messages.markRead.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const messageId = Number(req.params.id);
    // Realistically we should check if the user is the receiver, but keeping it simple for now
    const updated = await storage.markMessageRead(messageId);
    res.json(updated);
  });

  // Seed Data
  if ((await storage.getUserByUsername("coach")) === undefined) {
    const hp = await hashPassword("coach");
    const coach = await storage.createUser({ username: "coach", password: hp, role: "coach" });

    const hp2 = await hashPassword("athlete");
    const athlete = await storage.createUser({ username: "athlete", password: hp2, role: "athlete", coachId: coach.id });

    await storage.createCheckin({
      athleteId: athlete.id,
      weight: "200lbs",
      photos: [],
      notes: "Feeling good",
      sleep: 8,
      stress: 3,
      adherence: 9,
      coachFeedback: "Great job, keep pushing!"
    });
  }

  return httpServer;
}
