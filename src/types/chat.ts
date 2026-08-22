export type MessageSender = "student" | "professional";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: MessageSender;
  message: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  studentId: string;
  professionalId: string;
  lastMessageAt: string;
  createdAt: string;
}
