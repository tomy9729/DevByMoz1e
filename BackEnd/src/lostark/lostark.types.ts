export interface LostArkEvent {
    Title: string;
    StartDate: string;
    EndDate: string;
    Link: string;
}

export interface LostArkRewardItem {
    Name?: string;
    StartTimes?: string[];
}

export interface LostArkRewardGroup {
    Items?: LostArkRewardItem[];
}

export interface LostArkGameContent {
    CategoryName: string;
    ContentsName: string;
    StartTimes?: string[];
    RewardItems?: Array<LostArkRewardGroup | LostArkRewardItem[] | LostArkRewardItem>;
}
