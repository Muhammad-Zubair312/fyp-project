import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "../CSS/LoginCard.css";

export default function LoginCard({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    await new Promise((res) => setTimeout(res, 800));
    setLoading(false);

    // ✅ Hardcoded credentials
    if (email === "admin@gmail.com" && password === "123") {
      setIsAuthenticated(true);
      navigate("/"); // ✅ Home page redirect
    } else {
      setErrors({ form: "Galat Email ya Password hai." });
    }
  };

  return (
    <>
     
      <div className="login-page">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="login-card"
        >
          <h1 className="login-title">Welcome To Pitch Pilot</h1>
          <p className="login-subtitle">Login Your Account</p>

          {errors.form && <div className="error-box">{errors.form}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
            />

            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="toggle-password"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="login-btn"
            >
              {loading ? "Signing in..." : "Sign in"}
            </motion.button>
          </form>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
