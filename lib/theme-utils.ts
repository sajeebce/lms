/**
 * Theme Color Conversion Utilities
 * 
 * Automatically converts light mode colors to dark mode equivalents
 * while maintaining the same hue and brand identity.
 */

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

/**
 * Convert hex color to RGB
 */
export function hexToRGB(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 }
}

/**
 * Convert RGB to HSL
 */
export function rgbToHSL(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Convert HSL to RGB
 */
export function hslToRGB(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Convert hex to HSL (convenience function)
 */
export function hexToHSL(hex: string): HSL {
  return rgbToHSL(hexToRGB(hex))
}

/**
 * Convert HSL to hex (convenience function)
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRGB(hsl))
}

/**
 * Convert light hover background color to dark mode equivalent
 * 
 * Light backgrounds (90-100% lightness) → Dark backgrounds (15-25% lightness)
 * Maintains the same hue for brand consistency
 * 
 * @param lightHoverColor - Light mode hover background color (e.g., #fdf2f8)
 * @returns Dark mode hover background color (e.g., #831843)
 */
export function convertToDarkHover(lightHoverColor: string): string {
  const hsl = hexToHSL(lightHoverColor)
  
  // Convert light background (90-100% lightness) to dark (20% lightness)
  // Cap saturation at 60% to avoid overly vibrant dark backgrounds
  return hslToHex({
    h: hsl.h,                    // Keep same hue (brand color)
    s: Math.min(hsl.s, 60),      // Cap saturation
    l: 20                        // Dark background
  })
}

/**
 * Darken border color for dark mode
 * 
 * @param borderColor - Light mode border color (e.g., #fbcfe8)
 * @returns Dark mode border color (e.g., #9f1239)
 */
export function darkenBorder(borderColor: string): string {
  const hsl = hexToHSL(borderColor)
  
  // Darken border but not too dark (minimum 25% lightness)
  return hslToHex({
    h: hsl.h,
    s: hsl.s,
    l: Math.max(hsl.l * 0.4, 25)  // Reduce lightness to 40%, min 25%
  })
}

