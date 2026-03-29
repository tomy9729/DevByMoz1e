export const DEFAULT_CALENDAR_DISPLAY_ORDER = [
    "event",
    "chaosGate",
    "fieldBoss",
    "adventureIsland",
];

/**
 * 역할: 저장된 표시 순서를 기본 순서와 병합해 사용할 수 있는 순서 배열로 정규화한다.
 * 파라미터 설명:
 * - orderKeys: localStorage 등에서 읽은 표시 순서 배열
 * - availableKeys: 현재 화면에서 사용할 수 있는 표시 대상 키 배열
 * 반환값 설명: 누락 없이 정리된 표시 대상 키 배열
 */
export function normalizeCalendarDisplayOrder(
    orderKeys = DEFAULT_CALENDAR_DISPLAY_ORDER,
    availableKeys = DEFAULT_CALENDAR_DISPLAY_ORDER,
) {
    const uniqueOrderKeys = [...new Set(orderKeys)].filter((key) => availableKeys.includes(key));
    const missingKeys = availableKeys.filter((key) => !uniqueOrderKeys.includes(key));

    return [...uniqueOrderKeys, ...missingKeys];
}

/**
 * 역할: 표시 순서 배열을 기준으로 대상 키별 우선순위 맵을 생성한다.
 * 파라미터 설명:
 * - orderKeys: 표시 대상 키 배열
 * 반환값 설명: 대상 키를 숫자 우선순위로 매핑한 객체
 */
export function getCalendarDisplayOrderMap(orderKeys = DEFAULT_CALENDAR_DISPLAY_ORDER) {
    return Object.fromEntries(
        normalizeCalendarDisplayOrder(orderKeys).map((key, index) => [key, index]),
    );
}

/**
 * 역할: 표시 대상 배열을 사용자 지정 순서 기준으로 정렬한다.
 * 파라미터 설명:
 * - targets: 정렬할 표시 대상 배열
 * - orderKeys: 사용자 지정 표시 순서 배열
 * 반환값 설명: 사용자 지정 순서가 반영된 표시 대상 배열
 */
export function sortCalendarTargets(targets, orderKeys = DEFAULT_CALENDAR_DISPLAY_ORDER) {
    const orderMap = getCalendarDisplayOrderMap(
        orderKeys,
    );

    return [...targets].sort(
        (left, right) =>
            (orderMap[left.key] ?? 99) - (orderMap[right.key] ?? 99),
    );
}
