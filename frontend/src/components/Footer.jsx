import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-links">
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        <Link to="/faq">FAQs</Link>
        <Link to="/terms">Terms & Conditions</Link>
        <Link to="/privacy">Privacy Policy</Link>
      </div>
      <p className="footer-note">{new Date().getFullYear()} Sun-Kissed & Southern. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
