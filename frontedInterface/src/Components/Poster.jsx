import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import "../CSS/Poster.css";

function Poster() {
  const images = [
    { src: "/images/poster1.jpg" },
    { src: "/images/poster2.jpg" },
    { src: "/images/poster3.jpg" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="hero-section">
      {/* Background Image */}
      <div
        className="hero-slide"
        style={{ backgroundImage: `url(${images[currentIndex].src})` }}
      >
        <div className="hero-overlay">
          <h1 className="hero-title">Welcome to Our Website</h1>
          <p className="hero-subtitle">
            We are building something amazing. Stay tuned for the launch!
          </p>
          <div className="hero-buttons">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/requirement")}  // <-- navigate to new page
            >
              Enter Requirement
            </button>
          </div>
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="hero-dots">
        {images.map((_, index) => (
          <span
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`dot ${index === currentIndex ? "active" : ""}`}
          ></span>
        ))}
      </div>
    </section>
  );
}

export default Poster;
