/**
 * 역할: 카오스게이트용 자체 제작 포털 아이콘을 렌더링한다.
 * 파라미터 설명:
 * - className: 외부에서 주입하는 아이콘 크기 및 정렬 클래스 문자열
 * 반환값 설명: 카오스게이트 분위기의 SVG 아이콘 JSX
 */
export function ChaosGateIcon({ className = "" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <defs>
                <linearGradient id="chaosGateGradient" x1="5" y1="4" x2="19" y2="20">
                    <stop offset="0%" stopColor="#c39bff" />
                    <stop offset="55%" stopColor="#7b3fe4" />
                    <stop offset="100%" stopColor="#41207f" />
                </linearGradient>
            </defs>
            <path
                d="M12 2.75c4.9 0 8.75 4.04 8.75 9.25S16.9 21.25 12 21.25 3.25 17.21 3.25 12 7.1 2.75 12 2.75Z"
                fill="url(#chaosGateGradient)"
            />
            <path
                d="M12 5.1c3.45 0 6.15 2.93 6.15 6.9s-2.7 6.9-6.15 6.9S5.85 15.97 5.85 12 8.55 5.1 12 5.1Z"
                fill="#1d1038"
                fillOpacity="0.72"
            />
            <path
                d="M9.25 7.8c1.3.2 2.05 1.14 2.05 2.28 0 1.06-.66 1.82-1.75 2.14-1.02.3-1.69.92-1.69 1.8 0 .72.4 1.37 1.22 1.94"
                stroke="#f2e8ff"
                strokeWidth="1.25"
                strokeLinecap="round"
            />
            <path
                d="M14.9 7.15c-1.67 1.15-2.54 2.3-2.54 3.53 0 1.1.68 1.75 1.77 2.2 1.06.43 1.77 1 1.77 1.97 0 .67-.34 1.34-1.05 2.06"
                stroke="#f7f2ff"
                strokeWidth="1.25"
                strokeLinecap="round"
            />
            <circle cx="12.2" cy="12.3" r="1.35" fill="#ffffff" fillOpacity="0.95" />
        </svg>
    );
}

/**
 * 역할: 필드보스용 자체 제작 위협 아이콘을 렌더링한다.
 * 파라미터 설명:
 * - className: 외부에서 주입하는 아이콘 크기 및 정렬 클래스 문자열
 * 반환값 설명: 필드보스 분위기의 SVG 아이콘 JSX
 */
export function FieldBossIcon({ className = "" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <defs>
                <linearGradient id="fieldBossGradient" x1="4" y1="4" x2="20" y2="20">
                    <stop offset="0%" stopColor="#ff9a7a" />
                    <stop offset="55%" stopColor="#c24444" />
                    <stop offset="100%" stopColor="#5a1717" />
                </linearGradient>
            </defs>
            <path
                d="M12 3.2c1.65 0 2.73 1.38 3.54 2.55.47.69.95 1.06 1.68 1.29 1.65.52 3.13 1.44 3.13 3.35 0 1.22-.65 2.12-1.55 2.88-.53.46-.83.91-.96 1.57-.42 2.15-2.1 3.96-4.8 3.96s-4.38-1.81-4.8-3.96c-.13-.66-.43-1.11-.96-1.57-.9-.76-1.55-1.66-1.55-2.88 0-1.91 1.48-2.83 3.13-3.35.73-.23 1.21-.6 1.68-1.29.81-1.17 1.89-2.55 3.54-2.55Z"
                fill="url(#fieldBossGradient)"
            />
            <path
                d="M8.35 8.2 6.8 6.3M15.65 8.2l1.55-1.9"
                stroke="#ffe9e2"
                strokeWidth="1.25"
                strokeLinecap="round"
            />
            <path
                d="M8.25 12.15c0-1.02.78-1.8 1.75-1.8s1.75.78 1.75 1.8c0 1.01-.78 1.77-1.75 1.77s-1.75-.76-1.75-1.77ZM12.25 12.15c0-1.02.78-1.8 1.75-1.8s1.75.78 1.75 1.8c0 1.01-.78 1.77-1.75 1.77s-1.75-.76-1.75-1.77Z"
                fill="#2a0909"
            />
            <path
                d="M9.4 12.1c.36 0 .66-.32.66-.72s-.3-.71-.66-.71-.65.31-.65.71.29.72.65.72ZM13.4 12.1c.36 0 .66-.32.66-.72s-.3-.71-.66-.71-.65.31-.65.71.29.72.65.72Z"
                fill="#fff5f2"
            />
            <path
                d="M9.2 15.8c.84.57 1.79.84 2.8.84 1.02 0 1.97-.27 2.8-.84"
                stroke="#ffe4dc"
                strokeWidth="1.25"
                strokeLinecap="round"
            />
        </svg>
    );
}
