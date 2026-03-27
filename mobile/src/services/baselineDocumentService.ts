import axios from 'axios';
import type {
  BaselineUploadRequest,
  BaselineUploadResult,
  BaselineProfile,
  BaselineDocument,
} from '../types/baselineDocument';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const uploadBaselineDocument = async (
  userId: string,
  request: BaselineUploadRequest,
): Promise<BaselineUploadResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/baseline-document`, request, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to upload baseline document');
    }
  } catch (error) {
    console.error('Error uploading baseline document:', error);
    throw error;
  }
};

export const getBaselineProfile = async (userId: string): Promise<BaselineProfile | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/baseline-profile/${userId}`);

    if (response.data.success) {
      return response.data.data;
    } else {
      if (response.data.error?.includes('not found')) {
        return null;
      }
      throw new Error(response.data.error || 'Failed to get baseline profile');
    }
  } catch (error) {
    console.error('Error getting baseline profile:', error);
    return null;
  }
};

export const getLatestBaselineDocument = async (userId: string): Promise<BaselineDocument | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/baseline-document/${userId}/latest`);

    if (response.data.success) {
      return response.data.data;
    } else {
      if (response.data.error?.includes('not found')) {
        return null;
      }
      throw new Error(response.data.error || 'Failed to get latest baseline document');
    }
  } catch (error) {
    console.error('Error getting latest baseline document:', error);
    return null;
  }
};
