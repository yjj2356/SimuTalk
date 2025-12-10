import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Message, ChatMode, MessageBranch, ThemeType, TimeSettings } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  createChat: (characterId: string, theme: ThemeType) => string;
  deleteChat: (chatId: string) => void;
  setCurrentChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'currentBranchIndex'>) => string;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  addBranch: (chatId: string, messageId: string, branch: Omit<MessageBranch, 'id' | 'timestamp'>) => void;
  setBranchIndex: (chatId: string, messageId: string, index: number) => void;
  setChatMode: (chatId: string, mode: ChatMode) => void;
  setAutopilotScenario: (chatId: string, scenario: string) => void;
  setAutopilotRunning: (chatId: string, running: boolean) => void;
  setChatTimeSettings: (chatId: string, timeSettings: TimeSettings | undefined) => void;
  getChat: (chatId: string) => Chat | undefined;
  getChatByCharacter: (characterId: string) => Chat | undefined;
  getChatsByCharacter: (characterId: string) => Chat[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      createChat: (characterId, theme) => {
        const id = uuidv4();
        const now = Date.now();
        const newChat: Chat = {
          id,
          characterId,
          theme,
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
                  messages: [
                    ...chat.messages,
                    {
                      ...messageData,
                      id: messageId,
                      timestamp: Date.now(),
                      currentBranchIndex: 0,
                    },
                  ],
                  updatedAt: Date.now(),
                }
              : chat
          ),
        }));
        return messageId;
      },
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
