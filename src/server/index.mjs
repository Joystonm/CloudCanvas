import http from 'http'
import https from 'https'
import { URL } from 'url'

const PORT = 3001
const MINIMAX_ENDPOINT = 'https://api.minimax.io/v1/image_generation'
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

  // Generate image via MiniMax
  if (req.method === 'POST' && url.pathname === '/api/generate') {
    const body = await readBody(req)
    const apiKey = process.env.MINIMAX_API_KEY
    if (!apiKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'MINIMAX_API_KEY not set' }))
      return
    }
    try {
      const result = await httpsPost(
        MINIMAX_ENDPOINT,
        { Authorization: `Bearer ${apiKey}` },
        { model: 'image-01', prompt: body.prompt, n: 1, aspect_ratio: body.aspect_ratio || '1:1' }
      )
      res.writeHead(result.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(result.body))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: err.message }))
    }
    return
  }

  // Upload image URL to Cloudinary
  if (req.method === 'POST' && url.pathname === '/api/cloudinary/upload') {
    const body = await readBody(req)
    const cloud = process.env.CLOUDINARY_CLOUD_NAME
    const key = process.env.CLOUDINARY_API_KEY
    const secret = process.env.CLOUDINARY_API_SECRET
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
  console.log('Required env vars: MINIMAX_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
})
