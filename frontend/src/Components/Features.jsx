import React, { useEffect } from "react";
import "../CSS/Features.css";

const Features = () => {
  useEffect(() => {
    const tags = document.querySelectorAll(".tag");
    tags.forEach((tag, index) => {
      setTimeout(() => {
        tag.classList.add("visible");
      }, index * 200); // animation delay
    });
  }, []);

  return (
    <section className="features-section2">
      <h2 className="section-title">A Seamless User Experience</h2>
      <div className="features-tags">
        <div className="tag">Flexible Platform</div>
        <div className="tag purple">Fully Secured</div>
        <div className="tag purple">Time Saver</div>
        <div className="tag">Keep Track</div>
        <div className="tag purple">More Focus</div>
        <div className="tag">Easy Deploy</div>
      </div>
    </section>
  );
};

export default Features;
