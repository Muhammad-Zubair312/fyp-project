import React from "react";
import { Link } from "react-router-dom";   // ✅ Add this
import "../CSS/Poster.css";

const Poster = () => {
  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="wave"></div>
        <div className="wave wave2"></div>
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
      </div>
      <div className="hero-content">
        <h1>Your New AI Assistant</h1>
        <p>Get AI-Generated Data Solutions in Seconds</p>
        
        {/* ✅ Link to Canvas page */}
        <Link to="/canvas" className="hero-cta">
          Create Pitch →
        </Link>
      </div>
    </section>
  );
};

export default Poster;
