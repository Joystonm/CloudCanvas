import http from 'http'
import https from 'https'
import { URL } from 'url'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Load .env file manually (no external deps needed for ESM)
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const envPath = resolve(__dirname, '../../.env')
  const envFile = readFileSync(envPath, 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
} catch { /* .env not found, rely on OS env vars */ }

const PORT = 3001
// Correct Cloudinary Image Generation endpoint (from Console Code panel)
const CLOUDINARY_GENERATE_ENDPOINT = (cloud) =>
  `https://api.cloudinary.com/v2/generate/${cloud}/text_to_image`
const CLOUDINARY_UPLOAD_ENDPOINT = (cloud) =>
  `https://api.cloudinary.com/v1_1/${cloud}/image/upload`

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { resolve({}) }
    })
    req.on('error', reject)
  })
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const payload = JSON.stringify(body)
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

function httpsPostForm(url, formData, auth) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)
    let body = ''
    for (const [k, v] of Object.entries(formData)) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`
    }
    body += `--${boundary}--\r\n`
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(body),
        'Authorization': 'Basic ' + Buffer.from(auth).toString('base64'),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) })
        } catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

const server = http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const url = new URL(req.url, `http://localhost:${PORT}`)

  // Generate image via Cloudinary Image Generation add-on
  // Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
  // The generated image is automatically saved as a managed Cloudinary asset.
  // Response includes secure_url and public_id directly — no upload step needed.
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    const body = await readBody(req)
    const cloud = process.env.VITE_CLOUDINARY_CLOUD_NAME
    const key = process.env.VITE_CLOUDINARY_API_KEY
    const secret = process.env.VITE_CLOUDINARY_API_SECRET
    if (!cloud || !key || !secret) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must all be set' }))
      return
    }
    try {
      const requestBody = {
        prompt: body.prompt,
        model: { id: 'flux-2-klein-9b' },
        image_size: {
          aspect_ratio: body.aspect_ratio || '1:1',
          resolution: '1K',
        },
        target: { target_type: 'managed_asset', folder: 'cloudcanvas' },
      }
      const auth = Buffer.from(`${key}:${secret}`).toString('base64')
      const result = await httpsPost(
        CLOUDINARY_GENERATE_ENDPOINT(cloud),
        { Authorization: `Basic ${auth}` },
        requestBody
      )
      res.writeHead(result.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.body))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Upload image URL to Cloudinary (used for user-uploaded files, not for generated images)
  if (req.method === 'POST' && url.pathname === '/api/cloudinary/upload') {
    const body = await readBody(req)
    const cloud = process.env.VITE_CLOUDINARY_CLOUD_NAME
    const key = process.env.VITE_CLOUDINARY_API_KEY
    const secret = process.env.VITE_CLOUDINARY_API_SECRET
    if (!cloud || !key || !secret) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Cloudinary env vars not set' }))
      return
    }
    try {
      const result = await httpsPostForm(
        CLOUDINARY_UPLOAD_ENDPOINT(cloud),
        { file: body.url, upload_preset: body.upload_preset || 'ml_default', folder: 'cloudcanvas' },
        `${key}:${secret}`
      )
      res.writeHead(result.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.body))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`CloudCanvas API server running on http://localhost:${PORT}`)
  console.log('Required env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
})
