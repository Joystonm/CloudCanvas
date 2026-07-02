import https from 'https'
import { URL } from 'url'

const CLOUDINARY_GENERATE_ENDPOINT = (cloud) =>
  `https://api.cloudinary.com/v2/generate/${cloud}/text_to_image`

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const payload = JSON.stringify(body)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cloud = process.env.VITE_CLOUDINARY_CLOUD_NAME
  const key = process.env.VITE_CLOUDINARY_API_KEY
  const secret = process.env.VITE_CLOUDINARY_API_SECRET

  if (!cloud || !key || !secret) {
    res.status(500).json({
      error: 'VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_API_KEY, and VITE_CLOUDINARY_API_SECRET must all be set',
    })
    return
  }

  const body = req.body || {}

  if (!body.prompt) {
    res.status(400).json({ error: 'prompt is required' })
    return
  }

  const requestBody = {
    prompt: body.prompt,
    model: { id: 'flux-2-klein-9b' },
    image_size: {
      aspect_ratio: body.aspect_ratio || '1:1',
      resolution: '1K',
    },
    target: { target_type: 'managed_asset', folder: 'cloudcanvas' },
  }

  try {
    const auth = Buffer.from(`${key}:${secret}`).toString('base64')
    const result = await httpsPost(
      CLOUDINARY_GENERATE_ENDPOINT(cloud),
      { Authorization: `Basic ${auth}` },
      requestBody
    )
    res.status(result.status).json(result.body)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
