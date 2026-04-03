from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.config import get_gemini_api_key, settings
from app.prompts import FLASHCARD_SYSTEM_PROMPT, REVIEW_SYSTEM_PROMPT


GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
logger = logging.getLogger(__name__)


def _normalize_notes(notes: str) -> str:
    lines = []

    for raw_line in notes.splitlines():
        line = " ".join(raw_line.split()).strip()

        if not line:
            continue

        if re.fullmatch(r"\d+", line):
            continue

        if len(line) < 3:
            continue

        # Drop lines that look like file identifiers or export names.
        if re.fullmatch(r"[A-Za-z0-9_-]{12,}", line):
            continue

        lines.append(line)

    return "\n".join(lines)


def _clean_chapter_title(chapter_title: str) -> str:
    cleaned = (
        chapter_title.replace("_", " ")
        .replace("-", " ")
        .replace("/", " ")
    )
    cleaned = re.sub(r"\d+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if len(cleaned) < 4 or re.fullmatch(r"[A-Za-z0-9 ]{1,8}", cleaned):
        return "the uploaded notes"

    return cleaned


def _clean_sentences(notes: str) -> list[str]:
    raw_parts = re.split(r"(?<=[.!?])\s+|\n+", _normalize_notes(notes))
    cleaned = []

    for part in raw_parts:
        sentence = " ".join(part.split()).strip(" -•\t")
        if len(sentence) >= 35:
            cleaned.append(sentence)

    return cleaned


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z]{3,}", text.lower())


def _extract_json(text: str) -> dict[str, Any]:
    stripped = text.strip()

    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)

    start = stripped.find("{")
    end = stripped.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in Gemini response.")

    return json.loads(stripped[start : end + 1])


def _heuristic_flashcards(notes: str, chapter_title: str, cards_requested: int) -> dict[str, Any]:
    normalized_notes = _normalize_notes(notes)
    safe_title = _clean_chapter_title(chapter_title)
    sentences = _clean_sentences(normalized_notes)

    if not sentences:
        sentences = [normalized_notes.strip() or f"No notes were provided for {safe_title}."]

    question_patterns = [
        ("definition", "What does this statement from {chapter} mean: \"{snippet}\"?"),
        ("explanation", "Explain this point from {chapter}: \"{snippet}\"."),
        ("process", "What process or sequence is being described in {chapter}: \"{snippet}\"?"),
        ("comparison", "How would you compare this idea from {chapter} with a related concept: \"{snippet}\"?"),
        ("application", "How could you apply this point from {chapter}: \"{snippet}\"?")
    ]

    flashcards: list[dict[str, str]] = []
    limit = min(cards_requested, len(sentences))

    for index in range(limit):
        sentence = sentences[index]
        card_type, template = question_patterns[index % len(question_patterns)]
        snippet = sentence[:180]
        flashcards.append(
            {
                "type": card_type,
                "question": template.format(chapter=safe_title, snippet=snippet),
                "referenceAnswer": sentence,
                "hint": "Focus on the exact statement from the notes and explain it clearly.",
                "sourceSnippet": snippet,
            }
        )

    return {"flashcards": flashcards}


def _normalize_flashcards(payload: dict[str, Any], notes: str, chapter_title: str, cards_requested: int) -> dict[str, Any]:
    flashcards = payload.get("flashcards")

    if not isinstance(flashcards, list):
        return _heuristic_flashcards(notes, chapter_title, cards_requested)

    normalized: list[dict[str, str]] = []
    seen_questions: set[str] = set()

    for item in flashcards:
        if not isinstance(item, dict):
            continue

        question = str(item.get("question", "")).strip()
        reference_answer = str(item.get("referenceAnswer", "")).strip()
        source_snippet = str(item.get("sourceSnippet", "")).strip()

        if not question or not reference_answer:
            continue

        if question.lower() in seen_questions:
            continue

        seen_questions.add(question.lower())
        normalized.append(
            {
                "type": str(item.get("type", "short_answer")).strip() or "short_answer",
                "question": question,
                "referenceAnswer": reference_answer,
                "hint": str(item.get("hint", "Answer from the notes in your own words.")).strip()
                or "Answer from the notes in your own words.",
                "sourceSnippet": source_snippet or reference_answer[:180],
            }
        )

    if len(normalized) >= max(2, min(cards_requested, 4)):
        return {
            "flashcards": normalized[:cards_requested],
            "debug": {"source": "gemini", "reason": f"Generated with model {settings.gemini_model}"},
        }

    heuristic = _heuristic_flashcards(notes, chapter_title, cards_requested)["flashcards"]

    for item in heuristic:
        if len(normalized) >= cards_requested:
            break
        lowered = item["question"].lower()
        if lowered in seen_questions:
            continue
        seen_questions.add(lowered)
        normalized.append(item)

    return {
        "flashcards": normalized[:cards_requested],
        "debug": {
            "source": "gemini+fallback",
            "reason": f"Gemini returned too few usable cards; filled with local expansion using {settings.gemini_model}",
        },
    }


