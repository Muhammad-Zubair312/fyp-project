import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/FormSection.css";

const RequirementForm = () => {
  const navigate = useNavigate();
  const [requirement, setRequirement] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!requirement.trim()) {
      setError("Please enter your requirement before submitting.");
      return;
    }

    const theme = {
      id: "theme1",
      theme_name: "professional_modern",
      colors: {
        background: "#FFFFFF",
        text_primary: "#1F2937",
        text_secondary: "#4B5563",
        accent: "#2563EB",
        muted: "#E5E7EB",
      },
      fonts: {
        primary: "Inter, sans-serif",
        secondary: "Roboto, sans-serif",
      },
      layout: {
        style: "clean",
        spacing: "wide",
        buttons: "rounded",
        shadows: "subtle",
        navigation: "top_fixed",
      },
    };

    setError("");
	
	
	try {
      const res = await fetch("http://127.0.0.1:5000/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requirement }),
      });

      const data = await res.json();
      console.log("Flask Response:", data);

      // ✅ navigate AFTER backend responds
      navigate("/theme", { state: { theme, userRequirement: requirement } });

    } catch (err) {
      console.error("Error sending data to Flask:", err);
    }	
	
    //navigate("/theme", { state: { theme, userRequirement: requirement } });
  };

  return (
    <div className="fullpage">
    <div className="requirement-page">
      <section className="requirement-section">
        <h2>Client Requirements</h2>
        <form className="requirement-form" onSubmit={handleSubmit}>
          <textarea
            placeholder="Enter your requirements here..."
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
          ></textarea>

          {error && <p className="error-message">{error}</p>}

          <button type="submit">Submit Requirement</button>
        </form>
      </section>
    </div>
    </div>
  );
};

export default RequirementForm;
