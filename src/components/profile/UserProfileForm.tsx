import { useState } from 'react';
import { ProfileInputMode } from '@/types';
import { useUserStore } from '@/stores';

interface UserProfileFormProps {
  onClose: () => void;
}

export function UserProfileForm({ onClose }: UserProfileFormProps) {
  const { userProfile, setInputMode, updateFieldProfile, setFreeProfile } = useUserStore();

  const [inputMode, setLocalInputMode] = useState<ProfileInputMode>(
    userProfile.inputMode
  );

  // 필드 모드 상태
  const [name, setName] = useState(userProfile.fieldProfile?.name || '');
  const [profileImage, setProfileImage] = useState(
    userProfile.fieldProfile?.profileImage || ''
  );
  const [personality, setPersonality] = useState(
    userProfile.fieldProfile?.personality || ''
  );
  const [appearance, setAppearance] = useState(
    userProfile.fieldProfile?.appearance || ''
  );
  const [settings, setSettings] = useState(
    userProfile.fieldProfile?.settings || ''
  );
  const [additionalInfo, setAdditionalInfo] = useState(
    userProfile.fieldProfile?.additionalInfo || ''
  );

  // 자유 모드 상태
  const [freeProfileText, setFreeProfileText] = useState(
    userProfile.freeProfile || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setInputMode(inputMode);

    if (inputMode === 'field') {
      updateFieldProfile({
        name,
        profileImage: profileImage || undefined,
        personality,
        appearance,
        settings,
        additionalInfo: additionalInfo || undefined,
      });
    } else {
      setFreeProfile(freeProfileText);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-bold">내 프로필 설정</h2>
            <p className="text-sm text-gray-500">
              오토파일럿 모드에서 AI가 당신을 연기할 때 사용됩니다
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* 입력 모드 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">입력 모드</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLocalInputMode('field')}
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
                  onClick={() => setLocalInputMode('free')}
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
                  <label className="block text-sm font-medium mb-1">성격</label>
                  <textarea
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    rows={2}
                    placeholder="당신의 성격을 설명해주세요"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">외모</label>
                  <textarea
                    value={appearance}
                    onChange={(e) => setAppearance(e.target.value)}
                    rows={2}
                    placeholder="당신의 외모를 설명해주세요"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">설정</label>
                  <textarea
                    value={settings}
                    onChange={(e) => setSettings(e.target.value)}
                    rows={2}
                    placeholder="기타 설정 (직업, 취미 등)"
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  프로필 설명 (자유 형식) *
                </label>
                <textarea
                  value={freeProfileText}
                  onChange={(e) => setFreeProfileText(e.target.value)}
                  required
                  rows={10}
                  placeholder="당신에 대해 자유롭게 설명해주세요."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
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
