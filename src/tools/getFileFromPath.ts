import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from "fs";
import * as path from "path";

export const getFileFromPath: Tool = {
  name: "getFileFromPath",
  description: "Retrieves a file from the local file system given a path.",
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "The absolute path to the file.",
      },
    },
    required: ["filePath"],
  },
};

export interface GetFileFromPathArgs {
  filePath: string;
}

export async function handleGetFileFromPath(args: GetFileFromPathArgs): Promise<string> {
  const { filePath } = args;
  if (!path.isAbsolute(filePath)) {
    throw new Error("File path must be absolute: ${filePath}.");
  }
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`File not found at path: ${filePath}`);
    }
    throw new Error(`Failed to read file at path ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
