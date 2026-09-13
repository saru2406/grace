import React, { useState, useEffect, useRef } from 'react';
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
    if (query.trim().length < 2) {
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
    }, 280);

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
          ✕
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
              ✕
            </button>
          )}
        </div>

        <div id="steamgrid-search-results" className="search-results-grid">
          {loading && <div className="spinner"></div>}
          {!loading && query.trim().length < 2 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              Start typing above to search the global PC games database...
            </div>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
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
  const [thumb, setThumb] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getGameGrid(item.id).then(grid => {
      if (!cancelled) {
        if (grid && (grid.thumb || grid.url)) {
          setThumb(grid.thumb || grid.url);
        } else {
          setThumb('https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg');
        }
      }
    }).catch(() => {
      if (!cancelled) {
        setThumb('https://cdn2.steamgriddb.com/thumb/f39b781760a403dedaa05587e8889c1a.jpg');
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
        {!loaded && <div className="carousel-poster-skeleton" />}
        {thumb && (
          <img
            className="search-result-thumb"
            src={thumb}
            alt={item.name}
            style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0 && !loaded) {
                setLoaded(true);
              }
            }}
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              setLoaded(true);
              e.target.onerror = null;
              e.target.src = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg';
            }}
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
