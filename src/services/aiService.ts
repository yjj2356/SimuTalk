import { Character, UserProfile, Message } from '@/types';

interface AIResponse {
  content: string;
  error?: string;
}

// 사용 가능한 모델 목록
export const GEMINI_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
  { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview' },
  { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
];

export const OPENAI_MODELS = [
  { id: 'gpt-5.1-chat-latest', name: 'GPT-5.1 Chat', api: 'responses' },
  { id: 'gpt-5.1', name: 'GPT-5.1', api: 'responses' },
];

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
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
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

// 번역 함수
export async function translateText(
  text: string,
  targetLanguage: string,
  apiKey: string,
  provider: 'gemini' | 'openai',
  model?: string
): Promise<AIResponse> {
  const prompt = `다음 텍스트를 ${targetLanguage}로 번역해주세요. 번역 결과만 출력하고 다른 설명은 하지 마세요.

텍스트: ${text}`;

  if (provider === 'gemini') {
    return callGeminiAPI(prompt, apiKey, model);
  } else {
    return callOpenAIAPI(prompt, apiKey, model);
  }
}

// 캐릭터 프롬프트 생성
export function buildCharacterPrompt(
  character: Character,
  userProfile: UserProfile,
  messages: Message[],
  userMessage: string
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

  const conversationHistory = messages
    .slice(-10) // 최근 10개 메시지만
    .map((msg) => {
      const sender = msg.senderId === 'user' ? '유저' : character.fieldProfile?.name || '캐릭터';
      return `${sender}: ${msg.content}`;
    })
    .join('\n');

  const prompt = `
당신은 롤플레이 채팅에서 캐릭터를 연기하는 AI입니다.

[캐릭터 정보]
${characterInfo}

[유저 정보]
${userInfo}

[이전 대화]
${conversationHistory}

[유저의 새 메시지]
${userMessage}

위 캐릭터로서 자연스럽게 답변해주세요. 캐릭터의 성격과 말투를 반영하여 답변하세요.
답변만 출력하고, 다른 설명은 하지 마세요.
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
당신은 롤플레이 채팅을 자동으로 진행하는 AI입니다.

[시나리오]
${scenario}

[캐릭터 정보]
${characterInfo}

[유저 캐릭터 정보]
${userInfo}

[이전 대화]
${conversationHistory}

지금 "${speakerName}"의 대사를 생성해야 합니다.
해당 캐릭터의 성격과 말투를 반영하여 자연스러운 대사를 작성하세요.
대사만 출력하고, 다른 설명은 하지 마세요.
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
당신은 롤플레이 채팅에서 캐릭터를 연기하는 AI입니다.
같은 상황에서 다른 버전의 응답을 생성해야 합니다.

[캐릭터 정보]
${characterInfo}

[이전 대화]
${conversationHistory}
${existingVersions}

위 캐릭터로서 이전 대화에 이어지는 새로운 응답을 생성하세요.
기존 버전들과 다른 뉘앙스나 내용으로 작성하세요.
대사만 출력하고, 다른 설명은 하지 마세요.
  `.trim();

  return prompt;
}
