/**
 * Google Identity Services & Google Drive appDataFolder Sync Helper
 * Client ID: 405557692121-sufnlsmp61sf8j2biqgvma5odbhcri32.apps.googleusercontent.com
 * Scope: https://www.googleapis.com/auth/drive.appdata
 */

import { AppState, UserProfile } from '../types/index.ts';
import { getGeminiApiKey, setGeminiApiKey } from './gemini.ts';

export const GOOGLE_CLIENT_ID =
  '405557692121-sufnlsmp61sf8j2biqgvma5odbhcri32.apps.googleusercontent.com';

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export const BACKUP_FILENAME = 'studyflow_backup.json';

const TOKEN_STORAGE_KEY = 'studyflow_google_token';

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}

export interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (err: any) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export function getStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAccessToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to set stored token:', e);
  }
}

/**
 * Request access token from user via Google Identity Services popup
 */
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services library is not loaded yet. Please check your internet connection or reload the page.'
        )
      );
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPES,
        callback: (resp: TokenResponse) => {
          if (resp.error) {
            let msg = resp.error_description || resp.error;
            if (resp.error === 'access_denied') {
              msg = 'Access blocked (403): App is in Google Cloud Testing mode. Add your email as a Test User in Google Cloud Console or Publish the app.';
            }
            reject(new Error(msg));
            return;
          }
          if (resp.access_token) {
            setStoredAccessToken(resp.access_token);
            resolve(resp.access_token);
          } else {
            reject(new Error('No access token returned from Google.'));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || 'Google OAuth failed.'));
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      reject(new Error(err?.message || 'Could not launch Google authentication window.'));
    }
  });
}

/**
 * Fetch authenticated user's profile info
 */
export async function fetchGoogleUserProfile(token: string): Promise<Partial<UserProfile>> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile (${res.status})`);
  }

  const data = await res.json();
  return {
    name: data.name || data.given_name || 'Google User',
    email: data.email || '',
    avatar: data.picture || '',
    googleId: data.sub || '',
    signedIn: true,
  };
}

/**
 * Sign out and revoke token
 */
export async function revokeGoogleAccess(token?: string | null): Promise<void> {
  const currentToken = token || getStoredAccessToken();
  if (currentToken && window.google?.accounts?.oauth2?.revoke) {
    await new Promise<void>((resolve) => {
      try {
        window.google!.accounts.oauth2.revoke(currentToken, () => {
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }
  setStoredAccessToken(null);
}

/**
 * Locate existing backup file in Google Drive appDataFolder
 */
async function findBackupFile(token: string): Promise<{ id: string; name: string } | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILENAME}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setStoredAccessToken(null);
      throw new Error('Google authorization expired. Please click "Connect Google" again.');
    }
    const errText = await res.text();
    throw new Error(`Drive search failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

/**
 * Upload appState backup into Google Drive appDataFolder
 */
export async function uploadBackupToDrive(
  token: string,
  state: AppState
): Promise<{ success: boolean; message: string; timestamp: number }> {
  // Ensure the user's saved Gemini AI API key is included in the uploaded JSON
  const currentApiKey = getGeminiApiKey() || state.settings?.apiKey || '';
  const payloadToUpload: AppState = {
    ...state,
    settings: {
      ...state.settings,
      apiKey: currentApiKey,
    },
  };
  const jsonContent = JSON.stringify(payloadToUpload, null, 2);
  const existing = await findBackupFile(token);

  if (existing?.id) {
    // Update existing file content
    const patchUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`;
    const res = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonContent,
    });

    if (!res.ok) {
      if (res.status === 401) {
        setStoredAccessToken(null);
        throw new Error('Google authorization expired. Please click "Connect Google" again.');
      }
      const errText = await res.text();
      throw new Error(`Drive update failed (${res.status}): ${errText}`);
    }

    return {
      success: true,
      message: 'Backup updated successfully in Google Drive (appDataFolder).',
      timestamp: Date.now(),
    };
  } else {
    // Multipart create new file inside appDataFolder
    const metadata = {
      name: BACKUP_FILENAME,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const createUrl =
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name';

    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      if (res.status === 401) {
        setStoredAccessToken(null);
        throw new Error('Google authorization expired. Please click "Connect Google" again.');
      }
      const errText = await res.text();
      throw new Error(`Drive create failed (${res.status}): ${errText}`);
    }

    return {
      success: true,
      message: 'New backup created successfully in Google Drive (appDataFolder).',
      timestamp: Date.now(),
    };
  }
}

/**
 * Restore appState backup from Google Drive appDataFolder
 */
export async function restoreBackupFromDrive(token: string): Promise<AppState> {
  const existing = await findBackupFile(token);

  if (!existing?.id) {
    throw new Error('No studyflow_backup.json file found in your Google Drive appDataFolder.');
  }

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      setStoredAccessToken(null);
      throw new Error('Google authorization expired. Please click "Connect Google" again.');
    }
    const errText = await res.text();
    throw new Error(`Failed to download backup (${res.status}): ${errText}`);
  }

  const rawJson = await res.text();
  const parsed = JSON.parse(rawJson);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Downloaded backup contains invalid or empty JSON.');
  }

  // Restore the Gemini API Key into localStorage and settings automatically
  const restoredApiKey = parsed.settings?.apiKey || (parsed as any).geminiApiKey || '';
  if (restoredApiKey && typeof restoredApiKey === 'string') {
    setGeminiApiKey(restoredApiKey);
    if (parsed.settings) {
      parsed.settings.apiKey = restoredApiKey;
    }
  }

  return parsed as AppState;
}