def _normalize_review(payload: dict[str, Any], reference_answer: str, user_answer: str) -> dict[str, Any]:
    raw_score = payload.get("score", 0)

    try:
        score = max(0, min(100, int(float(raw_score))))
    except (TypeError, ValueError):
        score = 0

    strengths = payload.get("strengths", [])
    if isinstance(strengths, str):
        strengths = [strengths]
    strengths = [str(item).strip() for item in strengths if str(item).strip()][:3]

    gaps = payload.get("gaps", [])
    if isinstance(gaps, str):
        gaps = [gaps]
    gaps = [str(item).strip() for item in gaps if str(item).strip()][:3]

    improved_answer = str(payload.get("improvedAnswer", "")).strip() or reference_answer
    suggested_difficulty = str(payload.get("suggestedDifficulty", "MEDIUM")).strip().upper()

    if suggested_difficulty not in {"EASY", "MEDIUM", "HARD"}:
        if score >= 85:
            suggested_difficulty = "EASY"
        elif score >= 60:
            suggested_difficulty = "MEDIUM"
        else:
            suggested_difficulty = "HARD"

    if not strengths:
        if score >= 70:
            strengths = ["Your answer captures the main idea clearly."]
        elif user_answer.strip():
            strengths = ["You attempted the answer and identified at least part of the topic."]
        else:
            strengths = ["No meaningful answer was provided yet."]

    if not gaps:
        if score >= 85:
            gaps = ["Add a little more precision or a supporting detail to make the answer stronger."]
        elif score >= 60:
            gaps = ["Include the most important missing detail from the reference answer."]
        else:
            gaps = ["Rebuild the answer from the main concepts in the reference answer."]

    return {
        "score": score,
        "strengths": strengths,
        "gaps": gaps,
        "improvedAnswer": improved_answer,
        "suggestedDifficulty": suggested_difficulty,
        "debug": {"source": "gemini", "reason": f"Reviewed with model {settings.gemini_model}"},
    }


def _heuristic_review(question: str, reference_answer: str, user_answer: str) -> dict[str, Any]:
    cleaned_answer = user_answer.strip()

    if not cleaned_answer:
        return {
            "score": 0,
            "strengths": ["No answer was provided yet."],
            "gaps": ["Write a response that addresses the question directly."],
            "improvedAnswer": reference_answer,
            "suggestedDifficulty": "HARD",
            "debug": {"source": "fallback", "reason": "No answer was provided."},
        }

    answer_tokens = set(_tokenize(cleaned_answer))
    reference_tokens = set(_tokenize(reference_answer))
    overlap = len(answer_tokens & reference_tokens)
    overlap_ratio = overlap / max(1, len(reference_tokens))

    gibberish_like = (
        len(answer_tokens) <= 1
        and len(cleaned_answer) <= 12
        and cleaned_answer.isalpha()
        and cleaned_answer.lower() not in reference_answer.lower()
    )

    if gibberish_like:
        return {
            "score": 5,
            "strengths": ["You submitted an answer, but it does not address the question yet."],
            "gaps": ["Use key ideas from the notes or reference answer instead of random text."],
            "improvedAnswer": reference_answer,
            "suggestedDifficulty": "HARD",
            "debug": {"source": "fallback", "reason": "The submitted answer looked like gibberish or unrelated text."},
        }

    base_score = min(100, int(overlap_ratio * 100))

    if len(cleaned_answer.split()) < 4:
        base_score = min(base_score, 35)
    elif len(cleaned_answer.split()) < 8:
        base_score = min(base_score + 5, 55)
    else:
        base_score = min(base_score + 10, 100)

    if overlap_ratio >= 0.7:
        strengths = ["Your answer matches most of the important ideas from the reference answer."]
        gaps = ["Add one precise detail or example to make it even stronger."]
        difficulty = "EASY"
    elif overlap_ratio >= 0.35:
        strengths = ["Your answer captures part of the expected idea."]
        gaps = ["Include more of the important points from the reference answer."]
        difficulty = "MEDIUM"
    else:
        strengths = ["You attempted the question, which is a good start."]
        gaps = ["The answer is missing most of the key concepts from the reference answer."]
        difficulty = "HARD"

    return {
        "score": base_score,
        "strengths": strengths,
        "gaps": gaps,
        "improvedAnswer": reference_answer,
        "suggestedDifficulty": difficulty,
        "debug": {"source": "fallback", "reason": "Used heuristic review because Gemini was unavailable or failed."},
    }


