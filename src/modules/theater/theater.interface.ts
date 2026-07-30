import { THEATER_STATUS } from "../../enums";

export interface ITheater {
  id: number;
  admin_id: number;
  name: string;
  code: string; // short name of the theater, e.g. "BSC"
  location: string;
  status: THEATER_STATUS;
  created_at: Date;
  updated_at: Date;
}

// id/is_active/created_at/updated_at are auto-handled by DB.
export type ICreateTheater = Omit<
  ITheater,
  "id" | "status" | "created_at" | "updated_at"
>;

// Update = every create field optional also is_active toggle.
export type IUpdateTheater = Partial<ICreateTheater> & {
  status?: THEATER_STATUS;
};
