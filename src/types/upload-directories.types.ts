export const uploadDirectories = {
  banner_image: "banners",
  category_image: "categories",
  movie_poster: "movies",
  news_image: "news",
  user: "users",
} as const;

export type FolderName = keyof typeof uploadDirectories;

export const FOLDERS_NAMES = Object.keys(uploadDirectories).reduce(
  (acc, key) => ({ ...acc, [key]: key }),
  {} as Record<FolderName, FolderName>
);
