export type PriorityLevel = "urgent" | "high" | "normal" | "low";
export type CategoryTag = "action_required" | "deadline_today" | "vip" | "fyi" | "newsletter";

export interface EmailParticipant {
  name: string;
  email: string;
  avatarUrl?: string;
  isVIP?: boolean;
}

export interface EmailAttachment {
  name: string;
  size: string;
  type?: string;
  url?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  sender: EmailParticipant;
  recipients: EmailParticipant[];
  ccRecipients?: EmailParticipant[];
  subject: string;
  bodySnippet: string;
  bodyHtml?: string;
  bodyText: string;
  timestamp: string;
  isUnread: boolean;
  attachments?: EmailAttachment[];
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailParticipant[];
  lastMessageTimestamp: string;
  snippet: string;
  isUnread: boolean;
  isArchived: boolean;
  isSnoozed: boolean;
  snoozedUntil?: string;
  priority: PriorityLevel;
  category: CategoryTag;
  messages: EmailMessage[];
  unreadCount: number;
}
