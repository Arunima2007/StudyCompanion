import base64
from io import BytesIO

import fitz
import httpx

from app.config import get_gemini_api_key, settings

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
MAX_OCR_PAGES = 8
OCR_BATCH_SIZE = 2
OCR_SCALE = 1.5


def _extract_embedded_text(content: bytes) -> str:
    document = fitz.open(stream=BytesIO(content), filetype="pdf")
    chunks: list[str] = []

    try:
        for page in document:
            chunks.append(page.get_text())
    finally:
        document.close()

    return "\n".join(chunk.strip() for chunk in chunks if chunk.strip())


async def _extract_text_with_gemini_ocr(content: bytes) -> str:
    api_key = get_gemini_api_key()

    if not api_key:
        return ""

    document = fitz.open(stream=BytesIO(content), filetype="pdf")
    page_batches: list[list[dict[str, dict[str, str]]]] = []
    current_batch: list[dict[str, dict[str, str]]] = []

    try:
        for index, page in enumerate(document):
            if index >= MAX_OCR_PAGES:
                break
            pixmap = page.get_pixmap(matrix=fitz.Matrix(OCR_SCALE, OCR_SCALE), alpha=False)
            image_bytes = pixmap.tobytes("png")
            current_batch.append(
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": base64.b64encode(image_bytes).decode("utf-8"),
                    }
                }
            )
            if len(current_batch) >= OCR_BATCH_SIZE:
                page_batches.append(current_batch)
                current_batch = []
    finally:
        document.close()

    if current_batch:
        page_batches.append(current_batch)

    if not page_batches:
        return ""

    prompt = (
        "Extract all readable study text from these PDF page images in order. "
        "Return plain text only. Preserve headings, bullets, formulas, and short definitions when visible. "
        "Do not summarize, explain, or add extra words."
    )

    extracted_chunks: list[str] = []

    async with httpx.AsyncClient(timeout=120) as client:
        for batch in page_batches:
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": prompt}, *batch],
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                },
            }

            response = await client.post(
                GEMINI_URL.format(model=settings.gemini_model),
                params={"key": api_key},
                headers={"content-type": "application/json"},
                json=payload,
            )

            if response.status_code >= 400:
                continue

            data = response.json()
            candidates = data.get("candidates", [])

            if not candidates:
                continue

            parts = candidates[0].get("content", {}).get("parts", [])
            extracted = "\n".join(part.get("text", "") for part in parts if part.get("text")).strip()

            if extracted:
                extracted_chunks.append(extracted)

    return "\n\n".join(extracted_chunks).strip()


async def extract_text_from_pdf(content: bytes) -> str:
    embedded_text = _extract_embedded_text(content)

    if embedded_text.strip():
        return embedded_text

    return await _extract_text_with_gemini_ocr(content)
