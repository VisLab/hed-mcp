import { promises as fs } from "fs";
import * as path from "path";

/**
 * Reads a file from the local file system given an absolute path.
 * This is a shared utility used by multiple MCP tools.
 * 
 * @param filePath - The absolute path to the file
 * @returns Promise<string> - The file contents as a string
 * @throws Error if the path is not absolute, file is not found, or other read errors occur
 */
export async function readFileFromPath(filePath: string): Promise<string> {
  if (!path.isAbsolute(filePath)) {
    throw new Error(`File path must be absolute: ${filePath}.`);
  }
  
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (error) {
    // Type-safe check for NodeJS.ErrnoException
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(`File not found at path: ${filePath}`);
    }
    throw new Error(`Failed to read file at path ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
