import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Validation middleware factory
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuidParam: z.object({
    params: z.object({
      userId: z.string().uuid('Invalid user ID format'),
    }),
  }),

  // Date validation
  dateQuery: z.object({
    query: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
    }),
  }),

  // Pagination validation
  paginationQuery: z.object({
    query: z.object({
      limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional(),
      offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
    }),
  }),

  // Date range validation
  dateRangeQuery: z.object({
    query: z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      days: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(365)).optional(),
      months: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(24)).optional(),
    }),
  }),
};

// Bloodwork validation schemas
export const bloodworkSchemas = {
  addResult: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      labName: z.string().min(1).max(100),
      testType: z.string().min(1).max(100),
      notes: z.string().max(1000).optional(),
    }),
  }),

  addBiomarker: z.object({
    params: z.object({
      userId: z.string().uuid(),
      resultId: z.string().uuid(),
    }),
    body: z.object({
      biomarkerName: z.string().min(1).max(100),
      value: z.number(),
      unit: z.string().min(1).max(20),
      referenceRangeLow: z.number().optional(),
      referenceRangeHigh: z.number().optional(),
      status: z.enum(['normal', 'low', 'high', 'critical']).optional(),
    }),
  }),
};

// Workout validation schemas
export const workoutSchemas = {
  logWorkout: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      workoutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      workoutType: z.string().min(1).max(50),
      duration: z.number().min(1).max(600),
      notes: z.string().max(1000).optional(),
    }),
  }),

  addExercise: z.object({
    params: z.object({
      userId: z.string().uuid(),
      workoutId: z.string().uuid(),
    }),
    body: z.object({
      exerciseName: z.string().min(1).max(100),
      exerciseType: z.enum(['compound', 'isolation', 'cardio', 'flexibility']),
      muscleGroup: z.string().min(1).max(50),
      notes: z.string().max(500).optional(),
    }),
  }),

  addSet: z.object({
    params: z.object({
      userId: z.string().uuid(),
      workoutId: z.string().uuid(),
      exerciseId: z.string().uuid(),
    }),
    body: z.object({
      setNumber: z.number().int().min(1),
      weight: z.number().min(0),
      reps: z.number().int().min(0),
      rpe: z.number().min(1).max(10).optional(),
      notes: z.string().max(200).optional(),
    }),
  }),
};

// Supplement validation schemas
export const supplementSchemas = {
  addSupplement: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      supplementName: z.string().min(1).max(100),
      dosage: z.number().min(0),
      dosageUnit: z.string().min(1).max(20),
      frequency: z.enum(['daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed']),
      timingPreference: z.enum(['morning', 'afternoon', 'evening', 'pre_workout', 'post_workout', 'with_meals']).optional(),
      notes: z.string().max(500).optional(),
    }),
  }),

  logIntake: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      supplementId: z.string().uuid(),
      intakeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      intakeTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
      dosageTaken: z.number().min(0),
      notes: z.string().max(200).optional(),
    }),
  }),
};

// Goal validation schemas
export const goalSchemas = {
  createFromTemplate: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      templateId: z.string().uuid(),
      customizations: z.object({
        goalName: z.string().min(1).max(200).optional(),
        targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }).optional(),
    }),
  }),

  createCustom: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      goalData: z.object({
        goalName: z.string().min(1).max(200),
        goalType: z.string().min(1).max(50),
        targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        description: z.string().max(1000).optional(),
      }),
      metrics: z.array(z.object({
        metricName: z.string().min(1).max(100),
        startValue: z.number(),
        targetValue: z.number(),
        unit: z.string().min(1).max(20),
      })).min(1),
    }),
  }),
};

// Device integration validation schemas
export const deviceSchemas = {
  ouraConnect: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      code: z.string().min(1),
      redirectUri: z.string().url(),
    }),
  }),

  appleWatchConnect: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      deviceInfo: z.object({
        deviceName: z.string().max(100).optional(),
        deviceModel: z.string().max(50).optional(),
        watchOsVersion: z.string().max(20).optional(),
      }),
    }),
  }),

  sleepNumberConnect: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      username: z.string().min(1).max(100),
      password: z.string().min(1).max(100),
    }),
  }),
};

// AI Agent validation schemas
export const aiAgentSchemas = {
  askQuestion: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      question: z.string().min(1).max(1000),
    }),
  }),

  analyzeData: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      dataType: z.string().min(1).max(50),
      timeframe: z.string().min(1).max(50),
    }),
  }),
};

// Body composition validation schemas
export const bodyCompositionSchemas = {
  addScan: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      scanDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      weight: z.number().min(0),
      bodyFatPercentage: z.number().min(0).max(100).optional(),
      muscleMass: z.number().min(0).optional(),
      visceralFat: z.number().min(0).optional(),
      bmr: z.number().min(0).optional(),
      notes: z.string().max(500).optional(),
    }),
  }),
};

// Strength tracking validation schemas
export const strengthSchemas = {
  add1RM: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      exerciseName: z.string().min(1).max(100),
      oneRepMax: z.number().min(0),
      testDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      bodyweight: z.number().min(0).optional(),
      notes: z.string().max(500).optional(),
    }),
  }),

  calculate1RM: z.object({
    body: z.object({
      weight: z.number().min(0),
      reps: z.number().int().min(1).max(20),
      formula: z.enum(['epley', 'brzycki', 'lander', 'lombardi', 'mayhew', 'oconner', 'wathan']).optional(),
    }),
  }),
};

// Injury prevention validation schemas
export const injurySchemas = {
  logPain: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      painDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      bodyPart: z.string().min(1).max(50),
      painLevel: z.number().int().min(1).max(10),
      painType: z.string().min(1).max(50),
      notes: z.string().max(500).optional(),
    }),
  }),

  logMobility: z.object({
    params: z.object({
      userId: z.string().uuid(),
    }),
    body: z.object({
      assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      joint: z.string().min(1).max(50),
      rangeOfMotion: z.number().min(0).max(180),
      notes: z.string().max(500).optional(),
    }),
  }),
};

export default validate;
