from __future__ import annotations

import re
from pathlib import Path

import fitz


def extract_text_from_pdf(file_path: str | Path) -> str:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")

    document = fitz.open(path)
    try:
        pages: list[str] = []
        for page in document:
            # Prefer reading blocks top-to-bottom so multi-column CVs stay more readable.
            blocks = page.get_text("blocks")
            block_texts = [
                block[4].strip()
                for block in sorted(blocks, key=lambda item: (round(item[1], 1), round(item[0], 1)))
                if len(block) >= 5 and str(block[4]).strip()
            ]
            page_text = "\n".join(block_texts) if block_texts else page.get_text("text")
            if page_text.strip():
                pages.append(page_text.strip())
    finally:
        document.close()

    text = "\n\n".join(pages)
    return _cleanup_extracted_text(text)


def _cleanup_extracted_text(text: str) -> str:
    # Soft hyphens / zero-width characters that often appear in designed PDFs.
    cleaned = text.replace("\u00ad", "").replace("\u200b", "")
    # Join URL pieces split across newlines (common LinkedIn/GitHub extractions).
    cleaned = re.sub(r"(https?://[^\s]+)\s*\n\s*([^\s]+)", r"\1\2", cleaned)
    cleaned = re.sub(r"(www\.[^\s]+)\s*\n\s*([^\s]+)", r"\1\2", cleaned)
    cleaned = re.sub(r"(linkedin\.com/[^\s]*)\s*\n\s*([^\s]+)", r"\1\2", cleaned, flags=re.I)
    cleaned = re.sub(r"(github\.com/[^\s]*)\s*\n\s*([^\s]+)", r"\1\2", cleaned, flags=re.I)
    # Collapse excessive blank lines / spaces inside lines.
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def chunk_text(text: str, chunk_size: int = 700, overlap: int = 120) -> list[str]:
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    length = len(text)

    while start < length:
        end = min(start + chunk_size, length)
        # Prefer cutting near a paragraph/sentence boundary when possible.
        if end < length:
            window = text[start:end]
            for separator in ("\n\n", ". ", "\n"):
                cut = window.rfind(separator)
                if cut > chunk_size // 3:
                    end = start + cut + len(separator)
                    break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= length:
            break
        start = max(end - overlap, start + 1)

    return chunks
