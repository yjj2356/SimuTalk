import { Character, UserProfile, Message } from '@/types';

interface AIResponse {
  content: string;
  error?: string;
}

// 이미지 데이터 타입
interface ImageInput {
  data: string; // Base64 인코딩된 이미지 데이터
  mimeType: string; // MIME 타입 (image/jpeg, image/png, etc.)
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
  openaiApiKey?: string,
  imageInput?: ImageInput
): Promise<AIResponse> {
  const provider = getProviderFromModel(modelId);
  
  if (provider === 'gemini') {
    if (!geminiApiKey) {
      return { content: '', error: 'Gemini API 키가 설정되지 않았습니다.' };
    }
    return callGeminiAPI(prompt, geminiApiKey, modelId, imageInput);
  } else {
    if (!openaiApiKey) {
      return { content: '', error: 'OpenAI API 키가 설정되지 않았습니다.' };
    }
    return callOpenAIAPI(prompt, openaiApiKey, modelId, imageInput);
  }
}

// Gemini API 호출
export async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-1.5-flash',
  imageInput?: ImageInput
): Promise<AIResponse> {
  try {
    // Gemini 3 모델인지 확인 (thinkingLevel 지원)
    const isGemini3 = model.startsWith('gemini-3');
    
    // parts 배열 구성 (이미지가 있으면 이미지 먼저, 텍스트는 뒤에)
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    
    // 이미지가 있으면 인라인 데이터로 추가
    if (imageInput) {
      parts.push({
        inlineData: {
          mimeType: imageInput.mimeType,
          data: imageInput.data,
        },
      });
    }
    
    // 텍스트 프롬프트 추가
    parts.push({ text: prompt });
    
    // 디버그 로그
    console.log('[Gemini API] 이미지 포함 여부:', !!imageInput);
    if (imageInput) {
      console.log('[Gemini API] 이미지 MIME 타입:', imageInput.mimeType);
      console.log('[Gemini API] 이미지 데이터 길이:', imageInput.data.length);
      console.log('[Gemini API] Parts 구조:', parts.map(p => p.text ? 'text' : 'inlineData'));
    }
    
    // 요청 body 구성
    const requestBody: Record<string, unknown> = {
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };
    
    // Gemini 3 모델에는 thinkingConfig 추가 (응답 속도 개선)
    if (isGemini3) {
      requestBody.generationConfig = {
        ...(requestBody.generationConfig as object),
        thinkingConfig: {
          thinkingLevel: 'low',
        },
      };
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Gemini API] 에러 응답:', errorData);
      throw new Error(`API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    console.log('[Gemini API] 응답 데이터:', JSON.stringify(data, null, 2));
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
  model: string = 'gpt-5.1-chat-latest',
  imageInput?: ImageInput
): Promise<AIResponse> {
  try {
    // content 배열 구성
    const contentArray: Array<{ type: string; text?: string; image_url?: string; detail?: string }> = [];
    
    // 텍스트 추가
    contentArray.push({ type: 'input_text', text: prompt });
    
    // 이미지가 있으면 추가
    if (imageInput) {
      contentArray.push({
        type: 'input_image',
        image_url: `data:${imageInput.mimeType};base64,${imageInput.data}`,
        detail: 'auto', // auto, low, high
      });
    }
    
    // input 구조 결정 (이미지가 있으면 content 배열 형식, 없으면 단순 문자열)
    const inputPayload = imageInput 
      ? [{ role: 'user', content: contentArray }]
      : prompt;
    
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: inputPayload,
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

// [이름]: 형식 제거 함수
export function cleanSpeakerPrefix(text: string): string {
  return text
    .split('\n')
    .map(line => line.replace(/^\[[^\]]+\]:\s*/, '').replace(/^[^:\n]+:\s*/, '').trim())
    .filter(line => line !== '')
    .join('\n');
}

// 번역 함수 (통합)
export async function translateText(
  text: string,
  targetLanguage: string,
  modelId: string,
  geminiApiKey?: string,
  openaiApiKey?: string
): Promise<AIResponse> {
  // [이름]: 형식 제거 후 번역
  const cleanedText = cleanSpeakerPrefix(text);
  
  const prompt = `Translate the following text to ${targetLanguage}. Only output the translation without any explanations.

Text: ${cleanedText}`;

  return callAI(prompt, modelId, geminiApiKey, openaiApiKey);
}

// 출력 언어 -> 언어명 매핑
const languageNames: Record<string, string> = {
  korean: '한국어',
  english: 'English',
  japanese: '日本語',
  chinese: '中文',
};

// 테마 -> 메신저 이름 매핑
const messengerNames: Record<string, string> = {
  kakao: 'KakaoTalk',
  line: 'LINE',
  imessage: 'iMessage',
  basic: 'messenger app',
};

// 캐릭터 프롬프트 생성
export function buildCharacterPrompt(
  character: Character,
  userProfile: UserProfile,
  messages: Message[],
  userMessage: string,
  outputLanguage: string = 'korean',
  currentTime?: string,
  messengerTheme: string = 'kakao'
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
  const messengerName = messengerNames[messengerTheme] || 'messenger app';
  
  // 현재 시간 정보 (전달되었으면 사용)
  const timeInfo = currentTime ? `[현재 시각: ${currentTime}]` : '';
  
  const conversationHistory = messages
    .slice(-10) // 최근 10개 메시지만
    .map((msg) => {
      const sender = msg.senderId === 'user' ? '유저' : charName;
      // 메시지에 타임스탬프 추가
      const msgTime = new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `[${msgTime}] ${sender}: ${msg.content}`;
    })
    .join('\n');

  const targetLanguage = languageNames[outputLanguage] || outputLanguage;
  const languageInstruction = `\n\nIMPORTANT: You MUST respond in ${targetLanguage}.`;

  const prompt = `
You are an AI roleplaying as a character in a ${messengerName} chat.
This is a TEXT MESSAGING conversation - you are NOT meeting in person.
You are communicating through ${messengerName}, so you can only send text messages, not see or touch each other.
${timeInfo}

[Character Information]
${characterInfo}

[User Information]
${userInfo}

[Previous Messages]
${conversationHistory}

[User's New Message ${currentTime ? `(${currentTime})` : ''}]
${userMessage}

[IMPORTANT RULES]
- You are texting through ${messengerName}, NOT meeting face-to-face.
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
  outputLanguage: string = 'korean',
  currentTime?: string,
  messengerTheme: string = 'kakao'
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

  const userName = userProfile.fieldProfile?.name || '유저';
  const characterName = character.fieldProfile?.name || character.freeProfileName || '캐릭터';
  const messengerName = messengerNames[messengerTheme] || 'messenger app';
  
  // 현재 시간 정보
  const timeInfo = currentTime ? `[현재 시각: ${currentTime}]` : '';

  const conversationHistory = messages
    .slice(-10)
    .map((msg) => {
      const sender = msg.senderId === 'user' ? userName : characterName;
      // 메시지에 타임스탬프 추가
      const msgTime = new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `[${msgTime}] [${sender}]: ${msg.content}`;
    })
    .join('\n');

  const targetLanguage = languageNames[outputLanguage] || outputLanguage;
  const languageInstruction = `\n- IMPORTANT: You MUST respond in ${targetLanguage}. Regardless of the scenario language, your response must be in ${targetLanguage}.`;

  const prompt = `
You are an AI that automatically continues roleplaying conversations in a ${messengerName} chat.
This is a TEXT MESSAGING conversation - the characters are NOT meeting in person.
They are communicating through ${messengerName}, so they can only send text messages, not see or touch each other.
${timeInfo}

[Scenario]
${scenario}

[Character Information - "${characterName}"]
${characterInfo}

[User Character Information - "${userName}"]
${userInfo}

[Previous Messages]
${conversationHistory || '(대화 시작)'}

[OUTPUT FORMAT - VERY IMPORTANT]
You MUST output in this EXACT format:
[SPEAKER_NAME]: message content here

Where SPEAKER_NAME is either "${userName}" or "${characterName}".
Choose who speaks next based on the conversation flow and scenario.

[IMPORTANT RULES]
- The characters are texting through ${messengerName}, NOT meeting face-to-face
- Decide who should speak next based on the conversation context
- Output EXACTLY in the format: [SPEAKER_NAME]: message
- Write a natural message that reflects the speaker's personality
- Each line break will be displayed as a SEPARATE message bubble
- Only output ONE speaker's message at a time
- Do NOT include any explanations or meta-commentary${languageInstruction}
  `.trim();

  return prompt;
}

// Autopilot 응답에서 화자와 내용 파싱
export function parseAutopilotResponse(
  response: string,
  userName: string,
  _characterName: string
): { isUser: boolean; content: string } {
  // [이름]: 제거 함수
  const cleanLine = (line: string): string => {
    return line.replace(/^\[[^\]]+\]:\s*/, '').replace(/^[^:\n]+:\s*/, '');
  };

  // 첫 번째 줄에서 화자 판단
  const firstLine = response.split('\n')[0];
  
  // [이름]: 내용 형식 파싱
  const match = firstLine.match(/^\[([^\]]+)\]:/);
  let isUser = false;
  
  if (match) {
    const speaker = match[1].trim();
    isUser = speaker === userName || 
             speaker.toLowerCase() === 'user' || 
             speaker === '유저';
  } else {
    // 이름: 형식 시도
    const simpleMatch = firstLine.match(/^([^:]+):/);
    if (simpleMatch) {
      const speaker = simpleMatch[1].trim();
      isUser = speaker === userName || 
               speaker.toLowerCase() === 'user' || 
               speaker === '유저';
    }
  }
  
  // 모든 줄에서 [이름]: 제거
  const cleanedContent = response
    .split('\n')
    .map(line => cleanLine(line.trim()))
    .filter(line => line !== '')
    .join('\n');
  
  return { isUser, content: cleanedContent };
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
