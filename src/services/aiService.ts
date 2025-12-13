import { Character, UserProfile, Message, MemorySummary } from '@/types';

interface AIResponse {
  content: string;
  error?: string;
}

// 이미지 데이터 타입
interface ImageInput {
  data: string; // Base64 인코딩된 이미지 데이터
  mimeType: string; // MIME 타입 (image/jpeg, image/png, etc.)
}

// 현재 진행 중인 요청을 취소하기 위한 AbortController
let currentAbortController: AbortController | null = null;

// 진행 중인 요청 취소 함수
export function cancelCurrentRequest(): void {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
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
  imageInput?: ImageInput,
  gptFlexTier?: boolean
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
    return callOpenAIAPI(prompt, openaiApiKey, modelId, imageInput, gptFlexTier);
  }
}

// Gemini API 스트리밍 호출 (줄 단위 콜백)
export async function callGeminiAPIStreaming(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-1.5-flash',
  imageInput?: ImageInput,
  onLine?: (line: string) => void // 줄바꿈이 완성될 때마다 호출
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
    
    // 타임아웃 설정 (300초)
    const controller = new AbortController();
    currentAbortController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    
    try {
      // 스트리밍 API 사용 (streamGenerateContent) - 에러가 바로 옴
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );
      
      if (!response.ok) {
        clearTimeout(timeoutId);
        currentAbortController = null;
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
      }

      // 스트리밍 응답을 줄 단위로 처리
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('스트리밍 응답을 읽을 수 없습니다.');
      }

      const decoder = new TextDecoder();
      let buffer = ''; // 현재까지 받은 텍스트 버퍼
      let lastProcessedIndex = 0; // 마지막으로 처리한 줄바꿈 위치

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              try {
                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                buffer += text;
                
                // 줄바꿈이 있으면 콜백 호출
                if (onLine) {
                  let newlineIndex;
                  while ((newlineIndex = buffer.indexOf('\n', lastProcessedIndex)) !== -1) {
                    const completedLine = buffer.slice(lastProcessedIndex, newlineIndex).trim();
                    if (completedLine) {
                      onLine(completedLine);
                    }
                    lastProcessedIndex = newlineIndex + 1;
                  }
                }
              } catch {
                // JSON 파싱 실패 무시
              }
            }
          }
        }
      }

      // 마지막 줄 처리 (줄바꿈 없이 끝난 경우)
      if (onLine && lastProcessedIndex < buffer.length) {
        const remainingLine = buffer.slice(lastProcessedIndex).trim();
        if (remainingLine) {
          onLine(remainingLine);
        }
      }

      clearTimeout(timeoutId);
      currentAbortController = null;
      return { content: buffer };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      currentAbortController = null;
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        // 취소된 경우 조용히 빈 응답 반환 (에러 메시지 없음)
        return { content: '', error: undefined };
      }
      throw fetchError;
    }
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'API 호출 실패',
    };
  }
}

// Gemini API 호출 (일반 모드 - 전체 응답 한 번에 반환)
export async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-1.5-flash',
  imageInput?: ImageInput
): Promise<AIResponse> {
  return callGeminiAPIStreaming(prompt, apiKey, model, imageInput);
}

// OpenAI API 호출 (GPT-5.1 Responses API)
export async function callOpenAIAPI(
  prompt: string,
  apiKey: string,
  model: string = 'gpt-5.1-chat-latest',
  imageInput?: ImageInput,
  flexTier?: boolean
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
    
    // 요청 body 구성
    const requestBody: Record<string, unknown> = {
      model,
      input: inputPayload,
      reasoning: { effort: 'medium' },
      text: { verbosity: 'medium' },
    };
    
    // Flex 티어 사용 시 service_tier 추가
    // NOTE: GPT-5.1 Chat 계열은 flex tier를 지원하지 않으므로 적용하지 않습니다.
    if (flexTier && !model.startsWith('gpt-5.1-chat')) {
      requestBody.service_tier = 'flex';
    }
    
    // 타임아웃 설정 (300초)
    const controller = new AbortController();
    currentAbortController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 300000);
    
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    currentAbortController = null;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 오류: ${response.status} - ${errorData.error?.message || '알 수 없는 오류'}`);
    }

    const data = await response.json();
    
    // Responses API의 응답 형식 파싱
    // output_text가 있으면 사용, 없으면 output 배열에서 텍스트 추출
    let content = '';
    if (data.output_text) {
      content = data.output_text;
    } else if (data.output && Array.isArray(data.output)) {
      // output 배열에서 텍스트 추출
      for (const item of data.output) {
        // type === 'message'인 경우 (기존 방식)
        if (item.type === 'message' && item.content) {
          for (const contentItem of item.content) {
            if (contentItem.type === 'output_text' && contentItem.text) {
              content += contentItem.text;
            }
          }
        }
        // type === 'output_text'인 경우 (GPT 5.2+ 직접 텍스트 형식)
        else if (item.type === 'output_text' && item.text) {
          content += item.text;
        }
      }
    } else if (data.choices && data.choices[0]?.message?.content) {
      // 기존 Chat Completions API 형식 (폴백)
      content = data.choices[0].message.content;
    }
    
    return { content };
  } catch (error) {
    currentAbortController = null;
    if (error instanceof Error && error.name === 'AbortError') {
      // 취소된 경우 조용히 빈 응답 반환 (에러 메시지 없음)
      return { content: '', error: undefined };
    }
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
  messengerTheme: string = 'kakao',
  memorySummaries?: MemorySummary[]
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
  const languageInstruction = `

