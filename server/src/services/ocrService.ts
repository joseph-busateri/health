import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { logger } from '../utils/logger';

const DEFAULT_TESSERACT_LANG = process.env.TESSERACT_DEFAULT_LANG || 'eng';

export interface OCRResult {
  text: string;
  confidence?: number;
  pages?: string[];
  metadata?: Record<string, unknown>;
}

function bufferToUtf8(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

function splitPages(raw: string): string[] {
  return raw
    .split('\f')
    .map(page => page.trim())
    .filter(page => page.length > 0);
}

async function extractFromPdf(buffer: Buffer): Promise<OCRResult> {
  const result = await pdfParse(buffer);
  const text = result.text || '';

  return {
    text,
    pages: splitPages(text),
    metadata: {
      info: result.info,
      numberOfPages: result.numpages,
    },
  };
}

async function extractFromImage(buffer: Buffer, lang: string): Promise<OCRResult> {
  const { data } = await Tesseract.recognize(buffer, lang, {
    logger: message => {
      if (message.status === 'recognizing text') {
        logger.info('Tesseract progress', { progress: message.progress });
      }
    },
  });

  return {
    text: data.text || '',
    confidence: data.confidence,
    pages: [data.text || ''],
    metadata: {
      words: data.words?.length,
      symbols: data.symbols?.length,
    },
  };
}

export async function extractTextFromBuffer(buffer: Buffer, mimeType?: string): Promise<OCRResult> {
  try {
    if (mimeType?.includes('pdf')) {
      return await extractFromPdf(buffer);
    }

    if (mimeType?.startsWith('image/')) {
      return await extractFromImage(buffer, DEFAULT_TESSERACT_LANG);
    }

    const text = bufferToUtf8(buffer);
    return {
      text,
      pages: splitPages(text),
    };
  } catch (error) {
    logger.error('OCR extraction failed, attempting fallback to UTF-8 decode', { error: (error as Error).message, mimeType });
    const text = bufferToUtf8(buffer);
    return {
      text,
      pages: splitPages(text),
      metadata: {
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
