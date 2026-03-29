// Sleep Number Data Parser
// Parses Sleep Number app exports (CSV/JSON) and API responses

import { logger } from './logger';

export interface ParsedSleepSession {
  sessionDate: string;
  bedId?: string;
  sleeperSide: 'left' | 'right' | 'both';
  
  // Timing
  inBedTime?: string;
  outOfBedTime?: string;
  totalTimeInBedMinutes?: number;
  
  // Sleep duration
  totalSleepTimeMinutes?: number;
  awakeTimeMinutes?: number;
  restlessTimeMinutes?: number;
  restfulTimeMinutes?: number;
  
  // Quality metrics
  sleepIQScore?: number;
  sleepEfficiencyPercent?: number;
  
  // Heart rate
  avgHeartRate?: number;
  minHeartRate?: number;
  maxHeartRate?: number;
  
  // Respiratory rate
  avgRespiratoryRate?: number;
  minRespiratoryRate?: number;
  maxRespiratoryRate?: number;
  
  // Movement
  totalMovements?: number;
  positionChanges?: number;
  timeOnLeftSideMinutes?: number;
  timeOnRightSideMinutes?: number;
  timeOnBackMinutes?: number;
  timeOnStomachMinutes?: number;
  
  // Sleep stages
  lightSleepMinutes?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  
  // Settings
  sleepNumberSetting?: number;
  avgSleepNumber?: number;
  
  // Environmental
  roomTemperature?: number;
  
  notes?: string;
  rawData?: any;
}

export interface ParsedSleepHourlyData {
  hourTimestamp: string;
  sleepState?: 'awake' | 'restless' | 'restful' | 'light' | 'deep' | 'rem';
  heartRate?: number;
  respiratoryRate?: number;
  movementCount?: number;
  sleepNumberSetting?: number;
}

export class SleepNumberParser {
  
  /**
   * Parse Sleep Number JSON export
   */
  parseSleepNumberJSON(jsonData: any): ParsedSleepSession[] {
    try {
      const sessions: ParsedSleepSession[] = [];

      // Handle different JSON formats
      if (Array.isArray(jsonData)) {
        // Array of sessions
        for (const session of jsonData) {
          const parsed = this.parseSessionObject(session);
          if (parsed) sessions.push(parsed);
        }
      } else if (jsonData.sessions && Array.isArray(jsonData.sessions)) {
        // Wrapped in sessions array
        for (const session of jsonData.sessions) {
          const parsed = this.parseSessionObject(session);
          if (parsed) sessions.push(parsed);
        }
      } else {
        // Single session object
        const parsed = this.parseSessionObject(jsonData);
        if (parsed) sessions.push(parsed);
      }

      logger.info('Sleep Number JSON parsed', { sessionCount: sessions.length });
      return sessions;
    } catch (error) {
      logger.error('Error parsing Sleep Number JSON', { error });
      throw new Error('Failed to parse Sleep Number JSON data');
    }
  }

