import React from 'react';
import { Search, X, SearchX, Plus } from 'lucide-react';
import { GameCard } from './GameCard.jsx';
import { getSystemPeriod } from '../services/systemTrending.js';
import { CustomDropdown } from './CustomDropdown';

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
  onToggleFavorite,
  onDeleteGame,
  favoriteIds,
  onOpenSearchModal,
  userSettings = {},
  customGameCount = 0
}) {
  const systemPeriod = React.useMemo(() => getSystemPeriod(), []);

  const categories = React.useMemo(() => [
    { id: 'all', label: 'All Titles' },
    { id: 'favorites', label: 'Favourites' },
    { id: 'recently-added', label: `Recently Added${customGameCount > 0 ? ` (${customGameCount})` : ''}` },
    { id: 'trending', label: `Popular (${systemPeriod.monthShort} ${systemPeriod.year})` },
    { id: 'path-tracing', label: 'Path Tracing' },
    { id: 'aaa', label: 'AAA Visuals' },
    { id: 'esports', label: 'Esports' },
    { id: 'openworld', label: 'Open World' },
    { id: 'rpg', label: 'RPG' },
    { id: 'shooter', label: 'Shooters' },
    { id: 'racing', label: 'Sim & Racing' }
  ], [systemPeriod, customGameCount]);

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
            <Search className="search-icon-svg" size={13} strokeWidth={2.5} />
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
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>

          <CustomDropdown
            id="sort-select"
            className="sort-select"
            value={sortBy}
            searchable={false}
            options={[
              { value: 'trending', label: 'Popularity' },
              { value: 'fps-desc', label: 'FPS: High to Low' },
              { value: 'fps-asc', label: 'FPS: Low to High' },
              { value: 'title-asc', label: 'Title: A-Z' },
              { value: 'year-desc', label: 'Release: Newest' }
            ]}
            onChange={(val) => onSortChange(val)}
            ariaLabel="Sort games by"
          />
        </div>
      </div>

      <div className="games-grid" id="games-grid">
        {items.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '36px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>
              <SearchX size={32} strokeWidth={1.8} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: '#ffffff', marginBottom: '6px' }}>
              {searchQuery ? `No games matching "${searchQuery}"` : 'No games found'}
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
                  <Plus size={14} strokeWidth={2.5} style={{ marginRight: 6 }} />
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
              onToggleFavorite={onToggleFavorite}
              onDeleteGame={onDeleteGame}
              isFavorite={favoriteIds.includes(item.game.id)}
              fpsDetail={userSettings.fpsDetail}
              showBottlenecks={userSettings.showBottlenecks !== false}
              targetFps={userSettings.targetFps || 60}
            />
          ))
        )}
      </div>
    </>
  );
}
