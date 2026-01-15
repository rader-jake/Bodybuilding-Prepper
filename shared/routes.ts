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
      input: insertUserSchema,
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
} from './schema';
