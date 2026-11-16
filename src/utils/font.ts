/**
 * Detects whether the user's browser or Windows PC has a custom default font configured,
 * and ensures the root CSS variable `--app-font-family` adapts automatically.
 */
export const DEFAULT_APP_FONT_STACK =
  "system-ui, -apple-system, 'Segoe UI Variable', 'Segoe UI', 'Tajawal', 'Inter', sans-serif";

export const CUSTOM_BROWSER_FONT_STACK =
  "sans-serif, system-ui, -apple-system, 'Segoe UI Variable', 'Segoe UI', 'Tajawal', 'Inter'";

const STOCK_SANS_FALLBACKS = ['Arial', 'Helvetica', 'Liberation Sans', 'DejaVu Sans', 'Noto Sans'];
const PROBE_TEXT = 'mmmmmmmmmmlli1234567890ابتثجحخدذرزسشصضطظعغفقكلمنهوي';

export function resolveAdaptiveFontStack(
  measureWidth?: (fontFamily: string) => number | null
): string {
  if (typeof document === 'undefined' && !measureWidth) {
    return DEFAULT_APP_FONT_STACK;
  }

  try {
    let measure = measureWidth;
    if (!measure) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return DEFAULT_APP_FONT_STACK;
      measure = (family: string) => {
        ctx.font = `72px ${family}`;
        return ctx.measureText(PROBE_TEXT).width;
      };
    }

    const browserSansWidth = measure('sans-serif');
    if (browserSansWidth == null) return DEFAULT_APP_FONT_STACK;

    // Compare the browser's resolved `sans-serif` font against common stock OS defaults.
    // If it differs from every stock fallback, the user has customized their browser font.
    const matchesStockFallback = STOCK_SANS_FALLBACKS.some((fallback) => {
      const w = measure(`'${fallback}', monospace`);
      return w != null && Math.abs(w - browserSansWidth) < 0.5;
    });

    return matchesStockFallback ? DEFAULT_APP_FONT_STACK : CUSTOM_BROWSER_FONT_STACK;
  } catch {
    return DEFAULT_APP_FONT_STACK;
  }
}

export function applyAdaptiveUserFont(): string {
  const stack = resolveAdaptiveFontStack();
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--app-font-family', stack);
    document.documentElement.style.setProperty('--font-sans', stack);
  }
  return stack;
}
