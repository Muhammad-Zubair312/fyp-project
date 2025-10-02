#!/usr/bin/env python3
"""
website_agent_parallel.py — Parallel page generation using ThreadPoolExecutor

Key changes:
- generate_website_parallel(...) uses a thread pool to run independent page generations concurrently.
- _model_call now accepts a requests.Session (connection pooling) and includes jittered backoff on 429/connection errors.
- Concurrency controlled by env var DEEPSEEK_PARALLELISM (default 4).
"""

import os
import re
import json
import time
import logging
import requests
import shutil
import random
from typing import Dict, List, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# -----------------------------
# DeepSeek API Config
# -----------------------------
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise RuntimeError("DEEPSEEK_API_KEY not set in environment")

DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
CHAT_COMPLETIONS_ENDPOINT = "/chat/completions"
MODEL_ID = "deepseek-chat"   # adjust if needed
RETRY = 3
MAX_TOKENS = 7999

# -----------------------------
# DeepSite-style System Prompt
# -----------------------------
DEEPSITE_INITIAL_PROMPT = (
    "You are an expert Front-End Developer and UI/UX designer.\n"
    "Create a professional, fully responsive multi-page website using ONLY HTML, CSS, and JavaScript.\n"
    "Use TailwindCSS for styling (include <script src=\"https://cdn.tailwindcss.com\"></script> in the head).\n"
    "Icons may use Feather Icons; animations may use AOS or Vanta when appropriate.\n"
    "Return the full site using Deepsite multi-page markers. The first file must be index.html.\n"
    "Do NOT include any explanation outside the marked HTML blocks."
)

# -----------------------------
# Helpers
# -----------------------------
def _slugify(label: str) -> str:
    return re.sub(r"\W+", "-", label.strip().lower())

def _ensure_dirs() -> Dict[str, str]:
    site_root = os.path.join("generated_site", "site")
    if os.path.exists(site_root):
        shutil.rmtree(site_root)
    os.makedirs(site_root, exist_ok=True)
    css = os.path.join(site_root, "css"); os.makedirs(css, exist_ok=True)
    js = os.path.join(site_root, "js"); os.makedirs(js, exist_ok=True)
    assets = os.path.join(site_root, "assets"); os.makedirs(assets, exist_ok=True)
    return {"html": site_root, "css": css, "js": js, "assets": assets}

