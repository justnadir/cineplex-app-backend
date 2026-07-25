import { MOVIE_CATEGORY, MOVIE_STATUS } from "../../enums";

export interface IMovie {
  id: number;
  movie_poster: string;
  title: string;
  category: MOVIE_CATEGORY;
  admin_id: string;
  actor: string;
  genre: string;
  release_date: Date;
  duration: string;
  language: string;
  synopsis: string;
  trailer: string;
  status: MOVIE_STATUS;
  created_at: Date;
  updated_at: Date;
}

export type ICreateMovie = Omit<
  IMovie,
  "id" | "status" | "created_at" | "updated_at"
>;

export interface IMovieUpdate {
  movie_poster?: string;
  title?: string;
  category?: MOVIE_CATEGORY;
  actor?: string;
  genre?: string;
  release_date?: Date;
  duration?: string;
  language?: string;
  synopsis?: string;
  trailer?: string;
  status?: MOVIE_STATUS;
}
