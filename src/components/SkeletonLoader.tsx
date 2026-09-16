import React from 'react';

/**
 * Full Page Skeleton for GameDetailPage loading
 */
export function GameDetailPageSkeleton() {
  return (
    <div className="game-detail-page skeleton-page" style={{ padding: '24px 32px', minHeight: '80vh', opacity: 0.85 }}>
      {/* Back Button Skeleton */}
      <div className="skeleton-loading" style={{ width: '120px', height: '36px', borderRadius: '8px', marginBottom: '24px' }} />

      {/* Hero Banner Skeleton */}
      <div className="skeleton-loading" style={{ width: '100%', height: '340px', borderRadius: '16px', marginBottom: '32px', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: '24px', left: '24px', display: 'flex', gap: '20px', alignItems: 'flex-end', width: 'calc(100% - 48px)' }}>
          <div className="skeleton-loading" style={{ width: '140px', height: '210px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div className="skeleton-loading" style={{ width: '60%', height: '36px', borderRadius: '6px' }} />
            <div className="skeleton-loading" style={{ width: '35%', height: '18px', borderRadius: '4px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <div className="skeleton-loading" style={{ width: '80px', height: '26px', borderRadius: '14px' }} />
              <div className="skeleton-loading" style={{ width: '100px', height: '26px', borderRadius: '14px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* FPS Telemetry Grid Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-loading" style={{ height: '110px', borderRadius: '12px' }} />
        ))}
      </div>

      {/* Content Columns Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="skeleton-loading" style={{ height: '280px', borderRadius: '16px' }} />
        <div className="skeleton-loading" style={{ height: '280px', borderRadius: '16px' }} />
      </div>
    </div>
  );
}

/**
 * Skeleton Card Loader Grid for Games Grid
 */
export function GamesGridSkeleton({ count = 8 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '20px', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="game-card skeleton-card-item" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', padding: '12px' }}>
          <div className="skeleton-loading" style={{ aspectRatio: '2/3', borderRadius: '10px', marginBottom: '12px' }} />
          <div className="skeleton-loading" style={{ width: '85%', height: '16px', borderRadius: '4px', marginBottom: '8px' }} />
          <div className="skeleton-loading" style={{ width: '50%', height: '12px', borderRadius: '3px', marginBottom: '16px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton-loading" style={{ width: '70px', height: '24px', borderRadius: '6px' }} />
            <div className="skeleton-loading" style={{ width: '50px', height: '18px', borderRadius: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Steam Profile Fetching Skeleton
 */
export function SteamProfileSkeleton({ statusText = 'Resolving profile...' }) {
  return (
    <div className="skeleton-profile-wrap" style={{
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div className="skeleton-loading" style={{ width: '56px', height: '56px', borderRadius: '12px', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-loading" style={{ width: '45%', height: '16px', borderRadius: '4px' }} />
        <div className="skeleton-loading" style={{ width: '75%', height: '12px', borderRadius: '3px' }} />
        <span style={{ fontSize: '11px', color: 'var(--ctp-subtext0)', marginTop: '2px' }}>{statusText}</span>
      </div>
    </div>
  );
}

/**
 * API Diagnostic Test Progress Skeleton
 */
export function ApiDiagnosticsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton-loading" style={{ height: '48px', borderRadius: '8px' }} />
      ))}
    </div>
  );
}
