'use client'

import { useState, useCallback, useRef } from 'react'
import { FileUpload } from './FileUpload'
import { Download, FileText, Plus, Minus, Merge, Scissors, Edit3, Save } from 'lucide-react'
import { formatFileSize, isPDFFile } from '@/lib/utils'
import { PDFDocument } from 'pdf-lib'

interface PDFFile {
  file: File
  id: string
  pages: number
}

export function PDFEditor() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [operation, setOperation] = useState<'merge' | 'split' | 'annotate' | null>(null)
  const [resultPdf, setResultPdf] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFilesSelected = useCallback(async (files: File[]) => {
    const pdfFiles = files.filter(file => isPDFFile(file.name))
    const processedFiles: PDFFile[] = []
    
    for (const file of pdfFiles) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        processedFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          pages: pdfDoc.getPageCount()
        })
      } catch (error) {
        console.error('Error processing PDF:', error)
      }
    }
    
    setPdfFiles(processedFiles)
  }, [])

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const mergePDFs = async () => {
    if (selectedFiles.length < 2) return
    
    setIsProcessing(true)
    
    try {
      const mergedPdf = await PDFDocument.create()
      const selectedPdfFiles = pdfFiles.filter(pdf => selectedFiles.includes(pdf.id))
      
      for (const pdfFile of selectedPdfFiles) {
        const arrayBuffer = await pdfFile.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach(page => mergedPdf.addPage(page))
      }
      
      const pdfBytes = await mergedPdf.save()
      const resultFile = new File([pdfBytes], 'merged.pdf', { type: 'application/pdf' })
      setResultPdf(resultFile)
      setOperation('merge')
    } catch (error) {
      console.error('Merge failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const splitPDF = async (fileId: string) => {
    setIsProcessing(true)
    
    try {
      const pdfFile = pdfFiles.find(f => f.id === fileId)
      if (!pdfFile) return
      
      const arrayBuffer = await pdfFile.file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pageCount = pdf.getPageCount()
      
      // For demo purposes, we'll create a single page PDF
      const newPdf = await PDFDocument.create()
      const [firstPage] = await newPdf.copyPages(pdf, [0])
      newPdf.addPage(firstPage)
      
      const pdfBytes = await newPdf.save()
      const resultFile = new File([pdfBytes], `${pdfFile.file.name}_page1.pdf`, { type: 'application/pdf' })
      setResultPdf(resultFile)
      setOperation('split')
    } catch (error) {
      console.error('Split failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const addAnnotation = async (fileId: string) => {
    setIsProcessing(true)
    
    try {
      const pdfFile = pdfFiles.find(f => f.id === fileId)
      if (!pdfFile) return
      
      const arrayBuffer = await pdfFile.file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = pdf.getPages()
      const firstPage = pages[0]
      
      // Add a simple text annotation
      firstPage.drawText('Annotated with CompressifyPro', {
        x: 50,
        y: 50,
        size: 12,
        color: { r: 1, g: 0, b: 0 }
      })
      
      const pdfBytes = await pdf.save()
      const resultFile = new File([pdfBytes], `annotated_${pdfFile.file.name}`, { type: 'application/pdf' })
      setResultPdf(resultFile)
      setOperation('annotate')
    } catch (error) {
      console.error('Annotation failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadResult = () => {
    if (!resultPdf) return
    
    const url = URL.createObjectURL(resultPdf)
    const a = document.createElement('a')
    a.href = url
    a.download = resultPdf.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">PDF Editor</h2>
        </div>
        
        <FileUpload
          onFilesSelected={handleFilesSelected}
          acceptedFileTypes={['application/pdf']}
          maxFiles={10}
        />
      </div>

      {pdfFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Files</h3>
          
          <div className="space-y-3">
            {pdfFiles.map((pdfFile) => (
              <div key={pdfFile.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(pdfFile.id)}
                      onChange={() => handleFileSelect(pdfFile.id)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">{pdfFile.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {pdfFile.pages} pages • {formatFileSize(pdfFile.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => splitPDF(pdfFile.id)}
                      disabled={isProcessing}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                    >
                      <Scissors className="h-4 w-4" />
                      <span>Split</span>
                    </button>
                    <button
                      onClick={() => addAnnotation(pdfFile.id)}
                      disabled={isProcessing}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Annotate</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedFiles.length >= 2 && (
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={mergePDFs}
                disabled={isProcessing}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Merge className="h-4 w-4" />
                <span>
                  {isProcessing ? 'Merging...' : `Merge ${selectedFiles.length} PDFs`}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {resultPdf && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {operation === 'merge' && 'Merged PDF'}
              {operation === 'split' && 'Split PDF'}
              {operation === 'annotate' && 'Annotated PDF'}
            </h3>
            <button
              onClick={downloadResult}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FileText className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-gray-900">{resultPdf.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(resultPdf.size)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
