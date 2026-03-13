import * as fs from "fs";
import * as path from "path";

export type EncodedScreenshot = {
  filename: string;
  base64: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
};

const SUPPORTED_EXTENSIONS: Record<string, EncodedScreenshot["mediaType"]> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function validateAndEncodeScreenshots(
  screenshotPaths: string[]
): EncodedScreenshot[] {
  if (screenshotPaths.length === 0) {
    throw new Error("At least one screenshot is required.");
  }

  return screenshotPaths.map((filePath) => {
    const resolved = path.resolve(filePath);

    if (!fs.existsSync(resolved)) {
      throw new Error(`Screenshot not found: ${resolved}`);
    }

    const ext = path.extname(resolved).toLowerCase();
    const mediaType = SUPPORTED_EXTENSIONS[ext];

    if (!mediaType) {
      throw new Error(
        `Unsupported image format: ${ext}. Supported: ${Object.keys(SUPPORTED_EXTENSIONS).join(", ")}`
      );
    }

    const buffer = fs.readFileSync(resolved);
    const base64 = buffer.toString("base64");

    return {
      filename: path.basename(resolved),
      base64,
      mediaType,
    };
  });
}
