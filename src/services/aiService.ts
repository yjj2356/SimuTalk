import { Character, UserProfile, Message } from '@/types';

interface AIResponse {
  content: string;
  error?: string;
}

// 사용 가능한 모델 목록
export const GEMINI_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
  { id: 'gemini-2.5-flash-preview-09-2025', name: 'Gemini 2.5 Flash Preview' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro Preview' },
];

export const OPENAI_MODELS = [
  { id: 'gpt-5.1-chat-latest', name: 'GPT-5.1 Chat', api: 'responses' },
  { id: 'gpt-5.1', name: 'GPT-5.1', api: 'responses' },
];

// 모델 ID로 provider 판별
export function getProviderFromModel(modelId: string): 'gemini' | 'openai' {
  if (modelId.startsWith('gemini')) {
    return 'gemini';
  }
  return 'openai';
}

// 통합 API 호출 함수
export async function callAI(
  prompt: string,
  modelId: string,
  geminiApiKey?: string,
  openaiApiKey?: string
): Promise<AIResponse> {
  const provider = getProviderFromModel(modelId);
  
  if (provider === 'gemini') {
    if (!geminiApiKey) {
      return { content: '', error: 'Gemini API 키가 설정되지 않았습니다.' };
    }
    return callGeminiAPI(prompt, geminiApiKey, modelId);
  } else {
    if (!openaiApiKey) {
      return { content: '', error: 'OpenAI API 키가 설정되지 않았습니다.' };
    }
    return callOpenAIAPI(prompt, openaiApiKey, modelId);
  }
}

// Gemini API 호출
export async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-1.5-flash'
): Promise<AIResponse> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 1.0,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { content };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'API 호출 실패',
    };
  }
}

// OpenAI API 호출 (GPT-5.1 Responses API)
export async function callOpenAIAPI(
  prompt: string,
  apiKey: string,
  model: string = 'gpt-5.1-chat-latest'
): Promise<AIResponse> {
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        reasoning: { effort: 'low' },
        text: { verbosity: 'low' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    const content = data.output_text || '';
    return { content };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'API 호출 실패',
    };
  }
}

// 번역 함수 (통합)
export async function translateText(
  text: string,
  targetLanguage: string,
  modelId: string,
  geminiApiKey?: string,
  openaiApiKey?: string
): Promise<AIResponse> {
  const prompt = `Translate the following text to ${targetLanguage}. Only output the translation without any explanations.

Text: ${text}`;

  return callAI(prompt, modelId, geminiApiKey, openaiApiKey);
}

// 출력 언어 -> 언어명 매핑
const languageNames: Record<string, string> = {
  korean: '한국어',
  english: 'English',
  japanese: '日本語',
  chinese: '中文',
};

// 캐릭터 프롬프트 생성
export function buildCharacterPrompt(
  character: Character,
  userProfile: UserProfile,
  messages: Message[],
  userMessage: string,
  outputLanguage: string = 'korean'
): string {
  let characterInfo = '';
  if (character.inputMode === 'field' && character.fieldProfile) {
    const p = character.fieldProfile;
    characterInfo = `
이름: ${p.name}
성격: ${p.personality}
말투: ${p.speechStyle}
관계: ${p.relationship}
세계관: ${p.worldSetting}
${p.additionalInfo ? `추가 정보: ${p.additionalInfo}` : ''}
    `.trim();
  } else if (character.freeProfile) {
    characterInfo = character.freeProfile;
  }

  let userInfo = '';
  if (userProfile.inputMode === 'field' && userProfile.fieldProfile) {
    const u = userProfile.fieldProfile;
    userInfo = `
이름: ${u.name}
성격: ${u.personality}
외모: ${u.appearance}
설정: ${u.settings}
${u.additionalInfo ? `추가 정보: ${u.additionalInfo}` : ''}
    `.trim();
  } else if (userProfile.freeProfile) {
    userInfo = userProfile.freeProfile;
  }

  const charName = character.fieldProfile?.name || character.freeProfileName || '캐릭터';
  const conversationHistory = messages
    .slice(-10) // 최근 10개 메시지만
    .map((msg) => {
      const sender = msg.senderId === 'user' ? '유저' : charName;
      return `${sender}: ${msg.content}`;
    })
    .join('\n');

  const targetLanguage = languageNames[outputLanguage] || outputLanguage;
  const languageInstruction = `\n\nIMPORTANT: You MUST respond in ${targetLanguage}.`;

  const prompt = `
You are an AI roleplaying as a character in a messenger chat (like KakaoTalk, LINE, or iMessage).
This is NOT a formal conversation - it's casual messaging between people.

[Character Information]
${characterInfo}

[User Information]
${userInfo}

[Previous Messages]
${conversationHistory}

[User's New Message]
${userMessage}

[IMPORTANT RULES]
- Respond naturally as this character in a messenger chat context.
- Reflect the character's personality and speech style.
- Each line break in your response will be displayed as a SEPARATE message bubble in the UI.
- Use line breaks strategically to create natural message flow, like real texting.
- Only output the message content itself, without any explanations or meta-commentary.${languageInstruction}
  `.trim();

  return prompt;
}

