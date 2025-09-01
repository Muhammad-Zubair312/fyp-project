import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "../CSS/ThemeList.css";
import Navbar from "./Navbar";

const Theme = () => {
  const [themes, setThemes] = useState([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const navigate = useNavigate(); // ✅ Navigation hook

  useEffect(() => {
    fetch("/Theme.json")
      .then((res) => res.json())
      .then((data) => setThemes(data));
  }, []);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  // ✅ When user clicks a theme card, go to next page
    const handleThemeClick = async(theme) => {
	

    try {
    const res = await fetch("http://127.0.0.1:5000/submit-theme", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ themeName: theme.name }), // ✅ send theme name only
    });

    const message = await res.text();
    console.log("Flask Response:", message);

    if (message === "success") {
      // Continue navigation after Flask confirms
      navigate("/preview", { state: { theme } });
    }
    }
    catch (err) {
    console.error("Error sending theme to Flask:", err);
    }
	  
 };

  return (
    <>
      <Navbar />

      <div className="heading">
        <h2 className="text-3xl font-bold mb-6 text-center">🎨 Choose a Theme</h2>

        {/* GRID LAYOUT - 3 Columns */}
        <div className="theme-grid">
          {themes.slice(0, visibleCount).map((theme, idx) => (
            <div
              key={idx}
              className="theme-card rounded-2xl shadow-lg p-5 cursor-pointer transition transform hover:scale-105 hover:shadow-2xl"
              style={{
                background: theme.colors.background,
                color: theme.colors.text,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: "220px",
              }}
              onClick={() => handleThemeClick(theme)} // ✅ Navigate to next page
            >
              {/* Theme Name */}
              <h3
                className="text-lg font-bold mb-3 text-center"
                style={{ fontFamily: theme.fonts.heading }}
              >
                {theme.name}
              </h3>

              {/* Color Dots */}
              <div className="flex justify-center gap-2 mb-4">
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ background: theme.colors.primary }}
                ></div>
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ background: theme.colors.secondary }}
                ></div>
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ background: theme.colors.accent }}
                ></div>
              </div>

              {/* Select Button */}
              <button
                className="px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition"
                style={{
                  background: theme.colors.accent,
                  color: "#fff",
                }}
              >
                Select Theme
              </button>
            </div>
          ))}
        </div>

        {/* Show more button */}
        {visibleCount < themes.length && (
          <div className="flex justify-center mt-8">
            <button
              className=" px-6 py-2 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-700"
              onClick={handleShowMore}
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Theme;
