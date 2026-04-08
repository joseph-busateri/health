const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface StrengthSet {
  setNumber?: number;
  reps: number;
  loadKg?: number;
  loadLbs?: number;
  rpe?: number;
  notes?: string;
}

export interface StrengthExercise {
  exerciseName: string;
  muscleGroup?: string;
  sets: StrengthSet[];
  notes?: string;
}

export interface StrengthSession {
  id: string;
  userId: string;
  sessionDate: string;
  programName?: string;
  notes?: string;
  exercises: StrengthExercise[];
  createdAt: string;
}

export interface StrengthSessionInput {
  userId: string;
  sessionDate?: string;
  programName?: string;
  notes?: string;
  entries: {
    exerciseName: string;
    muscleGroup?: string;
    sets: StrengthSet[];
    notes?: string;
  }[];
}

export const strengthTrackingService = {
  /**
   * Create a new strength training session
   */
  async createSession(input: StrengthSessionInput): Promise<StrengthSession> {
    const response = await fetch(`${API_BASE_URL}/strength/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: input.userId,
        session_date: input.sessionDate,
        program_name: input.programName,
        notes: input.notes,
        entries: input.entries.map(entry => ({
          exercise_name: entry.exerciseName,
          muscle_group: entry.muscleGroup,
          sets: entry.sets.map(set => ({
            set_number: set.setNumber,
            reps: set.reps,
            load_kg: set.loadKg,
            load_lbs: set.loadLbs,
            rpe: set.rpe,
            notes: set.notes,
          })),
          notes: entry.notes,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create strength session');
    }

    const data = await response.json();
    return data.session;
  },

  /**
   * Get all strength sessions for a user
   */
  async getSessions(userId: string): Promise<StrengthSession[]> {
    const response = await fetch(`${API_BASE_URL}/strength/sessions/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch strength sessions');
    }

    const data = await response.json();
    return data.sessions || [];
  },

  /**
   * Get the latest strength session for a user
   */
  async getLatestSession(userId: string): Promise<StrengthSession | null> {
    const response = await fetch(`${API_BASE_URL}/strength/latest/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch latest strength session');
    }

    const data = await response.json();
    return data.session || null;
  },

  /**
   * Get strength progression for a specific exercise
   */
  async getExerciseProgression(userId: string, exerciseName: string): Promise<any[]> {
    const sessions = await this.getSessions(userId);
    
    // Filter and map sessions that contain the exercise
    const progression = sessions
      .filter(session => 
        session.exercises.some(ex => 
          ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()
        )
      )
      .map(session => {
        const exercise = session.exercises.find(ex => 
          ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()
        );
        
        if (!exercise) return null;
        
        // Calculate max weight and volume
        const maxWeight = Math.max(
          ...exercise.sets.map(set => set.loadKg || set.loadLbs || 0)
        );
        const totalVolume = exercise.sets.reduce(
          (sum, set) => sum + (set.reps * (set.loadKg || set.loadLbs || 0)),
          0
        );
        
        return {
          date: session.sessionDate,
          maxWeight,
          totalVolume,
          sets: exercise.sets.length,
          totalReps: exercise.sets.reduce((sum, set) => sum + set.reps, 0),
        };
      })
      .filter(item => item !== null);
    
    return progression;
  },

  /**
   * Calculate estimated 1RM for an exercise
   */
  calculateEstimated1RM(weight: number, reps: number): number {
    // Using Epley formula: 1RM = weight × (1 + reps/30)
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  },
};
