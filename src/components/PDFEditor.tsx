'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { FileUpload } from './FileUpload'
import { Download, FileText, Plus, Minus, Merge, Scissors, Edit3, Save, Eye, ChevronLeft, ChevronRight, Type, Bold, Italic, Underline, Palette } from 'lucide-react'
import { formatFileSize, isPDFFile } from '@/lib/utils'
import { PDFDocument, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker with multiple fallbacks
if (typeof window !== 'undefined') {
  // Try multiple CDN sources for better reliability
  const workerSources = [
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
  ]
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSources[0]
}

interface PDFFile {
  file: File
  id: string
  pages: number
}

interface TextBlock {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  color: string
  fontFamily: string
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  pageNumber: number
}

interface EditingState {
  isEditing: boolean
  selectedTextBlock: TextBlock | null
  showFormatting: boolean
}

export function PDFEditor() {
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [operation, setOperation] = useState<'merge' | 'split' | 'annotate' | 'edit' | null>(null)
  const [resultPdf, setResultPdf] = useState<File | null>(null)
  const [currentPdf, setCurrentPdf] = useState<PDFFile | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([])
  const [editingState, setEditingState] = useState<EditingState>({
    isEditing: false,
    selectedTextBlock: null,
    showFormatting: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  // Load PDF for editing
  const loadPDFForEditing = async (pdfFile: PDFFile) => {
    try {
      setIsProcessing(true)
      const arrayBuffer = await pdfFile.file.arrayBuffer()
      
      // Try to load PDF with better error handling
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: pdfjsLib.VerbosityLevel.ERRORS,
        useWorkerFetch: false,
        isEvalSupported: false
      })
      
      const pdfDoc = await loadingTask.promise
      
      setCurrentPdf(pdfFile)
      setTotalPages(pdfDoc.numPages)
      setCurrentPage(1)
      setPdfUrl(URL.createObjectURL(pdfFile.file))
      setOperation('edit')
      
      // Extract text content for editing
      await extractTextContent(pdfDoc)
    } catch (error) {
      console.error('Error loading PDF:', error)
      
      // Check if it's a worker-related error
      if (error.message && error.message.includes('worker')) {
        alert('PDF.js worker failed to load. Please refresh the page and try again.')
      } else {
        alert('Failed to load PDF. Please try a different file or check if the file is corrupted.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Extract text content from PDF
  const extractTextContent = async (pdfDoc: any) => {
    const blocks: TextBlock[] = []
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      textContent.items.forEach((item: any, index: number) => {
        if (item.str && item.str.trim()) {
          blocks.push({
            id: `${pageNum}-${index}`,
            text: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width || 100,
            height: item.height || 12,
            fontSize: item.transform[0] || 12,
            color: '#000000',
            fontFamily: 'Arial',
            isBold: false,
            isItalic: false,
            isUnderline: false,
            pageNumber: pageNum
          })
        }
      })
    }
    
    setTextBlocks(blocks)
  }

  // Render PDF page
  const renderPDFPage = async (pageNumber: number) => {
    if (!currentPdf || !canvasRef.current) return
    
    try {
      const arrayBuffer = await currentPdf.file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: pdfjsLib.VerbosityLevel.ERRORS,
        useWorkerFetch: false,
        isEvalSupported: false
      })
      const pdfDoc = await loadingTask.promise
      const page = await pdfDoc.getPage(pageNumber)
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) {
        console.error('Could not get canvas context')
        return
      }
      
      const viewport = page.getViewport({ scale: 1.5 })
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
    } catch (error) {
      console.error('Error rendering PDF page:', error)
      // Show user-friendly error message
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (context) {
          context.fillStyle = '#f3f4f6'
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.fillStyle = '#6b7280'
          context.font = '16px Arial'
          context.textAlign = 'center'
          context.fillText('Error loading PDF page', canvas.width / 2, canvas.height / 2)
        }
      }
    }
  }

  // Update text block
  const updateTextBlock = (blockId: string, updates: Partial<TextBlock>) => {
    setTextBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ))
  }

  // Save edited PDF
  const saveEditedPDF = async () => {
    if (!currentPdf) return
    
    try {
      setIsProcessing(true)
      const arrayBuffer = await currentPdf.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      const pages = pdfDoc.getPages()
      
      // Clear existing content and add new text
      textBlocks.forEach(block => {
        if (block.pageNumber <= pages.length) {
          const page = pages[block.pageNumber - 1]
          
          // Remove existing text (simplified - in real implementation, you'd need more sophisticated text removal)
          // For now, we'll just add the new text
          page.drawText(block.text, {
            x: block.x,
            y: block.y,
            size: block.fontSize,
            color: rgb(
              parseInt(block.color.slice(1, 3), 16) / 255,
              parseInt(block.color.slice(3, 5), 16) / 255,
              parseInt(block.color.slice(5, 7), 16) / 255
            )
          })
        }
      })
      
      const pdfBytes = await pdfDoc.save()
      const resultFile = new File([pdfBytes], `edited_${currentPdf.file.name}`, { type: 'application/pdf' })
      setResultPdf(resultFile)
    } catch (error) {
      console.error('Error saving PDF:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Effect to render page when current page changes
  useEffect(() => {
    if (currentPdf && operation === 'edit') {
      renderPDFPage(currentPage)
    }
  }, [currentPage, currentPdf, operation])

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

      {pdfFiles.length > 0 && operation !== 'edit' && (
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
                      onClick={() => loadPDFForEditing(pdfFile)}
                      disabled={isProcessing}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
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

      {/* PDF Editor Interface */}
      {operation === 'edit' && currentPdf && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Editing: {currentPdf.file.name}</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingState(prev => ({ ...prev, isEditing: !prev.isEditing }))}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  editingState.isEditing 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Edit3 className="h-4 w-4" />
                <span>{editingState.isEditing ? 'Exit Edit' : 'Edit Mode'}</span>
              </button>
              
              <button
                onClick={saveEditedPDF}
                disabled={isProcessing}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isProcessing ? 'Saving...' : 'Save PDF'}</span>
              </button>
            </div>
          </div>

          {/* PDF Preview and Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Preview */}
            <div className="lg:col-span-2">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h4 className="font-medium text-gray-900">PDF Preview</h4>
                </div>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto"
                    style={{ maxHeight: '600px' }}
                  />
                  
                  {/* Text editing overlay */}
                  {editingState.isEditing && (
                    <div className="absolute inset-0">
                      {textBlocks
                        .filter(block => block.pageNumber === currentPage)
                        .map((block) => (
                          <div
                            key={block.id}
                            className="absolute border-2 border-blue-400 bg-blue-50 bg-opacity-50 cursor-pointer hover:bg-opacity-70"
                            style={{
                              left: `${block.x}px`,
                              top: `${block.y}px`,
                              width: `${block.width}px`,
                              height: `${block.height}px`,
                            }}
                            onClick={() => setEditingState(prev => ({ 
                              ...prev, 
                              selectedTextBlock: block,
                              showFormatting: true 
                            }))}
                          >
                            <div className="p-1 text-xs text-gray-700 truncate">
                              {block.text}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Text Editor Panel */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Text Blocks</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {textBlocks
                    .filter(block => block.pageNumber === currentPage)
                    .map((block) => (
                      <div
                        key={block.id}
                        className={`p-2 rounded border cursor-pointer transition-colors ${
                          editingState.selectedTextBlock?.id === block.id
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setEditingState(prev => ({ 
                          ...prev, 
                          selectedTextBlock: block,
                          showFormatting: true 
                        }))}
                      >
                        <div className="text-sm text-gray-700 truncate">
                          {block.text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Size: {block.fontSize}px
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Text Formatting Panel */}
              {editingState.selectedTextBlock && editingState.showFormatting && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Text Formatting</h4>
                  
                  <div className="space-y-4">
                    {/* Text Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Content
                      </label>
                      <textarea
                        value={editingState.selectedTextBlock.text}
                        onChange={(e) => updateTextBlock(editingState.selectedTextBlock!.id, { text: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        rows={3}
                      />
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Font Size
                      </label>
                      <input
                        type="number"
                        value={editingState.selectedTextBlock.fontSize}
                        onChange={(e) => updateTextBlock(editingState.selectedTextBlock!.id, { fontSize: Number(e.target.value) })}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        min="8"
                        max="72"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={editingState.selectedTextBlock.color}
                          onChange={(e) => updateTextBlock(editingState.selectedTextBlock!.id, { color: e.target.value })}
                          className="w-8 h-8 border border-gray-300 rounded"
                        />
                        <input
                          type="text"
                          value={editingState.selectedTextBlock.color}
                          onChange={(e) => updateTextBlock(editingState.selectedTextBlock!.id, { color: e.target.value })}
                          className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    {/* Text Style */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Style
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateTextBlock(editingState.selectedTextBlock!.id, { isBold: !editingState.selectedTextBlock.isBold })}
                          className={`p-2 rounded border ${
                            editingState.selectedTextBlock.isBold
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <Bold className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateTextBlock(editingState.selectedTextBlock!.id, { isItalic: !editingState.selectedTextBlock.isItalic })}
                          className={`p-2 rounded border ${
                            editingState.selectedTextBlock.isItalic
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <Italic className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateTextBlock(editingState.selectedTextBlock!.id, { isUnderline: !editingState.selectedTextBlock.isUnderline })}
                          className={`p-2 rounded border ${
                            editingState.selectedTextBlock.isUnderline
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700'
                          }`}
                        >
                          <Underline className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {resultPdf && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {operation === 'merge' && 'Merged PDF'}
              {operation === 'split' && 'Split PDF'}
              {operation === 'annotate' && 'Annotated PDF'}
              {operation === 'edit' && 'Edited PDF'}
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
