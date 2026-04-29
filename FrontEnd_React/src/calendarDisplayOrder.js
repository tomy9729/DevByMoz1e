export const DEFAULT_CALENDAR_DISPLAY_ORDER = [
    "event",
    "notice",
    "chaosGate",
    "fieldBoss",
    "adventureIsland",
    "package",
    "custom",
];

/**
 * 역할: 고정된 표시 순서를 기준으로 대상 키별 우선순위 맵을 생성한다.
 * 파라미터 설명:
 * - orderKeys: 표시 대상 순서 배열
 * 반환값 설명: 대상 키를 숫자 우선순위로 매핑한 객체
 */
export function getCalendarDisplayOrderMap(orderKeys = DEFAULT_CALENDAR_DISPLAY_ORDER) {
    return Object.fromEntries(orderKeys.map((key, index) => [key, index]));
}

/**
 * 역할: 고정된 표시 순서를 기준으로 표시 대상 배열을 정렬한다.
 * 파라미터 설명:
 * - targets: 정렬할 표시 대상 배열
 * - orderKeys: 정렬 기준이 되는 표시 순서 배열
 * 반환값 설명: 고정된 표시 순서가 반영된 표시 대상 배열
 */
export function sortCalendarTargets(targets, orderKeys = DEFAULT_CALENDAR_DISPLAY_ORDER) {
    const orderMap = getCalendarDisplayOrderMap(orderKeys);

    return [...targets].sort((left, right) => (orderMap[left.key] ?? 99) - (orderMap[right.key] ?? 99));
}
