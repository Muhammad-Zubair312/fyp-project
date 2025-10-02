import React from "react";
import Editor from "@monaco-editor/react";
import { FaArrowUp, FaCopy } from "react-icons/fa";
import "./LeftCard.css";

export default function LeftCard({
  code,
  setCode,
  editorRef,
  requirements,
  setRequirements,
  copyCodeToClipboard,
  handleRequirement,
  isGenerating,
}) {
  return (
    <div className="left-card">
      <button
        onClick={copyCodeToClipboard}
        className="copy-btn"
        title="Copy current code"
        aria-label="Copy code"
      >
        <FaCopy />
      </button>

      <Editor
        height="100%"
        defaultLanguage="html"
        value={code}
        theme="vs-dark"
        onMount={(editor) => (editorRef.current = editor)}
        onChange={(value) => setCode(value)}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          lineNumbers: "on",
        }}
      />

      <div className="requirement-box">
        {/* ✅ Status moved ABOVE textarea with fade animation */}
        <div
          style={{
            marginBottom: 6,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: isGenerating ? 1 : 0,
            transition: "opacity 0.4s ease-in-out", // smooth fade
            color: "#0b74ff",
            height: "18px", // reserve space so layout doesn’t jump
          }}
        >
          {isGenerating && (
            <>
              <div className="spinner" />
              <span>⚡ Pitch Pilot is working...</span>
            </>
          )}
        </div>

        <div className="textarea-wrapper">
          <textarea
            placeholder="Enter your requirement..."
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!isGenerating) handleRequirement();
              }
            }}
            className="requirement-input"
            rows={3}
            disabled={isGenerating}
          />
          <button
            onClick={() => {
              if (!isGenerating) handleRequirement();
            }}
            className="send-btn1"
            disabled={isGenerating}
            title={isGenerating ? "Pitch Pilot is working..." : "Send requirement"}
            aria-label="Send requirement"
          >
            <FaArrowUp />
          </button>
        </div>

        {/* ✅ Only show hint when idle */}
        {!isGenerating && (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#9aa4b2",
            }}
          >
            Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline.
          </div>
        )}
      </div>
    </div>
  );
}
