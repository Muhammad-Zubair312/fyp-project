import React, { useEffect, useRef } from "react";
import "../CSS/Cards.css";

const Cards = () => {
  const features = [
    {
      letter: "A",
      icon: "📊",
      title: "Deep Dive Analysis in Seconds",
      desc: "Advanced AI algorithms provide comprehensive data analysis with actionable insights, delivered instantly to accelerate your decision-making process."
    },
    {
      letter: "B",
      icon: "📈",
      title: "Interactive Data Visualization",
      desc: "Transform complex datasets into stunning, interactive visualizations that make data storytelling effortless and impactful."
    },
    {
      letter: "C",
      icon: "🔧",
      title: "Custom AI Solutions",
      desc: "Tailored AI models built specifically for your business needs, ensuring maximum ROI and seamless integration with existing systems."
    }
  ];

  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  return (
   <section className="features-section1" id="features">
  <div className="features-grid1">
    {features.map((feature, index) => (
      <div
        className="feature-card"
        key={index}
        ref={(el) => (cardsRef.current[index] = el)}
      >
        <div className="feature-letter">{feature.letter}</div>
        <div className="feature-icon">{feature.icon}</div>
        <h3>{feature.title}</h3>
        <p>{feature.desc}</p>
        <button className="play-btn">▶ Play Demo</button>
      </div>
    ))}
  </div>

  {/* Newsletter Section - Full Width Poster Style */}
  <div className="newsletter-banner">
    <h3>Stay Updated</h3>
    <p>Get the latest AI insights and updates</p>
    <div className="newsletter">
      <input type="email" placeholder="Enter your email" aria-label="Email address" />
      <button className="subscribe-btn" type="submit">Subscribe</button>
    </div>
  </div>
</section>

  );
};

export default Cards;
