const ko = {
    app: {
        eyebrow: "프론트엔드",
        title: "월간 달력",
        description:
            "FullCalendar 월간 뷰가 준비되어 있습니다. 일정 데이터는 다음 단계에서 연결할 예정입니다.",
    },
    calendar: {
        firstDayLabel: "시작 요일",
        firstDayOptions: {
            sunday: "일요일",
            monday: "월요일",
            wednesday: "수요일",
        },
        buttons: {
            today: "오늘",
        },
    },
    remote: {
        title: "캘린더 리모콘",
        description: "달력 표시 기준을 한 곳에서 조정할 수 있습니다.",
        sections: {
            firstDay: {
                title: "달력 형태",
                description: "달력의 가장 왼쪽에 표시될 요일을 선택합니다.",
            },
        },
    },
    filters: {
        title: "표시",
        description: "달력에 표시할 항목만 선택해서 볼 수 있습니다.",
        targets: {
            event: "이벤트",
            adventureIsland: "모험섬",
            chaosGate: "카오스게이트",
            fieldBoss: "필드보스",
        },
        adventureIsland: {
            rewards: "보상별 표시",
            islands: "섬별 표시",
        },
    },
    displayOptions: {
        title: "세부 내용",
        options: {
            text: "이름",
            icon: "아이콘",
        },
    },
};

export default ko;
