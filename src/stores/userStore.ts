import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfileSlot, UserProfile, ProfileInputMode } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface UserState {
  // 여러 유저 프로필 슬롯
  userProfiles: UserProfileSlot[];
  currentUserProfileId: string | null;
  
  // 슬롯 관리
  addUserProfile: (profile: Omit<UserProfileSlot, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateUserProfile: (id: string, updates: Partial<UserProfileSlot>) => void;
  deleteUserProfile: (id: string) => void;
  setCurrentUserProfile: (id: string | null) => void;
  getUserProfile: (id: string) => UserProfileSlot | undefined;
  getCurrentUserProfile: () => UserProfile;
  
  // 레거시 호환
  userProfile: UserProfile;
  setInputMode: (mode: ProfileInputMode) => void;
  updateFieldProfile: (updates: Partial<UserProfile['fieldProfile']>) => void;
  setFreeProfile: (content: string) => void;
  setFreeProfileName: (name: string) => void;
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
    (set, get) => ({
      userProfiles: [],
      currentUserProfileId: null,
      userProfile: defaultUserProfile,
      
      getCurrentUserProfile: () => {
        const state = get();
        if (state.currentUserProfileId) {
          const slot = state.userProfiles.find(p => p.id === state.currentUserProfileId);
          if (slot) {
            return {
              inputMode: slot.inputMode,
              fieldProfile: slot.fieldProfile,
              freeProfile: slot.freeProfile,
            };
          }
        }
        if (state.userProfiles.length > 0) {
          const firstSlot = state.userProfiles[0];
          return {
            inputMode: firstSlot.inputMode,
            fieldProfile: firstSlot.fieldProfile,
            freeProfile: firstSlot.freeProfile,
          };
        }
        return defaultUserProfile;
      },
      
      addUserProfile: (profileData) => {
        const id = uuidv4();
        const now = Date.now();
        const newProfile: UserProfileSlot = {
          ...profileData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          userProfiles: [...state.userProfiles, newProfile],
          currentUserProfileId: state.userProfiles.length === 0 ? id : state.currentUserProfileId,
        }));
        return id;
      },
      
      updateUserProfile: (id, updates) =>
        set((state) => ({
          userProfiles: state.userProfiles.map((profile) =>
            profile.id === id
              ? { ...profile, ...updates, updatedAt: Date.now() }
              : profile
          ),
        })),
      
      deleteUserProfile: (id) =>
        set((state) => {
          const newProfiles = state.userProfiles.filter((p) => p.id !== id);
          return {
            userProfiles: newProfiles,
            currentUserProfileId:
              state.currentUserProfileId === id
                ? (newProfiles.length > 0 ? newProfiles[0].id : null)
                : state.currentUserProfileId,
          };
        }),
      
      setCurrentUserProfile: (id) => set({ currentUserProfileId: id }),
      
      getUserProfile: (id) => get().userProfiles.find((p) => p.id === id),
      
      // 레거시 호환 메서드
      setInputMode: (inputMode) =>
        set((state) => {
          if (state.currentUserProfileId) {
            return {
              userProfiles: state.userProfiles.map((p) =>
                p.id === state.currentUserProfileId
                  ? { ...p, inputMode, updatedAt: Date.now() }
                  : p
              ),
            };
          }
          return state;
        }),
      
      updateFieldProfile: (updates) =>
        set((state) => {
          if (state.currentUserProfileId) {
            return {
              userProfiles: state.userProfiles.map((p) =>
                p.id === state.currentUserProfileId
                  ? {
                      ...p,
                      fieldProfile: { ...p.fieldProfile!, ...updates },
                      updatedAt: Date.now(),
                    }
                  : p
              ),
            };
          }
          return state;
        }),
      
      setFreeProfile: (freeProfile) =>
        set((state) => {
          if (state.currentUserProfileId) {
            return {
              userProfiles: state.userProfiles.map((p) =>
                p.id === state.currentUserProfileId
                  ? { ...p, freeProfile, updatedAt: Date.now() }
                  : p
              ),
            };
          }
          return state;
        }),
        
      setFreeProfileName: (freeProfileName) =>
        set((state) => {
          if (state.currentUserProfileId) {
            return {
              userProfiles: state.userProfiles.map((p) =>
                p.id === state.currentUserProfileId
                  ? { ...p, freeProfileName, updatedAt: Date.now() }
                  : p
              ),
            };
          }
          return state;
        }),
    }),
    {
      name: 'simutalk-user',
      migrate: (persistedState: unknown, _version: number) => {
        const state = persistedState as UserState;
        
        // 기존 userProfile이 있고 userProfiles가 비어있으면 마이그레이션
        if (state.userProfile && (!state.userProfiles || state.userProfiles.length === 0)) {
          const id = uuidv4();
          const now = Date.now();
          const migratedSlot: UserProfileSlot = {
            id,
            inputMode: state.userProfile.inputMode,
            fieldProfile: state.userProfile.fieldProfile,
            freeProfile: state.userProfile.freeProfile,
            createdAt: now,
            updatedAt: now,
          };
          return {
            ...state,
            userProfiles: [migratedSlot],
            currentUserProfileId: id,
          };
        }
        
        return state;
      },
      version: 2,
    }
  )
);
