import { useState } from 'react';
import { AppState } from '../types';
import { initialData } from '../data';

const STORAGE_KEY = 'elikia-school-state';

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const storedState = localStorage.getItem(STORAGE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        return { ...initialData, ...parsedState, currentUser: null };
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
    }
    return initialData;
  });

  const updateState = (updater: (prevState: AppState) => AppState) => {
    setState((prevState) => {
      const newState = updater(prevState);
      try {
        const { currentUser, ...stateToStore } = newState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
      } catch (error) {
        console.error('Failed to save state to localStorage', error);
      }
      return newState;
    });
  };

  return [state, updateState] as const;
};
