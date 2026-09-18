import React from 'react';
import { Gamepad2, Cpu, Zap, Search, SlidersHorizontal } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'library' | 'rig' | 'builds' | 'search' | 'settings';
  onSelectTab: (tab: 'library' | 'rig' | 'builds' | 'search' | 'settings') => void;
  isRigConfigured?: boolean;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  isRigConfigured = false
}: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation" role="navigation">
      <div className="mobile-bottom-nav-inner">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => onSelectTab('library')}
          aria-label="Games Library"
        >
          <div className="mobile-nav-icon-wrap">
            <Gamepad2 size={20} strokeWidth={activeTab === 'library' ? 2.4 : 1.8} />
          </div>
          <span className="mobile-nav-label">Library</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'rig' ? 'active' : ''}`}
          onClick={() => onSelectTab('rig')}
          aria-label="Hardware & Rig"
        >
          <div className="mobile-nav-icon-wrap">
            <Cpu size={20} strokeWidth={activeTab === 'rig' ? 2.4 : 1.8} />
            {isRigConfigured && <span className="mobile-nav-badge-dot" />}
          </div>
          <span className="mobile-nav-label">My Rig</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'builds' ? 'active' : ''}`}
          onClick={() => onSelectTab('builds')}
          aria-label="Quick Hardware Builds"
        >
          <div className="mobile-nav-icon-wrap">
            <Zap size={20} strokeWidth={activeTab === 'builds' ? 2.4 : 1.8} />
          </div>
          <span className="mobile-nav-label">Builds</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => onSelectTab('search')}
          aria-label="Search and Add Games"
        >
          <div className="mobile-nav-icon-wrap">
            <Search size={20} strokeWidth={activeTab === 'search' ? 2.4 : 1.8} />
          </div>
          <span className="mobile-nav-label">Search</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
          aria-label="Preferences and Settings"
        >
          <div className="mobile-nav-icon-wrap">
            <SlidersHorizontal size={20} strokeWidth={activeTab === 'settings' ? 2.4 : 1.8} />
          </div>
          <span className="mobile-nav-label">Settings</span>
        </button>
      </div>
    </nav>
  );
}
