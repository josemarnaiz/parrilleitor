"use client";

import { I18nProvider } from '@/i18n';

export default function ClientI18nProvider({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
} 