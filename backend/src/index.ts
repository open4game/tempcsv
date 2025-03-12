import { Hono } from 'hono'
import { R2Bucket } from '@miniflare/r2'
import { MemoryStorage } from '@miniflare/storage-memory'
import { randomUUID } from 'crypto'

// Define the environment interface
interface Env {
  CSV_BUCKET: R2Bucket;
  // Add this for Workers Sites
  // __STATIC_CONTENT: KVNamespace;
}

// Create a Hono app
const app = new Hono<{ Bindings: Env }>()

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

// Upload the .csv file to Cloudflare R2, and return the file url with a random generated name.
app.post('/upload', async (c) => {
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
    
    // Generate a random file name
    const fileName = `${randomUUID()}.csv`
    console.log('Generated file name:', fileName)
    
    // Read the file and upload to R2
    const arrayBuffer = await file.arrayBuffer()
    console.log('File read into buffer, size:', arrayBuffer.byteLength)
    
    await bucket.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: 'text/csv',
      }
    })
    console.log('File uploaded to R2 bucket')
    
    // In a real environment, you would construct a proper URL
    const fileUrl = `/files/${fileName}`
    
    return c.json({ success: true, fileUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ error: 'Failed to upload file' }, 500)
  }
})

// Save the .csv file to Cloudflare R2 with provided file url.
app.post('/save', async (c) => {
  try {
    console.log('Save request received')
    const { fileUrl } = await c.req.json()
    
    if (!fileUrl) {
      console.log('No file URL provided')
      return c.json({ error: 'No file URL provided' }, 400)
    }
    
    // Extract the file name from the URL
    const fileName = fileUrl.split('/').pop()
    
    if (!fileName) {
      console.log('Invalid file URL format')
      return c.json({ error: 'Invalid file URL format' }, 400)
    }
    
    console.log('File name:', fileName)
    
    // Check if the file exists before proceeding
    const fileExists = await bucket.head(fileName)
    if (!fileExists) {
      console.log('File not found:', fileName)
      return c.json({ error: 'File not found. The URL may be invalid or the file has been deleted.' }, 404)
    }
    
    // Get the file
    const file = await bucket.get(fileName)
    
    if (!file) {
      console.log('Failed to retrieve file:', fileName)
      return c.json({ error: 'Failed to retrieve file' }, 500)
    }
    
    const bodyArrayBuffer = await file.arrayBuffer()
    console.log('File retrieved, size:', bodyArrayBuffer.byteLength)
    
    // We're not renaming, just confirming the file exists
    return c.json({ 
      success: true, 
      message: 'File exists and is accessible',
      fileUrl: `/files/${fileName}`
    })
  } catch (error) {
    console.error('Save error:', error)
    return c.json({ error: 'Failed to verify file' }, 500)
  }
})

// Serve files from R2 storage
app.get('/files/:fileName', async (c) => {
  const fileName = c.req.param('fileName')
  const file = await bucket.get(fileName)
  
  if (!file) {
    return c.json({ error: 'File not found' }, 404)
  }
  
  // Convert the R2 object body to a buffer
  const arrayBuffer = await file.arrayBuffer()
  
  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': file.httpMetadata?.contentType || 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}"`
    }
  })
})

// Add a root route to redirect to index.html
app.get('/', (c) => {
  return c.redirect('/index.html')
})

// Update an existing file with a new version
app.post('/update', async (c) => {
  try {
    console.log('Update request received')
    
    // Parse the multipart form data
    const body = await c.req.parseBody()
    console.log('Body parsed, keys:', Object.keys(body))
    
    // Get the file and fileUrl from the request
    const file = body.file
    const fileUrl = body.fileUrl as string
    
    if (!fileUrl) {
      console.log('No file URL provided')
      return c.json({ error: 'No file URL provided' }, 400)
    }
    
    if (!file || !(file instanceof File)) {
      console.log('No file found in the request or not a File object')
      return c.json({ error: 'No file uploaded' }, 400)
    }
    
    // Extract the file name from the URL
    const fileName = fileUrl.split('/').pop()
    
    if (!fileName) {
      console.log('Invalid file URL format')
      return c.json({ error: 'Invalid file URL format' }, 400)
    }
    
    console.log('Updating file:', fileName)
    
    // Check if the file exists before proceeding
    const fileExists = await bucket.head(fileName)
    if (!fileExists) {
      console.log('Original file not found:', fileName)
      return c.json({ error: 'Original file not found. Cannot update a non-existent file.' }, 404)
    }
    
    console.log('File received:', file.name, 'Size:', file.size)
    
    // Read the file and upload to R2 with the same name
    const arrayBuffer = await file.arrayBuffer()
    console.log('File read into buffer, size:', arrayBuffer.byteLength)
    
    await bucket.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: 'text/csv',
      }
    })
    console.log('File updated in R2 bucket')
    
    return c.json({ 
      success: true, 
      message: 'File updated successfully',
      fileUrl: `/files/${fileName}`
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
    return c.json({
      environment: process.env.NODE_ENV || 'unknown',
      bucketExists: !!bucket,
      objectCount: objects.objects?.length || 0
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
