const HISTORY_KEY = 'ai-chat-history';

export const saveHistory = (history) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const loadHistory = () => {
  const saved = localStorage.getItem(HISTORY_KEY);
  return saved ? JSON.parse(saved) : [];
};

export const createNewChat = (model) => {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [],
    model,
    createdAt: Date.now(),
  };
};

export const updateChatTitle = (history, chatId, firstMessage) => {
  return history.map(chat => {
    if (chat.id === chatId) {
      // Generate title from first few words of the user's first message
      const title = firstMessage.split(' ').slice(0, 4).join(' ') + '...';
      return { ...chat, title };
    }
    return chat;
  });
};
