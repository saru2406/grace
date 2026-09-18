import React from 'react';

interface MaterialSpinnerProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Material Web / Material Design Circular Progress Loading Spinner
 * Implements the standard indeterminate Material circular progress animation.
 */
export function MaterialSpinner({
  size = 28,
  color,
  strokeWidth = 5,
  className = '',
  style = {}
}: MaterialSpinnerProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      className={`material-spinner ${className}`}
      viewBox="0 0 50 50"
      style={{
        width: dimension,
        height: dimension,
        ...(color ? { color } : {}),
        ...style
      }}
      aria-hidden="true"
    >
      <circle
        className="material-spinner-circle"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color || 'currentColor'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
