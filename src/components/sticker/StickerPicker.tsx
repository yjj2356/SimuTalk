import { useStickerStore } from '@/stores';
import { Sticker } from '@/types';

interface StickerPickerProps {
  onSelect: (sticker: Sticker) => void;
  onClose: () => void;
}

export function StickerPicker({ onSelect, onClose }: StickerPickerProps) {
  const { stickers } = useStickerStore();

  return (
    <>
      {/* 백드롭 - 클릭 시 닫힘 */}
      <div 
        className="fixed inset-0 z-[10000]" 
        onClick={onClose}
      />
      
      {/* 스티커 선택기 - 화면 하단 중앙에 고정 */}
      <div 
        className="fixed bottom-20 left-1/2 -translate-x-1/2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
          <span className="text-sm font-medium text-gray-700">이모티콘</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 이모티콘 그리드 */}
        <div className="p-2 max-h-64 overflow-y-auto">
          {stickers.length > 0 ? (
            <div className="grid grid-cols-4 gap-1">
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => onSelect(sticker)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                  title={sticker.name}
                >
                  <img
                    src={`data:${sticker.mimeType};base64,${sticker.imageData}`}
                    alt={sticker.name}
                    className="w-12 h-12 object-contain"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">등록된 이모티콘이 없습니다</p>
              <p className="text-xs mt-1">사이드바에서 이모티콘을 추가해주세요</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
