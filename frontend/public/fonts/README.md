# Custom Fonts

## Bambi Bold Font

Please place the `X_bambi.ttf` font file in this directory.

**Expected file:** `X_bambi.ttf`

**Usage:** This font will be used for the school name "Jesus Junior Academy" throughout the website.

**Fallback:** If the font is not available, Georgia serif will be used as a fallback.

## Font Configuration

The fonts are configured in:
- `src/app/layout.tsx` - Font loading
- `tailwind.config.js` - Font family definitions

## How to Use

### Bambi Bold (School Name)
```jsx
<h1 className="font-bambi">Jesus Junior Academy</h1>
```

### Nunito (UI Text)
```jsx
<p className="font-nunito">Regular UI text</p>
```

Nunito is loaded from Google Fonts and is used as the default font for all UI elements.
