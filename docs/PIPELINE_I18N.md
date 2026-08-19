# PipelinePage Internationalization (i18n)

## Overview

Added bilingual support (Hebrew and English) to the PipelinePage component with language switching functionality.

## Changes Made

### 1. Translation Keys Added

#### English (`src/locales/en/translation.json`)

```json
{
  "pipeline": {
    "page": {
      "title": "Recruitment Pipeline",
      "candidatesCount": "{{count}} candidates",
      "stagesCount": "{{count}} stages",
      "filter": "Filter",
      "refresh": "Refresh",
      "loading": "Loading...",
      "demoDataBanner": "Demo Data — No real Applications yet. Import candidates to see real data."
    }
  }
}
```

#### Hebrew (`src/locales/he/translation.json`)

```json
{
  "pipeline": {
    "page": {
      "title": "תהליך גיוס",
      "candidatesCount": "{{count}} מועמדים",
      "stagesCount": "{{count}} שלבים",
      "filter": "סינון",
      "refresh": "רענון",
      "loading": "טוען...",
      "demoDataBanner": "Demo Data — אין Applications אמיתיים עדיין. ייבא מועמדים כדי לראות נתונים אמיתיים."
    }
  }
}
```

### 2. Component Updates

#### PipelinePage.jsx

- Added `useTranslation` hook for i18n support
- Dynamic direction (RTL/LTR) based on current language
- Replaced hardcoded Hebrew text with translation keys
- All UI text now uses `t()` function for translations

**Key Changes:**

```jsx
// Import translation hook
import { useTranslation } from 'react-i18next';

// Get translation function and language
const { t, i18n } = useTranslation();
const currentLang = i18n.language?.startsWith('en') ? 'en' : 'he';
const isRTL = currentLang === 'he';

// Use translations
<h1>{t('pipeline.page.title')}</h1>
<p>{t('pipeline.page.candidatesCount', { count: applications.length })}</p>
```

#### GlobalHeader.jsx

- Added `LanguageSwitcher` component
- Dynamic navigation labels based on language
- RTL/LTR direction support
- All UI text now supports both languages

**Key Changes:**

```jsx
// Added language switcher in header
;<LanguageSwitcher variant="badge" />

// Dynamic button labels
{
  isRTL ? "התחברות" : "Login"
}
{
  isRTL ? "הרשמה" : "Sign Up"
}
```

### 3. Language Switching

Users can now switch between Hebrew and English using the `LanguageSwitcher` component in the header:

- **Hebrew**: Right-to-left (RTL) layout
- **English**: Left-to-right (LTR) layout

The language preference is automatically saved in localStorage and persists across sessions.

## Usage

### Language Switcher Variants

The `LanguageSwitcher` component supports three variants:

1. **Badge** (used in GlobalHeader):

```jsx
<LanguageSwitcher variant="badge" />
```

2. **Minimal**:

```jsx
<LanguageSwitcher variant="minimal" />
```

3. **Default**:

```jsx
<LanguageSwitcher />
```

## Testing

To test the language switching:

1. Open the application
2. Navigate to the Pipeline page (`/recruitment/pipeline`)
3. Click on the language switcher in the header
4. Observe:
   - Page title changes language
   - Candidate/stages count changes language
   - Filter and Refresh buttons change language
   - Demo data banner changes language
   - Layout direction changes (RTL ↔ LTR)

## Files Modified

1. `src/pages/recruitment/PipelinePage.jsx` - Added i18n support
2. `src/locales/en/translation.json` - Added English translations
3. `src/locales/he/translation.json` - Added Hebrew translations
4. `src/components/layout/GlobalHeader.jsx` - Added LanguageSwitcher and i18n support

## Future Improvements

Consider adding translations for:

- PipelineFilters component
- PipelineBoard component
- MobilePipelineView component
- CandidateDrawer component
- Stage names in the pipeline
- Error messages and notifications
