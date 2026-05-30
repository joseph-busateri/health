import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { OuraTokens } from './ouraApiClient';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

interface EncryptedValue {
  value: string;
  iv: string;
}

interface OuraConnectionRow {
  id: string;
  user_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted?: string | null;
  token_expires_at?: string | null;
  encryption_iv: string;
  connection_status: string;
  last_sync_date?: string | null;
  last_successful_sync_date?: string | null;
  consecutive_failures?: number | null;
  last_error_message?: string | null;
  auto_sync_enabled?: boolean | null;
  oura_user_id?: string | null;
  email?: string | null;
  ring_model?: string | null;
  ring_size?: string | null;
  ring_color?: string | null;
}

export interface DecryptedOuraConnection {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date | null;
  connectionStatus: string;
  lastSyncDate?: string | null;
  lastSuccessfulSyncDate?: string | null;
  consecutiveFailures?: number | null;
  lastErrorMessage?: string | null;
  autoSyncEnabled?: boolean | null;
  ouraUserId?: string | null;
  email?: string | null;
}

function buildKeyBuffer(): Buffer {
  const raw = Buffer.from(ENCRYPTION_KEY, 'utf8');
  if (raw.length === 32) {
    return raw;
  }

  if (raw.length > 32) {
    return raw.subarray(0, 32);
  }

  const padded = Buffer.alloc(32);
  raw.copy(padded);
  return padded;
}

const KEY_BUFFER = buildKeyBuffer();

class OuraAuthService {
  private encrypt(value: string): EncryptedValue {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, KEY_BUFFER, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      value: encrypted,
      iv: iv.toString('hex'),
    };
  }

  private decrypt(value: string | null | undefined, ivHex: string | null | undefined): string | undefined {
    if (!value || !ivHex) return undefined;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, KEY_BUFFER, iv);

    let decrypted = decipher.update(value, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async upsertConnection(
    userId: string,
    tokens: OuraTokens,
    profile: {
      ouraUserId?: string;
      email?: string;
      ringModel?: string;
      ringSize?: string;
      ringColor?: string;
    } = {}
  ): Promise<DecryptedOuraConnection> {
    const accessTokenEncrypted = this.encrypt(tokens.accessToken);
    const refreshTokenEncrypted = tokens.refreshToken ? this.encrypt(tokens.refreshToken) : undefined;

    const { data, error } = await supabase
      .from('oura_connections')
      .upsert(
        {
          user_id: userId,
          access_token_encrypted: accessTokenEncrypted.value,
          refresh_token_encrypted: refreshTokenEncrypted?.value,
          token_expires_at: tokens.expiresAt?.toISOString?.() ?? null,
          encryption_iv: accessTokenEncrypted.iv,
          connection_status: 'active',
          auto_sync_enabled: true,
          oura_user_id: profile.ouraUserId,
          email: profile.email,
          ring_model: profile.ringModel,
          ring_size: profile.ringSize,
          ring_color: profile.ringColor,
          consecutive_failures: 0,
          last_error_message: null,
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .maybeSingle();

    if (error) {
      logger.error('Failed to upsert Oura connection', { userId, error });
      throw error;
    }

    if (!data) {
      throw new Error('Oura connection upsert did not return a row');
    }

    return this.toDecryptedConnection(data as OuraConnectionRow);
  }

  async getActiveConnectionByUserId(userId: string): Promise<DecryptedOuraConnection | null> {
    const { data, error } = await supabase
      .from('oura_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('connection_status', 'active')
      .maybeSingle();

    if (error) {
      logger.error('Failed to load Oura connection by user', { userId, error });
      throw error;
    }

    if (!data) return null;

    return this.toDecryptedConnection(data as OuraConnectionRow);
  }

  async getConnectionById(connectionId: string): Promise<DecryptedOuraConnection | null> {
    const { data, error } = await supabase
      .from('oura_connections')
      .select('*')
      .eq('id', connectionId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to load Oura connection by id', { connectionId, error });
      throw error;
    }

    if (!data) return null;

    return this.toDecryptedConnection(data as OuraConnectionRow);
  }

  async markDisconnected(userId: string): Promise<void> {
    const { error } = await supabase
      .from('oura_connections')
      .update({
        connection_status: 'disconnected',
        auto_sync_enabled: false,
      })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to disconnect Oura account', { userId, error });
      throw error;
    }
  }

  async persistTokens(connectionId: string, tokens: OuraTokens): Promise<void> {
    const accessTokenEncrypted = this.encrypt(tokens.accessToken);
    const refreshTokenEncrypted = tokens.refreshToken ? this.encrypt(tokens.refreshToken) : undefined;

    const updates: Record<string, any> = {
      access_token_encrypted: accessTokenEncrypted.value,
      encryption_iv: accessTokenEncrypted.iv,
      token_expires_at: tokens.expiresAt?.toISOString?.() ?? null,
    };

    if (refreshTokenEncrypted) {
      updates.refresh_token_encrypted = refreshTokenEncrypted.value;
    }

    const { error } = await supabase
      .from('oura_connections')
      .update(updates)
      .eq('id', connectionId);

    if (error) {
      logger.error('Failed to persist refreshed Oura tokens', { connectionId, error });
      throw error;
    }
  }

  private toDecryptedConnection(row: OuraConnectionRow): DecryptedOuraConnection {
    const accessToken = this.decrypt(row.access_token_encrypted, row.encryption_iv);
    if (!accessToken) {
      throw new Error('Stored Oura access token could not be decrypted');
    }

    const refreshToken = this.decrypt(row.refresh_token_encrypted ?? undefined, row.encryption_iv);

    return {
      id: row.id,
      userId: row.user_id,
      accessToken,
      refreshToken,
      tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at) : null,
      connectionStatus: row.connection_status,
      lastSyncDate: row.last_sync_date ?? null,
      lastSuccessfulSyncDate: row.last_successful_sync_date ?? null,
      consecutiveFailures: row.consecutive_failures ?? null,
      lastErrorMessage: row.last_error_message ?? null,
      autoSyncEnabled: row.auto_sync_enabled ?? null,
      ouraUserId: row.oura_user_id ?? null,
      email: row.email ?? null,
    };
  }
}

export const ouraAuthService = new OuraAuthService();
