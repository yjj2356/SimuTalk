import { useEffect, useRef } from 'react';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            AI 모델 가이드
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
          
          {/* 언어별 추천 */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              언어별 추천
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-900">한국어, 일본어, 중국어</span> 채팅에는 <span className="font-semibold text-gray-900">Gemini</span> 모델을 추천합니다.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">Gemini 시리즈</span>
            </div>
            
            {/* Gemini 3.0 Pro */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-gray-300 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Gemini 3.0 Pro</h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">최고 성능</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  가장 똑똑하고 성능이 좋지만 비용이 높습니다. 최고의 퀄리티를 원할 때 선택하세요.
                </p>
              </div>
            </div>

            {/* Gemini 2.5 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-gray-300 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">Gemini 2.5 Pro / Flash</h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">가성비</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  가격 대비 성능이 훌륭합니다. 특히 <span className="font-medium text-gray-700">번역 능력</span>이 뛰어나며, Flash 모델은 속도가 매우 빠릅니다.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 text-xs text-gray-500 border border-gray-100 flex gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Gemini 모델들은 2차 학습이 잘 되어 있어, 유명 캐릭터의 경우 이름만 입력해도 설정을 잘 이해하는 경우가 많습니다.</p>
            </div>
          </div>

          {/* 번역 명령어 */}
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              번역 명령어
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-800">/t 메시지</span>로 입력하면 메시지가 <span className="font-medium text-gray-900">채팅방 언어로 번역</span>되어 전송되고, AI가 자동으로 응답합니다.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">GPT 시리즈</span>
            </div>
            
            {/* GPT 5.1 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 group-hover:border-gray-300 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-sm">GPT 5.1</h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">캐릭터 해석</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  캐릭터의 성격과 상황 해석 능력이 탁월하고 가격도 저렴합니다. 다만 영어 데이터 위주라 <span className="font-medium text-gray-700">다국어 능력은 상대적으로 떨어질 수 있습니다.</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 text-xs text-gray-500 border border-gray-100 flex gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p><span className="font-medium text-gray-700">Flex Tier</span>를 활성화하면 GPT 모델을 더 저렴하게 사용할 수 있습니다. 단, 처리 속도가 느려질 수 있습니다.</p>
            </div>
          </div>

        </div>
        
        {/* 푸터 */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
