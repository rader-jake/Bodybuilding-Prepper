import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { log } from "./index";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import cors from "cors";
import Stripe from "stripe";
import { stripe, STRIPE_PRODUCT_ID, APP_BASE_URL, getWebhookSecret } from "./stripe";
import { type User } from "@shared/schema";

async function hydrateUser(user: any): Promise<User> {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser as User;
}


const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || "default_dev_secret_do_not_use_in_prod";
const LOCKED_STATUSES = new Set(["past_due", "unpaid", "incomplete", "canceled"]);

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

// Middleware to verify JWT and attach user to req
const requireAuthJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string };
    const user = await storage.getUser(payload.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // CORS Setup
  app.use(cors({
    origin: true, // Allow all origins for dev/capacitor
    credentials: true, // Not strictly needed for JWT header but good practice
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  // Passport Init (for LocalStrategy convenience)
  app.use(passport.initialize());

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

  // Helper to sign token
  const signToken = (user: any) => {
    return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "30d" });
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) return res.status(400).json({ message: "Username exists" });

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });

      const token = signToken(user);
      const safeUser = await hydrateUser(user);
      res.status(201).json({ user: safeUser, token });


    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local", { session: false }), async (req, res) => {
    const user = req.user as any;
    const token = signToken(user);
    const safeUser = await hydrateUser(user);
    res.json({ user: safeUser, token });
  });


  app.post(api.auth.logout.path, (req, res) => {
    // Stateless logout - client discards token
    res.sendStatus(200);
  });

  app.get(api.auth.me.path, requireAuthJWT, async (req, res) => {
    const safeUser = await hydrateUser(req.user);
    res.json(safeUser);
  });


  app.patch(api.auth.update.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    const input = api.auth.update.input.parse(req.body);
    const updates = {
      displayName: input.displayName,
      bio: input.bio,
      timezone: input.timezone,
      avatarUrl: input.avatarUrl,
      coachIndustry: input.coachIndustry,
      billingMode: input.billingMode,
      paymentStatus: input.paymentStatus,
      locked: input.locked,
    };
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    const updated = await storage.updateUser(user.id, sanitizedUpdates);
    const safeUpdated = await hydrateUser(updated);
    res.json(safeUpdated);

  });

  app.post(api.cloudinary.sign.path, requireAuthJWT, (req, res) => {
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
  app.get(api.athletes.list.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== 'coach') return res.sendStatus(403);
    const athletes = await storage.getAthletesByCoach(user.id);
    const hydrated = await Promise.all(athletes.map(a => hydrateUser(a)));
    res.json(hydrated);

  });

  app.post(api.athletes.create.path, requireAuthJWT, async (req, res) => {
    // Coach adding an athlete account
    const user = req.user as any;
    if (user.role !== 'coach') return res.sendStatus(403);

    try {
      const input = api.athletes.create.input.parse(req.body);
      if (!input.email) {
        return res.status(400).json({ message: "Athlete email is required for billing." });
      }
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "An athlete with that username already exists." });
      }

      const hashedPassword = await hashPassword(input.password);
      // Athletes inherit coach's industry (in 'sport' field for backward compat)
      const athlete = await storage.createUser({
        ...input,
        password: hashedPassword,
        coachId: user.id,
        role: 'athlete',
        paymentStatus: "trial",
        locked: false,
      });


      if (user.billingMode === "platform") {
        const stripeCustomer = await stripe.customers.create({
          email: input.email || undefined,
          name: input.displayName || input.username,
          metadata: {
            athleteId: String(athlete.id),
            coachId: String(user.id),
          },
        });

        await storage.createBillingProfile({
          athleteId: athlete.id,
          coachId: user.id,
          stripeCustomerId: stripeCustomer.id,
          currentAmountCents: input.monthlyFeeCents,
          currency: "usd",
          paymentStatus: "incomplete",
          locked: true,
        });
      }

      res.status(201).json(await hydrateUser(athlete));

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.athletes.update.path, requireAuthJWT, async (req, res) => {
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
      profile: input.profile,
      paymentStatus: input.paymentStatus,
      locked: input.locked,
    };
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    const updated = await storage.updateUser(athleteId, sanitizedUpdates);
    res.json(await hydrateUser(updated));

  });

  app.delete(api.athletes.delete.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);

    const athleteId = Number(req.params.id);
    const deletedId = await storage.deleteAthlete(user.id, athleteId);
    if (!deletedId) return res.status(404).json({ message: "Athlete not found." });
    res.json({ success: true, deletedId });
  });

  const resolveProductId = async () => {
    if (STRIPE_PRODUCT_ID) return STRIPE_PRODUCT_ID;
    const product = await stripe.products.create({ name: "Coaching Subscription" });
    return product.id;
  };

  app.post(api.billing.checkout.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "athlete") return res.sendStatus(403);

    const profile = await storage.getBillingProfileByAthlete(user.id);
    if (!profile) return res.status(404).json({ message: "Billing profile not found." });

    let customerId = profile.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.displayName || user.username,
        metadata: { athleteId: String(user.id), coachId: String(profile.coachId) },
      });
      customerId = customer.id;
      await storage.updateBillingProfile(profile.id, { stripeCustomerId: customerId });
    }

    if (!profile.currentAmountCents || profile.currentAmountCents < 100) {
      return res.status(400).json({ message: "Invalid monthly fee." });
    }

    const productId = await resolveProductId();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price_data: {
            product: productId,
            currency: profile.currency || "usd",
            unit_amount: profile.currentAmountCents || 0,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          athleteId: String(user.id),
          coachId: String(profile.coachId),
        },
      },
      metadata: {
        athleteId: String(user.id),
        coachId: String(profile.coachId),
      },
      success_url: `${APP_BASE_URL}billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}billing/cancel`,
    });

    res.json({ url: session.url });
  });

  app.post(api.billing.portal.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "athlete") return res.sendStatus(403);
    const profile = await storage.getBillingProfileByAthlete(user.id);
    if (!profile?.stripeCustomerId) return res.status(404).json({ message: "Billing profile not found." });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${APP_BASE_URL}athlete/dashboard`,
    });
    res.json({ url: portalSession.url });
  });

  app.get(api.billing.athleteSummary.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "athlete") return res.sendStatus(403);
    const billingProfile = await storage.getBillingProfileByAthlete(user.id);
    const payments = await storage.getPaymentsByAthlete(user.id);
    res.json({ billingProfile: billingProfile || null, payments });
  });

  app.get(api.billing.coachSummary.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);

    const athletes = await storage.getAthletesByCoach(user.id);
    const profiles = await storage.getBillingProfilesByCoach(user.id);
    const payments = await storage.getPaymentsByCoach(user.id);

    const totalRevenueCents = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amountCents || 0), 0);
    const mrrCents = profiles
      .filter((p) => p.paymentStatus === "active")
      .reduce((sum, p) => sum + (p.currentAmountCents || 0), 0);

    const lastPaidByAthlete = new Map<number, string>();
    payments
      .filter((p) => p.status === "paid")
      .forEach((p) => {
        if (!lastPaidByAthlete.has(p.athleteId)) {
          lastPaidByAthlete.set(p.athleteId, p.createdAt.toISOString());
        }
      });

    const perAthlete = athletes.map((athlete) => {
      return {
        athleteId: athlete.id,
        athleteName: athlete.displayName || athlete.username,
        currentAmountCents: athlete.role === "athlete" ? (profiles.find(p => p.athleteId === athlete.id)?.currentAmountCents ?? null) : null,
        paymentStatus: athlete.paymentStatus,
        locked: athlete.locked,
        lastPaidAt: lastPaidByAthlete.get(athlete.id) || null,
        billingMode: athlete.billingMode || user.billingMode, // Should be coach's mode
      };
    });

    res.json({ totalRevenueCents, mrrCents, perAthlete });
  });

  app.post(api.billing.updatePrice.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);

    const athleteId = Number(req.params.id);
    const athlete = await storage.getUser(athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);

    const input = api.billing.updatePrice.input.parse(req.body);
    const profile = await storage.getBillingProfileByAthlete(athleteId);
    if (!profile?.stripeSubscriptionId || !profile.stripeSubscriptionItemId) {
      return res.status(400).json({ message: "Subscription not active yet." });
    }

    const productId = await resolveProductId();
    const newPrice = await stripe.prices.create({
      product: productId,
      currency: profile.currency || "usd",
      unit_amount: input.monthlyFeeCents,
      recurring: { interval: "month" },
    });

    await stripe.subscriptions.update(profile.stripeSubscriptionId, {
      items: [{ id: profile.stripeSubscriptionItemId, price: newPrice.id }],
      proration_behavior: "none",
    });

    await storage.updateBillingProfile(profile.id, {
      currentPriceId: newPrice.id,
      currentAmountCents: input.monthlyFeeCents,
    });

    res.json({ success: true, currentPriceId: newPrice.id, currentAmountCents: input.monthlyFeeCents });
  });

  // GET alias for confirmation (idempotent)
  app.get("/api/billing/checkout-session/:id", requireAuthJWT, async (req, res) => {
    const sessionId = req.params.id;
    return await handleConfirmBilling(req, res, sessionId);
  });

  app.post(api.billing.confirm.path, requireAuthJWT, async (req: Request, res: Response) => {
    try {
      const input = api.billing.confirm.input.parse(req.body);
      return await handleConfirmBilling(req, res, input.sessionId);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  });

  async function handleConfirmBilling(req: Request, res: Response, sessionId: string) {
    const user = req.user as User;
    if (user.role !== "athlete") return res.sendStatus(403);

    log(`[billing.confirm] athlete=${user.id} session=${sessionId}`, "stripe");

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });

      if (!session) {
        return res.status(400).json({ message: "Session not found." });
      }

      const subscription = session.subscription as Stripe.Subscription | null;

      const normalizeStatus = (status: string) => {
        if (status === "trialing" || status === "active") return "active";
        if (status === "incomplete_expired") return "incomplete";
        return status;
      };

      // Determine status: prefer subscription status, fallback to payment_status
      const rawStatus = subscription?.status || (session.payment_status === "paid" ? "active" : "incomplete");
      const status = normalizeStatus(rawStatus);
      const isLocked = LOCKED_STATUSES.has(status);

      const profile = await storage.getBillingProfileByAthlete(user.id);
      if (profile) {
        const item = subscription?.items?.data?.[0];
        await storage.updateBillingProfile(profile.id, {
          stripeCustomerId: (session.customer as Stripe.Customer)?.id || profile.stripeCustomerId,
          stripeSubscriptionId: subscription?.id || profile.stripeSubscriptionId,
          stripeSubscriptionItemId: item?.id || profile.stripeSubscriptionItemId,
          currentPriceId: item?.price?.id || profile.currentPriceId,
          currentAmountCents: item?.price?.unit_amount || profile.currentAmountCents,
          currency: item?.price?.currency || profile.currency || "usd",
          paymentStatus: status as any,
          locked: isLocked,
        });
      }

      const updatedUser = await storage.updateUser(user.id, {
        paymentStatus: status as any,
        locked: isLocked
      });

      log(`[billing.confirm] success athlete=${user.id} status=${status} locked=${isLocked}`, "stripe");
      res.json({ success: true, paymentStatus: status, user: await hydrateUser(updatedUser) });
    } catch (err: any) {
      log(`[billing.confirm] error: ${err.message}`, "stripe");
      res.status(500).json({ message: "Failed to confirm billing session." });
    }
  }

  app.post(api.billing.webhook.path, async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature) {
      log(`[stripe.webhook] rejected: missing signature`, "stripe");
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;
    const body = req.body as Buffer;
    log(`[stripe.webhook] received request length=${body.length}`, "stripe");

    try {
      event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
    } catch (err: any) {
      log(`[stripe.webhook] signature verification failed: ${err.message}`, "stripe");
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    log(`[stripe.webhook] processing session.id=${event.id} type=${event.type}`, "stripe");

    const normalizeStatus = (status: string) => {
      if (status === "trialing" || status === "active") return "active";
      if (status === "incomplete_expired") return "incomplete";
      return status;
    };

    const updateProfileStatus = async (profileId: number, status: string) => {
      const normalized = normalizeStatus(status);
      const locked = LOCKED_STATUSES.has(normalized);
      log(`[stripe.webhook] update profile=${profileId} status=${normalized} locked=${locked}`, "stripe");
      await storage.updateBillingProfile(profileId, { paymentStatus: normalized as any, locked });
    };

    const updateUserStatus = async (athleteId: number, status: string) => {
      const normalized = normalizeStatus(status);
      const locked = LOCKED_STATUSES.has(normalized);
      log(`[stripe.webhook] update user=${athleteId} status=${normalized} locked=${locked}`, "stripe");
      await storage.updateUser(athleteId, { paymentStatus: normalized as any, locked });
    };

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const athleteId = Number(session.metadata?.athleteId);
          const coachId = Number(session.metadata?.coachId);
          const subscriptionId = session.subscription as string;

          log(`[stripe.webhook] checkout.completed athlete=${athleteId} sub=${subscriptionId}`, "stripe");

          if (!athleteId || !subscriptionId) {
            log(`[stripe.webhook] missing metadata or sub in checkout.completed`, "stripe");
            break;
          }

          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const item = subscription.items.data[0];
          const status = normalizeStatus(subscription.status);
          const isLocked = LOCKED_STATUSES.has(status);

          const profile = await storage.getBillingProfileByAthlete(athleteId);
          if (profile) {
            await storage.updateBillingProfile(profile.id, {
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              stripeSubscriptionItemId: item?.id,
              currentPriceId: item?.price?.id,
              currentAmountCents: item?.price?.unit_amount || profile.currentAmountCents,
              paymentStatus: status as any,
              locked: isLocked,
            });
          } else {
            await storage.createBillingProfile({
              athleteId,
              coachId,
              stripeCustomerId: subscription.customer as string,
              stripeSubscriptionId: subscription.id,
              stripeSubscriptionItemId: item?.id,
              currentPriceId: item?.price?.id,
              currentAmountCents: item?.price?.unit_amount || null,
              currency: item?.price?.currency || "usd",
              paymentStatus: status as any,
              locked: isLocked,
            });
          }

          await updateUserStatus(athleteId, subscription.status);
          break;
        }
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const profile = await storage.getBillingProfileBySubscriptionId(subscription.id);
          if (profile) {
            await updateProfileStatus(profile.id, subscription.status);
            await updateUserStatus(profile.athleteId, subscription.status);
          } else {
            log(`[stripe.webhook] profile not found for sub update=${subscription.id}`, "stripe");
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const profile = await storage.getBillingProfileBySubscriptionId(subscription.id);
          if (profile) {
            await updateProfileStatus(profile.id, "canceled");
            await updateUserStatus(profile.athleteId, "canceled");
          }
          break;
        }
        case "invoice.payment_succeeded":
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          const subscriptionId = invoice.subscription as string | undefined;
          let profile = subscriptionId ? await storage.getBillingProfileBySubscriptionId(subscriptionId) : undefined;
          if (!profile && invoice.customer) {
            profile = await storage.getBillingProfileByCustomerId(invoice.customer as string);
          }

          if (!profile) {
            log(`[stripe.webhook] profile not found for invoice event=${event.type}`, "stripe");
            break;
          }

          const paymentStatus = event.type === "invoice.payment_succeeded" ? "paid" : "failed";
          await storage.upsertPaymentByInvoice(invoice.id, {
            athleteId: profile.athleteId,
            coachId: profile.coachId,
            stripeInvoiceId: invoice.id,
            stripeChargeId: (invoice.charge as string) || null,
            amountCents: invoice.amount_paid || invoice.amount_due || null,
            currency: invoice.currency || "usd",
            status: paymentStatus,
            invoiceUrl: invoice.invoice_pdf || null,
            hostedInvoiceUrl: invoice.hosted_invoice_url || null,
          });

          const athleteStatus = event.type === "invoice.payment_succeeded" ? "active" : "past_due";
          await updateProfileStatus(profile.id, athleteStatus);
          await updateUserStatus(profile.athleteId, athleteStatus);
          break;
        }
        default:
          log(`[stripe.webhook] unhandled event type=${event.type}`, "stripe");
          break;
      }
    } catch (err: any) {
      log(`[stripe.webhook] error: ${err.message}`, "stripe");
      return res.status(500).json({ message: "Webhook processing failed." });
    }

    res.json({ received: true });
  });

  app.get(api.checkins.list.path, requireAuthJWT, async (req, res) => {
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

  app.get(api.checkins.queue.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const checkins = await storage.getCheckinsForCoach(user.id);
    res.json(checkins);
  });

  app.post(api.checkins.create.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;

    // Soft/Hard Gate logic
    const existingCheckins = await storage.getCheckinsByAthlete(user.id);
    if (existingCheckins.length >= 1) {
      if (user.locked || ["incomplete", "past_due", "canceled", "waiting_for_coach"].includes(user.paymentStatus)) {
        return res.status(403).json({ message: "Access restricted. Payment or coach confirmation required." });
      }
    }

    const input = api.checkins.create.input.parse(req.body);
    const checkin = await storage.createCheckin({ ...input, athleteId: user.id });

    // After first checkin, trigger hard gate for future access
    if (existingCheckins.length === 0) {
      if (user.coachId) {
        const coach = await storage.getUser(user.coachId);
        if (coach?.billingMode === "external") {
          await storage.updateUser(user.id, { paymentStatus: "waiting_for_coach", locked: true });
        } else if (coach?.billingMode === "platform") {
          await storage.updateUser(user.id, { paymentStatus: "incomplete", locked: true });
        }
      }
    }

    res.status(201).json(checkin);
  });

  app.patch(api.checkins.update.path, requireAuthJWT, async (req, res) => {
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

  app.get(api.trainingBlocks.list.path, requireAuthJWT, async (req, res) => {
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

  app.post(api.trainingBlocks.create.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.trainingBlocks.create.input.parse(req.body);
    const athlete = await storage.getUser(input.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const created = await storage.createTrainingBlock(input);
    res.status(201).json(created);
  });

  app.patch(api.trainingBlocks.update.path, requireAuthJWT, async (req, res) => {
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

  app.get(api.weeklyTrainingPlans.list.path, requireAuthJWT, async (req, res) => {
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

  app.post(api.weeklyTrainingPlans.create.path, requireAuthJWT, async (req, res) => {
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

  app.patch(api.weeklyTrainingPlans.update.path, requireAuthJWT, async (req, res) => {
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

  app.get(api.nutritionPlans.list.path, requireAuthJWT, async (req, res) => {
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

  app.post(api.nutritionPlans.create.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    if (user.role !== "coach") return res.sendStatus(403);
    const input = api.nutritionPlans.create.input.parse(req.body);
    const athlete = await storage.getUser(input.athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);
    const created = await storage.createNutritionPlan(input);
    res.status(201).json(created);
  });

  app.patch(api.nutritionPlans.update.path, requireAuthJWT, async (req, res) => {
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

  app.get(api.protocols.list.path, requireAuthJWT, async (req, res) => {
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

  app.post(api.protocols.create.path, requireAuthJWT, async (req, res) => {
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

  app.patch(api.protocols.update.path, requireAuthJWT, async (req, res) => {
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

  app.get(api.healthMarkers.list.path, requireAuthJWT, async (req, res) => {
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

  app.post(api.healthMarkers.create.path, requireAuthJWT, async (req, res) => {
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

  app.patch(api.healthMarkers.update.path, requireAuthJWT, async (req, res) => {
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

  app.get(api.trainingCompletions.list.path, requireAuthJWT, async (req, res) => {
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

  app.post(api.trainingCompletions.create.path, requireAuthJWT, async (req, res) => {
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

  app.patch(api.trainingCompletions.update.path, requireAuthJWT, async (req, res) => {
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
  app.get(api.messages.list.path, requireAuthJWT, async (req, res) => {
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

  app.post(api.messages.send.path, requireAuthJWT, async (req, res) => {
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

  app.patch(api.messages.markRead.path, requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    const messageId = Number(req.params.id);
    // Realistically we should check if the user is the receiver, but keeping it simple for now
    const updated = await storage.markMessageRead(messageId);
    res.json(updated);
  });

  // Payment Status Management (fallback/manual override)
  app.patch("/api/athletes/:id/payment", requireAuthJWT, async (req, res) => {
    const user = req.user as any;
    const athleteId = Number(req.params.id);

    if (user.role !== "coach") return res.sendStatus(403);

    const athlete = await storage.getUser(athleteId);
    if (!athlete || athlete.coachId !== user.id) return res.sendStatus(403);

    const { paymentStatus } = req.body;
    if (!["active", "past_due", "unpaid", "incomplete", "canceled"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const updated = await storage.updateUser(athleteId, { paymentStatus });
    res.json(updated);
  });

  // Seed Data
  if ((await storage.getUserByUsername("coach")) === undefined) {
    const hp = await hashPassword("coach");
    const coach = await storage.createUser({ username: "coach", password: hp, role: "coach", coachIndustry: "bodybuilding" });

    const hp2 = await hashPassword("athlete");
    const athlete = await storage.createUser({ username: "athlete", password: hp2, role: "athlete", coachId: coach.id, paymentStatus: "active" });

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
