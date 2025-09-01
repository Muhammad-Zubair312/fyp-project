import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Poster from "./Components/Poster";  
import FeatureList from "./Components/FeatureList";
import RequirementForm from "./Components/RequirementForm";
import Theme from "./Components/Theme";
import Preview from "./Components/Preview"; // ✅ Import Preview Page

function App() {
  return (
    <Router>
      <Routes>
        {/* Home Page */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Poster />
              <FeatureList />
            </>
          }
        />

        {/* Requirement Form Page */}
        <Route
          path="/requirement"
          element={
            <>
              <Navbar /> 
              <RequirementForm />
            </>
          }
        />

        {/* Theme Page */}
        <Route path="/theme" element={<Theme />} />

        {/* Preview Page for selected theme */}
        <Route path="/preview" element={<Preview />} /> {/* ✅ New Route */}
      </Routes>
    </Router>
  );
}

export default App;
