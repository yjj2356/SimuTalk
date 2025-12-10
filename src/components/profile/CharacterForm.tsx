import { useState, useRef } from 'react';
import { Character, ProfileInputMode } from '@/types';
import { useCharacterStore } from '@/stores';

interface CharacterFormProps {
  character?: Character;
  onSave: () => void;
  onCancel: () => void;
}

export function CharacterForm({ character, onSave, onCancel }: CharacterFormProps) {
  const { addCharacter, updateCharacter } = useCharacterStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<ProfileInputMode>(
    character?.inputMode || 'field'
  );

  // 필드 모드 상태
  const [name, setName] = useState(character?.fieldProfile?.name || '');
  const [profileImage, setProfileImage] = useState(
    character?.fieldProfile?.profileImage || ''
  );
  const [personality, setPersonality] = useState(
    character?.fieldProfile?.personality || ''
  );
  const [speechStyle, setSpeechStyle] = useState(
    character?.fieldProfile?.speechStyle || ''
  );
  const [relationship, setRelationship] = useState(
    character?.fieldProfile?.relationship || ''
  );
  const [worldSetting, setWorldSetting] = useState(
    character?.fieldProfile?.worldSetting || ''
  );
  const [additionalInfo, setAdditionalInfo] = useState(
    character?.fieldProfile?.additionalInfo || ''
  );

  // 자유 모드 상태
  const [freeProfile, setFreeProfile] = useState(character?.freeProfile || '');
  const [freeProfileName, setFreeProfileName] = useState(character?.freeProfileName || '');
  const [freeProfileImage, setFreeProfileImage] = useState(character?.freeProfileImage || '');
  const freeFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFreeImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFreeProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const characterData = {
      inputMode,
      fieldProfile:
        inputMode === 'field'
          ? {
              name,
              profileImage: profileImage || undefined,
              personality,
              speechStyle,
              relationship,
              worldSetting,
              additionalInfo: additionalInfo || undefined,
            }
          : undefined,
      freeProfile: inputMode === 'free' ? freeProfile : undefined,
      freeProfileName: inputMode === 'free' ? freeProfileName : undefined,
      freeProfileImage: inputMode === 'free' ? freeProfileImage : undefined,
    };

    if (character) {
      updateCharacter(character.id, characterData);
    } else {
      addCharacter(characterData);
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 shadow-2xl border border-gray-100">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                {character ? 'Edit Character' : 'New Character'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                대화할 캐릭터의 페르소나를 설정합니다
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 입력 모드 선택 */}
            <div className="bg-gray-100 p-1 rounded-lg flex">
              <button
                type="button"
                onClick={() => setInputMode('field')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  inputMode === 'field'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                필드 모드
              </button>
              <button
                type="button"
                onClick={() => setInputMode('free')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  inputMode === 'free'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                자유 모드
              </button>
            </div>

            {inputMode === 'field' ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                      이름
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                      placeholder="캐릭터 이름"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                      프로필 이미지
                    </label>
                    <div className="flex items-center gap-3">
                      {profileImage && (
                        <img
                          src={profileImage}
                          alt="프로필 미리보기"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-3 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 hover:bg-gray-100 transition-all duration-200 text-left"
                      >
                        {profileImage ? '이미지 변경' : '이미지 선택'}
                      </button>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={() => setProfileImage('')}
                          className="p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                    성격
                  </label>
                  <textarea
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200 resize-none"
                    placeholder="캐릭터의 성격을 설명해주세요"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                    말투
                  </label>
                  <textarea
                    value={speechStyle}
                    onChange={(e) => setSpeechStyle(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200 resize-none"
                    placeholder="캐릭터의 말투를 설명해주세요 (예: 반말, 존댓말, 특이한 어미 등)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                      관계
                    </label>
                    <input
                      type="text"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                      placeholder="유저와의 관계"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                      세계관
                    </label>
                    <input
                      type="text"
                      value={worldSetting}
                      onChange={(e) => setWorldSetting(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                      placeholder="캐릭터가 속한 세계관"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                    추가 정보
                  </label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200 resize-none"
                    placeholder="기타 알아야 할 정보"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 자유 모드: 이름과 이미지 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                      이름
                    </label>
                    <input
                      type="text"
                      value={freeProfileName}
                      onChange={(e) => setFreeProfileName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                      placeholder="캐릭터 이름"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                      프로필 이미지
                    </label>
                    <div className="flex items-center gap-3">
                      {freeProfileImage && (
                        <img
                          src={freeProfileImage}
                          alt="프로필 미리보기"
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                        />
                      )}
                      <input
                        ref={freeFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFreeImageSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => freeFileInputRef.current?.click()}
                        className="flex-1 py-3 px-4 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 hover:bg-gray-100 transition-all duration-200 text-left"
                      >
                        {freeProfileImage ? '이미지 변경' : '이미지 선택'}
                      </button>
                      {freeProfileImage && (
                        <button
                          type="button"
                          onClick={() => setFreeProfileImage('')}
                          className="p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                    캐릭터 설명 (자유 형식)
                  </label>
                  <textarea
                    value={freeProfile}
                    onChange={(e) => setFreeProfile(e.target.value)}
                    required
                    rows={10}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200 resize-none leading-relaxed"
                    placeholder="캐릭터에 대해 자유롭게 설명해주세요. 프롬프트 형식으로 작성해도 좋습니다."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 rounded-b-xl">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10 transition-all duration-200 transform hover:-translate-y-0.5"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
