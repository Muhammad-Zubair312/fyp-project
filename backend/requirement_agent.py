# requirement_agent.py
import os
import json
import re
import time
import requests

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY environment variable is not set.")

MAX_TOKENS = 2048
TEMPERATURE = 0.0
RETRY_ATTEMPTS = 5
RETRY_WAIT = 2
BACKOFF_FACTOR = 2

PRIMARY_MODEL = "deepseek/deepseek-r1:free"
FALLBACK_MODEL = "gpt-4o-mini:free"


def _strip_code_fence(text: str) -> str:
    if not text:
        return text
    m = re.search(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return text.strip()


def _extract_first_json(text: str):
    if not text:
        return None
    idx = text.find("{")
    if idx == -1:
        return None
    i = idx
    depth = 0
    in_string = False
    escape = False
    while i < len(text):
        ch = text[i]
        if ch == '"' and not escape:
            in_string = not in_string
        if ch == '\\' and in_string and not escape:
            escape = True
            i += 1
            continue
        if not in_string:
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    return text[idx:i+1]
        escape = False
        i += 1
    return None


def _try_parse_json_from_text(text: str):
    if not text:
        return None
    t = _strip_code_fence(text)
    try:
        return json.loads(t)
    except Exception:
        pass
    json_str = _extract_first_json(t)
    if json_str:
        try:
            return json.loads(json_str)
        except Exception:
            pass
    m = re.search(r"\{[\s\S]*\}", t)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return None


SYSTEM_PROMPT = (
    "You are a requirements engineer.\n"
    "Given a user requirement for a website (short or vague), produce EXACTLY one JSON object and NOTHING else."
    " The JSON MUST contain keys: project (string or object with name), pages (array of page names), features (array of feature ids/titles), style (string tags), theme (optional object), notes (string)."
    " If something is unknown, use empty string or empty array. Be concise and machine-parseable."
    "\n"
    "ALWAYS include Login and Signup page for every website"
     "\n"
    "ALWAYS include the essential domain-specific pages depending on the type of website. "
    "For example:\n"
    "- E-commerce: Cart, Checkout, Product Details\n"
    "- Learning Management System: Courses, Lessons, Dashboard\n"
    "- Blog: Articles, Categories, Tags\n"
    "- Any other domain: include pages essential to basic user workflow\n"
    "Return these pages in the 'pages' array if relevant to the user's domain.\n"
    "\n"
    "Do not include anything outside of the JSON object. The JSON must be valid and parseable."
)


def _call_model(model_id: str, messages: list) -> dict:
    """Call a model with retries and return parsed JSON or None."""
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}", "Content-Type": "application/json"}
    assistant_raw = None

    for attempt in range(RETRY_ATTEMPTS):
        payload = {
            "model": model_id,
            "messages": messages,
            "temperature": TEMPERATURE,
            "max_tokens": MAX_TOKENS
        }
        try:
            resp = requests.post(API_URL, headers=headers, json=payload, timeout=120)
        except Exception as e:
            if attempt < RETRY_ATTEMPTS - 1:
                wait = RETRY_WAIT * (BACKOFF_FACTOR ** attempt)
                print(f"[requirement_agent] Network error ({model_id}): {e}. Retrying in {wait}s...")
                time.sleep(wait)
                continue
            return None

        if resp.status_code in (429, 502, 503, 504):
            if attempt < (RETRY_ATTEMPTS - 1):
                wait = RETRY_WAIT * (BACKOFF_FACTOR ** attempt)
                print(f"[requirement_agent] {model_id} Rate-limited ({resp.status_code}). Retrying in {wait}s...")
                time.sleep(wait)
                continue
            return None

        if not resp.ok:
            print(f"[requirement_agent] {model_id} failed: {resp.status_code} {resp.text}")
            return None

        data = resp.json()
        assistant_raw = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        parsed = _try_parse_json_from_text(assistant_raw)
        if parsed is not None:
            if 'project' not in parsed:
                parsed['project'] = parsed.get('title', 'AutoProject')
            if 'pages' not in parsed:
                parsed['pages'] = ['Home']
            return parsed

        # If invalid JSON, try to repair
        if attempt < (RETRY_ATTEMPTS - 1):
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "assistant", "content": assistant_raw},
                {"role": "user", "content": "The JSON above is invalid or missing. Please return EXACTLY one valid JSON object containing keys project,pages,features,style,notes and nothing else."}
            ]
            wait = RETRY_WAIT * (BACKOFF_FACTOR ** attempt)
            print(f"[requirement_agent] Invalid JSON from {model_id}. Retrying in {wait}s...")
            time.sleep(wait)
            continue

    return None


def enhance_requirements(user_prompt: str):
    
    
    user_prompt += (
        "\nMake sure the pages include all essential domain-specific pages "
        "(e.g., Cart, Checkout for e-commerce; Courses, Lessons for LMS). "
        "Always return these in the 'pages' array if relevant."
    )
    
    base_messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": "Extract a complete structured requirements JSON from the following user text. Return ONLY JSON:\n" + user_prompt}
    ]

    # Try primary model (DeepSeek)
    parsed = _call_model(PRIMARY_MODEL, base_messages)
    if parsed is not None:
        print(f"[requirement_agent] Success with {PRIMARY_MODEL}")
        print(parsed)
        return parsed

    # Fallback to gpt-4o-mini
    print(f"[requirement_agent] Falling back to {FALLBACK_MODEL}...")
    parsed = _call_model(FALLBACK_MODEL, base_messages)
    if parsed is not None:
        print(f"[requirement_agent] Success with {FALLBACK_MODEL}")
        print(parsed)
        return parsed

    # Final fallback if everything fails
    return {
        "project": "AutoProject",
        "pages": ["Home"],
        "features": [],
        "style": "modern,tailwind",
        "notes": "INCOMPLETE: Requirement agent failed on both models."
    }
