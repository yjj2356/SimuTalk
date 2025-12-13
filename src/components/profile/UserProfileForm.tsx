import { useState, useRef, useEffect } from 'react';
import { ProfileInputMode, UserProfileSlot } from '@/types';
import { useUserStore } from '@/stores';

interface UserProfileFormProps {
  onClose: () => void;
  editingProfileId?: string;
}

export function UserProfileForm({ onClose, editingProfileId: initialEditingId }: UserProfileFormProps) {
  const { 
    userProfiles, 
    currentUserProfileId,
    addUserProfile,
    updateUserProfile,
    deleteUserProfile,
    setCurrentUserProfile,
    getUserProfile,
  } = useUserStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 현재 편집 중인 프로필 ID (null이면 새로 만들기)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(
    initialEditingId || currentUserProfileId || (userProfiles.length > 0 ? userProfiles[0].id : null)
  );
  
  // 편집 중인 프로필 데이터
  const editingProfile = editingProfileId ? getUserProfile(editingProfileId) : null;

  const [inputMode, setLocalInputMode] = useState<ProfileInputMode>(
    editingProfile?.inputMode || 'field'
  );

  // 필드 모드 상태
  const [name, setName] = useState(editingProfile?.fieldProfile?.name || '');
  const [profileImage, setProfileImage] = useState(
    editingProfile?.fieldProfile?.profileImage || ''
  );
  const [personality, setPersonality] = useState(
    editingProfile?.fieldProfile?.personality || ''
  );
  const [appearance, setAppearance] = useState(
    editingProfile?.fieldProfile?.appearance || ''
  );
  const [settings, setSettings] = useState(
    editingProfile?.fieldProfile?.settings || ''
  );
  const [additionalInfo, setAdditionalInfo] = useState(
    editingProfile?.fieldProfile?.additionalInfo || ''
  );

  // 자유 모드 상태
  const [freeProfileText, setFreeProfileText] = useState(
    editingProfile?.freeProfile || ''
  );
  const [freeProfileName, setFreeProfileName] = useState(
    editingProfile?.freeProfileName || ''
  );

  // 프로필 변경 시 폼 업데이트
  useEffect(() => {
    if (editingProfileId) {
      const profile = getUserProfile(editingProfileId);
      if (profile) {
        setLocalInputMode(profile.inputMode);
        setName(profile.fieldProfile?.name || '');
        setProfileImage(profile.fieldProfile?.profileImage || '');
        setPersonality(profile.fieldProfile?.personality || '');
        setAppearance(profile.fieldProfile?.appearance || '');
        setSettings(profile.fieldProfile?.settings || '');
        setAdditionalInfo(profile.fieldProfile?.additionalInfo || '');
        setFreeProfileText(profile.freeProfile || '');
        setFreeProfileName(profile.freeProfileName || '');
      }
    } else {
      // 새 프로필 - 초기화
      setLocalInputMode('field');
      setName('');
      setProfileImage('');
      setPersonality('');
      setAppearance('');
      setSettings('');
      setAdditionalInfo('');
      setFreeProfileText('');
      setFreeProfileName('');
    }
  }, [editingProfileId, getUserProfile]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: Partial<UserProfileSlot> = {
      inputMode,
      fieldProfile: inputMode === 'field' ? {
        name: name || '나',
        profileImage: profileImage || undefined,
        personality,
        appearance,
        settings,
        additionalInfo: additionalInfo || undefined,
      } : undefined,
      freeProfile: inputMode === 'free' ? freeProfileText : undefined,
      freeProfileName: inputMode === 'free' ? freeProfileName : undefined,
    };

    if (editingProfileId) {
      // 기존 프로필 업데이트
      updateUserProfile(editingProfileId, profileData);
    } else {
      // 새 프로필 추가
      const newId = addUserProfile(profileData as Omit<UserProfileSlot, 'id' | 'createdAt' | 'updatedAt'>);
      setCurrentUserProfile(newId);
    }

    onClose();
  };

  const handleAddNew = () => {
    setEditingProfileId(null);
  };

  const handleDeleteProfile = () => {
    if (!editingProfileId) return;
    if (userProfiles.length <= 1) {
      alert('최소 하나의 프로필이 필요합니다.');
      return;
    }
    if (confirm('이 프로필을 삭제하시겠습니까?')) {
      deleteUserProfile(editingProfileId);
      setEditingProfileId(userProfiles.filter(p => p.id !== editingProfileId)[0]?.id || null);
    }
  };

  const handleSelectProfile = (id: string) => {
    setEditingProfileId(id);
    setCurrentUserProfile(id);
  };

  const getProfileDisplayName = (profile: UserProfileSlot) => {
    if (profile.inputMode === 'field') {
      return profile.fieldProfile?.name || '이름 없음';
    }
    return profile.freeProfileName || '자유 프로필';
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto m-4 shadow-xl border border-black/[0.08]">
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 border-b border-black/[0.08] flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-[15px] font-semibold text-[#1d1d1f]">My Profile</h2>
              <p className="text-[10px] text-[#8e8e93] mt-0.5 font-medium">
                오토파일럿 모드에서 AI가 당신을 연기할 때 사용됩니다
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/[0.06] transition-colors"
            >
              <svg className="w-4 h-4 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* 프로필 슬롯 선택 */}
            <div>
              <label className="block text-[10px] font-semibold text-[#8e8e93] mb-2 uppercase tracking-wider">
                프로필 선택
              </label>
              <div className="flex flex-wrap gap-1.5">
                {userProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelectProfile(profile.id)}
                    className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                      editingProfileId === profile.id
                        ? 'bg-[#1d1d1f] text-white'
                        : 'bg-black/[0.04] text-[#6e6e73] hover:bg-black/[0.08]'
                    }`}
                  >
                    {getProfileDisplayName(profile)}
                    {currentUserProfileId === profile.id && (
                      <span className="ml-1 text-[10px] opacity-70">✓</span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddNew}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    editingProfileId === null
                      ? 'bg-[#1d1d1f] text-white'
                      : 'bg-black/[0.04] text-[#6e6e73] hover:bg-black/[0.08]'
                  }`}
                >
                  + 새 프로필
                </button>
              </div>
            </div>

            {/* 입력 모드 선택 */}
            <div className="bg-black/[0.03] p-0.5 rounded-md flex">
              <button
                type="button"
                onClick={() => setLocalInputMode('field')}
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
                onClick={() => setLocalInputMode('free')}
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
                      placeholder="내 이름"
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
                    rows={2}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none"
                    placeholder="나의 성격"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    외모
                  </label>
                  <textarea
                    value={appearance}
                    onChange={(e) => setAppearance(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none"
                    placeholder="나의 외모 묘사"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    설정
                  </label>
                  <textarea
                    value={settings}
                    onChange={(e) => setSettings(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none"
                    placeholder="현재 상황이나 배경 설정"
                  />
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
                    placeholder="기타 AI가 알아야 할 정보"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    이름 (표시용)
                  </label>
                  <input
                    type="text"
                    value={freeProfileName}
                    onChange={(e) => setFreeProfileName(e.target.value)}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
                    placeholder="프로필 이름"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8e8e93] mb-1.5 uppercase tracking-wider">
                    프로필 설명 (자유 형식)
                  </label>
                  <textarea
                    value={freeProfileText}
                    onChange={(e) => setFreeProfileText(e.target.value)}
                    required
                    rows={10}
                    className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all resize-none leading-relaxed"
                    placeholder="나에 대해 자유롭게 설명해주세요."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-black/[0.08] bg-black/[0.02] flex justify-between rounded-b-lg">
            <div>
              {editingProfileId && userProfiles.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteProfile}
                  className="px-3 py-1.5 rounded-md text-[12px] font-medium text-red-600 hover:bg-red-50 transition-all"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-md text-[12px] font-medium text-[#6e6e73] hover:bg-black/[0.06] hover:text-[#1d1d1f] transition-all"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md text-[12px] font-medium bg-[#1d1d1f] text-white hover:bg-[#3a3a3c] transition-all"
              >
                {editingProfileId ? '저장하기' : '추가하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
