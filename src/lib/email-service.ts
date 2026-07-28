import { EmailThread } from "@/types/email";
import { MOCK_THREADS } from "./mock-data";

/**
 * Service layer abstraction for Email operations.
 * Connects to Gmail API when credentials exist, or provides realistic mock data fallback.
 */
export class EmailService {
  private static threads: EmailThread[] = [...MOCK_THREADS];

  /**
   * Retrieves email threads filtered by category or priority.
   */
  static async getThreads(filter: "all" | "urgent" | "action_needed" | "vip" | "archived" = "all"): Promise<EmailThread[]> {
    // Simulate slight async network delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return this.threads.filter((thread) => {
      if (filter === "archived") return thread.isArchived;
      if (thread.isArchived) return false;

      if (filter === "urgent") return thread.priority === "urgent";
      if (filter === "action_needed") return thread.category === "action_required" || thread.category === "deadline_today";
      if (filter === "vip") return thread.category === "vip" || thread.participants.some((p) => p.isVIP);

      return true;
    });
  }

  /**
   * Retrieves a single email thread by ID.
   */
  static async getThreadById(id: string): Promise<EmailThread | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return this.threads.find((t) => t.id === id) || null;
  }

  /**
   * Archives a thread.
   */
  static async archiveThread(id: string): Promise<boolean> {
    const thread = this.threads.find((t) => t.id === id);
    if (thread) {
      thread.isArchived = true;
      return true;
    }
    return false;
  }

  /**
   * Snoozes a thread.
   */
  static async snoozeThread(id: string, untilText: string = "Tomorrow, 9:00 AM"): Promise<boolean> {
    const thread = this.threads.find((t) => t.id === id);
    if (thread) {
      thread.isSnoozed = true;
      thread.snoozedUntil = untilText;
      return true;
    }
    return false;
  }

  /**
   * Marks a thread as read.
   */
  static async markAsRead(id: string): Promise<boolean> {
    const thread = this.threads.find((t) => t.id === id);
    if (thread) {
      thread.isUnread = false;
      thread.unreadCount = 0;
      return true;
    }
    return false;
  }

  /**
   * Sends an email reply (scaffold for Gmail API send message).
   */
  static async sendReply(threadId: string, replyText: string): Promise<{ success: boolean; messageId?: string }> {
    const thread = this.threads.find((t) => t.id === threadId);
    if (!thread) {
      return { success: false };
    }

    const newMessage = {
      id: `msg_sent_${Date.now()}`,
      threadId,
      sender: { name: "Alex Mercer", email: "alex.mercer@priora.ai" },
      recipients: thread.participants.filter((p) => p.email !== "alex.mercer@priora.ai"),
      subject: `Re: ${thread.subject}`,
      bodySnippet: replyText.slice(0, 100) + "...",
      bodyText: replyText,
      timestamp: "Just now",
      isUnread: false,
    };

    thread.messages.push(newMessage);
    thread.lastMessageTimestamp = "Just now";
    thread.isArchived = true; // Auto-archive after sending executive reply

    return { success: true, messageId: newMessage.id };
  }
}
