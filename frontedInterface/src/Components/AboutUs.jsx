import React from "react";

function About() {
  return (
    <section style={styles.about} id="about">
      <h2 style={styles.h2}>About Us</h2>
      <p style={styles.p}>
        Our project is focused on delivering modern, clean and innovative solutions. 
        This one-page website is just a teaser for what’s coming next. 
        With a beautiful UI and premium design, we ensure the best experience for our users.
      </p>
    </section>
  );
}

const styles = {
  about: { padding: "80px 50px", background: "#fff", textAlign: "center" },
  h2: { fontSize: "2.5rem", marginBottom: "20px", color: "#4A00E0" },
  p: {
    maxWidth: "800px",
    margin: "auto",
    fontSize: "1.1rem",
    color: "#555",
  },
};

export default About;
