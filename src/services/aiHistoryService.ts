import { supabase } from "../supabaseClient";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

export type AIHistoryMessage = {
  id: string;
  conversation_id: string;
  sender: "student" | "mindSync";
  text: string;
  created_at: string;
};

export type AIConversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

/* ─────────────────────────────────────────────────────────────
   AUTHENTICATED USER
───────────────────────────────────────────────────────────── */

/**
 * Returns the Supabase Auth UUID of the currently
 * authenticated user.
 *
 * IMPORTANT:
 * This is NOT the student's profile.id.
 *
 * ai_conversations.user_id must use the Supabase Auth UUID.
 */
async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Could not get authenticated user: ${error.message}`);
  }

  if (!user) {
    throw new Error("No authenticated Supabase user.");
  }

  return user.id;
}

/* ─────────────────────────────────────────────────────────────
   CONVERSATIONS
───────────────────────────────────────────────────────────── */

/**
 * Load conversations belonging to the currently
 * authenticated Supabase user.
 */
export async function getAIConversations(): Promise<AIConversation[]> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(`Could not load AI conversations: ${error.message}`);
  }

  return (data ?? []) as AIConversation[];
}

/* ─────────────────────────────────────────────────────────────
   CREATE CONVERSATION
───────────────────────────────────────────────────────────── */

/**
 * Creates a conversation owned by the currently
 * authenticated Supabase user.
 */
export async function createAIConversation(
  title = "New conversation",
): Promise<AIConversation> {
  const userId = await getCurrentUserId();

  const cleanTitle = title.trim() || "New conversation";

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      title: cleanTitle,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not create AI conversation: ${error.message}`);
  }

  return data as AIConversation;
}

/* ─────────────────────────────────────────────────────────────
   UPDATE CONVERSATION TITLE
───────────────────────────────────────────────────────────── */

/**
 * Updates only a conversation belonging to the
 * currently authenticated user.
 */
export async function updateAIConversation(
  conversationId: string,
  title: string,
): Promise<AIConversation> {
  const userId = await getCurrentUserId();

  const cleanTitle = title.trim() || "New conversation";

  const { data, error } = await supabase
    .from("ai_conversations")
    .update({
      title: cleanTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not update AI conversation: ${error.message}`);
  }

  return data as AIConversation;
}

/* ─────────────────────────────────────────────────────────────
   DELETE CONVERSATION
───────────────────────────────────────────────────────────── */

/**
 * Deletes only a conversation belonging to the
 * currently authenticated user.
 */
export async function deleteAIConversation(
  conversationId: string,
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Could not delete AI conversation: ${error.message}`);
  }
}

/* ─────────────────────────────────────────────────────────────
   MESSAGES
───────────────────────────────────────────────────────────── */

/**
 * Load all messages for a conversation.
 *
 * Supabase RLS should also ensure that the conversation
 * belongs to the authenticated user.
 */
export async function getAIMessages(
  conversationId: string,
): Promise<AIHistoryMessage[]> {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(`Could not load AI messages: ${error.message}`);
  }

  return (data ?? []) as AIHistoryMessage[];
}

/* ─────────────────────────────────────────────────────────────
   SAVE MESSAGE
───────────────────────────────────────────────────────────── */

/**
 * Save one student or MindSync message.
 */
export async function saveAIMessage(
  conversationId: string,
  sender: "student" | "mindSync",
  text: string,
): Promise<AIHistoryMessage> {
  if (!conversationId) {
    throw new Error("Conversation ID is required.");
  }

  const cleanText = text.trim();

  if (!cleanText) {
    throw new Error("Message text cannot be empty.");
  }

  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: conversationId,
      sender,
      text: cleanText,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Could not save AI message: ${error.message}`);
  }

  return data as AIHistoryMessage;
}

/* ─────────────────────────────────────────────────────────────
   TOUCH CONVERSATION
───────────────────────────────────────────────────────────── */

/**
 * Updates the conversation timestamp after a message
 * is added.
 */
export async function touchAIConversation(
  conversationId: string,
): Promise<void> {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("ai_conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(
      `Could not update AI conversation timestamp: ${error.message}`,
    );
  }
}
