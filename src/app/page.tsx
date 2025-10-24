'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageCompression } from '@/components/ImageCompression'
import { FileCompression } from '@/components/FileCompression'
import { PDFEditor } from '@/components/PDFEditor'
import { BackgroundRemoval } from '@/components/BackgroundRemoval'
import { Header } from '@/components/Header'

export default function Home() {
  const [activeTab, setActiveTab] = useState('image')

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              CompressifyPro
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional file compression, image optimization, PDF editing, and background removal tools
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="image">Image Compression</TabsTrigger>
              <TabsTrigger value="file">File Compression</TabsTrigger>
              <TabsTrigger value="pdf">PDF Editor</TabsTrigger>
              <TabsTrigger value="background">Background Removal</TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-6">
              <ImageCompression />
            </TabsContent>

            <TabsContent value="file" className="mt-6">
              <FileCompression />
            </TabsContent>

            <TabsContent value="pdf" className="mt-6">
              <PDFEditor />
            </TabsContent>

            <TabsContent value="background" className="mt-6">
              <BackgroundRemoval />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}