import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chat, Message, ChatMode, MessageBranch } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  createChat: (characterId: string) => string;
  deleteChat: (chatId: string) => void;
  setCurrentChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'currentBranchIndex'>) => string;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
  addBranch: (chatId: string, messageId: string, branch: Omit<MessageBranch, 'id' | 'timestamp'>) => void;
  setBranchIndex: (chatId: string, messageId: string, index: number) => void;
  setChatMode: (chatId: string, mode: ChatMode) => void;
  setAutopilotScenario: (chatId: string, scenario: string) => void;
  setAutopilotRunning: (chatId: string, running: boolean) => void;
  getChat: (chatId: string) => Chat | undefined;
  getChatByCharacter: (characterId: string) => Chat | undefined;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      currentChatId: null,
      createChat: (characterId) => {
        // 이미 해당 캐릭터와의 채팅이 있으면 그 채팅 반환
        const existingChat = get().chats.find(
          (chat) => chat.characterId === characterId
        );
        if (existingChat) {
          set({ currentChatId: existingChat.id });
          return existingChat.id;
        }

        const id = uuidv4();
        const now = Date.now();
        const newChat: Chat = {
          id,
          characterId,
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
      getChat: (chatId) => get().chats.find((chat) => chat.id === chatId),
      getChatByCharacter: (characterId) =>
        get().chats.find((chat) => chat.characterId === characterId),
    }),
    {
      name: 'simutalk-chats',
    }
  )
);
