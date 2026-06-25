/**
 * Hook to access design tokens in React components
 */
import { THEME } from './tokens.js';

export const useTheme = () => {
  return THEME;
};

export default useTheme;