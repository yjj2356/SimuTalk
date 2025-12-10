import { useState, KeyboardEvent, useRef, ChangeEvent } from 'react';
import { ThemeType } from '@/types';

interface ImageData {
  data: string; // Base64 인코딩된 이미지 데이터
  mimeType: string; // MIME 타입 (image/jpeg, image/png, etc.)
  preview: string; // 미리보기용 Data URL
}

interface ChatInputProps {
  onSend: (message: string, imageData?: { data: string; mimeType: string }) => void;
  disabled?: boolean;
  placeholder?: string;
  theme?: ThemeType;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '메시지 입력... (/t 텍스트로 번역)',
  theme = 'basic',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 파일 선택 처리
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 지원하는 이미지 형식 확인
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('지원하지 않는 이미지 형식입니다. (JPEG, PNG, WEBP, GIF만 지원)');
      return;
    }

    // 파일 크기 제한 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('이미지 크기는 50MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Data URL에서 base64 데이터 추출
      const base64Data = result.split(',')[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
    
    // input 초기화 (같은 파일 다시 선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 이미지 선택 취소
  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  // 이미지 버튼 클릭
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = () => {
    if ((message.trim() || selectedImage) && !disabled) {
      onSend(
        message.trim(),
        selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined
      );
      setMessage('');
      setSelectedImage(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 숨겨진 파일 input (모든 테마에서 공유)
  const HiddenFileInput = () => (
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleImageSelect}
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
    />
  );

  // 이미지 미리보기 컴포넌트
  const ImagePreview = ({ className = '' }: { className?: string }) => (
    selectedImage && (
      <div className={`relative inline-block ${className}`}>
        <img 
          src={selectedImage.preview} 
          alt="선택된 이미지" 
          className="max-h-16 max-w-20 object-cover rounded"
        />
        <button
          onClick={handleRemoveImage}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
        >
          ×
        </button>
      </div>
    )
  );

  // 카카오톡 스타일 입력창
  if (theme === 'kakao') {
    return (
      <div className="bg-white z-10">
        {/* 이미지 미리보기 영역 */}
        {selectedImage && (
          <div className="px-2 pt-2 pb-1">
            <ImagePreview />
          </div>
        )}
        <div className="h-[44px] flex items-center px-2">
          <HiddenFileInput />
          <div 
            onClick={handleImageButtonClick}
            className="w-7 h-7 border border-gray-300 rounded-[7px] flex justify-center items-center text-gray-500 mr-2 flex-shrink-0 cursor-pointer hover:bg-gray-50"
          >
            <span className="text-lg pb-0.5">+</span>
          </div>
          <div className="flex-1 bg-[#F4F4F4] rounded-[18px] h-8 px-2.5 flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder=""
              disabled={disabled}
              className="border-none bg-transparent outline-none w-full text-[13px]"
            />
            <div className="flex gap-2 ml-2 flex-shrink-0 items-center">
              <svg className="w-5 h-5 cursor-pointer text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8c0 4.41-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
              <span className="cursor-pointer text-gray-400 text-base">#</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 라인 스타일 입력창
  if (theme === 'line') {
    return (
      <div className="bg-white z-10">
        {/* 이미지 미리보기 영역 */}
        {selectedImage && (
          <div className="px-[10px] pt-2 pb-1 border-t border-[#dcdcdc]">
            <ImagePreview />
          </div>
        )}
        <div className={`h-[50px] flex items-center px-[10px] ${!selectedImage ? 'border-t border-[#dcdcdc]' : ''}`}>
          <HiddenFileInput />
          {/* 좌측 아이콘들 */}
          <div className="flex gap-[15px] mr-3 text-[#222] text-[19px]">
            <svg onClick={handleImageButtonClick} className="w-[19px] h-[19px] cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <svg className="w-[19px] h-[19px] cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <svg onClick={handleImageButtonClick} className="w-[19px] h-[19px] cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
          
          {/* 입력 필드 */}
          <div className="flex-1 bg-[#F2F3F5] rounded-[20px] h-[34px] px-[10px] flex items-center relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              disabled={disabled}
              className="border-none bg-transparent outline-none w-full text-[14px] pr-[25px]"
            />
            <svg className="absolute right-[10px] w-4 h-4 cursor-pointer text-[#555]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8c0 4.41-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
          </div>
          
          {/* 마이크 아이콘 */}
          <div className="ml-[15px] text-[19px] text-[#222]">
            <svg className="w-[19px] h-[19px] cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // iMessage 스타일 입력창
  if (theme === 'imessage') {
    return (
      <div className="bg-white">
        {/* 이미지 미리보기 영역 */}
        {selectedImage && (
          <div className="px-3 pt-2 pb-1 border-t border-[#E5E5E5]">
            <ImagePreview />
          </div>
        )}
        <div className={`min-h-[48px] flex items-end py-2 px-3 gap-[10px] ${!selectedImage ? 'border-t border-[#E5E5E5]' : ''}`}>
          <HiddenFileInput />
          {/* + 버튼 */}
          <div 
            onClick={handleImageButtonClick}
            className="w-7 h-7 bg-[#D1D1D6] rounded-full flex justify-center items-center flex-shrink-0 cursor-pointer mb-1 hover:bg-[#C1C1C6]"
          >
            <svg className="w-[14px] h-[14px]" fill="#79797e" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </div>
          
          {/* 입력 필드 */}
          <div className="flex-1 border border-[#C6C6C6] rounded-[18px] min-h-[34px] px-[10px] flex items-center bg-white">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="iMessage"
              disabled={disabled}
              className="flex-1 border-none bg-transparent outline-none text-[14px] mr-[5px] py-[6px]"
            />
            {/* 마이크 아이콘 */}
            <svg className="w-[14px] h-[14px] cursor-pointer" fill="#8e8e93" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // 기본 스타일 입력창
  return (
    <div className="bg-white border-t border-gray-200">
      {/* 이미지 미리보기 영역 */}
      {selectedImage && (
        <div className="px-4 pt-3">
          <ImagePreview />
        </div>
      )}
      <div className="flex items-end gap-2 p-4">
        <HiddenFileInput />
        {/* 이미지 첨부 버튼 */}
        <button
          onClick={handleImageButtonClick}
          className="w-11 h-11 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-200"
          title="이미지 첨부"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-transparent disabled:bg-gray-100 transition-all duration-200 placeholder-gray-400 text-gray-900"
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !selectedImage)}
          className="w-11 h-11 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
        >
          <svg className="w-5 h-5 transform translate-x-0.5 -translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
