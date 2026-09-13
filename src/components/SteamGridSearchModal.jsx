import React, { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div id="steamgrid-search-results" className="search-results-grid">
          {loading && <div className="spinner"></div>}
          {!loading && query.trim().length < 1 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              Start typing above to search the global PC games database instantly...
            </div>
          )}
          {!loading && query.trim().length >= 1 && results.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              No games found matching "{query}". Try checking the spelling or use another keyword.
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
  const [thumb, setThumb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setThumb(null);

    getGameGrid(item.id)
      .then(grid => {
        if (!cancelled) {
          setThumb(grid?.thumb || grid?.url || null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setThumb(null);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [item.id]);

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
        {isLoading && <div className="carousel-poster-skeleton" />}
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
