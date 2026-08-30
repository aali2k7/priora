"use client";

import { EmailThread } from "@/types/email";
import { AISummary, ExecutiveBriefing } from "@/types/ai";

const STORAGE_KEYS = {
  THREADS: "priora_cached_threads",
  BRIEFING: "priora_cached_briefing",
  SUMMARY_PREFIX: "priora_cached_summary_",
  LAST_SYNC: "priora_last_sync_timestamp",
} as const;

interface CachedPayload<T> {
  data: T;
  timestamp: number;
  version: number;
}

const CURRENT_CACHE_VERSION = 1;
const DEFAULT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function safeGetItem<T>(key: string, maxAgeMs: number = DEFAULT_MAX_AGE_MS): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: CachedPayload<T> = JSON.parse(raw);
    if (!parsed || parsed.version !== CURRENT_CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - parsed.timestamp > maxAgeMs) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.warn(`[ClientCache] Failed to read key ${key}:`, err);
    return null;
  }
}

function safeSetItem<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedPayload<T> = {
      data,
      timestamp: Date.now(),
      version: CURRENT_CACHE_VERSION,
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn(`[ClientCache] Failed to write key ${key} (storage might be full):`, err);
    try {
      cleanupOldSummaries();
      const payload: CachedPayload<T> = {
        data,
        timestamp: Date.now(),
        version: CURRENT_CACHE_VERSION,
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Ignore if still failing
    }
  }
}

function cleanupOldSummaries() {
  if (typeof window === "undefined") return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE_KEYS.SUMMARY_PREFIX)) {
      keysToRemove.push(k);
    }
  }
  for (const k of keysToRemove) {
    localStorage.removeItem(k);
  }
}

/**
 * Threads Cache
 */
export function getCachedThreads(): EmailThread[] | null {
  return safeGetItem<EmailThread[]>(STORAGE_KEYS.THREADS);
}

export function setCachedThreads(threads: EmailThread[]): void {
  safeSetItem(STORAGE_KEYS.THREADS, threads);
}

/**
 * AI Executive Briefing Cache
 */
export function getCachedBriefing(): ExecutiveBriefing | null {
  return safeGetItem<ExecutiveBriefing>(STORAGE_KEYS.BRIEFING);
}

export function setCachedBriefing(briefing: ExecutiveBriefing): void {
  safeSetItem(STORAGE_KEYS.BRIEFING, briefing);
}

/**
 * Single Thread AI Summary Cache
 */
export function getCachedSummary(threadId: string): AISummary | null {
  return safeGetItem<AISummary>(`${STORAGE_KEYS.SUMMARY_PREFIX}${threadId}`);
}

export function setCachedSummary(threadId: string, summary: AISummary): void {
  safeSetItem(`${STORAGE_KEYS.SUMMARY_PREFIX}${threadId}`, summary);
}

export function invalidateThreadSummary(threadId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_KEYS.SUMMARY_PREFIX}${threadId}`);
  } catch {
    // ignore
  }
}

/**
 * Clear all Priora client caches (e.g. on user logout)
 */
export function clearClientCache(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith("priora_cached_") || k === STORAGE_KEYS.LAST_SYNC)
      ) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  } catch (err) {
    console.warn("[ClientCache] Error clearing cache:", err);
  }
}
