import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { R2Bucket } from '@miniflare/r2'
import { randomUUID } from 'crypto'

// Load environment variables in development
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  require('dotenv').config()
}

// Define the environment interface
interface Env {
  CSV_BUCKET: R2Bucket;
  // Add this for Workers Sites
  // __STATIC_CONTENT: KVNamespace;
  FRONT_HOST: string;
  API_HOST: string;
  DOWNLOAD_HOST: string;  // r2 host
  FILE_FOLDER: string;    // r2 folder for temp files
  MAX_FILE_SIZE: number;  // max file size in bytes
}

// Create a Hono app
const app = new Hono<{ Bindings: Env }>()

// Add CORS middleware
app.use('*', cors({
  origin: [
    'https://tempcsv.com',
    'http://localhost:8000',
    'http://localhost:3001',  // Next.js frontend
    'http://localhost:3000'   // Allow same-origin for testing
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400
}))

// Initialize bucket variable that will be set appropriately
let bucket: any;

// For local development with Node.js, use the miniflare R2 implementation
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  const { R2Bucket } = require('@miniflare/r2')
  const { MemoryStorage } = require('@miniflare/storage-memory')
  const storage = new MemoryStorage()
  bucket = new R2Bucket(storage)
}

// Middleware to set the bucket in production
app.use('*', async (c, next) => {
  if (typeof process === 'undefined' || process.env.NODE_ENV !== 'development') {
    bucket = c.env.CSV_BUCKET
  }
  await next()
})

// Helper function to get environment variables
function getEnv(c: any, key: keyof Env): any {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return process.env[key]
  }
  return c.env[key]
}

// Upload the .csv file to Cloudflare R2, and return the file url with a random generated name.
app.post('/api/upload', async (c) => {
  try {
    console.log('Upload request received')
    
    // Use Hono's built-in parseBody method
    const body = await c.req.parseBody()
    console.log('Body parsed, keys:', Object.keys(body))
    
    const file = body.file
    
    if (!file || !(file instanceof File)) {
      console.log('No file found in the request or not a File object')
      return c.json({ error: 'No file uploaded' }, 400)
    }
    
    console.log('File received:', file.name, 'Size:', file.size)

    const maxFileSize = Number(getEnv(c, 'MAX_FILE_SIZE'))
    if (file.size > maxFileSize) {
      console.log('File size exceeds the maximum limit: ' + maxFileSize + ' bytes, uploaded file size is ' + file.size + ' bytes')
      return c.json({ error: 'File size exceeds the maximum limit: ' + maxFileSize + ' bytes, your file size is ' + file.size + ' bytes' }, 413)
    }

    // Generate a random file name
    const fileName = `${randomUUID()}.csv`
    console.log('Generated file name:', fileName)

    // Read the file and upload to R2
    const arrayBuffer = await file.arrayBuffer()
    console.log('File read into buffer, size:', arrayBuffer.byteLength)

    const targetFolder = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const fileFolder = getEnv(c, 'FILE_FOLDER')
    const targetFilePath = `${fileFolder}/${targetFolder}/${fileName}`

    await bucket.put(targetFilePath, arrayBuffer, {
      httpMetadata: {
        contentType: 'text/csv',
      }
    })
    console.log('File uploaded to R2 bucket')

    // In a real environment, you would construct a proper URL
    const downloadHost = getEnv(c, 'DOWNLOAD_HOST')
    const fileUrl = `${downloadHost}/files/${targetFolder}/${fileName}`
    
    return c.json({ success: true, fileUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Failed to upload file' }, 500)
  }
})

// Serve files from R2 storage
app.get('/files/:folder/:fileName', async (c) => {
  const folder = c.req.param('folder')
  const fileName = c.req.param('fileName')
  const fileFolder = getEnv(c, 'FILE_FOLDER')
  const targetFilePath = `${fileFolder}/${folder}/${fileName}`
  const file = await bucket.get(targetFilePath)
  
  if (!file) {
    return c.json({ error: 'File not found' }, 404)
  }
  
  // Convert the R2 object body to a buffer
  const arrayBuffer = await file.arrayBuffer()
  
  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': file.httpMetadata?.contentType || 'text/csv',
      'Content-Disposition': `attachment; filename="${folder}/${fileName}"`
    }
  })
})

