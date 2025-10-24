# CompressifyPro

A comprehensive web application built with Next.js that provides advanced file and image compression, PDF editing, and background removal capabilities.

## Features

### 🖼️ Image Compression
- Support for all major image formats (JPG, PNG, GIF, SVG, BMP, WebP)
- Adjustable quality settings (10-100%)
- Resize images with custom dimensions
- Batch processing for multiple images
- Real-time compression ratio display

### 📁 File Compression
- Compress various file types (PDFs, Word docs, Excel sheets, etc.)
- Adjustable compression levels (1-10)
- Batch processing capabilities
- ZIP archive creation
- File size reduction statistics

### 📄 PDF Editor
- **Merge PDFs**: Combine multiple PDF files into one
- **Split PDFs**: Extract individual pages from PDFs
- **Annotate PDFs**: Add text annotations to PDF documents
- **Page Management**: Add/remove pages from PDFs
- Real-time preview and processing

### ✂️ Background Removal
- AI-powered background removal for images
- Automatic and manual processing modes
- Support for all image formats
- Transparent PNG output
- Batch processing capabilities

## Technology Stack

- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **File Processing**: 
  - Sharp (image processing)
  - PDF-lib (PDF manipulation)
  - React Dropzone (file uploads)
- **Compression**: Custom algorithms + browser APIs

## Getting Started

### Prerequisites
- Node.js 20.9.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd compressifypro
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Image Compression
1. Navigate to the "Image Compression" tab
2. Upload your images using drag & drop or click to select
3. Adjust quality and dimension settings
4. Click "Compress" to process your images
5. Download individual files or all at once

### File Compression
1. Go to the "File Compression" tab
2. Upload files of various types
3. Set compression level (1-10)
4. Process files and download results
5. Create ZIP archives for multiple files

### PDF Editor
1. Switch to the "PDF Editor" tab
2. Upload PDF files
3. Select files for merging or individual operations
4. Use split, merge, or annotate functions
5. Download processed PDFs

### Background Removal
1. Access the "Background Removal" tab
2. Upload images for processing
3. Choose automatic or manual mode
4. Process images to remove backgrounds
5. Download transparent PNG files

## File Format Support

### Images
- JPEG/JPG
- PNG
- GIF
- SVG
- BMP
- WebP

### Documents
- PDF
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Text files
- ZIP archives

## Performance Features

- **Client-side Processing**: All operations run in the browser for privacy
- **Batch Processing**: Handle multiple files simultaneously
- **Progress Indicators**: Real-time feedback during processing
- **Memory Efficient**: Optimized for large file handling
- **Responsive Design**: Works on desktop and mobile devices

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or feature requests, please open an issue on the GitHub repository.

---

Built with ❤️ using Next.js and modern web technologies.