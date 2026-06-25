/**
 * Apply design tokens to CSS variables for global styling
 */
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from './tokens.js';

export const applyTheme = () => {
  const root = document.documentElement;

  // Apply color variables
  Object.entries(COLORS).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subkey, subvalue]) => {
        root.style.setProperty(`--color-${key}-${subkey}`, subvalue);
      });
    } else {
      root.style.setProperty(`--color-${key}`, value);
    }
  });

  // Apply spacing variables
  Object.entries(SPACING).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });

  // Apply radius variables
  Object.entries(RADIUS).forEach(([key, value]) => {
    root.style.setProperty(`--radius-${key}`, value);
  });

  // Apply shadow variables
  Object.entries(SHADOWS).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value);
  });

  // Apply typography variables
  Object.entries(TYPOGRAPHY.scales).forEach(([key, value]) => {
    root.style.setProperty(`--typography-${key}-size`, value.size);
    root.style.setProperty(`--typography-${key}-weight`, value.weight);
    root.style.setProperty(`--typography-${key}-line-height`, value.lineHeight);
  });
};

// Apply theme on script load
applyTheme();

export default applyTheme;