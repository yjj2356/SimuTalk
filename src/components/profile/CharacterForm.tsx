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
      <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto m-4 shadow-xl border border-black/[0.08]">
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 border-b border-black/[0.08] flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-[15px] font-semibold text-[#1d1d1f]">
                {character ? 'Edit Character' : 'New Character'}
              </h2>
              <p className="text-[10px] text-[#8e8e93] mt-0.5 font-medium">
                대화할 캐릭터의 페르소나를 설정합니다
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/[0.06] transition-colors"
            >
              <svg className="w-4 h-4 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* 입력 모드 선택 */}
            <div className="bg-black/[0.03] p-0.5 rounded-md flex">
              <button
                type="button"
                onClick={() => setInputMode('field')}
                className={`flex-1 py-1.5 px-3 rounded text-[12px] font-medium transition-all ${
                  inputMode === 'field'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                필드 모드
              </button>
              <button
                type="button"
                onClick={() => setInputMode('free')}
                className={`flex-1 py-1.5 px-3 rounded text-[12px] font-medium transition-all ${
                  inputMode === 'free'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                자유 모드
              </button>
            </div>

            {inputMode === 'field' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                      이름
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
                      placeholder="캐릭터 이름"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                      프로필 이미지
                    </label>
                    <div className="flex items-center gap-2">
                      {profileImage && (
                        <img
                          src={profileImage}
                          alt="프로필 미리보기"
                          className="w-10 h-10 rounded-md object-cover border border-black/[0.08]"
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
                        className="flex-1 py-2 px-3 rounded-md border border-black/[0.08] bg-black/[0.02] text-[12px] text-[#6e6e73] hover:bg-black/[0.04] transition-all text-left"
                      >
                        {profileImage ? '이미지 변경' : '이미지 선택'}
                      </button>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={() => setProfileImage('')}
                          className="p-2 rounded-md border border-black/[0.08] hover:bg-black/[0.04] transition-all"
                        >
                          <svg className="w-3.5 h-3.5 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    성격
                  </label>
                  <textarea
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none"
                    placeholder="캐릭터의 성격을 설명해주세요"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    말투
                  </label>
                  <textarea
                    value={speechStyle}
                    onChange={(e) => setSpeechStyle(e.target.value)}
                    required
                    rows={2}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none"
                    placeholder="캐릭터의 말투를 설명해주세요 (예: 반말, 존댓말, 특이한 어미 등)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                      관계
                    </label>
                    <input
                      type="text"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
                      placeholder="유저와의 관계"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                      세계관
                    </label>
                    <input
                      type="text"
                      value={worldSetting}
                      onChange={(e) => setWorldSetting(e.target.value)}
                      className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
                      placeholder="캐릭터가 속한 세계관"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    추가 정보
                  </label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none"
                    placeholder="기타 알아야 할 정보"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 자유 모드: 이름과 이미지 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                      이름
                    </label>
                    <input
                      type="text"
                      value={freeProfileName}
                      onChange={(e) => setFreeProfileName(e.target.value)}
                      required
                      className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
                      placeholder="캐릭터 이름"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                      프로필 이미지
                    </label>
                    <div className="flex items-center gap-2">
                      {freeProfileImage && (
                        <img
                          src={freeProfileImage}
                          alt="프로필 미리보기"
                          className="w-10 h-10 rounded-md object-cover border border-black/[0.08]"
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
                        className="flex-1 py-2 px-3 rounded-md border border-black/[0.08] bg-black/[0.02] text-[12px] text-[#6e6e73] hover:bg-black/[0.04] transition-all text-left"
                      >
                        {freeProfileImage ? '이미지 변경' : '이미지 선택'}
                      </button>
                      {freeProfileImage && (
                        <button
                          type="button"
                          onClick={() => setFreeProfileImage('')}
                          className="p-2 rounded-md border border-black/[0.08] hover:bg-black/[0.04] transition-all"
                        >
                          <svg className="w-3.5 h-3.5 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    캐릭터 설명 (자유 형식)
                  </label>
                  <textarea
                    value={freeProfile}
                    onChange={(e) => setFreeProfile(e.target.value)}
                    required
                    rows={10}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none leading-relaxed"
                    placeholder="캐릭터에 대해 자유롭게 설명해주세요. 프롬프트 형식으로 작성해도 좋습니다."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-black/[0.08] bg-black/[0.02] flex justify-end gap-2 rounded-b-lg">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 rounded-md text-[12px] font-medium text-[#6e6e73] hover:bg-black/[0.06] hover:text-[#1d1d1f] transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md text-[12px] font-medium bg-[#1d1d1f] text-white hover:bg-[#3a3a3c] transition-all"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
