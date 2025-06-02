const { PDFDocument } = require('pdf-lib');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const poppler = require('pdf-poppler');
const { log } = require('console');

async function extractTextFromPDF(pdfPath) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const text = (await pdfDoc.getPages())[0].getText();
    return text || null;
  } catch (error) {
    
    return null;
  }
}

async function convertPDFToImage(pdfPath) {
  const outputDir = path.dirname(pdfPath);
 
  try {
    await poppler.convert(pdfPath, {
      format: 'png',
      out_dir: outputDir,
      out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
      page: 1, // Convert only the first page
    });
    const imagePath = path.join(outputDir, `${path.basename(pdfPath, '.pdf')}-1.png`);
    log(`Converted image path: ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error('PDF-to-image conversion failed:', error);
    return null;
  }
}

async function extractTextWithOCR(imagePath) {
  const worker = await createWorker('eng');
  try {
    const { data: { text } } = await worker.recognize(imagePath);
    // log(`OCR extracted text: ${text}`);
    return text;
  } finally {
    await worker.terminate();
    fs.unlinkSync(imagePath); 
  }
}

function parseReceiptText(text) {
 
  const purchasedAt = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)?.[0];
    const totalAmount = text.match(/Total\s*[:\-]?\s*\$?(\d+[.,]?\d*)/i)?.[1];
    const merchantName = text.split('\n').find(line => line.trim().length > 0);

  return {
    purchased_at: purchasedAt,
    merchant_name: merchantName,
    total_amount: totalAmount ? `$${totalAmount}` : null,
  };
}

async function processReceipt(pdfPath) {
 
    const imagePath = await convertPDFToImage(pdfPath);
    if (!imagePath) throw new Error('PDF-to-image conversion failed');
    text = await extractTextWithOCR(imagePath);
  

  return parseReceiptText(text);
}


module.exports = { processReceipt };
