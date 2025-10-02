import React from 'react';
import '../CSS/Footer.css';

const Footer = () => {
  const handleSocialClick = (platform) => {
    console.log(`Opening ${platform}`);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>DatoX</h3>
            <p className="footer-email">info@datox.ai</p>
            <div className="social-icons">
              <a href="#" title="Facebook" aria-label="Facebook" onClick={() => handleSocialClick('Facebook')}>📘</a>
              <a href="#" title="Instagram" aria-label="Instagram" onClick={() => handleSocialClick('Instagram')}>📷</a>
              <a href="#" title="LinkedIn" aria-label="LinkedIn" onClick={() => handleSocialClick('LinkedIn')}>💼</a>
              <a href="#" title="Twitter" aria-label="Twitter" onClick={() => handleSocialClick('Twitter')}>🐦</a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Product</h3>
            <ul>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Integrations</a></li>
              <li><a href="#">API</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 DatoX. All rights reserved. Made with ❤️ and AI</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
