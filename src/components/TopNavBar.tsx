import React, { useState } from 'react';
import { Home, Settings, MessageSquare, Search, MonitorCheck, Cpu } from 'lucide-react';
import { SettingsPopout } from './SettingsPopout';
import { FeedbackModal } from './FeedbackModal';
import { QuickBuildsPopout } from './QuickBuildsPopout';
import { DetectSpecsModal } from './DetectSpecsModal';

export function TopNavBar({
  onGoHome,
  onOpenSteamGridSearch,
  profileName,
  onProfileNameChange,
  onResetData,
  userSettings,
  onUpdateSetting,
  specs,
  onApplyPreset,
  onApplyDetectedSpecs
}: any) {
  const [isPopoutOpen, setIsPopoutOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isQuickBuildsOpen, setIsQuickBuildsOpen] = useState(false);
  const [isDetectModalOpen, setIsDetectModalOpen] = useState(false);

  return (
    <div className="top-nav-bar">
      <div className="top-nav-brand" onClick={onGoHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontFamily: "'Cinzel Decorative', cursive, system-ui", fontSize: '22px', color: '#fff', letterSpacing: '0.5px' }}>Grace</span>
      </div>

      <div className="top-nav-center">
        {/* Command Bar / Search */}
        <button className="top-nav-search-btn" onClick={() => onOpenSteamGridSearch('')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={14} style={{ opacity: 0.5 }} />
            <span>Search or add games...</span>
          </div>
          <div className="kbd-shortcut">Ctrl+Space</div>
        </button>
      </div>

      <div className="top-nav-actions">
        {onGoHome && (
          <button className="top-nav-btn" onClick={onGoHome} title="Go to Library">
            <Home size={16}/>
            <span>Library</span>
          </button>
        )}
        
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <div style={{ position: 'relative' }}>
          <button 
            className={`top-nav-btn ${isQuickBuildsOpen ? 'active' : ''}`}
            onClick={(e) => {
               e.stopPropagation();
               setIsPopoutOpen(false);
               setIsQuickBuildsOpen(prev => !prev);
            }}
            title="Quick Builds"
          >
            <Cpu size={16}/>
            <span>Quick Builds</span>
          </button>
          <div className="top-nav-popout-wrapper">
            <QuickBuildsPopout 
              isOpen={isQuickBuildsOpen} 
              onClose={() => setIsQuickBuildsOpen(false)} 
              onApplyPreset={onApplyPreset} 
            />
          </div>
        </div>

        <button 
          className="top-nav-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsQuickBuildsOpen(false);
            setIsPopoutOpen(false);
            setIsDetectModalOpen(true);
          }}
          title="Detect My PC Specs"
        >
          <MonitorCheck size={16}/>
          <span>Detect Specs</span>
        </button>

        <div style={{ position: 'relative' }}>
          <button 
            className={`top-nav-btn ${isPopoutOpen ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsQuickBuildsOpen(false);
              setIsPopoutOpen(prev => !prev);
            }}
            title="Preferences"
          >
            <Settings size={16}/>
            <span>Preferences</span>
          </button>
          <div className="top-nav-popout-wrapper">
            <SettingsPopout
              isOpen={isPopoutOpen}
              onClose={() => setIsPopoutOpen(false)}
              userSettings={userSettings}
              onUpdateSetting={onUpdateSetting}
              specs={specs}
              profileName={profileName}
              onProfileNameChange={onProfileNameChange}
              onResetData={onResetData}
            />
          </div>
        </div>

        <button 
          className={`top-nav-btn ${isFeedbackOpen ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsFeedbackOpen(true);
          }}
          title="Submit Feedback"
        >
          <MessageSquare size={16}/>
          <span>Feedback</span>
        </button>
        
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />
      </div>
      
      <DetectSpecsModal
        isOpen={isDetectModalOpen}
        onClose={() => setIsDetectModalOpen(false)}
        onApply={(detected) => {
          if (onApplyDetectedSpecs) onApplyDetectedSpecs(detected);
        }}
      />
    </div>
  );
}