  /**
   * Parse Sleep Number CSV export
   */
  parseSleepNumberCSV(csvContent: string): ParsedSleepSession[] {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const sessions: ParsedSleepSession[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const session: any = {};
        headers.forEach((header, index) => {
          session[header] = values[index];
        });

        const parsed = this.parseSessionFromCSVRow(session);
        if (parsed) sessions.push(parsed);
      }

      logger.info('Sleep Number CSV parsed', { sessionCount: sessions.length });
      return sessions;
    } catch (error) {
      logger.error('Error parsing Sleep Number CSV', { error });
      throw new Error('Failed to parse Sleep Number CSV data');
    }
  }

  /**
   * Parse individual session object
   */
  private parseSessionObject(session: any): ParsedSleepSession | null {
    try {
      // Extract date
      const sessionDate = this.extractDate(session);
      if (!sessionDate) return null;

      const parsed: ParsedSleepSession = {
        sessionDate,
        sleeperSide: this.extractSleeperSide(session),
        bedId: session.bedId || session.bed_id,
        
        // Timing
        inBedTime: this.extractTimestamp(session.inBedTime || session.in_bed_time || session.bedtime_start),
        outOfBedTime: this.extractTimestamp(session.outOfBedTime || session.out_of_bed_time || session.bedtime_end),
        totalTimeInBedMinutes: this.parseNumber(session.totalTimeInBed || session.total_time_in_bed || session.timeInBed),
        
        // Sleep duration
        totalSleepTimeMinutes: this.parseNumber(session.totalSleepTime || session.total_sleep_time || session.sleepDuration),
        awakeTimeMinutes: this.parseNumber(session.awakeTime || session.awake_time),
        restlessTimeMinutes: this.parseNumber(session.restlessTime || session.restless_time),
        restfulTimeMinutes: this.parseNumber(session.restfulTime || session.restful_time),
        
        // Quality
        sleepIQScore: this.parseNumber(session.sleepIQ || session.sleep_iq || session.sleepScore),
        sleepEfficiencyPercent: this.parseNumber(session.sleepEfficiency || session.sleep_efficiency),
        
        // Heart rate
        avgHeartRate: this.parseNumber(session.avgHeartRate || session.avg_heart_rate || session.heartRate),
        minHeartRate: this.parseNumber(session.minHeartRate || session.min_heart_rate),
        maxHeartRate: this.parseNumber(session.maxHeartRate || session.max_heart_rate),
        
        // Respiratory
        avgRespiratoryRate: this.parseNumber(session.avgRespiratoryRate || session.avg_respiratory_rate || session.respiratoryRate),
        minRespiratoryRate: this.parseNumber(session.minRespiratoryRate || session.min_respiratory_rate),
        maxRespiratoryRate: this.parseNumber(session.maxRespiratoryRate || session.max_respiratory_rate),
        
        // Movement
        totalMovements: this.parseNumber(session.totalMovements || session.total_movements || session.movements),
        positionChanges: this.parseNumber(session.positionChanges || session.position_changes),
        timeOnLeftSideMinutes: this.parseNumber(session.timeOnLeftSide || session.time_on_left_side),
        timeOnRightSideMinutes: this.parseNumber(session.timeOnRightSide || session.time_on_right_side),
        timeOnBackMinutes: this.parseNumber(session.timeOnBack || session.time_on_back),
        timeOnStomachMinutes: this.parseNumber(session.timeOnStomach || session.time_on_stomach),
        
        // Sleep stages
        lightSleepMinutes: this.parseNumber(session.lightSleep || session.light_sleep),
        deepSleepMinutes: this.parseNumber(session.deepSleep || session.deep_sleep),
        remSleepMinutes: this.parseNumber(session.remSleep || session.rem_sleep || session.REM),
        
        // Settings
        sleepNumberSetting: this.parseNumber(session.sleepNumber || session.sleep_number || session.firmness),
        avgSleepNumber: this.parseNumber(session.avgSleepNumber || session.avg_sleep_number),
        
        // Environmental
        roomTemperature: this.parseNumber(session.roomTemperature || session.room_temperature || session.temperature),
        
        notes: session.notes,
        rawData: session,
      };

      return parsed;
    } catch (error) {
      logger.error('Error parsing session object', { error, session });
      return null;
    }
  }

  /**
   * Parse session from CSV row
   */
  private parseSessionFromCSVRow(row: any): ParsedSleepSession | null {
    try {
      const sessionDate = row.date || row.session_date || row['sleep date'];
      if (!sessionDate) return null;

      return {
        sessionDate: this.formatDate(sessionDate),
        sleeperSide: this.extractSleeperSide(row),
        totalSleepTimeMinutes: this.parseNumber(row['total sleep'] || row.sleep_time || row.duration),
        sleepIQScore: this.parseNumber(row['sleep iq'] || row.sleepiq || row.score),
        avgHeartRate: this.parseNumber(row['heart rate'] || row.hr || row['avg hr']),
        avgRespiratoryRate: this.parseNumber(row['respiratory rate'] || row.rr || row['avg rr']),
        deepSleepMinutes: this.parseNumber(row['deep sleep'] || row.deep),
        lightSleepMinutes: this.parseNumber(row['light sleep'] || row.light),
        remSleepMinutes: this.parseNumber(row['rem sleep'] || row.rem),
        sleepNumberSetting: this.parseNumber(row['sleep number'] || row.firmness || row.setting),
        rawData: row,
      };
    } catch (error) {
      logger.error('Error parsing CSV row', { error, row });
      return null;
    }
  }

  /**
   * Parse hourly data
   */
  parseHourlyData(hourlyData: any[]): ParsedSleepHourlyData[] {
    try {
      return hourlyData.map(hour => ({
        hourTimestamp: this.extractTimestamp(hour.timestamp || hour.time || hour.hour) || '',
        sleepState: this.mapSleepState(hour.state || hour.sleep_state || hour.stage),
        heartRate: this.parseNumber(hour.heartRate || hour.heart_rate || hour.hr),
        respiratoryRate: this.parseNumber(hour.respiratoryRate || hour.respiratory_rate || hour.rr),
        movementCount: this.parseNumber(hour.movements || hour.movement_count),
        sleepNumberSetting: this.parseNumber(hour.sleepNumber || hour.sleep_number || hour.setting),
      })).filter(h => h.hourTimestamp);
    } catch (error) {
      logger.error('Error parsing hourly data', { error });
      return [];
    }
  }

  /**
   * Helper: Extract date
   */
  private extractDate(session: any): string | null {
    const dateStr = session.date || session.sessionDate || session.session_date || 
                    session.sleepDate || session.sleep_date || session.day;
    
    if (!dateStr) return null;
    return this.formatDate(dateStr);
  }

  /**
   * Helper: Extract sleeper side
   */
  private extractSleeperSide(session: any): 'left' | 'right' | 'both' {
    const side = (session.side || session.sleeperSide || session.sleeper_side || 'both').toLowerCase();
    if (side.includes('left') || side === 'l') return 'left';
    if (side.includes('right') || side === 'r') return 'right';
    return 'both';
  }

  /**
   * Helper: Extract timestamp
   */
  private extractTimestamp(value: any): string | undefined {
    if (!value) return undefined;
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Format date to YYYY-MM-DD
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Helper: Parse number
   */
  private parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Helper: Map sleep state
   */
  private mapSleepState(state: any): 'awake' | 'restless' | 'restful' | 'light' | 'deep' | 'rem' | undefined {
    if (!state) return undefined;
    
    const stateStr = state.toString().toLowerCase();
    if (stateStr.includes('awake')) return 'awake';
    if (stateStr.includes('restless')) return 'restless';
    if (stateStr.includes('restful')) return 'restful';
    if (stateStr.includes('light')) return 'light';
    if (stateStr.includes('deep')) return 'deep';
    if (stateStr.includes('rem')) return 'rem';
    
    return undefined;
  }

  /**
   * Helper: Parse CSV line (handles quoted values)
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Validate parsed session
   */
  validateSession(session: ParsedSleepSession): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!session.sessionDate) {
      errors.push('Session date is required');
    }

    if (session.sleepIQScore !== undefined && (session.sleepIQScore < 0 || session.sleepIQScore > 100)) {
      errors.push('Sleep IQ score must be between 0 and 100');
    }

    if (session.sleepEfficiencyPercent !== undefined && (session.sleepEfficiencyPercent < 0 || session.sleepEfficiencyPercent > 100)) {
      errors.push('Sleep efficiency must be between 0 and 100');
    }

    if (session.totalSleepTimeMinutes !== undefined && session.totalSleepTimeMinutes < 0) {
      errors.push('Total sleep time cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const sleepNumberParser = new SleepNumberParser();
