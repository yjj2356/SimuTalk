import { useState } from 'react';
import { useSettingsStore } from '@/stores';
import { exportAllData, importAllData, downloadAsFile } from '@/utils/storage';
import { GEMINI_MODELS, OPENAI_MODELS } from '@/services/aiService';

interface SettingsPanelProps {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    settings,
    setGeminiApiKey,
    setOpenAIApiKey,
    setResponseModel,
    setTranslationModel,
    setSummaryModel,
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4 shadow-2xl border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-xl font-bold tracking-tight">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* API 키 설정 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">API Keys</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                />
              </div>
              <button
                onClick={handleSaveApiKeys}
                className="w-full py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 text-sm font-medium transition-all duration-200 shadow-sm"
              >
                Save API Keys
              </button>
            </div>
          </section>

          {/* AI 모델 설정 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">AI Models</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  답변 모델 (Response Model)
                </label>
                <select
                  value={settings.responseModel}
                  onChange={(e) => setResponseModel(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                >
                  <optgroup label="Google Gemini">
                    {GEMINI_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="OpenAI">
                    {OPENAI_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  번역 모델 (Translation Model)
                </label>
                <select
                  value={settings.translationModel}
                  onChange={(e) => setTranslationModel(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                >
                  <optgroup label="Google Gemini">
                    {GEMINI_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="OpenAI">
                    {OPENAI_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  요약 모델 (Summary Model)
                </label>
                <select
                  value={settings.summaryModel || 'gemini-2.5-flash-preview-09-2025'}
                  onChange={(e) => setSummaryModel(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200"
                >
                  <optgroup label="Google Gemini">
                    {GEMINI_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="OpenAI">
                    {OPENAI_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </section>

          {/* 데이터 관리 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Data Management</h3>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Backup Data
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Restore Data
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
