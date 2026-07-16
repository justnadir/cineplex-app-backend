import { Request } from "express";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import ApiError from "../errors/ApiErrors";

// maps the upload field name -> destination folder under /uploads
const uploadDirectories: Record<string, string> = {
  image: "image",
  banner_image: "banners",
  category_image: "categories",
  movie_poster: "movies",
  news_image: "news",
  video: "video",
  doc: "doc",
  pdf: "pdf",
};

const fileUploadHandler = () => {
  //create upload folder
  const baseUploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir);
  }

  //folder create for different file
  const createDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  };

  //create filename
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folderName = uploadDirectories[file.fieldname];

      if (!folderName) {
        return cb(
          new ApiError(StatusCodes.BAD_REQUEST, "File type not supported"),
          ""
        );
      }

      const uploadDir = path.join(baseUploadDir, folderName);
      createDir(uploadDir);
      cb(null, uploadDir);
    },

    filename: (_req, file, cb) => {
      const fileExt = path.extname(file.originalname).toLowerCase();
      const random = Math.random().toString(36).slice(2, 6); // 4-char unique suffix
      cb(null, `${Date.now()}-${random}${fileExt}`);
    },
  });

  //allowed mime types
  const allowedMimeTypes: Record<string, string[]> = {
    image: ["image/jpeg", "image/png", "image/jpg"],
    banner_image: ["image/jpeg", "image/png", "image/jpg"],
    category_image: ["image/jpeg", "image/png", "image/jpg"],
    movie_poster: ["image/jpeg", "image/png", "image/jpg"],
    news_image: ["image/jpeg", "image/png", "image/jpg"],
    pdf: ["application/pdf"],
    doc: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    video: ["video/mp4", "video/mpeg"],
  };

  //file filter
  const filterFilter = (_req: Request, file: any, cb: FileFilterCallback) => {
    //allowed mime types
    const allowedTypes = allowedMimeTypes[file.fieldname];

    //check allowed mime types
    if (!allowedTypes) {
      return cb(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          `File field '${file.fieldname}' is not supported`
        )
      );
    }

    //check file type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          `File type '${file.mimetype}' is not supported`
        )
      );
    }
    cb(null, true);
  };

  const upload = multer({
    storage: storage,
    fileFilter: filterFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  }).fields([
    { name: "image", maxCount: 3 },
    { name: "banner_image", maxCount: 1 },
    { name: "category_image", maxCount: 1 },
    { name: "movie_poster", maxCount: 1 },
    { name: "news_image", maxCount: 1 },
  ]);
  return upload;
};

export default fileUploadHandler;
