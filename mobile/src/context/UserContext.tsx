import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserContextType {
  userId: string | null;
  setUserId: (id: string) => Promise<void>;
  clearUserId: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_ID_KEY = '@health_app_user_id';
export const DEFAULT_USER_ID = process.env.EXPO_PUBLIC_DEFAULT_USER_ID ?? '00000000-0000-0000-0000-000000000001';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserId();
  }, []);

  const loadUserId = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      const normalized = storedUserId?.trim();
      if (normalized !== DEFAULT_USER_ID) {
        await AsyncStorage.setItem(USER_ID_KEY, DEFAULT_USER_ID);
      }
      setUserIdState(DEFAULT_USER_ID);
    } catch (error) {
      console.error('Error loading user ID:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserId = async (id: string) => {
    try {
      if (id?.trim() !== DEFAULT_USER_ID) {
        console.warn('Ignoring attempt to set alternate user ID; enforcing default user.');
      }
      await AsyncStorage.setItem(USER_ID_KEY, DEFAULT_USER_ID);
      setUserIdState(DEFAULT_USER_ID);
    } catch (error) {
      console.error('Error saving user ID:', error);
      throw error;
    }
  };

  const clearUserId = async () => {
    try {
      await AsyncStorage.removeItem(USER_ID_KEY);
      setUserIdState(null);
    } catch (error) {
      console.error('Error clearing user ID:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ userId, setUserId, clearUserId, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
