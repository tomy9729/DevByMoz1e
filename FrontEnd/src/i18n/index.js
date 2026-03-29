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

/**
 * 역할: 점 표기 경로를 사용해 중첩 객체에서 값을 조회한다.
 * 파라미터 설명:
 * - target: 조회 대상 객체
 * - path: `a.b.c` 형태의 문자열 경로
 * 반환값 설명: 경로에 해당하는 값 또는 `undefined`
 */
function getValueByPath(target, path) {
  return path.split('.').reduce((current, key) => current?.[key], target)
}

/**
 * 역할: 현재 언어에 맞는 메시지 리소스를 반환한다.
 * 파라미터 설명:
 * - language: 조회할 언어 코드
 * 반환값 설명: 해당 언어 리소스 객체, 없으면 기본 언어 리소스
 */
export function getMessages(language = currentLanguage) {
  return resources[language] ?? resources[DEFAULT_LANGUAGE]
}

/**
 * 역할: 지정한 경로의 번역 문자열을 반환한다.
 * 파라미터 설명:
 * - path: 번역 문자열 경로
 * - language: 조회할 언어 코드
 * 반환값 설명: 번역 문자열, 없으면 입력 경로 문자열
 */
export function t(path, language = currentLanguage) {
  return getValueByPath(getMessages(language), path) ?? path
}

/**
 * 역할: FullCalendar에서 사용할 locale 객체를 반환한다.
 * 파라미터 설명:
 * - language: 조회할 언어 코드
 * 반환값 설명: FullCalendar locale 객체
 */
export function getCalendarLocale(language = currentLanguage) {
  return calendarLocales[language] ?? calendarLocales[DEFAULT_LANGUAGE]
}

export { resources, calendarLocales }
