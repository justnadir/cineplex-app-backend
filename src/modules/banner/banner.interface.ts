import { BANNER_STATUS } from "../../enums";

export interface IBanner {
  id: number;
  title: string;
  banner_image: string;
  status: BANNER_STATUS;
  created_at: Date;
  updated_at: Date;
}

export type ICreateBanner = Omit<
  IBanner,
  "id" | "created_at" | "status" | "created_at" | "updated_at"
>;

export interface IBannerUpdate {
  title?: string;
  banner_image?: string;
  status?: BANNER_STATUS;
}
