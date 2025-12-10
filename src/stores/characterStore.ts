import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface CharacterState {
  characters: Character[];
  addCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  getCharacter: (id: string) => Character | undefined;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      characters: [],
      addCharacter: (characterData) => {
        const id = uuidv4();
        const now = Date.now();
        const newCharacter: Character = {
          ...characterData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          characters: [...state.characters, newCharacter],
        }));
        return id;
      },
      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((char) =>
            char.id === id
              ? { ...char, ...updates, updatedAt: Date.now() }
              : char
          ),
        })),
      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((char) => char.id !== id),
        })),
      getCharacter: (id) => get().characters.find((char) => char.id === id),
    }),
    {
      name: 'simutalk-characters',
    }
  )
);
