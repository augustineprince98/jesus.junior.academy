/**
 * App Theme Colors
 * 
 * Matches the school website branding.
 */

const tintColorLight = '#1E3A5F';  // Primary blue
const tintColorDark = '#6691E5';   // Light blue for dark mode

export default {
  light: {
    text: '#1a1a1a',
    background: '#f8fafc',
    tint: tintColorLight,
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    border: '#e2e8f0',
    primary: '#1E3A5F',
    secondary: '#6691E5',
    accent: '#F5D76E',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  dark: {
    text: '#f1f5f9',
    background: '#0a0a0f',
    tint: tintColorDark,
    tabIconDefault: '#64748b',
    tabIconSelected: tintColorDark,
    card: '#1e1e2e',
    border: '#334155',
    primary: '#6691E5',
    secondary: '#1E3A5F',
    accent: '#F5D76E',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#f87171',
  },
};
