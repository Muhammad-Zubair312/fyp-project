import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Poster from "./Components/Poster";
import Features from "./Components/Features";
import Cards from "./Components/Cards";
import Footer from "./Components/Footer";
import MyCanvasApp from "./Components/my-canvas-app/App.jsx";
import LoginCard from "./Components/LoginCard.jsx";

// ✅ A layout wrapper so we can conditionally hide Navbar
function Layout({ children, isAuthenticated, setIsAuthenticated }) {
  const location = useLocation();
  const hideNavbar = location.pathname === "/canvas"; // 👈 hide on canvas page

  return (
    <>
      {!hideNavbar && (
        <Navbar
          isAuthenticated={isAuthenticated}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
      {children}
    </>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Layout isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated}>
        <Routes>
          {/* ✅ Home Page */}
          <Route
            path="/"
            element={
              <>
                <Poster />
                <Features />
                <Cards />
                <Footer />
              </>
            }
          />

          {/* ✅ Canvas Page (no Navbar shown) */}
          <Route path="/canvas" element={<MyCanvasApp />} />

          {/* ✅ Login Page */}
          <Route
            path="/login"
            element={<LoginCard setIsAuthenticated={setIsAuthenticated} />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
