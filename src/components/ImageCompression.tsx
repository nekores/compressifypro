'use client'

import { useState, useCallback } from 'react'
import { FileUpload } from './FileUpload'
import { Download, Settings, Image as ImageIcon, CheckCircle } from 'lucide-react'
import { formatFileSize, isImageFile } from '@/lib/utils'

interface CompressedImage {
  original: File
  compressed: File
  compressionRatio: number
  originalSize: number
  compressedSize: number
}

export function ImageCompression() {
  const [images, setImages] = useState<File[]>([])
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState(1920)
  const [maxHeight, setMaxHeight] = useState(1080)

  const handleFilesSelected = useCallback((files: File[]) => {
    const imageFiles = files.filter(file => isImageFile(file.name))
    setImages(imageFiles)
  }, [])

  const compressImage = async (file: File): Promise<CompressedImage> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        const aspectRatio = width / height
        
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            
            const compressionRatio = ((file.size - compressedFile.size) / file.size) * 100
            
            resolve({
              original: file,
              compressed: compressedFile,
              compressionRatio,
              originalSize: file.size,
              compressedSize: compressedFile.size
            })
          }
        }, file.type, quality / 100)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleCompress = async () => {
    if (images.length === 0) return
    
    setIsCompressing(true)
    setCompressedImages([])
    
    try {
      const results = await Promise.all(
        images.map(image => compressImage(image))
      )
      
      setCompressedImages(results)
    } catch (error) {
      console.error('Compression failed:', error)
    } finally {
      setIsCompressing(false)
    }
  }

  const downloadCompressed = (compressedImage: CompressedImage) => {
    const url = URL.createObjectURL(compressedImage.compressed)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed_${compressedImage.original.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    compressedImages.forEach(downloadCompressed)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ImageIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Image Compression</h2>
        </div>
        
        <FileUpload
          onFilesSelected={handleFilesSelected}
          acceptedFileTypes={['image/*']}
          maxFiles={10}
        />
      </div>

      {images.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Compression Settings</h3>
            <Settings className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality ({quality}%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Width (px)
              </label>
              <input
                type="number"
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Height (px)
              </label>
              <input
                type="number"
                value={maxHeight}
                onChange={(e) => setMaxHeight(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <button
            onClick={handleCompress}
            disabled={isCompressing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCompressing ? 'Compressing...' : `Compress ${images.length} Image(s)`}
          </button>
        </div>
      )}

      {compressedImages.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Compression Results</h3>
            <button
              onClick={downloadAll}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download All</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {compressedImages.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-gray-900">{result.original.name}</span>
                  </div>
                  <button
                    onClick={() => downloadCompressed(result)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Original Size:</span>
                    <p className="font-medium">{formatFileSize(result.originalSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Compressed Size:</span>
                    <p className="font-medium">{formatFileSize(result.compressedSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Savings:</span>
                    <p className="font-medium text-green-600">
                      {result.compressionRatio.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Size Reduction:</span>
                    <p className="font-medium">
                      {formatFileSize(result.originalSize - result.compressedSize)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