async def _call_claude(system_prompt: str, user_prompt: str) -> dict[str, Any]:
    api_key = get_gemini_api_key()

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    endpoint = GEMINI_URL.format(model=settings.gemini_model)

    if "flashcards" in user_prompt.lower():
        response_schema = {
            "type": "object",
            "properties": {
                "flashcards": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string"},
                            "question": {"type": "string"},
                            "referenceAnswer": {"type": "string"},
                            "hint": {"type": "string"},
                            "sourceSnippet": {"type": "string"},
                        },
                        "required": ["type", "question", "referenceAnswer", "hint", "sourceSnippet"],
                    },
                }
            },
            "required": ["flashcards"],
        }
    else:
        response_schema = {
            "type": "object",
            "properties": {
                "score": {"type": "integer"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "gaps": {"type": "array", "items": {"type": "string"}},
                "improvedAnswer": {"type": "string"},
                "suggestedDifficulty": {"type": "string"},
            },
            "required": ["score", "strengths", "gaps", "improvedAnswer", "suggestedDifficulty"],
        }

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}],
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseJsonSchema": response_schema,
            "temperature": 0.4,
        },
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            endpoint,
            params={"key": api_key},
            headers={"content-type": "application/json"},
            json=payload,
        )

    if response.status_code >= 400:
        detail = response.text.strip()
        raise RuntimeError(
            f"Gemini request failed with status {response.status_code}: {detail[:400]}"
        )

    data = response.json()
    candidates = data.get("candidates", [])

    if not candidates:
        raise RuntimeError(f"Gemini returned no candidates: {json.dumps(data)[:400]}")

    parts = candidates[0].get("content", {}).get("parts", [])
    text = parts[0].get("text", "") if parts else ""

    if not text:
        raise RuntimeError(f"Gemini returned empty content: {json.dumps(data)[:400]}")

    return _extract_json(text)


async def generate_flashcards(notes: str, chapter_title: str, cards_requested: int) -> dict[str, Any]:
    normalized_notes = _normalize_notes(notes)
    safe_title = _clean_chapter_title(chapter_title)

    if not get_gemini_api_key():
        return _heuristic_flashcards(normalized_notes, safe_title, cards_requested)

    prompt = f"""
Chapter title: {safe_title}
Cards requested: {cards_requested}
Notes:
{normalized_notes}

Generate {cards_requested} flashcards strictly from these notes.
If the notes do not support {cards_requested} strong cards, return fewer cards.
Make each question clearly tied to a different important point from the notes.
Return a varied mix of definitions, explanations, comparisons, processes, and applications when supported by the notes.
Do not mention file names, upload names, IDs, roll numbers, or document codes in the question unless they are truly part of the study content.
"""
    try:
        payload = await _call_claude(FLASHCARD_SYSTEM_PROMPT, prompt)
        return _normalize_flashcards(payload, normalized_notes, safe_title, cards_requested)
    except Exception as error:
        logger.exception("Gemini flashcard generation failed")
        fallback = _heuristic_flashcards(normalized_notes, safe_title, cards_requested)
        fallback["debug"] = {"source": "fallback", "reason": str(error)}
        return fallback


async def review_answer(question: str, reference_answer: str, user_answer: str) -> dict[str, Any]:
    if not get_gemini_api_key():
        return _heuristic_review(question, reference_answer, user_answer)

    prompt = f"""
Question: {question}
Reference answer: {reference_answer}
Student answer: {user_answer}

Evaluate how well the student answer matches the reference answer.
Keep the feedback concise and useful for revision.
"""
    try:
        payload = await _call_claude(REVIEW_SYSTEM_PROMPT, prompt)
        return _normalize_review(payload, reference_answer, user_answer)
    except Exception as error:
        logger.exception("Gemini answer review failed")
        fallback = _heuristic_review(question, reference_answer, user_answer)
        fallback["debug"] = {"source": "fallback", "reason": str(error)}
        return fallback
