import { useEffect, useRef, useState } from 'react';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [openSection, setOpenSection] = useState<'model' | 'feature' | null>('model');

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

  const toggleSection = (section: 'model' | 'feature') => {
    setOpenSection(openSection === section ? null : section);
  };

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
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17h.01M12 14v-2a1 1 0 011-1h.01a1 1 0 011 1v0a1 1 0 01-1 1h-1v1" />
            </svg>
            도움말
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
        <div className="overflow-y-auto max-h-[70vh]">
          
          {/* 모델 가이드 섹션 */}
          <div className="border-b border-gray-100">
            <button 
              onClick={() => toggleSection('model')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                모델 가이드
              </h3>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${openSection === 'model' ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {openSection === 'model' && (
              <div className="px-6 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200"
              >
          
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
            )}
          </div>

          {/* 기능 가이드 섹션 */}
          <div className="border-b border-gray-100">
            <button 
              onClick={() => toggleSection('feature')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                기능 가이드
              </h3>
              <svg 
                className={`w-5 h-5 text-gray-400 transition-transform ${openSection === 'feature' ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {openSection === 'feature' && (
              <div className="px-6 pb-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                
                {/* 번역 명령어 */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    번역 명령어
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-800">/t 메시지</span>로 입력하면 메시지가 <span className="font-medium text-gray-900">채팅방 언어로 번역</span>되어 전송되고, AI가 자동으로 응답합니다.
                  </p>
                  <p className="text-xs text-gray-500">
                    예: 일본어 채팅방에서 <span className="font-mono text-gray-700">/t 안녕하세요</span> → <span className="font-mono text-gray-700">こんにちは</span>로 번역되어 전송됩니다.
                  </p>
                </div>

                {/* 이미지 인식 */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    이미지 인식
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    채팅 입력창에서 <span className="font-medium text-gray-900">클립보드 이미지를 붙여넣기</span>하면 AI가 이미지를 분석하여 대화할 수 있습니다. (Vision 모델 필요)
                  </p>
                </div>

                {/* 이모티콘 */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    이모티콘
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    채팅 입력창 왼쪽의 <span className="font-medium text-gray-900">스티커 아이콘</span>을 클릭하여 다양한 이모티콘을 추가하고 사용할 수 있습니다.
                  </p>
                </div>

                {/* 장기기억 */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    장기기억
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    캐릭터 설정에서 <span className="font-medium text-gray-900">장기기억 기능</span>을 활성화하면 AI가 이전 대화 내용을 기억하고 더욱 자연스러운 대화를 이어갈 수 있습니다.
                  </p>
                </div>

                {/* 테마 설정 */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    테마 설정
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    상단 메뉴의 <span className="font-medium text-gray-900">설정 → 테마</span>에서 배경색, 글꼴, 말풍선 스타일 등을 자유롭게 커스터마이징할 수 있습니다.
                  </p>
                </div>

              </div>
            )}
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
