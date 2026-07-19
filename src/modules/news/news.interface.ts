import { NEWS_STATUS } from "../../enums";

export interface INews {
    id?: number;
    title: string;
    news_image: string;
    content: string;
    status: NEWS_STATUS;
    created_at: Date;
    updated_at: Date;
}

export type ICreateNews = Omit<
    INews,
    "id" | "status" | "created_at" | "updated_at"
>;

export interface INewsUpdate {
    title?: string;
    news_image?: string;
    content?: string;
    status?: NEWS_STATUS;
}
