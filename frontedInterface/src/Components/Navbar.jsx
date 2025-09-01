import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import "../CSS/Navbar.css";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = ["Home", "About", "Contact"];

  return (
    <motion.nav
      className={`navbar ${scrolled ? "scrolled" : ""}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: scrolled ? -10 : 0, opacity: scrolled ? 0.95 : 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      <motion.div
        className="logo"
        whileHover={{
          scale: 1.15,
          rotate: 5,
          textShadow:
            "white",
        }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        Pitch Pilot
      </motion.div>
      <motion.ul
        className="nav-links"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {links.map((link, index) => (
          <motion.li
            key={index}
            variants={{
              hidden: { opacity: 0, y: -20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
            }}
          >
            <a href={`#${link.toLowerCase()}`}>{link}</a>
          </motion.li>
        ))}
      </motion.ul>
    </motion.nav>
  );
}

export default Navbar;
