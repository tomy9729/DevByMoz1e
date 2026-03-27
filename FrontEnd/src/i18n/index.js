import ko from '../locales/ko'
import koLocale from '@fullcalendar/core/locales/ko'

export const DEFAULT_LANGUAGE = 'ko'
export const currentLanguage = DEFAULT_LANGUAGE

const resources = {
  ko,
}

const calendarLocales = {
  ko: koLocale,
}

function getValueByPath(target, path) {
  return path.split('.').reduce((current, key) => current?.[key], target)
}

export function getMessages(language = currentLanguage) {
  return resources[language] ?? resources[DEFAULT_LANGUAGE]
}

export function t(path, language = currentLanguage) {
  return getValueByPath(getMessages(language), path) ?? path
}

export function getCalendarLocale(language = currentLanguage) {
  return calendarLocales[language] ?? calendarLocales[DEFAULT_LANGUAGE]
}

export { resources, calendarLocales }
