import { 
  SupplementBaselineWithItems, 
  SupplementDocumentResult, 
  CreateSupplementDocumentRequest,
  ManualSupplementData 
} from '../types/supplementDocument';

const API_BASE_URL = 'http://localhost:3000';

export const uploadSupplementDocument = async (
  request: CreateSupplementDocumentRequest
): Promise<SupplementDocumentResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/supplement-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to upload supplement document');
    }

    return result.data;
  } catch (error) {
    console.error('Error uploading supplement document:', error);
    throw error;
  }
};

export const getSupplementBaseline = async (
  userId: string
): Promise<SupplementBaselineWithItems | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/supplement-baseline/${userId}`);

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(result.error || 'Failed to get supplement baseline');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting supplement baseline:', error);
    throw error;
  }
};

export const getLatestSupplementDocument = async (
  userId: string
): Promise<any | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/supplement-document/${userId}/latest`);

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(result.error || 'Failed to get latest supplement document');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting latest supplement document:', error);
    throw error;
  }
};

// Export ManualSupplementData for use in screens
export type { ManualSupplementData } from '../types/supplementDocument';
