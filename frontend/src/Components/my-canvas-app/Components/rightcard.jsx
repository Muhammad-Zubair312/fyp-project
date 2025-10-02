import React from "react";
import "./RightCard.css";

export default function RightCard({ iframeRef }) {
  return (
    <div className="right-card">
<iframe
  ref={iframeRef}
  className="preview-iframe"
  title="preview"
/>



    </div>
  );
}
