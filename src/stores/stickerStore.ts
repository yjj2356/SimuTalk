import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sticker } from '@/types';

interface StickerState {
  stickers: Sticker[];
  addSticker: (sticker: Omit<Sticker, 'id' | 'createdAt'>) => void;
  updateSticker: (id: string, updates: Partial<Omit<Sticker, 'id' | 'createdAt'>>) => void;
  removeSticker: (id: string) => void;
  getSticker: (id: string) => Sticker | undefined;
}

// 이미지 리사이징 함수 (최대 128x128)
export async function resizeImage(
  imageData: string,
  mimeType: string,
  maxSize: number = 128
): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      // 비율 유지하면서 리사이징
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      // PNG로 저장 (투명도 유지)
      const resizedData = canvas.toDataURL('image/png').split(',')[1];
      resolve({ data: resizedData, mimeType: 'image/png' });
    };
    img.src = `data:${mimeType};base64,${imageData}`;
  });
}

export const useStickerStore = create<StickerState>()(
  persist(
    (set, get) => ({
      stickers: [],
      
      addSticker: (stickerData) => {
        const newSticker: Sticker = {
          ...stickerData,
          id: `sticker_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          createdAt: Date.now(),
        };
        
        set((state) => ({
          stickers: [...state.stickers, newSticker],
        }));
      },
      
      updateSticker: (id, updates) => {
        set((state) => ({
          stickers: state.stickers.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },
      
      removeSticker: (id) => {
        set((state) => ({
          stickers: state.stickers.filter((s) => s.id !== id),
        }));
      },
      
      getSticker: (id) => {
        return get().stickers.find((s) => s.id === id);
      },
    }),
    {
      name: 'simutalk-stickers',
    }
  )
);
