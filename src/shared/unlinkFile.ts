import fs from "fs/promises";
import path from "path";

const unlinkFile = async (file: string): Promise<void> => {
  const filePath = path.join("uploads", file);
  try {
    await fs.unlink(filePath);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code !== "ENOENT"
    ) {
      throw error;
    }
  }
};

export default unlinkFile;
