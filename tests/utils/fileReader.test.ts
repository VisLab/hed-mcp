import { readFileFromPath } from '../../src/utils/fileReader';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('fileReader utility', () => {
  const testFilePath = path.join(__dirname, 'test-file.txt');
  const testContent = 'This is test content for file reader utility';

  beforeAll(async () => {
    // Create a test file
    await fs.writeFile(testFilePath, testContent, 'utf8');
  });

  afterAll(async () => {
    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('readFileFromPath', () => {
    test('should read file content successfully with absolute path', async () => {
      const content = await readFileFromPath(testFilePath);
      expect(content).toBe(testContent);
    });

    test('should throw error for relative path', async () => {
      await expect(readFileFromPath('relative/path.txt')).rejects.toThrow('File path must be absolute');
    });

    test('should throw error for non-existent file', async () => {
      const nonExistentPath = path.join(__dirname, 'non-existent-file.txt');
      await expect(readFileFromPath(nonExistentPath)).rejects.toThrow('File not found at path');
    });

    test('should handle other file system errors gracefully', async () => {
      // Test with a directory path instead of file path
      const dirPath = __dirname;
      await expect(readFileFromPath(dirPath)).rejects.toThrow('Failed to read file at path');
    });
  });
});
