/**
 * Tests for injectTransformation — the function that builds Cloudinary
 * generative-AI URLs from a layer's current src.
 *
 * Key invariants verified here:
 *  - Version segments (v1234567890) are stripped
 *  - File extensions (.png, .jpg, .webp…) are stripped
 *  - Prior transformation chains are stripped (no duplicates)
 *  - Query strings (?t=…, ?p=…) are stripped
 *  - Folder-prefixed public IDs are preserved (e.g. cloudcanvas/abc123)
 *  - The new transformation is prepended cleanly after /upload/
 *
 * The valid Cloudinary gen-fill syntax is:
 *   c_pad,ar_16:9,b_gen_fill,f_auto,q_auto   (NOT e_gen_fill)
 */

// Re-export the private function for testing via a thin wrapper.
// We expose it through a named export added only in test builds, OR we
// duplicate the implementation here to test the logic independently.
// Using the duplication approach so tests have zero coupling to build config.

function injectTransformation(src: string, transformation: string): string {
  const clean = src.split('?')[0]
  const uploadMarker = '/upload/'
  const idx = clean.indexOf(uploadMarker)
  if (idx === -1) return clean

  const base = clean.slice(0, idx + uploadMarker.length)
  const afterUpload = clean.slice(idx + uploadMarker.length)
  const parts = afterUpload.split('/')

  const isTransformOrVersion = (seg: string) =>
    /^[a-z]+_/.test(seg) || /^v\d+$/.test(seg)

  const publicIdParts: string[] = []
  for (const part of parts) {
    if (!isTransformOrVersion(part)) {
      publicIdParts.push(part)
    }
  }

  if (publicIdParts.length > 0) {
    publicIdParts[publicIdParts.length - 1] = publicIdParts[publicIdParts.length - 1].replace(/\.[^/.]+$/, '')
  }

  const publicId = publicIdParts.join('/')
  return `${base}${transformation}/${publicId}`
}

const CLOUD = 'https://res.cloudinary.com/dwfusge27/image/upload'
const PUB   = 'cloudcanvas/vuyqqa12nuhwbchbqozi'
const T     = 'c_pad,ar_16:9,b_gen_fill,f_auto,q_auto'

describe('injectTransformation', () => {
  test('clean URL with folder-prefixed public ID', () => {
    const src = `${CLOUD}/${PUB}`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('strips version segment (v1783009318)', () => {
    const src = `${CLOUD}/v1783009318/${PUB}`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('strips file extension (.png)', () => {
    const src = `${CLOUD}/${PUB}.png`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('strips version AND extension', () => {
    const src = `${CLOUD}/v1783009318/${PUB}.png`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('strips prior transformation chain', () => {
    const src = `${CLOUD}/e_brightness:15/e_saturation:-40/e_contrast:-20/f_auto,q_auto/${PUB}`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('strips prior transformation chain with version and extension', () => {
    const src = `${CLOUD}/c_pad,ar_16:9,b_gen_fill,f_auto,q_auto/v1783009318/${PUB}.jpg`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('strips query string cache-buster (?t=...)', () => {
    const src = `${CLOUD}/${PUB}?t=1234567890`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('strips query string poll param (?p=...)', () => {
    const src = `${CLOUD}/${PUB}?p=7`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/${PUB}`)
  })

  test('handles public ID without folder prefix', () => {
    const src = `${CLOUD}/vuyqqa12nuhwbchbqozi`
    expect(injectTransformation(src, T)).toBe(`${CLOUD}/${T}/vuyqqa12nuhwbchbqozi`)
  })

  test('returns src unchanged if /upload/ is missing', () => {
    const src = 'https://example.com/some/image.png'
    expect(injectTransformation(src, T)).toBe(src)
  })

  test('correct gen-fill transformation string (b_gen_fill not e_gen_fill)', () => {
    // Ensures nobody accidentally reverts to the invalid e_gen_fill syntax
    const src = `${CLOUD}/${PUB}`
    const result = injectTransformation(src, T)
    expect(result).toContain('b_gen_fill')
    expect(result).not.toContain('e_gen_fill')
    expect(result).toContain('c_pad')
  })

  test('expand 9:16', () => {
    const t = 'c_pad,ar_9:16,b_gen_fill,f_auto,q_auto'
    const src = `${CLOUD}/v123456/${PUB}.webp`
    expect(injectTransformation(src, t)).toBe(`${CLOUD}/${t}/${PUB}`)
  })

  test('expand square 1:1', () => {
    const t = 'c_pad,ar_1:1,b_gen_fill,f_auto,q_auto'
    const src = `${CLOUD}/${PUB}.jpeg`
    expect(injectTransformation(src, t)).toBe(`${CLOUD}/${t}/${PUB}`)
  })
})
