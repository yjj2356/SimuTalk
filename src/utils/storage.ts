// 데이터 내보내기/가져오기 유틸리티

export interface ExportData {
  version: string;
  exportedAt: number;
  settings: unknown;
  characters: unknown;
  chats: unknown;
  userProfile: unknown;
}

export function exportAllData(): string {
  const data: ExportData = {
    version: '1.0.0',
    exportedAt: Date.now(),
    settings: JSON.parse(localStorage.getItem('simutalk-settings') || '{}'),
    characters: JSON.parse(localStorage.getItem('simutalk-characters') || '{}'),
    chats: JSON.parse(localStorage.getItem('simutalk-chats') || '{}'),
    userProfile: JSON.parse(localStorage.getItem('simutalk-user') || '{}'),
  };

  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data: ExportData = JSON.parse(jsonString);

    if (!data.version || !data.exportedAt) {
      throw new Error('유효하지 않은 데이터 형식입니다.');
    }

    if (data.settings) {
      localStorage.setItem('simutalk-settings', JSON.stringify(data.settings));
    }
    if (data.characters) {
      localStorage.setItem('simutalk-characters', JSON.stringify(data.characters));
    }
    if (data.chats) {
      localStorage.setItem('simutalk-chats', JSON.stringify(data.chats));
    }
    if (data.userProfile) {
      localStorage.setItem('simutalk-user', JSON.stringify(data.userProfile));
    }

    return true;
  } catch (error) {
    console.error('데이터 가져오기 실패:', error);
    return false;
  }
}

export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
