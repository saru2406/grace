import React from 'react';

export function PopoutBackdrop({ isVisible, onClick }) {
  if (!isVisible) return null;

  return (
    <div
      className="popout-backdrop"
      onClick={onClick}
      aria-hidden="true"
    />
  );
}
