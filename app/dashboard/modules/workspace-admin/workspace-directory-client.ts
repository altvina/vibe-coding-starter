'use client';

import {
  defaultWorkspaceDirectory,
  decodeWorkspaceDirectoryCookie,
  encodeWorkspaceDirectoryCookie,
  WORKSPACE_DIRECTORY_COOKIE_KEY,
  WORKSPACE_DIRECTORY_STORAGE_KEY,
  type WorkspaceDirectoryV1,
} from '@/lib/dashboard/workspace-directory';

function isValidDirectory(value: unknown): value is WorkspaceDirectoryV1 {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as WorkspaceDirectoryV1;
  return (
    v.version === 1 &&
    Array.isArray(v.customWorkspaces) &&
    v.seedOverrides != null &&
    typeof v.seedOverrides === 'object'
  );
}

export function loadWorkspaceDirectoryFromBrowser(): WorkspaceDirectoryV1 {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_DIRECTORY_STORAGE_KEY);
    if (!raw) {
      return defaultWorkspaceDirectory();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidDirectory(parsed)) {
      return defaultWorkspaceDirectory();
    }
    return parsed;
  } catch {
    return defaultWorkspaceDirectory();
  }
}

export function persistWorkspaceDirectory(next: WorkspaceDirectoryV1) {
  try {
    window.localStorage.setItem(WORKSPACE_DIRECTORY_STORAGE_KEY, JSON.stringify(next));
    const cookieValue = encodeWorkspaceDirectoryCookie(next);
    document.cookie = `${WORKSPACE_DIRECTORY_COOKIE_KEY}=${cookieValue}; path=/; SameSite=Lax`;
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function syncWorkspaceDirectoryCookieFromStorage() {
  try {
    const raw = window.localStorage.getItem(WORKSPACE_DIRECTORY_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidDirectory(parsed)) {
      return;
    }
    const cookieValue = encodeWorkspaceDirectoryCookie(parsed);
    document.cookie = `${WORKSPACE_DIRECTORY_COOKIE_KEY}=${cookieValue}; path=/; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function parseWorkspaceDirectoryFromImport(raw: string): WorkspaceDirectoryV1 | null {
  return decodeWorkspaceDirectoryCookie(raw);
}
