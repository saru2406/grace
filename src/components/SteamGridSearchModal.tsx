import React, { useState, useEffect, useRef } from 'react';
import { ImageOff, X, Search, Gamepad2 } from 'lucide-react';
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
      className="modal-overlay open palette-overlay"
      onClick={(e) => {
        if (e.target.classList.contains('modal-overlay')) onClose();
      }}
    >
      <div className="modal-box search-palette-box">
        <div className="search-palette-input-wrap">
          <Search className="search-palette-icon" size={22} />
          <input
            type="text"
            id="steamgrid-live-input"
            className="search-palette-input"
            placeholder="Search for any PC game..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={inputRef}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              className="search-palette-clear-btn"
              onClick={() => setQuery('')}
              aria-label="Clear input"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="search-palette-content">
          {loading && (
            <div className="search-palette-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="search-result-card skeleton-card-placeholder" aria-hidden="true">
                  <div style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.06)' }} className="skeleton-loading" />
                  <div className="search-result-title" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div className="skeleton-loading" style={{ height: '14px', width: '80%', borderRadius: '4px' }} />
                    <div className="skeleton-loading" style={{ height: '10px', width: '40%', borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && query.trim().length < 1 && (
            <div className="search-palette-empty">
              <Gamepad2 size={48} className="search-palette-empty-icon" />
              <h3>Find Your Game</h3>
              <p>Type a game name to search the global PC games database.</p>
              
              <div className="search-palette-suggestions">
                {['Cyberpunk 2077', 'Helldivers 2', 'Elden Ring', 'Black Myth: Wukong', 'Space Marine 2'].map(s => (
                  <button
                    key={s}
                    type="button"
                    className="search-suggestion-pill"
                    onClick={() => setQuery(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && query.trim().length >= 1 && results.length === 0 && (
            <div className="search-palette-empty">
              <Search size={48} className="search-palette-empty-icon" />
              <h3>No Results</h3>
              <p>We couldn't find any games matching "{query}".</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="search-palette-grid">
              {results.slice(0, 16).map((item) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  onSelect={() => onAddGame(item)}
                />
              ))}
            </div>
          )}
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
