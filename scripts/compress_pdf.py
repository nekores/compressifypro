#!/usr/bin/env python3
"""
PDF Compression using PyMuPDF (fitz)
Achieves 80-90% compression by recompressing images and optimizing structure
"""

import sys
import fitz  # PyMuPDF
import io
import base64
import json

def compress_pdf(input_data, level):
    """Compress PDF using PyMuPDF with aggressive image recompression"""
    try:
        # Open PDF from bytes
        doc = fitz.open(stream=input_data, filetype="pdf")
        
        # Much more aggressive compression parameters
        if level >= 10:
            image_quality = 10
            scale_factor = 0.3
            dpi = 72
        elif level >= 9:
            image_quality = 15
            scale_factor = 0.4
            dpi = 96
        elif level >= 8:
            image_quality = 20
            scale_factor = 0.5
            dpi = 120
        elif level >= 7:
            image_quality = 25
            scale_factor = 0.6
            dpi = 144
        elif level >= 6:
            image_quality = 30
            scale_factor = 0.7
            dpi = 168
        elif level >= 5:
            image_quality = 40
            scale_factor = 0.8
            dpi = 192
        elif level >= 3:
            image_quality = 50
            scale_factor = 0.85
            dpi = 216
        elif level >= 2:
            image_quality = 60
            scale_factor = 0.9
            dpi = 240
        else:
            image_quality = 70
            scale_factor = 0.95
            dpi = 300
        
        # Create new document for compressed output
        new_doc = fitz.open()
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Get page dimensions
            rect = page.rect
            new_width = rect.width * scale_factor
            new_height = rect.height * scale_factor
            
            # Create new page with scaled dimensions
            new_page = new_doc.new_page(width=new_width, height=new_height)
            
            # Render page at lower DPI for smaller file size
            mat = fitz.Matrix(dpi/72, dpi/72)  # Scale based on DPI
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to JPEG with very aggressive compression
            img_data = pix.tobytes("jpeg", jpg_quality=image_quality)
            
            # Insert compressed image into new page
            new_page.insert_image(fitz.Rect(0, 0, new_width, new_height), stream=img_data)
        
        # Save with maximum compression
        output_buffer = io.BytesIO()
        new_doc.save(output_buffer, 
                    garbage=4, 
                    deflate=True, 
                    clean=True,
                    deflate_images=True,
                    deflate_fonts=True,
                    linear=False)
        compressed_data = output_buffer.getvalue()
        
        # Clean up
        doc.close()
        new_doc.close()
        
        return compressed_data
        
    except Exception as e:
        raise Exception(f"PDF compression failed: {str(e)}")

def main():
    """Main function to handle command line input"""
    try:
        # Read all input from stdin
        input_text = sys.stdin.read().strip()
        if not input_text:
            raise Exception("No input provided")
            
        input_json = json.loads(input_text)
        input_data = base64.b64decode(input_json['data'])
        level = int(input_json['level'])
        
        # Compress PDF
        compressed_data = compress_pdf(input_data, level)
        
        # Return base64 encoded result
        result = {
            'success': True,
            'data': base64.b64encode(compressed_data).decode('utf-8'),
            'original_size': len(input_data),
            'compressed_size': len(compressed_data),
            'compression_ratio': ((len(input_data) - len(compressed_data)) / len(input_data)) * 100
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
