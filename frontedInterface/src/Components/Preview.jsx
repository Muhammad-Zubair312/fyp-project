import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(null);
  const [error, setError] = useState("");

  if (!theme) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold">⚠️ No Theme Selected!</h2>
        <button
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md"
          onClick={() => navigate("/theme")}
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleGenerateWebsite = async () => {
    setLoading(true);
    setError("");
    setWebsiteUrl(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeName: theme.name }),
      });

      if (!res.ok) throw new Error("Failed to generate website");
      const data = await res.json();

      setWebsiteUrl(data.url); // ✅ backend should return { url: "http://..." }
    } catch (err) {
      setError("❌ Something went wrong while generating your website.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div>
        <h1 className="text-4xl font-bold mb-2">🌟 {theme.name} Website</h1>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          {/* Show Generate Website button only before URL is returned */}
          {!websiteUrl && (
            <button
              className="px-6 py-3 rounded-lg shadow-md text-white disabled:opacity-50"
              style={{ background: theme.colors.accent }}
              onClick={handleGenerateWebsite}
              disabled={loading}
            >
              {loading ? "⏳ Generating..." : "🚀 Generate Website"}
            </button>
          )}

          {/* Show these only after URL is returned */}
          {websiteUrl && (
            <>
              <button
                className="px-6 py-3 rounded-lg shadow-md bg-green-600 text-white hover:bg-green-500"
                onClick={() => console.log("OK clicked")}
              >
                ✅ OK
              </button>
              <button
                className="px-6 py-3 rounded-lg shadow-md bg-blue-600 text-white hover:bg-blue-500"
                onClick={() => navigate("/requirement")}
              >
                ✏️ Refine Requirements
              </button>
            </>
          )}

          {/* Back button always available */}
          <button
            className="px-6 py-3 rounded-lg shadow-md bg-gray-700 text-white hover:bg-gray-600"
            onClick={() => navigate("/theme")}
          >
            🔙 Back to Themes
          </button>
        </div>

        {/* Status messages */}
        {loading && (
          <p className="mt-4 text-blue-600 font-medium">
            ⏳ Please wait... your website is being generated.
          </p>
        )}
        {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}
        {websiteUrl && (
          <p className="mt-4 text-green-600 font-medium">
            🎉 Website ready! 👉{" "}
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-700"
            >
              {websiteUrl}
            </a>
          </p>
        )}
      </div>
    </>
  );
};

export default Preview;
