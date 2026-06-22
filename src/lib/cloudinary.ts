import type { GenerationPreset } from '../types'

// Natural language → Cloudinary transformation strings
// Uses cloudinary-transformations skill patterns
export const TRANSFORMATION_MAP: Record<string, string> = {
  'make cinematic':       'e_art:audrey,q_auto,f_auto',
  'cinematic':            'e_art:audrey,q_auto,f_auto',
  'remove background':    'e_background_removal,f_png',
  'background removal':   'e_background_removal,f_png',
  'compress for web':     'f_auto,q_auto',
  'optimize':             'f_auto,q_auto',
  'make thumbnail':       'c_thumb,g_auto,w_400,h_400,f_auto,q_auto',
  'thumbnail':            'c_thumb,g_auto,w_400,h_400,f_auto,q_auto',
  'grayscale':            'e_grayscale,f_auto,q_auto',
  'black and white':      'e_grayscale,f_auto,q_auto',
  'sharpen':              'e_sharpen:100,f_auto,q_auto',
  'blur':                 'e_blur:300,f_auto,q_auto',
  'sepia':                'e_sepia,q_auto,f_auto',
  'vintage':              'e_art:hokusai,q_auto,f_auto',
  'bright':               'e_brightness:30,f_auto,q_auto',
  'brightness up':        'e_brightness:30,f_auto,q_auto',
  'darken':               'e_brightness:-30,f_auto,q_auto',
  'contrast up':          'e_contrast:40,f_auto,q_auto',
  'saturate':             'e_saturation:50,f_auto,q_auto',
  'vibrant':              'e_vibrance:70,f_auto,q_auto',
  'instagram':            'c_fill,w_1080,h_1080,g_auto,f_auto,q_auto',
  'square':               'c_fill,w_1080,h_1080,g_auto,f_auto,q_auto',
  'youtube thumbnail':    'c_fill,w_1280,h_720,g_auto,f_auto,q_auto',
  'widescreen':           'c_fill,w_1920,h_1080,g_auto,f_auto,q_auto',
  'portrait':             'c_fill,w_1080,h_1350,g_auto,f_auto,q_auto',
  'landscape':            'c_fill,w_1200,h_628,g_auto,f_auto,q_auto',
  'make professional':    'e_improve,f_auto,q_auto',
  'enhance':              'e_improve,f_auto,q_auto',
  'restore':              'e_enhance,f_auto,q_auto',
  'upscale':              'e_upscale,f_auto,q_auto',
  'generative fill':      'e_gen_fill,ar_16:9,g_auto,f_auto,q_auto',
  'expand':               'e_gen_fill,ar_16:9,g_auto,f_auto,q_auto',
  'replace background':   'e_gen_background_replace,f_auto,q_auto',
  'remove object':        'e_gen_remove,f_auto,q_auto',
  'add watermark':        'l_cloudinary_icon,o_30,g_south_east,x_10,y_10/f_auto,q_auto',
}

export function naturalLangToTransformation(prompt: string): string | null {
  const lower = prompt.toLowerCase().trim()
  for (const [key, val] of Object.entries(TRANSFORMATION_MAP)) {
    if (lower.includes(key)) return val
  }
  // Fallback: always return optimize
  return 'f_auto,q_auto'
}

export function buildCloudinaryUrl(
  cloudName: string,
  publicId: string,
  transformation: string
): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`
}

// Export presets → transformation strings
export const EXPORT_PRESETS = [
  { id: 'instagram',       label: 'Instagram',   transformation: 'c_fill,w_1080,h_1080,g_auto,f_auto,q_auto', width: 1080, height: 1080 },
  { id: 'instagram-story', label: 'IG Story',    transformation: 'c_fill,w_1080,h_1920,g_auto,f_auto,q_auto', width: 1080, height: 1920 },
  { id: 'tiktok',          label: 'TikTok',      transformation: 'c_fill,w_1080,h_1920,g_auto,f_auto,q_auto', width: 1080, height: 1920 },
  { id: 'pinterest',       label: 'Pinterest',   transformation: 'c_fill,w_1000,h_1500,g_auto,f_auto,q_auto', width: 1000, height: 1500 },
  { id: 'twitter',         label: 'X / Twitter', transformation: 'c_fill,w_1600,h_900,g_auto,f_auto,q_auto',  width: 1600, height: 900  },
  { id: 'linkedin',        label: 'LinkedIn',    transformation: 'c_fill,w_1200,h_628,g_auto,f_auto,q_auto',  width: 1200, height: 628  },
  { id: 'youtube',         label: 'YouTube',     transformation: 'c_fill,w_1280,h_720,g_auto,f_auto,q_auto',  width: 1280, height: 720  },
  { id: 'og-image',        label: 'OG / Meta',   transformation: 'c_fill,w_1200,h_630,g_auto,f_auto,q_auto',  width: 1200, height: 630  },
  { id: 'mobile',          label: 'Mobile',      transformation: 'c_fill,w_390,h_844,g_auto,f_auto,q_auto',   width: 390,  height: 844  },
  { id: 'desktop',         label: 'Desktop',     transformation: 'c_fill,w_1920,h_1080,g_auto,f_auto,q_auto', width: 1920, height: 1080 },
]

// Prompt enhancer — converts raw user prompt to production-quality generation prompt
export function enhancePrompt(raw: string, preset: GenerationPreset): string {
  const trimmed = raw.trim()

  // Detect if prompt is very short / vague (trash prompt rescue)
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  const isThin = wordCount <= 3

  // Expand thin prompts into richer descriptions
  const expanded = isThin
    ? `a stunning ${trimmed}, beautifully composed, rich in detail, visually striking`
    : trimmed

  const qualityBase =
    'ultra detailed, 8K resolution, sharp focus, clean edges, realistic textures, professional grade, premium look, masterpiece'
  const negativeGuide =
    'no watermarks, no blurry edges, no extra limbs, no distorted text, no oversaturation, no noise, no bad anatomy, no low quality artifacts'

  const presetModifiers: Record<GenerationPreset, string> = {
    photo:
      'award-winning editorial photograph, perfect exposure, rule of thirds composition, cinematic lighting, soft natural bokeh, realistic depth of field, professional color grading, Canon 5D quality',
    illustration:
      'professional digital illustration, concept art quality, bold confident composition, vibrant harmonious palette, clean precise linework, ArtStation trending, studio-grade artwork',
    product:
      'hero product photography, perfectly centered, pristine white studio background, soft wrap-around diffused lighting, tack-sharp focus, commercial advertising quality, reflection on surface',
    poster:
      'high-impact graphic design poster, striking visual hierarchy, bold typography layout, strong color contrast, eye-catching composition, print-ready 300dpi quality, award-winning design',
    thumbnail:
      'viral YouTube thumbnail, extreme visual punch, bold saturated colors, high contrast pop, clear dominant focal point, curiosity-gap composition, professional click-bait quality',
    branding:
      'premium brand identity visual, clean minimal composition, intentional negative space, sophisticated color palette, strong brand recall, Fortune-500 brand quality, Swiss design principles',
  }

  return `${presetModifiers[preset]}: ${expanded}, ${qualityBase}. ${negativeGuide}`
}
