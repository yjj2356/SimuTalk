import { useStickerStore } from '@/stores';
import { Sticker } from '@/types';

interface StickerPickerProps {
  onSelect: (sticker: Sticker) => void;
  onManage: () => void;
  onClose: () => void;
}

export function StickerPicker({ onSelect, onManage, onClose }: StickerPickerProps) {
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
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onManage();
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="이모티콘 관리"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onManage();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 mt-2"
              >
                이모티콘 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
