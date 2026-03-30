/**
 * useDatabase Hook
 *
 * Detecte automatiquement si l'app tourne dans Electron (avec SQLite)
 * ou dans un navigateur web (fallback localStorage).
 *
 * Usage dans les composants :
 *   const db = useDatabase();
 *   if (db.isElectron) {
 *     // SQLite via IPC
 *     const students = await db.api.getStudents();
 *   }
 */

import { useMemo } from 'react';

export const useDatabase = () => {
  const isElectron = useMemo(() => {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }, []);

  return {
    isElectron,
    api: window.electronAPI ?? null,
  };
};

/**
 * Helper statique pour verifier si on est dans Electron
 * (utilisable en dehors de React).
 */
export const isElectronEnv = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

export const getElectronAPI = () => window.electronAPI ?? null;
