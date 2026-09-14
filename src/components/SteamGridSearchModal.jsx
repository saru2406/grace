import React, { useState, useEffect, useRef } from 'react';
import { ImageOff, X } from 'lucide-react';
import { searchGames, getGameGrid } from '../services/steamGrid.js';

export function SteamGridSearchModal({ isOpen, onClose, onAddGame, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialQuery) {
        setQuery(initialQuery);
      }
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchGames(query.trim());
        setResults(data || []);
      } catch (e) {
        console.warn('Search error:', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      id="steamgrid-search-modal"
      className="modal-overlay open"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal-box modal-search">
        <button
          id="close-steamgrid-modal"
          className="modal-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="modal-header">
          <h2 className="modal-title">Add Any PC Game</h2>
          <p className="modal-subtitle">Search and add titles directly from the Steam &amp; SteamGridDB catalog.</p>
        </div>

        <div className="search-bar-wrap" style={{ position: 'relative' }}>
          <input
            type="text"
            id="steamgrid-live-input"
            className="search-large-input"
            placeholder="Search game title (e.g. Cyberpunk, Witcher, Helldivers, Silent Hill)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={inputRef}
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
              aria-label="Clear input"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div id="steamgrid-search-results" className="search-results-grid">
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="search-result-card skeleton-card-placeholder" aria-hidden="true">
              <div style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.06)' }} className="skeleton-loading" />
              <div className="search-result-title" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton-loading" style={{ height: '14px', width: '80%', borderRadius: '4px' }} />
                <div className="skeleton-loading" style={{ height: '10px', width: '40%', borderRadius: '3px' }} />
              </div>
            </div>
          ))}
          {!loading && query.trim().length < 1 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px 16px' }}>
              <p style={{ color: 'var(--ctp-subtext1)', marginBottom: '14px', fontSize: '13px' }}>
                Start typing to search the global PC games database, or pick a popular title:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '640px', margin: '0 auto' }}>
                {['Cyberpunk 2077', 'Resident Evil 4', 'Counter-Strike 2', 'Grand Theft Auto V', 'Elden Ring', 'Minecraft', 'The Witcher 3', 'Helldivers 2', 'Black Myth: Wukong', 'Space Marine 2'].map(s => (
                  <button
                    key={s}
                    type="button"
                    style={{
                      background: 'rgba(255, 255, 255, 0.07)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: 'var(--ctp-text, #e2e8f0)',
                      borderRadius: '16px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setQuery(s)}
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!loading && query.trim().length >= 1 && results.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px 16px' }}>
              <p style={{ color: 'var(--ctp-subtext1)', marginBottom: '10px' }}>
                No games found matching "{query}". Try checking the spelling or use another keyword.
              </p>
            </div>
          )}
          {!loading && results.slice(0, 16).map((item) => (
            <SearchResultCard
              key={item.id}
              item={item}
              onSelect={() => onAddGame(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchResultCard({ item, onSelect }) {
  const initialThumb = item.thumb || item.url || item.coverUrl || null;
  const [thumb, setThumb] = useState(initialThumb);
  const [isLoading, setIsLoading] = useState(!initialThumb);

  useEffect(() => {
    let cancelled = false;

    if (!initialThumb) {
      setIsLoading(true);
    }

    getGameGrid(item.id, item.steamAppId)
      .then(grid => {
        if (!cancelled) {
          const bestThumb = grid?.thumb || grid?.url || initialThumb;
          if (bestThumb) {
            setThumb(bestThumb);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [item.id, item.steamAppId, initialThumb]);

  const releaseYear = item.release_date ? new Date(item.release_date * 1000).getFullYear() : null;

  return (
    <div
      className="search-result-card"
      tabIndex={0}
      role="button"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      title={`Click to add ${item.name} to your library`}
    >
      <div style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' }}>
        {isLoading && <div className="carousel-poster-skeleton skeleton-loading" />}
        {!isLoading && !thumb && (
          <div className="search-result-thumb search-result-thumb-missing" aria-label={`No cover image available for ${item.name}`}>
            <ImageOff size={24} strokeWidth={1.8} />
          </div>
        )}
        {!isLoading && thumb && (
          <img
            className="search-result-thumb"
            src={thumb}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onError={() => setThumb(null)}
          />
        )}
      </div>
      <div className="search-result-title" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
        {releaseYear && <span style={{ fontSize: '10px', color: 'var(--ctp-subtext0)' }}>{releaseYear}</span>}
      </div>
    </div>
  );
}
