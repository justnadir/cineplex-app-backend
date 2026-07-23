import { COMMENT_STATUS } from "../../enums";

export interface IComment {
  id: number;
  news_id: number;
  nick_name: string;
  email: string;
  content: string;
  status: COMMENT_STATUS;
  created_at: Date;
  updated_at: Date;
}

export type ICreateComment = Omit<
  IComment,
  "id" | "status" | "created_at" | "updated_at"
>;
