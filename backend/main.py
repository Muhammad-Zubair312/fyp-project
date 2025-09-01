from flask import Flask, render_template, request, jsonify
import os
import json
import re
import base64
import requests
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

GEMINI_API_KEYS = [
    os.environ.get("API_KEY_1"),
    os.environ.get("API_KEY_2"),
    os.environ.get("API_KEY_3"),
    os.environ.get("API_KEY_4"),
]

build_hook_url = os.environ.get("NETLIFY_HOOK_URL")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_REPO = os.environ.get("GITHUB_REPO")

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/submit", methods=["POST"])
def submit():
    
    print(build_hook_url)
    data = request.get_json()   
    global requirement
    requirement = data.get("requirement")

    print("User Requirement:", requirement)  #logs
    
    return jsonify({"status": "ok", "requirement": requirement})


@app.route("/submit-theme", methods=["POST"])
def select_theme():
    data = request.get_json()
    theme_name = data.get("themeName")
    theme_name = theme_name.replace(" ", "_")
    print("User selected theme: ", theme_name) #logs 
    path = f"Theme/{theme_name}.json"
    
    with open(path,"r") as f:
        themes = json.load(f)
    global selected_theme
    selected_theme = themes
    
    return "success"



def start():
    global func_req 
    func_req = call_gemini_api(f"""
Extract functional requirements from this text: {requirement}.
Give output in JSON form, no extra text.
""")
    print(func_req)
    html_code = generate_website()
    file_path = "index.html"

    with open(file_path, "w", encoding="utf-8") as f:
       f.write(html_code)

    check = push_to_github(file_path)


@app.route("/generate", methods=["POST"])
def generate_url():
    try:
        data = request.get_json()
        theme_name = data.get("themeName", "default")
        
        start()
    
        url = trigger_netlify_build_hook()
        if url:            
           print(url)
           return jsonify({"url": url}), 200
        else:
            print("Error while Generating URL\n")
            return jsonify({"error": "URL does Not Generate"}), 404            
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Something went wrong"}), 500

 
def call_gemini_api(prompt_text):
    if not GEMINI_API_KEYS:
        return "Gemini API key is missing."

    for api_key in GEMINI_API_KEYS:
        if not api_key:
            continue  

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key={api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {"parts": [{"text": prompt_text}]}
            ]
        }

        try:
            response = requests.post(url, headers=headers, json=payload)

            if response.status_code in [401, 403, 429]:
                print(f"[!] API key {api_key[:6]}... failed: {response.status_code}, trying next key...")
                continue

            response.raise_for_status()
            result = response.json()
            print("DEBUG: Gemini full response:", json.dumps(result, indent=4))

            candidates = result.get("candidates", [])
            if candidates:
                first_candidate = candidates[0]
                content = first_candidate.get("content", {})
                parts = content.get("parts", [])
                text_list = [part.get("text") for part in parts if "text" in part]
                return "\n".join(text_list) if text_list else "No text returned"
            else:
                return "No text returned"

        except Exception as e:
            print(f"[!] Error with API key {api_key[:6]}...: {e}")
            continue  

    return "Error: All Gemini API keys failed."


def extract_only_html(raw_html: str) -> str:
    cleaned = re.sub(r"^```[a-zA-Z]*\n", "", raw_html)
    cleaned = re.sub(r"\n```$", "", cleaned)
    return cleaned.strip()




def generate_website():
    if not func_req:
        return "Error: No functional requirements found. Submit first."

    prompt = f"""
You are a professional web developer.
You are given:

1. Functional Requirements JSON:
{func_req}

2. Theme JSON:
{selected_theme}

Task:
Generate a **complete, standalone HTML5 file** with:
- Proper <html>, <head>, <body> structure.
- All CSS inside <style> in <head>.
- All JS (if needed) inside <script> before </body>.
- No external links or CDNs.
- Use the functional requirements to create real sections, headings, paragraphs, buttons, or forms.
- Output ONLY **pure HTML code**, do NOT include Markdown, explanation, or text outside HTML tags.
"""
    
    
    html_code = call_gemini_api(prompt)
    html_code = extract_only_html(html_code)  # <-- clean the backticks
 
    if not html_code.lower().startswith("<!doctype html>") and not html_code.lower().startswith("<html"):
        raise ValueError("Gemini did not return HTML. Check your prompt.")
    
    return html_code


def push_to_github(file_path="index.html", commit_message="Update website"):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    content_b64 = base64.b64encode(content.encode()).decode()
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/{file_path}"

    r = requests.get(url, headers={"Authorization": f"token {GITHUB_TOKEN}"})
    sha = r.json()["sha"] if r.status_code == 200 else None
    print("\nSHA Value: ", sha)
    payload = {"message": commit_message, "content": content_b64}
    if sha:
        payload["sha"] = sha
    print("\n")
    response = requests.put(url, headers={"Authorization": f"token {GITHUB_TOKEN}"}, json=payload)
    print(response)
    
    if response.status_code in [200, 201]:
        print("Pushed to GitHub successfully")
        time.sleep(60)
        return True
    else:
        print("GitHub error:", response.text)
        return False


def trigger_netlify_build_hook():
    response = requests.post(build_hook_url)
    print(response)
    if response.status_code in [200, 201]:
        print("Netlify build triggered successfully")
        return "https://auto-deploy-site.netlify.app"  
    else:
        print("Netlify hook error:", response.text)
        return None


if __name__ == "__main__":
    app.run(debug=True)