// Autopilot 모드용 프롬프트 생성
export function buildAutopilotPrompt(
  character: Character,
  userProfile: UserProfile,
  messages: Message[],
  scenario: string,
  nextSpeaker: 'user' | 'character'
): string {
  let characterInfo = '';
  if (character.inputMode === 'field' && character.fieldProfile) {
    const p = character.fieldProfile;
    characterInfo = `
이름: ${p.name}
성격: ${p.personality}
말투: ${p.speechStyle}
관계: ${p.relationship}
세계관: ${p.worldSetting}
    `.trim();
  } else if (character.freeProfile) {
    characterInfo = character.freeProfile;
  }

  let userInfo = '';
  if (userProfile.inputMode === 'field' && userProfile.fieldProfile) {
    const u = userProfile.fieldProfile;
    userInfo = `
이름: ${u.name}
성격: ${u.personality}
외모: ${u.appearance}
설정: ${u.settings}
    `.trim();
  } else if (userProfile.freeProfile) {
    userInfo = userProfile.freeProfile;
  }

  const conversationHistory = messages
    .slice(-10)
    .map((msg) => {
      const sender = msg.senderId === 'user' 
        ? (userProfile.fieldProfile?.name || '유저')
        : (character.fieldProfile?.name || '캐릭터');
      return `${sender}: ${msg.content}`;
    })
    .join('\n');

  const speakerName = nextSpeaker === 'user'
    ? (userProfile.fieldProfile?.name || '유저')
    : (character.fieldProfile?.name || '캐릭터');

  const prompt = `
You are an AI that automatically continues roleplaying conversations in a messenger chat (like KakaoTalk, LINE, or iMessage).
This is NOT a formal conversation - it's casual messaging between people.

[Scenario]
${scenario}

[Character Information]
${characterInfo}

[User Character Information]
${userInfo}

[Previous Messages]
${conversationHistory}

[IMPORTANT RULES]
- You need to generate the next message for "${speakerName}".
- Write a natural message that reflects the character's personality and speech style.
- Each line break in your response will be displayed as a SEPARATE message bubble in the UI.
- Use line breaks strategically to create natural message flow, like real texting.
- Only output the message content itself, without any explanations or meta-commentary.
  `.trim();

  return prompt;
}

// 분기 생성용 프롬프트 (다른 버전의 응답 생성)
export function buildBranchPrompt(
  character: Character,
  userProfile: UserProfile,
  messages: Message[],
  targetMessageIndex: number,
  existingBranches: string[]
): string {
  let characterInfo = '';
  if (character.inputMode === 'field' && character.fieldProfile) {
    const p = character.fieldProfile;
    characterInfo = `
이름: ${p.name}
성격: ${p.personality}
말투: ${p.speechStyle}
관계: ${p.relationship}
세계관: ${p.worldSetting}
    `.trim();
  } else if (character.freeProfile) {
    characterInfo = character.freeProfile;
  }

  const previousMessages = messages.slice(0, targetMessageIndex);
  const conversationHistory = previousMessages
    .slice(-10)
    .map((msg) => {
      const sender = msg.senderId === 'user' 
        ? (userProfile.fieldProfile?.name || '유저')
        : (character.fieldProfile?.name || '캐릭터');
      return `${sender}: ${msg.content}`;
    })
    .join('\n');

  const existingVersions = existingBranches.length > 0
    ? `\n\n[이미 생성된 버전들 - 이와 다른 응답을 생성하세요]\n${existingBranches.map((b, i) => `버전 ${i + 1}: ${b}`).join('\n')}`
    : '';

  const prompt = `
You are an AI roleplaying as a character in a messenger chat (like KakaoTalk, LINE, or iMessage).
You need to generate an alternative version of a response to the same situation.
This is NOT a formal conversation - it's casual messaging between people.

[Character Information]
${characterInfo}

[Previous Messages]
${conversationHistory}
${existingVersions}

[IMPORTANT RULES]
- Generate a new response as this character that follows the previous conversation.
- Write with a different nuance or content from the existing versions.
- Each line break in your response will be displayed as a SEPARATE message bubble in the UI.
- Use line breaks strategically to create natural message flow, like real texting.
- Only output the message content itself, without any explanations or meta-commentary.
  `.trim();

  return prompt;
}
