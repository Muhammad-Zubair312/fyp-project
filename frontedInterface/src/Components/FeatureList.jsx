import React from "react";
import "../CSS/FeatureList.css";

function FeatureList() {
  return (
    <div className="featureContainer">
      {/* Motivation Line */}
      <p className="motivation">
        Every small step in learning and building makes you stronger and brings
        you closer to your goals.
      </p>

      {/* Section 1: Text Left, Image Right */}
      <div className="simpleSection">
        <div className="textBlock">
          <h2>Learn & Grow</h2>
          <p>
            Every step you take in learning opens new doors of opportunities.
            Build your knowledge, and success will follow you naturally.
          </p>
        </div>
        <div className="imageBlock">
          <img src="images/card1.jpg" alt="Learning" />
        </div>
      </div>

      {/* Section 2: Image Left, Text Right */}
      <div className="simpleSection">
        <div className="imageBlock">
          <img src="images/card2.jpg" alt="Success" />
        </div>
        <div className="textBlock">
          <h2>Achieve Your Goals</h2>
          <p>
            Consistency and focus bring you closer to your dreams.
            Keep pushing forward, and your hard work will pay off.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FeatureList;
