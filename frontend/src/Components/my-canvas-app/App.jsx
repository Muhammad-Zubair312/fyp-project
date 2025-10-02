import React, { useState, useRef, useEffect } from "react";
import Split from "react-split";
import LeftCard from "./Components/leftcard";
import RightCard from "./Components/rightcard";
import "./App.css";

const defaultCode = `<!DOCTYPE html>
<html>
  <head>
    <title>My app</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="flex justify-center items-center h-screen overflow-hidden bg-white font-sans text-center px-6">
    <div class="w-full">
      <span class="text-xs rounded-full mb-2 inline-block px-2 py-1 border border-amber-500/15 bg-amber-500/15 text-amber-500">🔥 New version dropped!</span>
      <h1 class="text-4xl lg:text-6xl font-bold font-sans">
        <span class="text-2xl lg:text-4xl text-gray-400 block font-medium">I'm ready to work,</span>
        Ask me anything.
      </h1>
    </div>
    <img src="https://enzostvs-deepsite.hf.space/arrow.svg" class="absolute bottom-8 left-0 w-[100px] transform rotate-[30deg]" />
  </body>
</html>`;

export default function App() {
  const [requirements, setRequirements] = useState("");
  const [code, setCode] = useState(defaultCode);

  const [generatedFiles, setGeneratedFiles] = useState({});
  const [navbarFiles, setNavbarFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [allFilesTyped, setAllFilesTyped] = useState(false);

  const [deployUrl, setDeployUrl] = useState(null); // ✅ store deploy URL

  const iframeRef = useRef(null);
  const editorRef = useRef(null);

  const updatePreview = (newCode) => {
    const iframe = iframeRef.current;
    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(newCode);
        doc.close();
      }
    }
  };
  useEffect(() => {
    updatePreview(code);
  }, [code]);

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  // ⚡ Ultra-fast typing speed
  const typeCode = (filename, content, onComplete) => {
    if (typeof content !== "string") {
      setCode(String(content ?? ""));
      setCurrentFile(filename);
      setNavbarFiles((prev) =>
        prev.includes(filename) ? prev : [...prev, filename]
      );
      if (typeof onComplete === "function") onComplete();
      return;
    }

    let i = 0;
    const chunkSize = 100; // ⚡ huge chunks = almost instant typing
    const intervalMs = 0; // ⚡ no delay

    // ✅ 1. Add file to navbar FIRST
    setNavbarFiles((prev) =>
      prev.includes(filename) ? prev : [...prev, filename]
    );

    // ✅ 2. Switch to this file before typing starts
    setCurrentFile(filename);
    setCode("");

    // ✅ 3. Start typing content
    const interval = setInterval(() => {
      const nextSlice = content.slice(i, i + chunkSize);
      if (nextSlice.length) {
        setCode((prev) => prev + nextSlice);
        i += nextSlice.length;
      }

      if (i >= content.length) {
        clearInterval(interval);
        setCode(content);
        if (typeof onComplete === "function") onComplete();
      }
    }, intervalMs);
  };

  const handleRequirement = async () => {
    try {
      if (!requirements.trim()) return;
      if (isGenerating) return;

      setIsGenerating(true);
      setAllFilesTyped(false);

      setGeneratedFiles({});
      setNavbarFiles([]);
      setCurrentFile(null);
      setDeployUrl(null); // ✅ clear old deploy link

      const response = await fetch("http://localhost:5000/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement: requirements }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text}`);
      }

      const data = await response.json();
      const files =
        data && typeof data === "object" && data.files && typeof data.files === "object"
          ? data.files
          : {};

      setRequirements(""); // clear only after response
      setGeneratedFiles(files);

      const fileNames = Object.keys(files || {});
      if (fileNames.length === 0) {
        console.warn("No files received from backend.");
        setIsGenerating(false);
        return;
      }

      const sortedFiles = fileNames.sort((a, b) => {
        if (a === "index.html") return -1;
        if (b === "index.html") return 1;
        return a.localeCompare(b);
      });

      const firstFile = sortedFiles[0];
      const firstContent = files[firstFile];
      typeCode(firstFile, firstContent, () => handleFileComplete(1, sortedFiles, files));
    } catch (err) {
      console.error("Error in handleRequirement:", err);
      setIsGenerating(false);
    }
  };

  const handleFileComplete = (nextIndex, sortedFiles, files) => {
    if (nextIndex < sortedFiles.length) {
      const nextFile = sortedFiles[nextIndex];
      const nextContent = files[nextFile];
      typeCode(nextFile, nextContent, () =>
        handleFileComplete(nextIndex + 1, sortedFiles, files)
      );
    } else {
      setIsGenerating(false);
      setAllFilesTyped(true);
    }
  };

  const handleDeploy = async () => {
    try {
      const response = await fetch("http://localhost:5000/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Deploy failed: ${text}`);
      }

      const data = await response.json();
      if (data.url) {
        setDeployUrl(data.url); // ✅ save instead of auto-opening
      } else {
        alert("⚠️ No URL returned from backend.");
      }
    } catch (err) {
      console.error("Error during deploy:", err);
      alert("❌ Deployment failed. Check console for details.");
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          borderBottom: "1px solid #ddd",
          minHeight: "48px",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {navbarFiles.map((file) => (
            <button
              key={file}
              onClick={() => {
                setCode(generatedFiles[file]);
                setCurrentFile(file);
              }}
              className={currentFile === file ? "active" : ""}
            >
              {file}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {allFilesTyped && (
            <button
              onClick={handleDeploy}
              style={{
                background: "#0b74ff",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              🚀 Deploy
            </button>
          )}

          {/* ✅ Show deployed link when available */}
          {deployUrl && (
            <a
              href={deployUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0b74ff", fontWeight: "bold" }}
            >
              🔗 Open Deployed Site
            </a>
          )}
        </div>
      </div>

      <Split
        className="split"
        sizes={[50, 50]}
        minSize={200}
        gutterSize={8}
        style={{ display: "flex", height: "100%", width: "100%" }}
      >
        <LeftCard
          code={code}
          setCode={setCode}
          editorRef={editorRef}
          requirements={requirements}
          setRequirements={setRequirements}
          copyCodeToClipboard={copyCodeToClipboard}
          handleRequirement={handleRequirement}
          isGenerating={isGenerating}
        />
        <RightCard iframeRef={iframeRef} />
      </Split>
    </div>
  );
}
