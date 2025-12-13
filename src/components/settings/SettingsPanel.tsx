import { useState } from 'react';
import { useSettingsStore } from '@/stores';
import { exportAllData, importAllData, downloadAsFile } from '@/utils/storage';
import { GEMINI_MODELS, OPENAI_MODELS, getProviderFromModel } from '@/services/aiService';

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
    setGptFlexTier,
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
      <div className="bg-white rounded-lg w-full max-w-md max-h-[85vh] overflow-y-auto m-4 shadow-xl border border-black/[0.08]">
        <div className="px-5 py-4 border-b border-black/[0.08] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Settings</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/[0.06] transition-colors"
          >
            <svg className="w-4 h-4 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* API 키 설정 */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-3 uppercase tracking-wider">API Keys</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
                />
              </div>
              <button
                onClick={handleSaveApiKeys}
                className="w-full py-2 bg-[#1d1d1f] text-white rounded-md hover:bg-[#3a3a3c] text-[12px] font-medium transition-all"
              >
                Save API Keys
              </button>
            </div>
          </section>

          {/* AI 모델 설정 */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-3 uppercase tracking-wider">AI Models</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                  답변 모델 (Response Model)
                </label>
                <select
                  value={settings.responseModel}
                  onChange={(e) => setResponseModel(e.target.value)}
                  className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
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
                <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                  번역 모델 (Translation Model)
                </label>
                <select
                  value={settings.translationModel}
                  onChange={(e) => setTranslationModel(e.target.value)}
                  className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
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
                <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                  요약 모델 (Summary Model)
                </label>
                <select
                  value={settings.summaryModel || 'gemini-2.5-flash-preview-09-2025'}
                  onChange={(e) => setSummaryModel(e.target.value)}
                  className="w-full rounded-md border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-[12px] focus:outline-none focus:bg-white transition-all"
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
              
              {/* GPT Flex 티어 토글 */}
              {(getProviderFromModel(settings.responseModel) === 'openai' ||
                getProviderFromModel(settings.translationModel) === 'openai' ||
                getProviderFromModel(settings.summaryModel || '') === 'openai') && (
                <div className="flex items-center justify-between p-3 bg-black/[0.02] rounded-md border border-black/[0.06]">
                  <div>
                    <h4 className="text-[12px] font-medium text-[#1d1d1f]">GPT Flex Tier</h4>
                    <p className="text-[10px] text-[#8e8e93] mt-0.5">저렴한 가격, 느린 처리 속도</p>
                  </div>
                  <button
                    onClick={() => setGptFlexTier(!settings.gptFlexTier)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings.gptFlexTier ? 'bg-[#1d1d1f]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        settings.gptFlexTier ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 데이터 관리 */}
          <section>
            <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-3 uppercase tracking-wider">Data Management</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2 px-3 rounded-md border border-black/[0.08] hover:bg-black/[0.03] text-[12px] font-medium text-[#1d1d1f] transition-all"
              >
                Backup Data
              </button>
              <button
                onClick={handleImport}
                className="flex-1 py-2 px-3 rounded-md border border-black/[0.08] hover:bg-black/[0.03] text-[12px] font-medium text-[#1d1d1f] transition-all"
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
