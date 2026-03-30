export interface LostArkEvent {
    Title: string;
    StartDate: string;
    EndDate: string;
    Link: string;
}

export interface LostArkNotice {
    Title: string;
    Date: string;
    Link: string;
    Type: string;
}

export interface LostArkRewardItem {
    Name?: string;
    Icon?: string;
    StartTimes?: string[];
}

export interface LostArkRewardGroup {
    Items?: LostArkRewardItem[];
}

export interface LostArkGameContent {
    CategoryName: string;
    ContentsName: string;
    ContentsIcon?: string;
    Icon?: string;
    Image?: string;
    StartTimes?: string[];
    RewardItems?: Array<LostArkRewardGroup | LostArkRewardItem[] | LostArkRewardItem>;
}
