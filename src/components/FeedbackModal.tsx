import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, GripHorizontal, Send, CheckCircle, Star } from 'lucide-react';
import { useDraggable } from '../hooks/useDraggable';
import { MaterialSpinner } from './MaterialSpinner';
import { CustomDropdown } from './CustomDropdown';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ACCURACY_OPTIONS = [
  { value: 'Very Accurate', label: 'Very Accurate' },
  { value: 'Mostly Accurate', label: 'Mostly Accurate' },
  { value: 'Somewhat Accurate', label: 'Somewhat Accurate' },
  { value: 'Not Accurate at All', label: 'Not Accurate at All' },
  { value: "I haven't tested it in-game yet", label: "I haven't tested it in-game yet" }
];

const EASE_OPTIONS = [
  { value: 'Very Easy', label: 'Very Easy' },
  { value: 'Somewhat Easy', label: 'Somewhat Easy' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Difficult', label: 'Difficult' },
  { value: 'Very Difficult', label: 'Very Difficult' }
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  // Form State mapped to Google Forms
  const [email, setEmail] = useState(''); // entry.300090524
  const [rating, setRating] = useState<number>(0); // entry.201366531 (1-5)
  const [accuracy, setAccuracy] = useState(''); // entry.1815182391
  const [ease, setEase] = useState(''); // entry.918118064
  const [features, setFeatures] = useState(''); // entry.639872567
  const [comments, setComments] = useState(''); // entry.1288455381

  useDraggable(dialogRef, '.modal-drag-handle', isOpen);

  useEffect(() => {
    if (!isOpen) {
      // Reset after closing
      setTimeout(() => {
        setStatus('idle');
        setEmail('');
        setRating(0);
        setAccuracy('');
        setEase('');
        setFeatures('');
        setComments('');
      }, 300);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !accuracy || !ease) return; // Basic validation

    setStatus('submitting');
    
    try {
      const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSckzceLs4p_yBBTTBGxz9aaShWyIGIx0Lf536v1Oj-vALJTeA/formResponse';
      
      const formData = new FormData();
      formData.append('entry.300090524', email);
      formData.append('entry.201366531', rating.toString());
      formData.append('entry.1815182391', accuracy);
      formData.append('entry.918118064', ease);
      formData.append('entry.639872567', features);
      formData.append('entry.1288455381', comments);
      
      await fetch(formUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Feedback submission error', err);
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="detect-modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="detect-modal-dialog"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: '520px', width: '100%', padding: 0 }}
      >
        <div className="detect-modal-dialog-inner" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>
          
          <div className="detect-modal-header" style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="detect-header-title-group">
              <h2 className="detect-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} color="var(--ctp-blue)" />
                Grace Feedback
              </h2>
              <p className="detect-modal-subtitle">Help us improve the FPS Estimator</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="modal-drag-handle" title="Drag to move" style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', borderRadius: '4px', cursor: 'grab' }}>
                <GripHorizontal size={16} />
              </div>
              <button
                className="detect-modal-close"
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                style={{ position: 'relative' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="detect-modal-body" style={{ overflowY: 'auto', paddingRight: '8px' }}>
            {status === 'success' ? (
              <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <CheckCircle size={56} color="var(--ctp-green)" />
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '18px' }}>Feedback Submitted!</h3>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.5 }}>
                    Thank you for helping us make Grace better.<br/>Your responses have been recorded.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="feedback-custom-form">
                
                {/* Email */}
                <div className="form-group">
                  <label>Email Address <span className="optional">(Optional)</span></label>
                  <input 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input"
                  />
                </div>

                {/* Rating */}
                <div className="form-group">
                  <label>Overall Experience <span className="required">*</span></label>
                  <div className="star-rating-group">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`star-btn ${rating >= num ? 'active' : ''}`}
                        onClick={() => setRating(num)}
                      >
                        <Star size={24} fill={rating >= num ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accuracy */}
                <div className="form-group">
                  <label>FPS Accuracy <span className="required">*</span></label>
                  <CustomDropdown
                    value={accuracy}
                    onChange={(val) => setAccuracy(val)}
                    options={ACCURACY_OPTIONS}
                    placeholder="Select FPS accuracy rating..."
                    ariaLabel="Select FPS Accuracy"
                    className="feedback-dropdown"
                  />
                </div>

                {/* Navigation Ease */}
                <div className="form-group">
                  <label>Navigation &amp; Ease of Use <span className="required">*</span></label>
                  <CustomDropdown
                    value={ease}
                    onChange={(val) => setEase(val)}
                    options={EASE_OPTIONS}
                    placeholder="Select ease of use rating..."
                    ariaLabel="Select Navigation & Ease of Use"
                    className="feedback-dropdown"
                  />
                </div>

                {/* Requested Features */}
                <div className="form-group">
                  <label>What features should we add? <span className="optional">(Optional)</span></label>
                  <textarea 
                    placeholder="More games, specific hardware filters, etc..."
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    className="glass-input"
                    rows={2}
                  />
                </div>

                {/* Comments / Bugs */}
                <div className="form-group">
                  <label>Comments or Bug Reports <span className="optional">(Optional)</span></label>
                  <textarea 
                    placeholder="Found a bug? Have an idea? Let us know!"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="glass-input"
                    rows={3}
                  />
                </div>

                {status === 'error' && (
                  <div className="error-message">
                    There was an issue submitting your feedback. Please try again.
                  </div>
                )}

                <div className="form-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="feedback-btn-cancel" onClick={onClose} disabled={status === 'submitting'}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="feedback-btn-submit" 
                    disabled={status === 'submitting' || !rating || !accuracy || !ease}
                  >
                    {status === 'submitting' ? (
                      <MaterialSpinner size={16} color="currentColor" strokeWidth={3} />
                    ) : (
                      <>
                        <Send size={15} />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
