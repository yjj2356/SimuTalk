import { useState } from 'react';
import { useSettingsStore } from '@/stores';
import { ThemeType } from '@/types';
import { themeConfigs } from '@/utils/theme';
import { exportAllData, importAllData, downloadAsFile } from '@/utils/storage';
import { GEMINI_MODELS, OPENAI_MODELS } from '@/services/aiService';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    settings,
    setTheme,
    setGeminiApiKey,
    setOpenAIApiKey,
    setDefaultAIProvider,
    setGeminiModel,
    setOpenAIModel,
    setTranslateUserMessages,
  } = useSettingsStore();

  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey || '');

  const handleSaveApiKeys = () => {
    setGeminiApiKey(geminiKey);
    setOpenAIApiKey(openaiKey);
    alert('API 키가 저장되었습니다.');
  };

  const handleExport = () => {
    const data = exportAllData();
    const filename = `simutalk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadAsFile(data, filename);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const success = importAllData(text);

      if (success) {
        alert('데이터를 성공적으로 가져왔습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } else {
        alert('데이터 가져오기에 실패했습니다.');
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">설정</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 테마 설정 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">테마</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(themeConfigs) as ThemeType[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setTheme(theme)}
                  className={`p-3 rounded-lg border text-left ${
                    settings.theme === theme
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{themeConfigs[theme].name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* API 키 설정 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">API 키</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Google Gemini API 키
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  OpenAI API 키
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSaveApiKeys}
                className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
              >
                API 키 저장
              </button>
            </div>
          </section>

          {/* 기본 AI 제공자 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">기본 AI</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDefaultAIProvider('gemini')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm ${
                  settings.defaultAIProvider === 'gemini'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Gemini
              </button>
              <button
                onClick={() => setDefaultAIProvider('openai')}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm ${
                  settings.defaultAIProvider === 'openai'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                OpenAI
              </button>
            </div>
          </section>

          {/* 모델 선택 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">모델 선택</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Gemini 모델</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {GEMINI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">OpenAI 모델</label>
                <select
                  value={settings.openaiModel}
                  onChange={(e) => setOpenAIModel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  {OPENAI_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 번역 설정 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">번역</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.translateUserMessages}
                onChange={(e) => setTranslateUserMessages(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm">
                내 메시지도 외국어로 번역하여 표시
              </span>
            </label>
          </section>

          {/* 데이터 백업 */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              데이터 백업
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
              >
                내보내기
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
              >
                가져오기
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