[CRITICAL LANGUAGE REQUIREMENT]
You MUST respond ONLY in ${targetLanguage}. 
This is NON-NEGOTIABLE regardless of:
- The language used in character/user descriptions
- The language of previous messages
- The language of the user's input
- Any other context
Your ENTIRE response must be written in ${targetLanguage}. No exceptions.`;

  // 메모리 요약 내용 (있으면 추가)
  const memorySection = memorySummaries && memorySummaries.length > 0
    ? `\n[Long-term Memory - Previous Conversation Summary]\n${memorySummaries.map(m => m.content).join('\n\n---\n\n')}\n`
    : '';

  const prompt = `
You are an AI roleplaying as a character in a ${messengerName} chat.
This is a TEXT MESSAGING conversation - you are NOT meeting in person.
You are communicating through ${messengerName}, so you can only send text messages, not see or touch each other.
${timeInfo}

[Character Information]
${characterInfo}

[User Information]
${userInfo}
${memorySection}
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
- Only output the message content itself, without any explanations or meta-commentary.
- If there is long-term memory, use it to maintain consistency with past conversations.${languageInstruction}
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
  const languageInstruction = `
- [CRITICAL LANGUAGE REQUIREMENT] You MUST respond ONLY in ${targetLanguage}. This is NON-NEGOTIABLE regardless of scenario language, character descriptions, or any other input. Your ENTIRE response must be in ${targetLanguage}.`;

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
  existingBranches: string[],
  outputLanguage: string = 'korean',
  scenario?: string
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

  const targetLanguage = languageNames[outputLanguage] || outputLanguage;

  // 시나리오가 있으면 포함
  const scenarioSection = scenario && scenario.trim()
    ? `\n[Scenario/Plot Direction]\n${scenario}\n\nFollow this scenario while generating the alternative response.`
    : '';

  const prompt = `
You are an AI roleplaying as a character in a messenger chat (like KakaoTalk, LINE, or iMessage).
You need to generate an alternative version of a response to the same situation.
This is NOT a formal conversation - it's casual messaging between people.

[Character Information]
${characterInfo}
${scenarioSection}
[Previous Messages]
${conversationHistory}
${existingVersions}

[IMPORTANT RULES]
- Generate a new response as this character that follows the previous conversation.
- Write with a different nuance or content from the existing versions.
- Each line break in your response will be displayed as a SEPARATE message bubble in the UI.
- Use line breaks strategically to create natural message flow, like real texting.
- Only output the message content itself, without any explanations or meta-commentary.

[CRITICAL LANGUAGE REQUIREMENT]
You MUST respond ONLY in ${targetLanguage}. This is NON-NEGOTIABLE regardless of the language used in character descriptions, previous messages, or any other context. Your ENTIRE response must be in ${targetLanguage}.
  `.trim();

  return prompt;
}

// ============================================
// 장기 기억 (Memory) 시스템
// ============================================

// 대략적인 토큰 수 계산 (영어: 4자당 1토큰, 한국어: 2자당 1토큰 추정)
export function estimateTokenCount(text: string): number {
  // 한글 문자 수
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  // 영문 + 기타 문자 수
  const otherChars = text.length - koreanChars;
  
  // 한글은 2자당 1토큰, 영문은 4자당 1토큰으로 대략 계산
  return Math.ceil(koreanChars / 2) + Math.ceil(otherChars / 4);
}

// 메시지 배열의 총 토큰 수 계산
export function calculateMessagesTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    let tokens = estimateTokenCount(msg.content);
    if (msg.translatedContent) {
      tokens += estimateTokenCount(msg.translatedContent);
    }
    return total + tokens;
  }, 0);
}

// 메모리 요약들의 총 토큰 수 계산
export function calculateMemorySummariesTokens(summaries: MemorySummary[]): number {
  return summaries.reduce((total, summary) => {
    return total + estimateTokenCount(summary.content);
  }, 0);
}

// 전체 컨텍스트 토큰 계산 (메시지 + 메모리)
export function calculateTotalContextTokens(messages: Message[], memorySummaries: MemorySummary[] = []): number {
  return calculateMessagesTokens(messages) + calculateMemorySummariesTokens(memorySummaries);
}

