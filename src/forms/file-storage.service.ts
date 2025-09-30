import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

@Injectable()
export class FileStorageService {
  private readonly storageDir = join(process.cwd(), 'storage', 'forms');
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB per file

  constructor() {
    this.ensureStorageDirectory();
  }

  private async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      console.log(`Form storage directory created: ${this.storageDir}`);
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Store form data as a file and return the file path
   */
  async storeFormData(formId: string, data: any, options: {
    compress?: boolean;
    format?: 'json' | 'txt';
  } = {}): Promise<{
    filePath: string;
    fileSize: number;
    compressed: boolean;
  }> {
    const { compress = true, format = 'json' } = options;
    
    try {
      // Create unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const extension = compress ? 'gz' : format;
      const filename = `form_${formId}_${timestamp}_${randomId}.${extension}`;
      const filePath = join(this.storageDir, filename);

      // Prepare data
      let dataToWrite: Buffer;
      let fileSize: number;

      if (format === 'json') {
        const jsonData = JSON.stringify(data, null, 2);
        if (compress) {
          dataToWrite = await gzip(Buffer.from(jsonData));
          fileSize = dataToWrite.length;
        } else {
          dataToWrite = Buffer.from(jsonData);
          fileSize = dataToWrite.length;
        }
      } else {
        dataToWrite = Buffer.from(JSON.stringify(data));
        if (compress) {
          dataToWrite = await gzip(dataToWrite);
        }
        fileSize = dataToWrite.length;
      }

      // Validate file size
      if (fileSize > this.maxFileSize) {
        throw new Error(`File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${this.maxFileSize / 1024 / 1024}MB)`);
      }

      // Write file
      await fs.writeFile(filePath, dataToWrite);
      
      console.log(`Form data stored: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)}MB, compressed: ${compress})`);

      return {
        filePath,
        fileSize,
        compressed: compress
      };
    } catch (error) {
      console.error('Error storing form data:', error);
      throw new Error(`Failed to store form data: ${error.message}`);
    }
  }

  /**
   * Retrieve form data from file
   */
  async retrieveFormData(filePath: string, compressed: boolean = true): Promise<any> {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read file
      const fileBuffer = await fs.readFile(filePath);
      
      // Decompress if needed
      let dataBuffer: Buffer;
      if (compressed) {
        dataBuffer = await gunzip(fileBuffer);
      } else {
        dataBuffer = fileBuffer;
      }

      // Parse JSON
      const data = JSON.parse(dataBuffer.toString());
      
      console.log(`Form data retrieved: ${filePath} (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
      
      return data;
    } catch (error) {
      console.error('Error retrieving form data:', error);
      throw new Error(`Failed to retrieve form data: ${error.message}`);
    }
  }

  /**
   * Update form data in existing file
   */
  async updateFormData(filePath: string, data: any, compressed: boolean = true): Promise<{
    fileSize: number;
  }> {
    try {
      // Store new data (overwrite existing file)
      const result = await this.storeFormData('update', data, { compress: compressed });
      
      // If new file was created, replace the old one
      if (result.filePath !== filePath) {
        await fs.rename(result.filePath, filePath);
      }

      return {
        fileSize: result.fileSize
      };
    } catch (error) {
      console.error('Error updating form data:', error);
      throw new Error(`Failed to update form data: ${error.message}`);
    }
  }

  /**
   * Delete form data file
   */
  async deleteFormData(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`Form data file deleted: ${filePath}`);
    } catch (error) {
      console.error('Error deleting form data:', error);
      // Don't throw error if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw new Error(`Failed to delete form data: ${error.message}`);
      }
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    created: Date;
    modified: Date;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
        created: null,
        modified: null
      };
    }
  }

  /**
   * Clean up old files (optional maintenance)
   */
  async cleanupOldFiles(olderThanDays: number = 30): Promise<number> {
    try {
      const files = await fs.readdir(this.storageDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = join(this.storageDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      console.log(`Cleaned up ${deletedCount} old form files`);
      return deletedCount;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
  }> {
    try {
      const files = await fs.readdir(this.storageDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = join(this.storageDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
      
      return {
        totalFiles: files.length,
        totalSize,
        averageFileSize: files.length > 0 ? totalSize / files.length : 0
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        averageFileSize: 0
      };
    }
  }
}
