"use client";

import React, { useState } from 'react';
import { useI18n, languageGroups } from '../i18n';

/**
 * Language selector component that allows users to change the application language
 */
export const LanguageSelector = ({ appearance = 'dropdown' }) => {
  const { language, setLanguage, getLanguages, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const languages = getLanguages();
  
  // Get current language name
  const currentLanguage = languages.find(lang => lang.code === language)?.name || 'English';
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Close dropdown when clicking outside
  const closeDropdown = () => {
    setIsOpen(false);
  };
  
  // Handle language change
  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };
  
  // Render language group
  const renderLanguageGroup = (groupName, langCodes) => {
    const groupLanguages = languages.filter(lang => langCodes.includes(lang.code));
    
    if (groupLanguages.length === 0) return null;
    
    return (
      <div key={groupName} className="language-group">
        <h4 className="language-group-title">{t(`languages.groups.${groupName}`)}</h4>
        <div className="language-group-items">
          {groupLanguages.map(lang => (
            <button
              key={lang.code}
              className={`language-item ${lang.code === language ? 'active' : ''}`}
              onClick={() => handleLanguageChange(lang.code)}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Render as dropdown
  if (appearance === 'dropdown') {
    return (
      <div className="language-selector-dropdown" onClick={e => e.stopPropagation()}>
        <button 
          className="language-selector-button" 
          onClick={toggleDropdown}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span className="language-code">{language.toUpperCase()}</span>
          <span className="language-name">{currentLanguage}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`chevron-icon ${isOpen ? 'open' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        
        {isOpen && (
          <>
            <div className="language-selector-backdrop" onClick={closeDropdown} />
            <div className="language-selector-menu">
              {renderLanguageGroup('western', languageGroups.western)}
              {renderLanguageGroup('northern', languageGroups.northern)}
              {renderLanguageGroup('eastern', languageGroups.eastern)}
              {renderLanguageGroup('southern', languageGroups.southern)}
            </div>
          </>
        )}
      </div>
    );
  }
  
  // Render as radio buttons
  if (appearance === 'radio') {
    return (
      <div className="language-selector-radio">
        <div className="language-selector-label">{t('common.selectLanguage')}:</div>
        <div className="language-selector-options">
          {languages.map(lang => (
            <label key={lang.code} className="language-radio-label">
              <input
                type="radio"
                name="language"
                value={lang.code}
                checked={lang.code === language}
                onChange={() => handleLanguageChange(lang.code)}
                className="language-radio-input"
              />
              <span className="language-radio-text">{lang.name}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }
  
  // Render as simple list
  return (
    <div className="language-selector-list">
      <div className="language-selector-label">{t('common.selectLanguage')}:</div>
      <div className="language-selector-options">
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`language-button ${lang.code === language ? 'active' : ''}`}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector; 