import React, { useState } from 'react';
import { LegalModal } from './LegalModal';

export function Footer() {
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  return (
    <>
      <footer className="app-footer glass-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-title" style={{ fontFamily: "'Cinzel Decorative', cursive, system-ui", letterSpacing: '1px', fontSize: '20px', color: '#fff' }}>Grace</span>
            <span className="footer-disclaimer">
              Game imagery & logos are property of their respective owners. Performance estimates are approximate based on hardware scaling algorithms.
            </span>
          </div>
          
          <div className="footer-links">
            <button 
              type="button" 
              onClick={() => setIsLegalModalOpen(true)}
              className="footer-legal-btn"
            >
              Legal & Compliance
            </button>
          </div>
        </div>
      </footer>
      <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} />
    </>
  );
}