// 대화 요약 프롬프트 생성
export function buildSummarizePrompt(
  messages: Message[],
  characterName: string,
  userName: string
): string {
  const conversationText = messages.map((msg) => {
    const sender = msg.senderId === 'user' ? userName : characterName;
    const time = new Date(msg.timestamp).toISOString();
    return `[${time}] ${sender}: ${msg.content}`;
  }).join('\n');

  const prompt = `
You are a conversation summarizer. Summarize the following chat conversation in a structured, chronological format.

[CONVERSATION TO SUMMARIZE]
${conversationText}

[OUTPUT REQUIREMENTS]
1. Write in English only
2. Use Markdown format
3. Do NOT use ** for emphasis (no bold text)
4. Organize by time periods and key events
5. Keep proper nouns (names, places) in original language with parentheses, e.g., "the user (유저)" or "visited Seoul (서울)"
6. Be concise but capture important details, emotions, and plot points
7. Include timestamps or time references when relevant

[OUTPUT FORMAT]
## Summary: [Start Date] - [End Date]

### Timeline
- [Time/Date]: Brief description of what happened

### Key Events
- Event 1: Description
- Event 2: Description

### Relationship/Emotional Notes
- Any significant relationship developments or emotional moments

### Important Details to Remember
- Names, places, promises, or facts that should be remembered
  `.trim();

  return prompt;
}

// 메모리 재요약 프롬프트 생성 (기존 요약들을 하나로 압축)
export function buildResummarizePrompt(
  summaries: MemorySummary[]
): string {
  const summaryTexts = summaries.map((s, i) => {
    return `[SUMMARY ${i + 1}]\n${s.content}`;
  }).join('\n\n');

  const prompt = `
You are a memory consolidation assistant. Combine the following conversation summaries into a single, more concise summary while preserving all important information.

[EXISTING SUMMARIES TO CONSOLIDATE]
${summaryTexts}

[OUTPUT REQUIREMENTS]
1. Write in English only
2. Use Markdown format
3. Do NOT use ** for emphasis (no bold text)
4. Merge overlapping information
5. Keep proper nouns (names, places) in original language with parentheses
6. Prioritize: character relationships, plot developments, important facts
7. Remove redundant details but keep unique events

[OUTPUT FORMAT]
## Consolidated Memory Summary

### Key Timeline
- Major events in chronological order

### Relationship Status
- Current state of relationships between characters

### Important Facts
- Names, places, promises, or recurring themes to remember
  `.trim();

  return prompt;
}

// 대화 요약 API 호출
export async function summarizeConversation(
  messages: Message[],
  characterName: string,
  userName: string,
  modelId: string,
  geminiApiKey?: string,
  openaiApiKey?: string
): Promise<AIResponse> {
  const prompt = buildSummarizePrompt(messages, characterName, userName);
  return callAI(prompt, modelId, geminiApiKey, openaiApiKey);
}

// 메모리 재요약 API 호출
export async function resummarizeSummaries(
  summaries: MemorySummary[],
  modelId: string,
  geminiApiKey?: string,
  openaiApiKey?: string
): Promise<AIResponse> {
  const prompt = buildResummarizePrompt(summaries);
  return callAI(prompt, modelId, geminiApiKey, openaiApiKey);
}

// 요약이 필요한지 확인 (메시지 + 메모리 토큰 기준)
export function shouldSummarize(
  messages: Message[],
  tokenThreshold: number = 40000,
  memorySummaries: MemorySummary[] = []
): boolean {
  const totalTokens = calculateTotalContextTokens(messages, memorySummaries);
  return totalTokens > tokenThreshold;
}

// 메모리 재요약이 필요한지 확인 (메모리 토큰만 기준)
export function shouldResummarize(
  memorySummaries: MemorySummary[],
  memoryTokenThreshold: number = 10000 // 메모리가 10000 토큰 넘으면 재요약
): boolean {
  const memoryTokens = calculateMemorySummariesTokens(memorySummaries);
  return memoryTokens > memoryTokenThreshold;
}

// 요약할 메시지 범위 결정 (4세트 = 8메시지 단위)
export function getMessagesToSummarize(
  messages: Message[],
  messageSetCount: number = 4 // 수신+발신 세트 수 (기본 4세트 = 8메시지)
): Message[] {
  const targetMessageCount = messageSetCount * 2; // 세트당 2개 메시지
  
  // 앞에서부터 targetMessageCount 개 또는 전체 메시지의 절반 중 작은 것
  const maxToSummarize = Math.min(targetMessageCount, Math.floor(messages.length / 2));
  
  if (maxToSummarize < 2) return [];
  
  return messages.slice(0, maxToSummarize);
}

// 재요약할 메모리 범위 결정 (가장 오래된 것부터)
export function getMemoriesToResummarize(
  memorySummaries: MemorySummary[],
  count: number = 2 // 기본 2개 요약을 1개로 합침
): MemorySummary[] {
  if (memorySummaries.length < count) return [];
  
  // 가장 오래된 것부터 count개 선택
  const sorted = [...memorySummaries].sort((a, b) => a.createdAt - b.createdAt);
  return sorted.slice(0, count);
}
