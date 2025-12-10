import { useState } from 'react';
import { Character, ProfileInputMode, OutputLanguage } from '@/types';
import { useCharacterStore } from '@/stores';

interface CharacterFormProps {
  character?: Character;
  onSave: () => void;
  onCancel: () => void;
}

export function CharacterForm({ character, onSave, onCancel }: CharacterFormProps) {
  const { addCharacter, updateCharacter } = useCharacterStore();

  const [inputMode, setInputMode] = useState<ProfileInputMode>(
    character?.inputMode || 'field'
  );
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>(
    character?.outputLanguage || 'korean'
  );
  const [foreignLanguage, setForeignLanguage] = useState(
    character?.foreignLanguage || ''
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const characterData = {
      inputMode,
      outputLanguage,
      foreignLanguage: outputLanguage === 'foreign' ? foreignLanguage : undefined,
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
    };

    if (character) {
      updateCharacter(character.id, characterData);
    } else {
      addCharacter(characterData);
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold">
              {character ? '캐릭터 수정' : '새 캐릭터 추가'}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {/* 입력 모드 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">입력 모드</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('field')}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    inputMode === 'field'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  필드 모드
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('free')}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    inputMode === 'free'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  자유 모드
                </button>
              </div>
            </div>

            {inputMode === 'field' ? (
              <>
                {/* 필드 모드 입력 */}
                <div>
                  <label className="block text-sm font-medium mb-1">이름 *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    프로필 이미지 URL
                  </label>
                  <input
                    type="url"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">성격 *</label>
                  <textarea
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    required
                    rows={2}
                    placeholder="캐릭터의 성격을 설명해주세요"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">말투 *</label>
                  <textarea
                    value={speechStyle}
                    onChange={(e) => setSpeechStyle(e.target.value)}
                    required
                    rows={2}
                    placeholder="캐릭터의 말투를 설명해주세요 (예: 반말, 존댓말, 특이한 어미 등)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">관계</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="유저와의 관계 (예: 친구, 연인, 동료 등)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">세계관</label>
                  <textarea
                    value={worldSetting}
                    onChange={(e) => setWorldSetting(e.target.value)}
                    rows={2}
                    placeholder="캐릭터가 속한 세계관이나 배경"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">추가 정보</label>
                  <textarea
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={2}
                    placeholder="기타 알아야 할 정보"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              /* 자유 모드 입력 */
              <div>
                <label className="block text-sm font-medium mb-1">
                  캐릭터 설명 (자유 형식) *
                </label>
                <textarea
                  value={freeProfile}
                  onChange={(e) => setFreeProfile(e.target.value)}
                  required
                  rows={10}
                  placeholder="캐릭터에 대해 자유롭게 설명해주세요. 프롬프트 형식으로 작성해도 좋습니다."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* 출력 언어 설정 */}
            <div>
              <label className="block text-sm font-medium mb-2">출력 언어</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOutputLanguage('korean')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm ${
                    outputLanguage === 'korean'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  한국어
                </button>
                <button
                  type="button"
                  onClick={() => setOutputLanguage('foreign')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm ${
                    outputLanguage === 'foreign'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  외국어 + 번역
                </button>
              </div>
            </div>

            {outputLanguage === 'foreign' && (
              <div>
                <label className="block text-sm font-medium mb-1">외국어</label>
                <input
                  type="text"
                  value={foreignLanguage}
                  onChange={(e) => setForeignLanguage(e.target.value)}
                  placeholder="예: 일본어, 영어, 중국어"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
