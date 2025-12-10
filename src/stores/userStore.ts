import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, ProfileInputMode } from '@/types';

interface UserState {
  userProfile: UserProfile;
  setInputMode: (mode: ProfileInputMode) => void;
  updateFieldProfile: (updates: Partial<UserProfile['fieldProfile']>) => void;
  setFreeProfile: (content: string) => void;
}

const defaultUserProfile: UserProfile = {
  inputMode: 'field',
  fieldProfile: {
    name: '나',
    personality: '',
    appearance: '',
    settings: '',
  },
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userProfile: defaultUserProfile,
      setInputMode: (inputMode) =>
        set((state) => ({
          userProfile: { ...state.userProfile, inputMode },
        })),
      updateFieldProfile: (updates) =>
        set((state) => ({
          userProfile: {
            ...state.userProfile,
            fieldProfile: {
              ...state.userProfile.fieldProfile!,
              ...updates,
            },
          },
        })),
      setFreeProfile: (freeProfile) =>
        set((state) => ({
          userProfile: { ...state.userProfile, freeProfile },
        })),
    }),
    {
      name: 'simutalk-user',
    }
  )
);
