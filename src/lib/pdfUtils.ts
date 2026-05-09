import * as pdfjs from 'pdfjs-dist';

// Use a reliable CDN for the worker matching the library's version
const PDFJS_VERSION = pdfjs.version || '5.7.284';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file: File): Promise<string> {
  console.log('Extracting text from PDF...', file.name);
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Add a promise that rejects after 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF extraction timed out after 15 seconds.')), 15000);
    });

    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await (Promise.race([loadingTask.promise, timeoutPromise]) as Promise<pdfjs.PDFDocumentProxy>);
    let fullText = '';

    console.log(`PDF loaded. Pages: ${pdf.numPages}`);

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF. It might be scanned or protected.');
    }

    return fullText;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw error;
  }
}
