import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export interface ImageUploadResult {
  uri: string;
  url?: string;
  error?: string;
}

export const imageUpload = {
  async requestPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  },

  async pickImage(): Promise<ImageUploadResult | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      return { uri: '', error: 'Permission denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return { uri: result.assets[0].uri };
  },

  async takePhoto(): Promise<ImageUploadResult | null> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return { uri: '', error: 'Camera permission denied' };
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return { uri: result.assets[0].uri };
  },

  async uploadToServer(uri: string, endpoint: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  },
};
