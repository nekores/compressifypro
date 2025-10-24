import { FileText, Image, Archive, Scissors } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CompressifyPro</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Image className="h-4 w-4" />
              <span>Image Compression</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Archive className="h-4 w-4" />
              <span>File Compression</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>PDF Editor</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Scissors className="h-4 w-4" />
              <span>Background Removal</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
