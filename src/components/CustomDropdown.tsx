import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface DropdownOption {
  value: any;
  label: string;
  sublabel?: string;
  badge?: string;
  tier?: string;
}

export interface DropdownGroup {
  label: string;
  options: DropdownOption[];
}

export interface CustomDropdownProps {
  id?: string;
  className?: string;
  value: any;
  placeholder?: string;
  options?: DropdownOption[];
  groups?: DropdownGroup[];
  onChange: (value: any) => void;
  searchable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export function CustomDropdown({
  id,
  className = 'spec-select',
  value,
  placeholder = 'Select option',
  options,
  groups,
  onChange,
  searchable = false,
  disabled = false,
  ariaLabel
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUp: false
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize list of all options for lookup
  const allOptions = useMemo<DropdownOption[]>(() => {
    if (options && options.length > 0) return options;
    if (groups && groups.length > 0) {
      return groups.flatMap(g => g.options);
    }
    return [];
  }, [options, groups]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return allOptions.find(o => String(o.value) === String(value));
  }, [allOptions, value]);

  // Smart search matcher that normalizes whitespace, hyphens, and checks all tokens
  const matchesSearch = useCallback((opt: DropdownOption, term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    const cleanTerm = lowerTerm.replace(/[\s\-_]+/g, '');
    const tokens = lowerTerm.split(/[\s\-_]+/).filter(Boolean);

    const targets = [
      opt.label,
      opt.value ? String(opt.value) : '',
      opt.badge || '',
      opt.sublabel || '',
      opt.tier || ''
    ];

    for (const text of targets) {
      if (!text) continue;
      const lowerText = text.toLowerCase();
      if (lowerText.includes(lowerTerm)) return true;
      const cleanText = lowerText.replace(/[\s\-_]+/g, '');
      if (cleanTerm && cleanText.includes(cleanTerm)) return true;
    }

    const combined = targets.filter(Boolean).join(' ').toLowerCase();
    const combinedClean = combined.replace(/[\s\-_]+/g, '');
    if (tokens.length > 1 && tokens.every(tok => {
      const cleanTok = tok.replace(/[\s\-_]+/g, '');
      return combined.includes(tok) || (cleanTok && combinedClean.includes(cleanTok));
    })) {
      return true;
    }

    return false;
  }, []);

  // Filtered groups / options
  const filteredGroups = useMemo<DropdownGroup[]>(() => {
    const term = searchTerm.trim();
    if (groups && groups.length > 0) {
      return groups
        .map(group => {
          if (!term) return group;
          const matched = group.options.filter(opt => matchesSearch(opt, term));
          return { ...group, options: matched };
        })
        .filter(group => group.options.length > 0);
    }
    if (options && options.length > 0) {
      const filtered = term
        ? options.filter(opt => matchesSearch(opt, term))
        : options;
      return filtered.length > 0 ? [{ label: '', options: filtered }] : [];
    }
    return [];
  }, [groups, options, searchTerm, matchesSearch]);

  // Recalculate menu position
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    // Minimum width: trigger width or 300px, up to max 420px or screen bounds
    const isMobile = window.innerWidth < 640;
    const minW = isMobile ? Math.min(window.innerWidth - 24, 360) : Math.max(rect.width, 320);
    const width = Math.min(minW, window.innerWidth - 24);

    let left = isMobile
      ? Math.max(12, Math.floor((window.innerWidth - width) / 2))
      : rect.left;

    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    if (left < 12) {
      left = 12;
    }

    setCoords({
      top: openUp ? Math.max(12, rect.top - 6) : (rect.bottom + 6),
      left,
      width,
      openUp
    });
  }, []);

  // Handle open / close & listeners
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }

    updatePosition();

    // Focus search input after animation
    const timer = setTimeout(() => {
      if (searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 40);

    const handleScroll = (e: Event) => {
      // Don't reposition if scrolling inside dropdown menu list
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    const handleResize = () => updatePosition();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition, searchable]);

  const handleSelect = (val: any) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="custom-dropdown-container">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={`${className} custom-dropdown-trigger ${isOpen ? 'open' : ''} ${!value ? 'is-placeholder' : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        title={displayText}
      >
        <span className="trigger-text">
          {displayText}
        </span>
        <ChevronDown size={14} strokeWidth={2.2} className="trigger-chevron" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="custom-dropdown-popout detect-modal-dialog"
            style={{
              top: coords.openUp ? undefined : coords.top,
              bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
              left: coords.left,
              width: coords.width,
              transformOrigin: coords.openUp ? 'bottom center' : 'top center'
            }}
            role="listbox"
            aria-label={placeholder}
          >
            {/* Optional search input */}
            {searchable && (
              <div className="custom-dropdown-search-wrap">
                <Search size={13} strokeWidth={2.2} className="custom-dropdown-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="custom-dropdown-search-input"
                  placeholder="Filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Select the first match if available
                      const firstGroup = filteredGroups[0];
                      if (firstGroup && firstGroup.options.length > 0) {
                        handleSelect(firstGroup.options[0].value);
                      }
                    }
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="custom-dropdown-search-clear"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear filter"
                  >
                    <X size={12} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable list */}
            <div className="custom-dropdown-list">
              {filteredGroups.length === 0 ? (
                <div className="custom-dropdown-empty">
                  No matching options found
                </div>
              ) : (
                filteredGroups.map((group, gIdx) => (
                  <div key={group.label || `group-${gIdx}`} className="custom-dropdown-group">
                    {group.label && (
                      <div className="custom-dropdown-group-title">
                        {group.label}
                      </div>
                    )}
                    {group.options.map((opt) => {
                      const isSelected = String(opt.value) === String(value);
                      return (
                        <div
                          key={String(opt.value)}
                          className={`custom-dropdown-item ${isSelected ? 'active' : ''}`}
                          onClick={() => handleSelect(opt.value)}
                          role="option"
                          aria-selected={isSelected}
                          title={opt.label}
                        >
                          <div className="custom-dropdown-item-content">
                            <span className="custom-dropdown-item-label">{opt.label}</span>
                            {opt.sublabel && (
                              <span className="custom-dropdown-item-sublabel">{opt.sublabel}</span>
                            )}
                          </div>

                          {isSelected && (
                            <div className="custom-dropdown-item-meta">
                              <Check size={14} strokeWidth={2.5} className="custom-dropdown-item-check" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
