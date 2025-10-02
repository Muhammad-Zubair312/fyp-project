# main.py
import os
import json
import re
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from requirement_agent import enhance_requirements
from website_agent import generate_website_parallel
from auto_deploy import deploy

app = Flask(__name__)
CORS(app)


def _safe_project_name(enhanced):
    name = None
    if isinstance(enhanced, dict):
        proj = enhanced.get("project")
        if isinstance(proj, dict):
            name = proj.get("name")
        elif isinstance(proj, str):
            name = proj
    if not name:
        import datetime
        name = f"site_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
    name = str(name).strip()
    name = re.sub(r"[^A-Za-z0-9_\-\.]+", "_", name)
    return name[:80]


@app.route("/submit", methods=["POST"])
def submit():
    try:
        data = request.get_json(force=True)
        user_prompt = data.get("requirement")
        if not user_prompt:
            return jsonify({"error": "Missing 'requirement' in JSON body"}), 400

        enhanced = enhance_requirements(user_prompt)
        # normalize if string
        if isinstance(enhanced, str):
            try:
                enhanced = json.loads(enhanced)
            except Exception:
                enhanced = {"project": "AutoProject", "pages": ["Home"], "features": [], "style": "modern", "notes": enhanced}

        project_name = _safe_project_name(enhanced)
        
        saved_files = generate_website_parallel(enhanced) #generate_website(enhanced)
        
        if saved_files:
            
            folder_path = "generated_site/site"
            html_files = {}

            for file_name in os.listdir(folder_path):
                if file_name.endswith(".html"):
                    with open(os.path.join(folder_path, file_name), "r", encoding="utf-8") as f:
                        html_files[file_name] = f.read()

            return jsonify({"files": html_files})
        
               
        return jsonify({
            "status": "success",
            "files": "No File To Display"
        }), 200

    except Exception as e:
        print("[main] Exception:", e)
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Website generator backend running"}), 200

@app.route("/deploy", methods=["POST"])
def deployment():
    
    deployed_url = deploy()
    return jsonify({"url": deployed_url})



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
