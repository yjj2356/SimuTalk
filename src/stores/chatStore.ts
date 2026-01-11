import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Message, ChatMode, MessageBranch, ThemeType, TimeSettings, MemorySummary, OutputLanguage, IMessageColor } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  generatingChatId: string | null; // 현재 응답 생성 중인 채팅 ID
  createChat: (characterId: string, theme: ThemeType, imessageColor?: IMessageColor) => string;
  deleteChat: (chatId: string) => void;
  setCurrentChat: (chatId: string | null) => void;
  setGenerating: (chatId: string | null) => void; // 응답 생성 상태 설정
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'currentBranchIndex'>) => string;
  setChatMessages: (chatId: string, messages: Message[]) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  updateBranchTranslation: (chatId: string, messageId: string, branchIndex: number, translatedContent: string | undefined) => void;
  addBranch: (chatId: string, messageId: string, branch: Omit<MessageBranch, 'id' | 'timestamp'>) => void;
  setBranchIndex: (chatId: string, messageId: string, index: number) => void;
  setMessagesAfterForBranch: (chatId: string, messageId: string, branchIndex: number, messagesAfter: Message[]) => void;
  setChatMode: (chatId: string, mode: ChatMode) => void;
  setAutopilotScenario: (chatId: string, scenario: string) => void;
  setAutopilotRunning: (chatId: string, running: boolean) => void;
  setChatTimeSettings: (chatId: string, timeSettings: TimeSettings | undefined) => void;
  setChatOutputLanguage: (chatId: string, language: OutputLanguage) => void;
  setShortResponseMode: (chatId: string, enabled: boolean) => void;
  // 메모리 관련
  addMemorySummary: (chatId: string, summary: Omit<MemorySummary, 'id' | 'createdAt'>) => void;
  removeMemorySummaries: (chatId: string, summaryIds: string[]) => void;
  removeMessages: (chatId: string, messageIds: string[]) => void;
  getChat: (chatId: string) => Chat | undefined;
  getChatByCharacter: (characterId: string) => Chat | undefined;
  getChatsByCharacter: (characterId: string) => Chat[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      generatingChatId: null,
      setGenerating: (chatId) => set({ generatingChatId: chatId }),
      createChat: (characterId, theme, imessageColor) => {
        const id = uuidv4();
        const now = Date.now();
        const newChat: Chat = {
          id,
          characterId,
          theme,
          imessageColor: theme === 'imessage' ? (imessageColor || 'blue') : undefined,
          messages: [],
          mode: 'immersion',
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          chats: [...state.chats, newChat],
          currentChatId: id,
        }));
        return id;
      },
      deleteChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
          currentChatId:
            state.currentChatId === chatId ? null : state.currentChatId,
        })),
      setCurrentChat: (chatId) => set({ currentChatId: chatId }),
      addMessage: (chatId, messageData) => {
        const messageId = uuidv4();
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: (() => {
                    const appended: Message[] = [
                      ...chat.messages,
                      {
                        ...messageData,
                        id: messageId,
                        timestamp: Date.now(),
                        currentBranchIndex: 0,
                      },
                    ];

                    // 분기점 이후 메시지를 저장해두는(편집 분기 등) 루트가 있으면,
                    // 현재 보이는 suffix를 해당 루트의 현재 브랜치에 자동 반영해 persistence를 높인다.
                    let rootIndex = -1;
                    for (let i = appended.length - 1; i >= 0; i--) {
                      const m = appended[i];
                      const hasContinuation =
                        !!m.baseMessagesAfter ||
                        !!m.branches?.some((b) => b.messagesAfter);
                      if (hasContinuation) {
                        rootIndex = i;
                        break;
                      }
                    }

                    if (rootIndex === -1) return appended;

                    const root = appended[rootIndex];
                    const suffix = appended.slice(rootIndex + 1);
                    const rootBranchIndex = root.currentBranchIndex || 0;

                    return appended.map((m, idx) => {
                      if (idx !== rootIndex) return m;
                      if (rootBranchIndex === 0) {
                        return { ...m, baseMessagesAfter: suffix };
                      }
                      const branches = (m.branches || []).map((b, bIdx) =>
                        bIdx === rootBranchIndex - 1 ? { ...b, messagesAfter: suffix } : b
                      );
                      return { ...m, branches };
                    });
                  })(),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        }));
        return messageId;
      },
      setChatMessages: (chatId, messages) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages,
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      updateMessage: (chatId, messageId, updates) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      updateBranchTranslation: (chatId, messageId, branchIndex, translatedContent) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId && msg.branches
                      ? {
                          ...msg,
                          branches: msg.branches.map((branch, idx) =>
                            idx === branchIndex
                              ? { ...branch, translatedContent }
                              : branch
                          ),
                        }
                      : msg
                  ),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      addBranch: (chatId, messageId, branchData) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId
                      ? {
                          ...msg,
                          branches: [
                            ...(msg.branches || []),
                            {
                              ...branchData,
                              id: uuidv4(),
                              timestamp: Date.now(),
                            },
                          ],
                        }
                      : msg
                  ),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      setBranchIndex: (chatId, messageId, index) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg) =>
                    msg.id === messageId
                      ? { ...msg, currentBranchIndex: index }
                      : msg
                  ),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      setMessagesAfterForBranch: (chatId, messageId, branchIndex, messagesAfter) =>
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id !== chatId) return chat;

            return {
              ...chat,
              messages: chat.messages.map((msg) => {
                if (msg.id !== messageId) return msg;
                if (branchIndex === 0) {
                  return { ...msg, baseMessagesAfter: messagesAfter };
                }
                const branches = (msg.branches || []).map((b, idx) =>
                  idx === branchIndex - 1 ? { ...b, messagesAfter } : b
                );
                return { ...msg, branches };
              }),
              updatedAt: Date.now(),
            };
          }),
        })),
      setChatMode: (chatId, mode) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, mode, updatedAt: Date.now() } : chat
          ),
        })),
      setAutopilotScenario: (chatId, scenario) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, autopilotScenario: scenario, updatedAt: Date.now() }
              : chat
          ),
        })),
      setAutopilotRunning: (chatId, running) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, isAutopilotRunning: running, updatedAt: Date.now() }
              : chat
          ),
        })),
      setChatTimeSettings: (chatId, timeSettings) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, timeSettings, updatedAt: Date.now() }
              : chat
          ),
        })),
      setChatOutputLanguage: (chatId, outputLanguage) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, outputLanguage, updatedAt: Date.now() }
              : chat
          ),
        })),
      setShortResponseMode: (chatId, shortResponseMode) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? { ...chat, shortResponseMode, updatedAt: Date.now() }
              : chat
          ),
        })),
      // 메모리 요약 추가
      addMemorySummary: (chatId, summaryData) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  memorySummaries: [
                    ...(chat.memorySummaries || []),
                    {
                      ...summaryData,
                      id: uuidv4(),
                      createdAt: Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      // 메모리 요약들 삭제 (재요약 시 사용)
      removeMemorySummaries: (chatId, summaryIds) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  memorySummaries: (chat.memorySummaries || []).filter(
                    (s) => !summaryIds.includes(s.id)
                  ),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      // 요약된 메시지들 삭제
      removeMessages: (chatId, messageIds) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.filter((msg) => !messageIds.includes(msg.id)),
                  updatedAt: Date.now(),
                }
              : chat
          ),
        })),
      getChat: (chatId) => get().chats.find((chat) => chat.id === chatId),
      getChatByCharacter: (characterId) =>
        get().chats.find((chat) => chat.characterId === characterId),
      getChatsByCharacter: (characterId) =>
        get().chats.filter((chat) => chat.characterId === characterId),
    }),
    {
      name: 'simutalk-chats',
      // 기존 채팅방에 theme가 없을 경우 기본값 적용
      migrate: (persistedState: unknown, _version: number) => {
        const state = persistedState as ChatState;
        if (state.chats) {
          state.chats = state.chats.map((chat) => ({
            ...chat,
            theme: chat.theme || 'kakao', // 기본 테마로 카카오톡 설정
          }));
        }
        return state;
      },
      version: 1,
    }
  )
);
