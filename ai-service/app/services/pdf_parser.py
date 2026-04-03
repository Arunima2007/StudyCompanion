from io import BytesIO

import fitz


def extract_text_from_pdf(content: bytes) -> str:
    document = fitz.open(stream=BytesIO(content), filetype="pdf")
    chunks: list[str] = []

    for page in document:
        chunks.append(page.get_text())

    return "\n".join(chunk.strip() for chunk in chunks if chunk.strip())

