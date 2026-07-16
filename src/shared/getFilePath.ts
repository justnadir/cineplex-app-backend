import path from "path";
import { optimizeImage } from "../utils/imageOptimize";
// upload field names (NOTE: the destination folder may differ, e.g. banner_image -> /banners)
type IFolderName =
  | "image"
  | "media"
  | "doc"
  | "banner_image"
  | "category_image"
  | "movie_poster"
  | "user"
  | "news_image";

// single file
export const getSingleFilePath = async (files: any, fieldName: IFolderName) => {
  const fileField = files && files[fieldName];
  if (fileField && Array.isArray(fileField) && fileField.length > 0) {
    // use multer's actual stored path so it works regardless of field/folder naming
    const originalFilePath = fileField[0].path;
    const optimizedFilePath = await optimizeImage(originalFilePath);

    const relativePath = optimizedFilePath.replace(
      path.join(process.cwd(), "uploads"),
      ""
    );
    return `${relativePath.replace(/\\/g, "/")}`;
  }
  return undefined;
};

//multiple files
export const getMultipleFilesPath = async (
  files: any,
  fieldName: IFolderName
) => {
  const folderFiles = files && files[fieldName];

  if (folderFiles && Array.isArray(folderFiles)) {
    const optimizedPaths = await Promise.all(
      folderFiles.map(async (file: any) => {
        const originalFilePath = file.path;

        const optimizedFilePath = await optimizeImage(originalFilePath);

        // Convert absolute path to a proper relative path
        const relativePath = optimizedFilePath.replace(
          path.join(process.cwd(), "uploads"),
          ""
        );
        return `${relativePath.replace(/\\/g, "/")}`;
      })
    );

    return optimizedPaths;
  }

  return undefined;
};
