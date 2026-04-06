import base64
from io import BytesIO

import fitz
import httpx

from app.config import get_gemini_api_key, settings

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


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
    image_parts = []

    try:
        for index, page in enumerate(document):
            if index >= 12:
                break
            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image_bytes = pixmap.tobytes("png")
            image_parts.append(
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": base64.b64encode(image_bytes).decode("utf-8"),
                    }
                }
            )
    finally:
        document.close()

    if not image_parts:
        return ""

    prompt = (
        "Extract all readable study text from these PDF page images in order. "
        "Return plain text only. Preserve headings, bullets, formulas, and short definitions when visible. "
        "Do not summarize, explain, or add extra words."
    )

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}, *image_parts],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
        },
    }

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            GEMINI_URL.format(model=settings.gemini_model),
            params={"key": api_key},
            headers={"content-type": "application/json"},
            json=payload,
        )

    if response.status_code >= 400:
        return ""

    data = response.json()
    candidates = data.get("candidates", [])

    if not candidates:
        return ""

    parts = candidates[0].get("content", {}).get("parts", [])
    extracted = "\n".join(part.get("text", "") for part in parts if part.get("text"))
    return extracted.strip()


async def extract_text_from_pdf(content: bytes) -> str:
    embedded_text = _extract_embedded_text(content)

    if embedded_text.strip():
        return embedded_text

    return await _extract_text_with_gemini_ocr(content)