def sanitize_ai_html(raw: str) -> str:
    if not raw:
        return ""

    s = raw

    s = re.sub(r"<<+.*?END_TITLE.*?\n", "", s, flags=re.IGNORECASE)
    s = re.sub(r"<<+.*?START_TITLE.*?\n", "", s, flags=re.IGNORECASE)

    fenced = re.findall(r"```(?:html)?\s*([\s\S]*?)```", s, flags=re.IGNORECASE)
    if fenced:
        cleaned = "\n\n".join(block.strip() for block in fenced)
        return cleaned.strip()

    s = re.sub(r"```(?:html)?", "", s, flags=re.IGNORECASE)
    s = s.replace("```", "")
    s = re.sub(r"^\s*html\s*", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\s*html\s*$", "", s, flags=re.IGNORECASE)
    return s.strip()

def _build_navbar(pages: List[str]) -> str:
    links = []
    normalized = []
    for p in pages:
        if p and p.strip():
            normalized.append(p.strip())
    if "Home" in normalized:
        normalized = [p for p in normalized if p != "Home"]
    normalized.insert(0, "Home")

    for i, page in enumerate(normalized):
        if i == 0 or page.lower() == "home":
            slug = "index.html"
            display = "Home"
        else:
            slug = _slugify(page) + ".html"
            display = page
        links.append(f"<a href='{slug}' class='px-3 py-2 hover:text-blue-400'>{display}</a>")
    return "<nav class='bg-gray-900 text-white p-4 flex space-x-4'>" + "".join(links) + "</nav>"

# -----------------------------
# HTTP / Model call (thread-friendly)
# -----------------------------
def _model_call(messages: list, session: requests.Session, max_tokens: int = MAX_TOKENS) -> str:
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": MODEL_ID, "messages": messages, "temperature": 0.25, "max_tokens": max_tokens}
    url = DEEPSEEK_BASE_URL + CHAT_COMPLETIONS_ENDPOINT

    for attempt in range(RETRY):
        try:
            resp = session.post(url, headers=headers, json=payload, timeout=120)
        except Exception as e:
            wait = (2 ** attempt) + random.uniform(0, 0.5)
            logging.warning("Request attempt %d failed (exception): %s — backing off %.2fs", attempt + 1, e, wait)
            time.sleep(wait)
            continue

        # Rate-limited: retry with backoff + jitter
        if resp.status_code == 429:
            wait = (2 ** attempt) + random.uniform(0, 1)
            logging.warning("Rate limited (429). Retrying after %.2fs (attempt %d)...", wait, attempt + 1)
            time.sleep(wait)
            continue

        if not resp.ok:
            raise RuntimeError(f"DeepSeek error {resp.status_code}: {resp.text}")

        j = resp.json()
        try:
            return j["choices"][0]["message"]["content"]
        except Exception:
            return str(j)

    raise RuntimeError("DeepSeek model call failed after retries")

# -----------------------------
# Per-page worker
# -----------------------------
def _generate_page_task(
    idx: int,
    page: str,
    project_title: str,
    features_list: List[str],
    notes: str,
    navbar_html: str,
    paths: Dict[str, str],
    session: requests.Session,
) -> Tuple[int, str]:
    """
    Generate one page, write to disk, return (index, out_path).
    Designed to be safe to run concurrently (pure functions + local I/O).
    """
    filename = "index.html" if idx == 0 else _slugify(page) + ".html"

    user_prompt = (
        f"Project: {project_title}\n"
        f"Page: {page}\n"
        f"Features: {', '.join(features_list)}\n"
        f"Notes: {notes}\n\n"
        "Generate ONLY the full HTML for this page.\n"
        "Use TailwindCSS for styling (<script src='https://cdn.tailwindcss.com'></script>).\n"
        "Do NOT include explanations, only HTML.\n"
        f"The HTML must include the shared navbar (provided below) and the page-specific body content for {page}.\n\n"
        f"Navbar (use these exact links):\n{navbar_html}\n\n"
        "Return only the page HTML (no extra commentary)."
    )

    messages = [
        {"role": "system", "content": DEEPSITE_INITIAL_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    logging.info("Worker: generating page '%s' (idx=%d)", page, idx)
    raw_html = _model_call(messages, session=session)
    clean_html = sanitize_ai_html(raw_html)

    # Wrap if not full document
    if "<!doctype" not in clean_html.lower():
        wrapped = (
            "<!DOCTYPE html>\n"
            "<html lang='en'>\n"
            "<head>\n"
            f"  <title>{project_title} — {page}</title>\n"
            "  <meta charset='utf-8'>\n"
            "  <meta name='viewport' content='width=device-width, initial-scale=1'>\n"
            "  <script src='https://cdn.tailwindcss.com'></script>\n"
            "  <link href='css/style.css' rel='stylesheet'>\n"
            "</head>\n"
            "<body>\n"
            f"{navbar_html}\n\n{clean_html}\n"
            "<script src='js/script.js'></script>\n"
            "</body>\n"
            "</html>\n"
        )
        to_write = wrapped
    else:
        to_write = clean_html

    out_path = os.path.join(paths["html"], filename)
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(to_write)

    logging.info("Worker: finished page '%s' -> %s", page, out_path)
    return (idx, out_path)

# -----------------------------
# Main (parallel) generator
# -----------------------------
def generate_website_parallel(enhanced_req: dict, max_workers: int = None) -> List[str]:
    """
    Parallel page generation. Returns list of saved file paths (HTML + created assets).
    """
    paths = _ensure_dirs()
    saved_files: List[str] = []

    project_title = (
        enhanced_req.get("project")
        if isinstance(enhanced_req.get("project"), str)
        else enhanced_req.get("project", {}).get("name", "My Site")
    )
    pages_list = enhanced_req.get("pages", []) or ["Home"]
    features_list = enhanced_req.get("features", []) or []
    notes = enhanced_req.get("notes", "") or ""

    # Normalize pages (remove empties, ensure Home first)
    pages_list = [p for p in pages_list if p and p.strip()]
    pages_list = [p for p in pages_list if p.lower() != "home"]
    pages_list.insert(0, "Home")

    navbar_html = _build_navbar(pages_list)

    # concurrency settings
    env_workers = os.environ.get("DEEPSEEK_PARALLELISM")
    if max_workers is None:
        try:
            max_workers = int(env_workers) if env_workers else 4
        except Exception:
            max_workers = 4
#    max_workers = max(1, min(max_workers, len(pages_list)))  # sensible bounds
    
    max_workers = len(pages_list)

    logging.info("Generating %d pages with %d workers", len(pages_list), max_workers)

    # Create a single session for connection pooling (requests.Session is commonly used across threads).
    session = requests.Session()

    # Submit tasks
    tasks = []
    with ThreadPoolExecutor(max_workers=max_workers) as exe:
        futures = []
        for idx, page in enumerate(pages_list):
            fut = exe.submit(
                _generate_page_task,
                idx,
                page,
                project_title,
                features_list,
                notes,
                navbar_html,
                paths,
                session,
            )
            futures.append(fut)

        # collect results; preserve ordering by idx
        results_by_idx = {}
        for fut in as_completed(futures):
            try:
                idx_out, path_out = fut.result()
                results_by_idx[idx_out] = path_out
            except Exception as e:
                logging.exception("A worker failed: %s", e)
                # decide: continue with other pages, or raise
                # Here we continue so other pages still generate
                continue

    # Compose list of saved HTML paths in original page order
    for i in range(len(pages_list)):
        if i in results_by_idx:
            saved_files.append(results_by_idx[i])
        else:
            logging.warning("Page index %d missing due to earlier error", i)

    # Create shared css/js if missing
    css_path = os.path.join(paths["css"], "style.css")
    if not os.path.exists(css_path):
        with open(css_path, "w", encoding="utf-8") as fh:
            fh.write("/* Custom styles */\n")
        saved_files.append(css_path)

    js_path = os.path.join(paths["js"], "script.js")
    if not os.path.exists(js_path):
        with open(js_path, "w", encoding="utf-8") as fh:
            fh.write("// Custom JS\n")
        saved_files.append(js_path)

    logging.info("Generated %d pages + assets in %s", len(saved_files), paths["html"])
    return saved_files

 