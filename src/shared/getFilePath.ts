import path from "path";
import { optimizeImage } from "../utils/imageOptimize";
import { FolderName } from "../types/upload-directories.types";

type MulterFiles =
  | Express.Multer.File[]
  | { [fieldname: string]: Express.Multer.File[] }
  | undefined;

// single file
export const getSingleFilePath = async (
  files: MulterFiles,
  fieldName: FolderName
) => {
  const fileField =
    files && !Array.isArray(files) ? files[fieldName] : undefined;
  if (fileField && Array.isArray(fileField) && fileField.length > 0) {
    // use multer's actual stored path so it works regardless of field/folder naming
    const originalFilePath = fileField[0]?.path;
    const optimizedFilePath = await optimizeImage(originalFilePath!);

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
  files: MulterFiles,
  fieldName: FolderName
) => {
  const folderFiles =
    files && !Array.isArray(files) ? files[fieldName] : undefined;

  if (folderFiles && Array.isArray(folderFiles)) {
    const optimizedPaths = await Promise.all(
      folderFiles.map(async (file: Express.Multer.File) => {
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
