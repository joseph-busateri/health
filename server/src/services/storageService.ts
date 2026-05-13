import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables are not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

export const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export interface UploadFileOptions {
  bucket?: string;
  path: string;
  file: Buffer;
  contentType?: string;
  upsert?: boolean;
  cacheControlSeconds?: number;
}

export interface UploadFileResult {
  bucket: string;
  path: string;
  publicUrl: string | null;
}

export async function uploadFileToStorage(options: UploadFileOptions): Promise<UploadFileResult> {
  const {
    bucket = DOCUMENTS_BUCKET,
    path,
    file,
    contentType,
    upsert = true,
    cacheControlSeconds = 60,
  } = options;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert,
    contentType,
    cacheControl: `${cacheControlSeconds}`,
  });

  if (error) {
    logger.error('Failed to upload file to Supabase storage', { error: error.message, bucket, path });
    throw new Error(`Failed to upload file to storage: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    publicUrl: publicUrlData?.publicUrl ?? null,
  };
}

export async function downloadFileFromStorage(path: string, bucket?: string): Promise<Buffer> {
  const targetBucket = bucket || DOCUMENTS_BUCKET;
  const { data, error } = await supabase.storage.from(targetBucket).download(path);

  if (error || !data) {
    logger.error('Failed to download file from Supabase storage', { error: error?.message, bucket: targetBucket, path });
    throw new Error(`Failed to download file from storage: ${error?.message ?? 'Unknown error'}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function getPublicUrlForStoragePath(path: string, bucket: string = DOCUMENTS_BUCKET): string | null {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}
