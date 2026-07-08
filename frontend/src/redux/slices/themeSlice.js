import { createSlice } from '@reduxjs/toolkit';

const lightTokens = {
  '--bg-gradient': 'linear-gradient(135deg, #944dff 0%, #3b82f6 100%)',
  '--text-primary': '#111111',
  '--text-secondary': '#777777',
  '--text-light': '#ffffff',
  '--primary-color': '#2e2eb8',
  '--primary-hover': '#2929a3',
  '--card-bg': '#f3f3f3',
  '--input-bg': '#e8e8e8',
  '--input-focus-bg': '#ffffff',
  '--input-border': '#cccccc',
  '--input-focus-border': '#2e2eb8',
  '--success-color': '#10b981',
  '--warning-color': '#f59e0b',
  '--danger-color': '#ef4444',
  '--divider-color': '#bbbbbb',
  '--navbar-bg': '#ffffff',
  '--sidebar-bg': '#f8f9fa',
  '--app-bg': 'linear-gradient(135deg, #944dff 0%, #3b82f6 100%)',
  '--app-text': '#ffffff',
};

const darkTokens = {
  '--bg-gradient': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  '--text-primary': '#ffffff',
  '--text-secondary': '#a0a0a0',
  '--text-light': '#e0e0e0',
  '--primary-color': '#5c5cff',
  '--primary-hover': '#4c4cff',
  '--card-bg': 'rgba(255, 255, 255, 0.05)',
  '--input-bg': 'rgba(255, 255, 255, 0.1)',
  '--input-focus-bg': 'rgba(255, 255, 255, 0.15)',
  '--input-border': 'rgba(255, 255, 255, 0.2)',
  '--input-focus-border': '#5c5cff',
  '--success-color': '#10b981',
  '--warning-color': '#f59e0b',
  '--danger-color': '#ef4444',
  '--divider-color': 'rgba(255, 255, 255, 0.1)',
  '--navbar-bg': '#1a1a2e',
  '--sidebar-bg': '#16213e',
  '--app-bg': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  '--app-text': '#e0e0e0',
};

const initialState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  tokens: localStorage.getItem('darkMode') === 'true' ? darkTokens : lightTokens,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.darkMode = !state.darkMode;
      state.tokens = state.darkMode ? darkTokens : lightTokens;
      localStorage.setItem('darkMode', state.darkMode);
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      state.tokens = state.darkMode ? darkTokens : lightTokens;
      localStorage.setItem('darkMode', state.darkMode);
    },
  },
});

export const { toggleTheme, setDarkMode } = themeSlice.actions;
export default themeSlice.reducer;

