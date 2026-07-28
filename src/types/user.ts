export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isConnectingGmail: boolean;
  gmailConnected: boolean;
  lastSyncedAt?: string;
}
