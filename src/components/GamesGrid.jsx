import React from 'react';
import { GameCard } from './GameCard.jsx';
import { getSystemPeriod } from '../services/systemTrending.js';

export function GamesGrid({
  items,
  isConfigured,
  category,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onHoverGame,
  onLeaveGame,
  onSelectGame,
  onOpenSearchModal
}) {
  const systemPeriod = React.useMemo(() => getSystemPeriod(), []);

  const categories = React.useMemo(() => [
    { id: 'all', label: 'All Titles' },
    { id: 'trending', label: `Popular (${systemPeriod.monthShort} ${systemPeriod.year})` },
    { id: 'aaa', label: 'AAA Visuals' },
    { id: 'esports', label: 'Esports' },
    { id: 'openworld', label: 'Open World' },
    { id: 'rpg', label: 'RPG' },
    { id: 'shooter', label: 'Shooters' },
    { id: 'racing', label: 'Sim & Racing' }
  ], [systemPeriod]);

  return (
    <>
      <div className="library-controls">
        <div className="category-tabs" id="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`tab-btn ${category === cat.id ? 'active' : ''}`}
              data-category={cat.id}
              onClick={() => onSelectCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="search-sort-group">
          <div className="search-box">
            <svg className="search-icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="game-search-input"
              className="search-input"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="trending">Popular: {systemPeriod.year} / {systemPeriod.monthShort}</option>
            <option value="fps-desc">FPS: High to Low</option>
            <option value="fps-asc">FPS: Low to High</option>
            <option value="title-asc">Title: A-Z</option>
            <option value="year-desc">Release: Newest</option>
          </select>
        </div>
      </div>

      <div className="games-grid" id="games-grid">
        {items.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '36px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff', marginBottom: '6px' }}>
              {searchQuery ? `No library games matching "${searchQuery}"` : 'No games found'}
            </div>
            <p style={{ color: 'var(--ctp-subtext0)', fontSize: '13px', marginBottom: '18px', maxWidth: '420px', marginInline: 'auto' }}>
              {searchQuery
                ? `You can search and add "${searchQuery}" directly from the full Steam & SteamGridDB catalog.`
                : 'No titles match your active filters or category selection.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {searchQuery && onOpenSearchModal && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onOpenSearchModal(searchQuery)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Search &amp; Add "{searchQuery}"
                </button>
              )}
              <button
                type="button"
                className="btn-reset-specs"
                onClick={() => {
                  onSearchChange('');
                  onSelectCategory('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          items.map((item, index) => (
            <GameCard
              key={item.game.id}
              item={item}
              index={index}
              isConfigured={isConfigured}
              onHover={onHoverGame}
              onLeave={onLeaveGame}
              onSelect={onSelectGame}
            />
          ))
        )}
      </div>
    </>
  );
}
