import { jsPDF } from "jspdf";

const FONT_REGULAR = "/fonts/NotoSans-Regular.ttf";
const FONT_BOLD = "/fonts/NotoSans-Bold.ttf";

let fontsReady: Promise<void> | null = null;
const fontCache: { regular?: string; bold?: string } = {};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function ensureFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      const [regularRes, boldRes] = await Promise.all([
        fetch(FONT_REGULAR),
        fetch(FONT_BOLD),
      ]);
      if (!regularRes.ok || !boldRes.ok) {
        throw new Error("Could not load cover letter fonts");
      }
      fontCache.regular = arrayBufferToBase64(await regularRes.arrayBuffer());
      fontCache.bold = arrayBufferToBase64(await boldRes.arrayBuffer());
    })();
  }
  await fontsReady;
}

function safeFilename(base: string): string {
  const cleaned = base
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${cleaned || "cover-letter"}.pdf`;
}

/**
 * Direct PDF download — plain letter layout, Arial-like sans font (Noto Sans).
 * No browser date/URL headers.
 */
export async function saveCoverLetterPdf(options: {
  subject: string;
  letter: string;
  filenameHint?: string;
}): Promise<void> {
  const subject = options.subject.trim();
  const letter = options.letter.trim();
  if (!letter && !subject) {
    throw new Error("Nothing to save");
  }

  await ensureFonts();
  if (!fontCache.regular || !fontCache.bold) {
    throw new Error("Fonts not ready");
  }

  // A4 + ~1" margins — standard application letter
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.addFileToVFS("NotoSans-Regular.ttf", fontCache.regular);
  doc.addFileToVFS("NotoSans-Bold.ttf", fontCache.bold);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 72; // 1 inch
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 16; // ~11pt with comfortable leading
  let y = margin;

  doc.setFont("NotoSans", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20, 17, 15);

  const writeBlock = (text: string, { bold = false } = {}) => {
    doc.setFont("NotoSans", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        doc.setFont("NotoSans", bold ? "bold" : "normal");
        doc.setFontSize(11);
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
  };

  if (subject) {
    writeBlock(subject, { bold: true });
    y += lineHeight; // blank line after subject
  }

  // Preserve paragraph breaks from the draft
  const paragraphs = letter.split(/\n+/);
  paragraphs.forEach((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      return;
    }
    writeBlock(trimmed);
    if (index < paragraphs.length - 1) {
      y += lineHeight * 0.65;
    }
  });

  doc.save(safeFilename(options.filenameHint || subject || "cover-letter"));
}
