const ko = {
    app: {
        eyebrow: "프론트엔드",
        title: "월간 달력",
        description:
            "FullCalendar 월간 뷰가 준비되어 있습니다. 일정 데이터는 다음 단계에서 연결할 예정입니다.",
    },
    calendar: {
        firstDayLabel: "시작 요일",
        todayFocusLabel: "오늘 날짜 강조 표시",
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
                description: "달력의 가장 왼쪽에 표시되는 요일을 선택합니다.",
            },
        },
    },
    filters: {
        title: "표시",
        description: "달력에 표시할 항목만 선택해서 볼 수 있습니다.",
        targets: {
            event: "이벤트",
            notice: "공지",
            adventureIsland: "모험섬",
            chaosGate: "카오스게이트",
            fieldBoss: "필드보스",
            package: "패키지",
            custom: "커스텀 일정",
        },
        notice: {
            categories: "카테고리",
        },
        adventureIsland: {
            rewards: "보상",
            islands: "섬",
            selectAll: "전체 선택/해제",
        },
    },
    displayOptions: {
        title: "표시 옵션",
        options: {
            text: "글자",
            icon: "아이콘",
            image: "이미지",
            period: "오전/오후",
        },
    },
};

export default ko;
