import { create } from "zustand";


const useConversation = create((set) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
	messages: [],
	setMessages: (messages) => set({ messages }),
	chat:1,
	setChat: (chat) => set({chat })
	
}));

export default useConversation;