// Add a root route to redirect to index.html
app.get('/', (c) => {
  return c.redirect('/index.html')
})

// Update an existing file with a new version

app.post('/api/update/:folder/:fileName', async (c) => {
  try {
    console.log('Update request received')
    
    const folder = c.req.param('folder')
    const fileName = c.req.param('fileName')

    // Parse the multipart form data
    const body = await c.req.parseBody()
    console.log('Body parsed, keys:', Object.keys(body))
    
    // Get the file and fileUrl from the request
    const file = body.file
    
    if (!file || !(file instanceof File)) {
      console.log('No file found in the request or not a File object')
      return c.json({ error: 'No file uploaded' }, 400)
    }

    const fileFolder = getEnv(c, 'FILE_FOLDER')
    const targetFilePath = `${fileFolder}/${folder}/${fileName}`
        
    console.log('Updating file:', targetFilePath)
    
    // Check if the file exists before proceeding
    const fileExists = await bucket.head(targetFilePath)
    if (!fileExists) {
      console.log('Original file not found:', targetFilePath)
      return c.json({ error: 'Original file not found. Cannot update a non-existent file.' }, 404)
    }
    
    console.log('File received:', file.name, 'Size:', file.size)

    const maxFileSize = Number(getEnv(c, 'MAX_FILE_SIZE'))
    if (file.size > maxFileSize) {
      console.log('File size exceeds the maximum limit: ' + maxFileSize + ' bytes, uploaded file size is ' + file.size + ' bytes')
      return c.json({ error: 'File size exceeds the maximum limit: ' + maxFileSize + ' bytes, your file size is ' + file.size + ' bytes' }, 413)
    }

    // Read the file and upload to R2 with the same name
    const arrayBuffer = await file.arrayBuffer()
    console.log('File read into buffer, size:', arrayBuffer.byteLength)

    await bucket.put(targetFilePath, arrayBuffer, {
      httpMetadata: {
        contentType: 'text/csv',
      }
    })
    console.log('File updated in R2 bucket')

    const downloadHost = getEnv(c, 'DOWNLOAD_HOST')
    return c.json({
      success: true,
      message: 'File updated successfully',
      fileUrl: `${downloadHost}/files/${folder}/${fileName}`
    })
  } catch (error) {
    console.error('Update error:', error)
    return c.json({ error: 'Failed to update file' }, 500)
  }
})

// Debug endpoint to check bindings (remove before production)
app.get('/debug', async (c) => {
  try {
    // List objects in the bucket
    const objects = await bucket.list()
    const fileFolder = getEnv(c, 'FILE_FOLDER')
    const downloadHost = getEnv(c, 'DOWNLOAD_HOST')
    return c.json({
      environment: process.env.NODE_ENV || 'unknown',
      bucketExists: !!bucket,
      objectCount: objects.objects?.length || 0,
      fileFolder: fileFolder,
      downloadHost: downloadHost
    })
  } catch (error) {
    return c.json({
      error: 'Failed to access bucket',
      message: (error as Error).message
    }, 500)
  }
})

// For local development with Node.js, start the server
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  const { serve } = require('@hono/node-server')
  const { serveStatic } = require('@hono/node-server/serve-static')
  
  // Only use serveStatic in development mode
  app.use('/*', serveStatic({ root: './public/static' }))
  
  serve({
    fetch: app.fetch,
    port: 3000
  })
  console.log('Server is running on http://localhost:3000')
}

// // Export the app for Cloudflare Workers
// export default {
//   fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
//     // Set the bucket in production
//     if (typeof process === 'undefined' || process.env.NODE_ENV !== 'development') {
//       bucket = env.CSV_BUCKET;
//     }
    
//     // Let Hono handle all requests
//     return app.fetch(request, env, ctx);
//   }
// }

export default app;

// Helper function to determine content type
// function getContentType(path: string): string {
//   const ext = path.split('.').pop()?.toLowerCase() || ''
//   const contentTypes: Record<string, string> = {
//     'html': 'text/html',
//     'css': 'text/css',
//     'js': 'text/javascript',
//     'json': 'application/json',
//     'png': 'image/png',
//     'jpg': 'image/jpeg',
//     'jpeg': 'image/jpeg',
//     'svg': 'image/svg+xml',
//     'ico': 'image/x-icon'
//   }
//   return contentTypes[ext] || 'text/plain'
// }
