// src/component/footer/footer.component.js
import React from 'react';
import './footer.layout.css';

const Footer = () => {
  return (
    <footer className="footer bg-zinc-900 p-6">
      <div className="footer-content">
        <div className="footer-logo">
          <h2 className='text-lg font-semibold text-white mb-3'>Tracer</h2>
        </div>
      </div>
      <div className="footer-bottom">
        <p className='text-sm text-gray-300 text-center'>&copy; {new Date().getFullYear()} Tracer. All rights reserved.</p>

      </div>
    </footer>
  );
}

export default Footer;
