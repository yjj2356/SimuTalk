import { useState, useRef } from 'react';
import { useStickerStore, resizeImage, useSettingsStore } from '@/stores';
import { Sticker } from '@/types';
import { callAI } from '@/services/aiService';

interface StickerManagerProps {
  onClose: () => void;
}

export function StickerManager({ onClose }: StickerManagerProps) {
  const { stickers, addSticker, updateSticker, removeSticker } = useStickerStore();
  const { settings } = useSettingsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsCharacterUsable, setNewIsCharacterUsable] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일을 Base64로 읽기
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const mimeType = file.type;
      
      // 리사이징 (128x128)
      const resized = await resizeImage(base64, mimeType, 128);
      setPreviewImage(resized);
      setNewName(file.name.split('.')[0]); // 파일명을 기본 이름으로
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeImage = async () => {
    if (!previewImage || !settings.geminiApiKey) {
      alert('이미지 분석을 위해 Gemini API 키가 필요합니다.');
      return;
    }

    setIsAnalyzing(true);

    const prompt = `Describe this sticker/emoticon image in a concise way (1-2 sentences in Korean). 
Focus on: the emotion/feeling it conveys, the character or object shown, and the action or pose.
This description will be used to provide context in a chat when someone sends this sticker.
Example outputs:
- "귀여운 고양이가 하트 눈으로 사랑을 표현하는 스티커"
- "화난 표정의 캐릭터가 주먹을 쥐고 있는 이모티콘"
- "슬픈 표정으로 눈물을 흘리는 귀여운 토끼"

Just output the description, nothing else.`;

    const response = await callAI(
      prompt,
      'gemini-2.0-flash',
      settings.geminiApiKey,
      undefined,
      { data: previewImage.data, mimeType: previewImage.mimeType }
    );

    if (!response.error && response.content) {
      setNewDescription(response.content.trim());
    } else {
      alert('이미지 분석 실패: ' + (response.error || '알 수 없는 오류'));
    }

    setIsAnalyzing(false);
  };

  const handleAddSticker = () => {
    if (!previewImage || !newName.trim() || !newDescription.trim()) {
      alert('이름, 설명, 이미지를 모두 입력해주세요.');
      return;
    }

    addSticker({
      name: newName.trim(),
      description: newDescription.trim(),
      imageData: previewImage.data,
      mimeType: previewImage.mimeType,
      isCharacterUsable: newIsCharacterUsable,
    });

    // 초기화
    setIsAdding(false);
    setNewName('');
    setNewDescription('');
    setNewIsCharacterUsable(true);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateSticker = (sticker: Sticker) => {
    updateSticker(sticker.id, {
      name: newName.trim() || sticker.name,
      description: newDescription.trim() || sticker.description,
      isCharacterUsable: newIsCharacterUsable,
    });
    setEditingId(null);
    setNewName('');
    setNewDescription('');
    setNewIsCharacterUsable(true);
  };

  const startEdit = (sticker: Sticker) => {
    setEditingId(sticker.id);
    setNewName(sticker.name);
    setNewDescription(sticker.description);
    setNewIsCharacterUsable(sticker.isCharacterUsable ?? true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10002] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">이모티콘 관리</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 추가 버튼 또는 추가 폼 */}
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 이모티콘 추가
            </button>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-3">새 이모티콘 추가</h3>
              
              {/* 이미지 업로드 */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden"
                >
                  {previewImage ? (
                    <img
                      src={`data:${previewImage.mimeType};base64,${previewImage.data}`}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">이름</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="이모티콘 이름"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-500">설명 (AI 컨텍스트용)</label>
                      {previewImage && settings.geminiApiKey && (
                        <button
                          onClick={handleAnalyzeImage}
                          disabled={isAnalyzing}
                          className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                        >
                          {isAnalyzing ? '분석 중...' : 'AI 자동 분석'}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="예: 귀여운 고양이가 하트 눈으로 사랑을 표현하는 스티커"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newCharacterUsable"
                      checked={newIsCharacterUsable}
                      onChange={(e) => setNewIsCharacterUsable(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="newCharacterUsable" className="text-xs text-gray-600">
                      캐릭터도 이 이모티콘 사용 가능
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewName('');
                    setNewDescription('');
                    setNewIsCharacterUsable(true);
                    setPreviewImage(null);
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={handleAddSticker}
                  disabled={!previewImage || !newName.trim() || !newDescription.trim()}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  추가
                </button>
              </div>
            </div>
          )}

          {/* 이모티콘 목록 */}
          {stickers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                >
                  {editingId === sticker.id ? (
                    <div className="space-y-2">
                      <img
                        src={`data:${sticker.mimeType};base64,${sticker.imageData}`}
                        alt={sticker.name}
                        className="w-16 h-16 object-contain mx-auto"
                      />
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                      />
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-xs text-gray-500"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => handleUpdateSticker(sticker)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={`data:${sticker.mimeType};base64,${sticker.imageData}`}
                        alt={sticker.name}
                        className="w-16 h-16 object-contain mx-auto mb-2"
                      />
                      <p className="text-sm font-medium text-gray-900 text-center truncate">{sticker.name}</p>
                      <p className="text-xs text-gray-500 text-center line-clamp-2 mt-1">{sticker.description}</p>
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => startEdit(sticker)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('이 이모티콘을 삭제하시겠습니까?')) {
                              removeSticker(sticker.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : !isAdding && (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>등록된 이모티콘이 없습니다</p>
              <p className="text-sm mt-1">위 버튼을 눌러 이모티콘을 추가해보세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
