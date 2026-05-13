import { Request, Response } from 'express';
import {
  getCurrentState,
  reconstructStateAsOf,
  compareStates,
  getChangeEvents
} from '../services/pointInTimeService';
import { StateRequest, StateQueryParams } from '../types/pointInTime';

// Get current effective state for a user
export async function getCurrentStateHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required'
      });
    }

    const currentState = await getCurrentState(Array.isArray(user_id) ? user_id[0] : user_id);

    res.json({
      success: true,
      data: currentState
    });

  } catch (error) {
    console.error('Error getting current state:', error);
    res.status(500).json({
      error: 'Failed to get current state',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get historical state as of a specific date
export async function getHistoricalStateHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { date, include_changes } = req.query;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required'
      });
    }

    if (!date) {
      return res.status(400).json({
        error: 'date parameter is required (YYYY-MM-DD format)'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date as string)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Parse and validate date
    const targetDate = new Date(date as string);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date provided'
      });
    }

    // Don't allow future dates
    const now = new Date();
    if (targetDate > now) {
      return res.status(400).json({
        error: 'Cannot retrieve state for future dates'
      });
    }

    const includeChanges = include_changes === 'true';

    const historicalState = await reconstructStateAsOf(Array.isArray(user_id) ? user_id[0] : user_id, date as string, {
      include_deleted: false,
      include_metadata: includeChanges,
      max_changes: 1000
    });

    res.json({
      success: true,
      data: historicalState
    });

  } catch (error) {
    console.error('Error getting historical state:', error);
    res.status(500).json({
      error: 'Failed to get historical state',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Compare current state with historical state
export async function compareStatesHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { historical_date, current_date } = req.query;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required'
      });
    }

    if (!historical_date) {
      return res.status(400).json({
        error: 'historical_date parameter is required (YYYY-MM-DD format)'
      });
    }

    // Validate historical date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(historical_date as string)) {
      return res.status(400).json({
        error: 'Invalid historical_date format. Use YYYY-MM-DD'
      });
    }

    // Parse and validate dates
    const historicalDate = new Date(historical_date as string);
    if (isNaN(historicalDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid historical_date provided'
      });
    }

    const currentDateStr = (current_date as string) || new Date().toISOString().split('T')[0];
    const currentDate = new Date(currentDateStr);
    if (isNaN(currentDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid current_date provided'
      });
    }

    if (historicalDate >= currentDate) {
      return res.status(400).json({
        error: 'historical_date must be before current_date'
      });
    }

    const comparison = await compareStates(Array.isArray(user_id) ? user_id[0] : user_id, historical_date as string, currentDateStr);

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Error comparing states:', error);
    res.status(500).json({
      error: 'Failed to compare states',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get change events for a user
export async function getChangeEventsHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const { 
      entity_type, 
      entity_id, 
      limit = '100',
      start_date,
      end_date 
    } = req.query;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required'
      });
    }

    // Validate limit
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({
        error: 'limit must be between 1 and 1000'
      });
    }

    // Validate entity_type if provided
    const validEntityTypes = ['baseline_profile', 'workout_baseline', 'supplement_baseline', 'supplement_item', 'goal'];
    if (entity_type && !validEntityTypes.includes(entity_type as string)) {
      return res.status(400).json({
        error: `Invalid entity_type. Must be one of: ${validEntityTypes.join(', ')}`
      });
    }

    // Get change events
    let changeEvents = await getChangeEvents(
      Array.isArray(user_id) ? user_id[0] : user_id, 
      entity_type as any, 
      entity_id as string, 
      limitNum
    );

    // Filter by date range if provided
    if (start_date || end_date) {
      const startDate = start_date ? new Date(start_date as string) : new Date('1970-01-01');
      const endDate = end_date ? new Date(end_date as string) : new Date();
      
      changeEvents = changeEvents.filter(event => {
        const eventDate = new Date(event.effective_at);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }

    res.json({
      success: true,
      data: {
        change_events: changeEvents,
        total: changeEvents.length,
        filters: {
          user_id,
          entity_type,
          entity_id,
          limit: limitNum,
          start_date,
          end_date
        }
      }
    });

  } catch (error) {
    console.error('Error getting change events:', error);
    res.status(500).json({
      error: 'Failed to get change events',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get available dates for state reconstruction
export async function getAvailableDatesHandler(req: Request, res: Response) {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        error: 'user_id is required'
      });
    }

    // Get all change events for the user to determine available dates
    const changeEvents = await getChangeEvents(Array.isArray(user_id) ? user_id[0] : user_id, undefined, undefined, 1000);
    
    // Extract unique dates
    const dates = [...new Set(changeEvents.map(event => 
      new Date(event.effective_at).toISOString().split('T')[0]
    ))].sort().reverse();

    // Get the earliest and latest dates
    const earliestDate = dates.length > 0 ? dates[dates.length - 1] : null;
    const latestDate = dates.length > 0 ? dates[0] : new Date().toISOString().split('T')[0];

    res.json({
      success: true,
      data: {
        available_dates: dates,
        earliest_date: earliestDate,
        latest_date: latestDate,
        total_changes: changeEvents.length
      }
    });

  } catch (error) {
    console.error('Error getting available dates:', error);
    res.status(500).json({
      error: 'Failed to get available dates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Health check for point-in-time service
export async function pointInTimeHealthHandler(req: Request, res: Response) {
  try {
    // Test basic functionality
    const testUserId = 'health-check-user';
    
    // This should return empty results for a non-existent user, but not error
    const currentState = await getCurrentState(testUserId);
    const changeEvents = await getChangeEvents(testUserId, undefined, undefined, 1);

    res.json({
      success: true,
      data: {
        status: 'healthy',
        services: {
          current_state: 'operational',
          historical_state: 'operational',
          change_events: 'operational'
        },
        test_results: {
          current_state_query: currentState.user_id === testUserId,
          change_events_query: Array.isArray(changeEvents),
          database_connection: true
        }
      }
    });

  } catch (error) {
    console.error('Point-in-time health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Point-in-time service unhealthy',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
