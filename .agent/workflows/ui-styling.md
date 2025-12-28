# UI Styling Guidelines for aetcanvas

## Color Palette

Use **pastel colors** for soft, light tones. Defined in `src/components/MessageBubble.js` and `src/components/Sources.js`:

```javascript
const COLORS = {
    accent: '#7c7fdb',      // Pastel indigo
    accentLight: '#a5a8ed',
    bgCard: '#1a1a2e',
    bgHover: '#252540',
    text: '#e2e8f0',
    textDim: '#94a3b8',
    // Source colors
    gmail: '#e8a5a0',       // Pastel coral
    url: '#a5c4e8',         // Pastel blue
    document: '#a5e8c0',    // Pastel mint
    memory: '#c4a5e8',      // Pastel lavender
};
```

## Formatting Rules

### Email Addresses
- **Backend formats** email addresses as mailto links in `limbs/sources/gmail/gmail_source.py`
- Format: `Name [📧](mailto:email@domain.com)` → clickable in markdown
- Frontend renders as-is, keeping it lightweight

### Spacing
- Keep UI **compact** - minimal padding/margins
- Footer: `paddingTop: 4, marginTop: 4` (no separator line)
- Pills: `paddingVertical: 4, paddingHorizontal: 10`

### Message Structure
1. **Header**: Source activity (e.g., "📧 Searched Gmail")
2. **Content**: Message text (markdown rendered)
3. **Footer**: Source pills with counts (e.g., "📧 Gmail: 5 emails")

## Do NOT
- Use raw/bold colors (pure red, green, blue)
- Add angle brackets `<email>` in content (breaks HTML rendering)
- Add complex escape logic in frontend - fix at source (backend)
