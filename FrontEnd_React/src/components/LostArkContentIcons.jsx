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
                <linearGradient id="chaosGateGearGradient" x1="4" y1="4" x2="20" y2="20">
                    <stop offset="0%" stopColor="#e2c9ff" />
                    <stop offset="48%" stopColor="#8a43f2" />
                    <stop offset="100%" stopColor="#31105f" />
                </linearGradient>
                <radialGradient id="chaosGateHoleGradient" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#020103" />
                    <stop offset="22%" stopColor="#12061f" />
                    <stop offset="48%" stopColor="#3d136f" />
                    <stop offset="72%" stopColor="#8b47f7" />
                    <stop offset="100%" stopColor="#eedfff" />
                </radialGradient>
                <linearGradient id="chaosGateHighlight" x1="7" y1="7" x2="17" y2="17">
                    <stop offset="0%" stopColor="#f8f1ff" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#d1aeff" stopOpacity="0.18" />
                </linearGradient>
            </defs>
            <path
                d="M12 2.15 14.02 3.63 16.42 2.98 17.42 5.25 19.9 5.65 19.67 8.12 21.85 9.38 20.45 11.44 21.2 13.85 18.92 14.8 18.6 17.28 16.12 17.15 14.95 19.35 12.78 18.15 10.58 19.35 9.42 17.15 6.93 17.28 6.62 14.8 4.33 13.85 5.08 11.44 3.68 9.38 5.87 8.12 5.63 5.65 8.12 5.25 9.12 2.98 11.52 3.63 12 2.15Z"
                fill="url(#chaosGateGearGradient)"
            />
            <path
                d="M12 5.25c3.74 0 6.75 3.01 6.75 6.75s-3.01 6.75-6.75 6.75S5.25 15.74 5.25 12 8.26 5.25 12 5.25Z"
                fill="#140522"
                fillOpacity="0.9"
            />
            <path
                d="M8.05 7.9c1.44-.82 3.1-1.1 4.63-.73 1.61.38 2.9 1.48 3.45 2.95.47 1.25.36 2.66-.3 3.86-.68 1.22-1.84 2.12-3.2 2.42-1.2.27-2.45.1-3.56-.48"
                stroke="url(#chaosGateHighlight)"
                strokeWidth="1.08"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.95 8.55c-.45 1.25-1.36 2.04-2.47 2.53-1.17.51-2.03 1.14-2.27 2.25-.2.97.17 1.93 1.02 2.85"
                stroke="#f5ecff"
                strokeWidth="1.08"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12 8.15c2.4 0 4.35 1.95 4.35 4.35S14.4 16.85 12 16.85 7.65 14.9 7.65 12.5 9.6 8.15 12 8.15Z"
                fill="url(#chaosGateHoleGradient)"
            />
            <ellipse
                cx="12.15"
                cy="12.45"
                rx="2.5"
                ry="1.95"
                fill="#05020a"
                transform="rotate(-16 12.15 12.45)"
            />
            <ellipse
                cx="12.35"
                cy="11.95"
                rx="1.1"
                ry="0.7"
                fill="#f7f0ff"
                fillOpacity="0.82"
                transform="rotate(-16 12.35 11.95)"
            />
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
