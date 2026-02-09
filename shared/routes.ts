import { z } from 'zod';
import {
  insertUserSchema,
  insertCheckinSchema,
  insertTrainingBlockSchema,
  insertWeeklyTrainingPlanSchema,
  insertNutritionPlanSchema,
  insertProtocolSchema,
  insertHealthMarkerSchema,
  users,
  checkins,
  trainingBlocks,
  weeklyTrainingPlans,
  nutritionPlans,
  protocols,
  healthMarkers,
  trainingCompletions,
  insertTrainingCompletionSchema,
  billingProfiles,
  payments,
  messages,
  insertMessageSchema,
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/user',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.internal,
      },
    },
  },
  cloudinary: {
    sign: {
      method: "POST" as const,
      path: "/api/cloudinary/signature",
      input: z.object({
        folder: z.string().optional(),
      }),
      responses: {
        200: z.object({
          signature: z.string(),
          timestamp: z.number(),
          cloudName: z.string(),
          apiKey: z.string(),
        }),
        401: errorSchemas.internal,
      },
    },
  },
  athletes: {
    list: {
      method: 'GET' as const,
      path: '/api/athletes',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/athletes',
      input: insertUserSchema.extend({
        monthlyFeeCents: z.coerce.number().int().min(100),
        email: z.string().email(),
      }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/athletes/:id",
      input: insertUserSchema.partial().extend({
        nextShowDate: z.coerce.date().optional().nullable(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.internal,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/athletes/:id",
      responses: {
        200: z.object({ success: z.boolean(), deletedId: z.number() }),
        401: errorSchemas.internal,
        404: errorSchemas.notFound,
      },
    },
  },
  billing: {
    checkout: {
      method: "POST" as const,
      path: "/api/billing/checkout",
      input: z.object({ athleteId: z.number().optional() }).optional(),
      responses: {
        200: z.object({ url: z.string() }),
      },
    },
    portal: {
      method: "POST" as const,
      path: "/api/billing/portal",
      responses: {
        200: z.object({ url: z.string() }),
      },
    },
    athleteSummary: {
      method: "GET" as const,
      path: "/api/billing/athlete",
      responses: {
        200: z.object({
          billingProfile: z.custom<typeof billingProfiles.$inferSelect>().nullable(),
          payments: z.array(z.custom<typeof payments.$inferSelect>()),
        }),
      },
    },
    coachSummary: {
      method: "GET" as const,
      path: "/api/billing/coach",
      responses: {
        200: z.object({
          totalRevenueCents: z.number(),
          mrrCents: z.number(),
          perAthlete: z.array(z.object({
            athleteId: z.number(),
            athleteName: z.string(),
            currentAmountCents: z.number().nullable(),
            paymentStatus: z.string().nullable(),
            locked: z.boolean().nullable(),
            lastPaidAt: z.string().nullable(),
          })),
        }),
      },
    },
    updatePrice: {
      method: "POST" as const,
      path: "/api/coach/athletes/:id/price",
      input: z.object({ monthlyFeeCents: z.coerce.number().int().min(100) }),
      responses: {
        200: z.object({ success: z.boolean(), currentPriceId: z.string(), currentAmountCents: z.number() }),
      },
    },
    confirm: {
      method: "POST" as const,
      path: "/api/billing/confirm",
      input: z.object({ sessionId: z.string() }),
      responses: {
        200: z.object({ success: z.boolean(), paymentStatus: z.string() }),
      },
    },
    webhook: {
      method: "POST" as const,
      path: "/api/stripe/webhook",
      responses: {
        200: z.object({ received: z.boolean() }),
      },
    },
  },
  checkins: {
    list: {
      method: 'GET' as const,
      path: '/api/checkins', // Optional query param ?athleteId=...
      input: z.object({ athleteId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof checkins.$inferSelect>()),
      },
    },
    queue: {
      method: "GET" as const,
      path: "/api/checkins/queue",
      responses: {
        200: z.array(z.custom<typeof checkins.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/checkins',
      input: insertCheckinSchema,
      responses: {
        201: z.custom<typeof checkins.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/checkins/:id',
      input: insertCheckinSchema.partial().extend({
        coachFeedback: z.string().optional(),
        status: z.string().optional(),
        coachChanges: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.custom<typeof checkins.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  trainingBlocks: {
    list: {
      method: "GET" as const,
      path: "/api/training-blocks",
      input: z.object({ athleteId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof trainingBlocks.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/training-blocks",
      input: insertTrainingBlockSchema,
      responses: {
        201: z.custom<typeof trainingBlocks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/training-blocks/:id",
      input: insertTrainingBlockSchema.partial(),
      responses: {
        200: z.custom<typeof trainingBlocks.$inferSelect>(),
      },
    },
  },
  weeklyTrainingPlans: {
    list: {
      method: "GET" as const,
      path: "/api/weekly-training-plans",
      input: z.object({
        athleteId: z.coerce.number().optional(),
        weekStartDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof weeklyTrainingPlans.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/weekly-training-plans",
      input: insertWeeklyTrainingPlanSchema.extend({ weekStartDate: z.coerce.date() }),
      responses: {
        201: z.custom<typeof weeklyTrainingPlans.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/weekly-training-plans/:id",
      input: insertWeeklyTrainingPlanSchema.partial().extend({ weekStartDate: z.coerce.date().optional() }),
      responses: {
        200: z.custom<typeof weeklyTrainingPlans.$inferSelect>(),
      },
    },
  },
  nutritionPlans: {
    list: {
      method: "GET" as const,
      path: "/api/nutrition-plans",
      input: z.object({
        athleteId: z.coerce.number().optional(),
        weekStartDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof nutritionPlans.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/nutrition-plans",
      input: insertNutritionPlanSchema.extend({ weekStartDate: z.coerce.date() }),
      responses: {
        201: z.custom<typeof nutritionPlans.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/nutrition-plans/:id",
      input: insertNutritionPlanSchema.partial().extend({ weekStartDate: z.coerce.date().optional() }),
      responses: {
        200: z.custom<typeof nutritionPlans.$inferSelect>(),
      },
    },
  },
  protocols: {
    list: {
      method: "GET" as const,
      path: "/api/protocols",
      input: z.object({ athleteId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof protocols.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/protocols",
      input: insertProtocolSchema.extend({
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional().nullable(),
      }),
      responses: {
        201: z.custom<typeof protocols.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/protocols/:id",
      input: insertProtocolSchema.partial().extend({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional().nullable(),
      }),
      responses: {
        200: z.custom<typeof protocols.$inferSelect>(),
      },
    },
  },
  healthMarkers: {
    list: {
      method: "GET" as const,
      path: "/api/health-markers",
      input: z.object({ athleteId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof healthMarkers.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/health-markers",
      input: insertHealthMarkerSchema,
      responses: {
        201: z.custom<typeof healthMarkers.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/health-markers/:id",
      input: insertHealthMarkerSchema.partial(),
      responses: {
        200: z.custom<typeof healthMarkers.$inferSelect>(),
      },
    },
  },
  trainingCompletions: {
    list: {
      method: "GET" as const,
      path: "/api/training-completions",
      input: z.object({
        athleteId: z.coerce.number().optional(),
        dateKey: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof trainingCompletions.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/training-completions",
      input: insertTrainingCompletionSchema,
      responses: {
        201: z.custom<typeof trainingCompletions.$inferSelect>(),
      },
    },
    update: {
      method: "PATCH" as const,
      path: "/api/training-completions/:id",
      input: insertTrainingCompletionSchema.partial(),
      responses: {
        200: z.custom<typeof trainingCompletions.$inferSelect>(),
      },
    },
  },
  messages: {
    list: {
      method: "GET" as const,
      path: "/api/messages/:otherUserId",
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
      },
    },
    send: {
      method: "POST" as const,
      path: "/api/messages",
      input: insertMessageSchema,
      responses: {
        201: z.custom<typeof messages.$inferSelect>(),
      },
    },
    markRead: {
      method: "PATCH" as const,
      path: "/api/messages/:id/read",
      responses: {
        200: z.custom<typeof messages.$inferSelect>(),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Re-export some types from schema for convenience in the client
export type {
  User,
  InsertUser,
  Checkin,
  InsertCheckin,
  TrainingBlock,
  InsertTrainingBlock,
  WeeklyTrainingPlan,
  InsertWeeklyTrainingPlan,
  NutritionPlan,
  InsertNutritionPlan,
  Protocol,
  InsertProtocol,
  HealthMarker,
  InsertHealthMarker,
  TrainingCompletion,
  InsertTrainingCompletion,
  BillingProfile,
  InsertBillingProfile,
  Payment,
  InsertPayment,
  Message,
  InsertMessage,
} from './schema';
