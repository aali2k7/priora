import { EmailThread } from "@/types/email";
import { MOCK_THREADS } from "./mock-data";

/**
 * Service layer abstraction for Email operations (Client & Server safe).
 * Dispatches to /api/gmail/* routes when in browser, or uses mock fallback.
 */
export class EmailService {
  private static threads: EmailThread[] = [...MOCK_THREADS];

  /**
   * Retrieves email threads filtered by category or priority.
   */
  static async getThreads(filter: "all" | "urgent" | "action_needed" | "vip" | "archived" = "all"): Promise<EmailThread[]> {
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
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/gmail/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "archive", threadId: id }),
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn("[EmailService] archive API failed, updating local state:", err);
      }
    }

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
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/gmail/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "snooze", threadId: id, value: untilText }),
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn("[EmailService] snooze API failed, updating local state:", err);
      }
    }

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
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/gmail/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markRead", threadId: id }),
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn("[EmailService] markRead API failed, updating local state:", err);
      }
    }

    const thread = this.threads.find((t) => t.id === id);
    if (thread) {
      thread.isUnread = false;
      thread.unreadCount = 0;
      return true;
    }
    return false;
  }

  /**
   * Sends an email reply to an existing thread.
   */
  static async sendReply(
    threadId: string,
    replyText: string,
    archiveAfterSend: boolean = false
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/gmail/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            bodyText: replyText,
            archiveAfterSend,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          return { success: true, messageId: data.messageId };
        } else if (!res.ok) {
          console.warn("[EmailService] sendReply API failed with error:", data.error);
          return {
            success: false,
            error: data.error || `Server returned error (${res.status})`,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        console.warn("[EmailService] sendReply API request failed:", err);
        return { success: false, error: msg };
      }
    }

    const thread = this.threads.find((t) => t.id === threadId);
    if (!thread) {
      return { success: false, error: "Thread not found" };
    }

    const newMessage = {
      id: `msg_sent_${Date.now()}`,
      threadId,
      sender: { name: "Me", email: "user@gmail.com" },
      recipients: thread.participants.filter((p) => p.email !== "user@gmail.com"),
      subject: `Re: ${thread.subject}`,
      bodySnippet: replyText.slice(0, 100) + "...",
      bodyText: replyText,
      timestamp: "Just now",
      isUnread: false,
    };

    thread.messages.push(newMessage);
    thread.lastMessageTimestamp = "Just now";
    if (archiveAfterSend) {
      thread.isArchived = true;
    }

    return { success: true, messageId: newMessage.id };
  }

  /**
   * Composes and sends a new standalone email.
   */
  static async sendNewEmail(params: {
    to: string | string[];
    subject: string;
    bodyText: string;
    cc?: string | string[];
    bcc?: string | string[];
  }): Promise<{ success: boolean; messageId?: string; threadId?: string; error?: string }> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/gmail/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          return {
            success: true,
            messageId: data.messageId,
            threadId: data.threadId,
          };
        } else {
          return {
            success: false,
            error: data.error || `Server returned error (${res.status})`,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        console.warn("[EmailService] sendNewEmail API request failed:", err);
        return { success: false, error: msg };
      }
    }

    return {
      success: true,
      messageId: `msg_new_${Date.now()}`,
      threadId: `thread_new_${Date.now()}`,
    };
  }

  /**
   * Schedules an email for future delivery.
   */
  static async scheduleEmail(params: {
    to: string | string[];
    subject: string;
    bodyText: string;
    cc?: string | string[];
    bcc?: string | string[];
    scheduledAt: string; // ISO string in UTC
    userTimezone: string; // e.g. "America/New_York"
    userFormattedTime: string; // e.g. "Tomorrow at 8:00 AM"
    threadId?: string;
  }): Promise<{ success: boolean; scheduledId?: string; error?: string }> {
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/gmail/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          return {
            success: true,
            scheduledId: data.scheduledId,
          };
        } else {
          return {
            success: false,
            error: data.error || `Server returned error (${res.status})`,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        console.warn("[EmailService] scheduleEmail API request failed:", err);
        return { success: false, error: msg };
      }
    }

    return {
      success: true,
      scheduledId: `sched_${Date.now()}`,
    };
  }
}

