'use client'

import { useI18n } from '@/i18n'

/**
 * Example component that demonstrates the use of translations
 */
export const TranslatedWelcomeMessage = ({ username }) => {
  const { t } = useI18n();
  
  return (
    <div className="p-6 rounded-lg bg-white shadow-md text-center max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {t('app.name')}
      </h1>
      <p className="text-lg text-gray-700 mb-6">
        {t('app.tagline')}
      </p>
      <div className="p-4 bg-primary-50 rounded-lg mb-6">
        <p className="text-primary-700">
          {t('chat.welcomeMessage')}
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('chat.suggestions.title')}</h2>
        <div className="grid gap-2">
          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left text-gray-700 transition-colors">
            {t('chat.suggestions.suggestion1')}
          </button>
          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left text-gray-700 transition-colors">
            {t('chat.suggestions.suggestion2')}
          </button>
          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left text-gray-700 transition-colors">
            {t('chat.suggestions.suggestion3')}
          </button>
          <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-left text-gray-700 transition-colors">
            {t('chat.suggestions.suggestion4')}
          </button>
        </div>
      </div>
      <div className="mt-8">
        <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors">
          {t('home.hero.cta')}
        </button>
      </div>
      <div className="mt-8 text-sm text-gray-500">
        {t('footer.copyright', { year: new Date().getFullYear() })}
      </div>
    </div>
  );
};

export default TranslatedWelcomeMessage; 