import { NextRequest } from 'next/server'
import { PythonShell } from 'python-shell'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const levelStr = (form.get('level') as string) || '7'
    const level = Number(levelStr)

    if (!file) {
      return new Response('No file provided', { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    // Prepare input for Python script
    const inputData = {
      data: base64Data,
      level: level
    }

    // Run Python compression script
    const result = await new Promise<any>((resolve, reject) => {
      const options = {
        mode: 'text' as const,
        pythonPath: path.join(process.cwd(), 'scripts', 'venv', 'bin', 'python3'),
        scriptPath: path.join(process.cwd(), 'scripts'),
        args: []
      }

      const pyshell = new PythonShell('compress_pdf.py', options)
      
      pyshell.send(JSON.stringify(inputData))
      
      pyshell.on('message', (message) => {
        try {
          const result = JSON.parse(message.trim())
          resolve(result)
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${message}`))
        }
      })
      
      pyshell.on('error', (err) => {
        reject(new Error(`Python script error: ${err.message}`))
      })
      
      pyshell.end((err) => {
        if (err) {
          reject(new Error(`Python shell error: ${err.message}`))
        }
      })
    })

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), { status: 500 })
    }

    // Convert base64 result back to buffer
    const compressedBuffer = Buffer.from(result.data, 'base64')

    return new Response(compressedBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Compression failed' }), { status: 500 })
  }
}


