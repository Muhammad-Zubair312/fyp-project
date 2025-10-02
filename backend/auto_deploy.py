from flask import Flask, request, jsonify
import json
import os
import re
import base64
import requests
from pathlib import Path
from bs4 import BeautifulSoup
import time


build_hook_url = os.environ.get("NETLIFY_HOOK_URL")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_REPO = os.environ.get("GITHUB_REPO")



HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}


def deploy():  
    site_dir = os.path.abspath(os.path.join("generated_site", "site"))
    
    ok = push_directory_single_commit(site_dir, GITHUB_REPO, branch="main",
                                      commit_message="Auto-deploy: update site")
    if ok:
        # 3. trigger Netlify build
        link = trigger_netlify_build_hook()
        print(link)
        return link

    return None   




def push_directory_single_commit(local_dir: str,
                                 repo: str,
                                 branch: str = "main",
                                 commit_message: str = None):
    """
    Push entire local_dir contents to GitHub repo root as ONE commit.
    Overwrites previous contents (clean snapshot style).
    """
    commit_message = commit_message or f"Auto site update {int(time.time())}"

    # 1. Get latest commit sha and base tree
    url = f"https://api.github.com/repos/{repo}/git/refs/heads/{branch}"
    r = requests.get(url, headers=HEADERS)
    if r.status_code != 200:
        raise Exception(f"Failed to get branch ref: {r.text}")
    ref_info = r.json()
    latest_commit_sha = ref_info["object"]["sha"]

    url = f"https://api.github.com/repos/{repo}/git/commits/{latest_commit_sha}"
    r = requests.get(url, headers=HEADERS)
    if r.status_code != 200:
        raise Exception(f"Failed to get latest commit: {r.text}")
    commit_info = r.json()
    base_tree_sha = commit_info["tree"]["sha"]

    # 2. Collect local files for new tree
    tree_items = []
    for root, _, files in os.walk(local_dir):
        for fname in files:
            abs_path = os.path.join(root, fname)
            rel_path = os.path.relpath(abs_path, local_dir).replace(os.path.sep, "/")

            with open(abs_path, "rb") as f:
                content = f.read()

            blob_url = f"https://api.github.com/repos/{repo}/git/blobs"
            blob_resp = requests.post(blob_url, headers=HEADERS,
                                      json={"content": base64.b64encode(content).decode(),
                                            "encoding": "base64"})
            if blob_resp.status_code != 201:
                raise Exception(f"Failed to create blob for {rel_path}: {blob_resp.text}")
            blob_sha = blob_resp.json()["sha"]

            tree_items.append({
                "path": rel_path,
                "mode": "100644",
                "type": "blob",
                "sha": blob_sha
            })

    # 3. Create new tree
    url = f"https://api.github.com/repos/{repo}/git/trees"
    tree_resp = requests.post(url, headers=HEADERS,
                              json={"base_tree": base_tree_sha, "tree": tree_items})
    if tree_resp.status_code != 201:
        raise Exception(f"Failed to create tree: {tree_resp.text}")
    new_tree_sha = tree_resp.json()["sha"]

    # 4. Create commit
    url = f"https://api.github.com/repos/{repo}/git/commits"
    commit_resp = requests.post(url, headers=HEADERS,
                                json={"message": commit_message,
                                      "tree": new_tree_sha,
                                      "parents": [latest_commit_sha]})
    if commit_resp.status_code != 201:
        raise Exception(f"Failed to create commit: {commit_resp.text}")
    new_commit_sha = commit_resp.json()["sha"]

    # 5. Update ref
    url = f"https://api.github.com/repos/{repo}/git/refs/heads/{branch}"
    ref_resp = requests.patch(url, headers=HEADERS,
                              json={"sha": new_commit_sha, "force": True})
    if ref_resp.status_code not in (200, 201):
        raise Exception(f"Failed to update ref: {ref_resp.text}")

    print(f"Pushed site as one commit: {new_commit_sha}")
    return True


def trigger_netlify_build_hook(max_retries=3, backoff=5, timeout=10):
    """
    Trigger Netlify build hook and wait until the latest deployment is ready.
    """
    if not build_hook_url:
        print("[!] Netlify build hook URL is missing.")
        return None

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.post(build_hook_url, timeout=timeout)
            print(f"[Netlify] Attempt {attempt}: status {response.status_code}")

            if response.status_code in (200, 201):
                print("✅ Netlify build triggered successfully")

                # Wait for Netlify to process new deployment
                return wait_for_latest_deploy()
            else:
                print(f"[Netlify] Hook error: {response.text}")

        except requests.RequestException as e:
            print(f"[Netlify] Request failed: {e}")

        if attempt < max_retries:
            print(f"⏳ Retrying in {backoff} seconds...")
            time.sleep(backoff)

    print("❌ Netlify build hook failed after retries.")
    return None


def wait_for_latest_deploy(poll_interval=5, max_wait=120):
    """
    Poll Netlify API until the latest deploy is ready.
    Requires NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID in env.
    """
    NETLIFY_AUTH_TOKEN = os.environ.get("NETLIFY_AUTH_TOKEN")
    NETLIFY_SITE_ID = os.environ.get("NETLIFY_SITE_ID")

    if not NETLIFY_AUTH_TOKEN or not NETLIFY_SITE_ID:
        print("[!] Missing NETLIFY_AUTH_TOKEN or NETLIFY_SITE_ID.")
        return "https://auto-deploy-site.netlify.app"

    headers = {"Authorization": f"Bearer {NETLIFY_AUTH_TOKEN}"}

    for waited in range(0, max_wait, poll_interval):
        try:
            url = f"https://api.netlify.com/api/v1/sites/{NETLIFY_SITE_ID}/deploys"
            resp = requests.get(url, headers=headers, timeout=10)

            if resp.status_code == 200:
                deploys = resp.json()
                if deploys:
                    latest = deploys[0]
                    state = latest.get("state")
                    deploy_url = latest.get("deploy_url")

                    print(f"[Netlify] Latest deploy state: {state}")

                    if state == "ready" and deploy_url:
                        print(f"✅ New deploy is live: {deploy_url}")
                        return deploy_url
            else:
                print(f"[Netlify] Failed to fetch deploys: {resp.text}")

        except Exception as e:
            print(f"[Netlify] Error polling deploys: {e}")

        time.sleep(poll_interval)

    print("⚠️ Timeout: returning site root")
    return "https://auto-deploy-site.netlify.app"
