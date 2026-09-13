import React from 'react';

export function AmbientBackdrop({ bgUrl, isActive }) {
  if (!bgUrl) return null;

  return (
    <div
      id="ambient-backdrop"
      className={`ambient-backdrop ${isActive ? 'active' : ''}`}
      style={{ backgroundImage: `url("${bgUrl}")` }}
    />
  );
}
