import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

/**
 * Extract text from a CV file buffer.
 * @param {Buffer} buffer - File buffer
 * @param {string} mimetype - MIME type of the file
 * @returns {{ text: string, wordCount: number, extractionMethod: string }}
 */
export async function extractCvText(buffer, mimetype) {
  let text = "";
  let extractionMethod = "";

  if (mimetype === "application/pdf") {
    const result = await pdfParse(buffer);
    text = result.text || "";
    extractionMethod = "pdf-parse";

    // Fallback to OCR if PDF text is too short (scanned PDF)
    if (text.replace(/\s/g, "").length < 100) {
      text = await ocrBuffer(buffer);
      extractionMethod = "tesseract-fallback";
    }
  } else if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || "";
    extractionMethod = "mammoth";
  } else if (["image/png", "image/jpeg", "image/jpg"].includes(mimetype)) {
    text = await ocrBuffer(buffer);
    extractionMethod = "tesseract";
  }

  text = text.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return { text, wordCount, extractionMethod };
}

async function ocrBuffer(buffer) {
  const {
    data: { text },
  } = await Tesseract.recognize(buffer, "vie+eng");
  return text || "";
}
