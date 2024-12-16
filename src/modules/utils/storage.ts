import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { promisify } from 'util';
import config from '../../config/config';

const keyPath = path.join(__dirname, '..', '..', '..', 'service_account.json');

// Google Cloud Storage configuration
const storage = new Storage({
  keyFilename: keyPath, // Path to your service account key file
});

const bucket = storage.bucket(config.gcp.bucketName);

// Define allowed file types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

type AllowedMimeType = keyof typeof ALLOWED_FILE_TYPES;

// Ensure uploads directory exists
const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}`;
    cb(null, `${file.fieldname}-${config.gcp.bucketName}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Multer upload configuration
export const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (_req, file, cb) => {
    const mimetype = file.mimetype as AllowedMimeType;
    if (mimetype in ALLOWED_FILE_TYPES) {
      cb(null, true);
    } else {
      cb(new Error('Error: Only allowed file types are accepted.'));
    }
  },
});

// Helper function to upload multiple files to Google Cloud Storage
export const uploadFilesToGCS = async (files: Express.Multer.File[]): Promise<Express.Multer.File[]> => {
  const uploadPromises = files.map(async (file) => {
    console.log('🚀 ~ uploadPromises ~ file: before Upload file to GCS', file);
    // Upload file to GCS
    await bucket.upload(file.path, {
      destination: file.filename,
      metadata: {
        contentType: file.mimetype,
      },
    });

    // Remove the file from local storage after successful GCS upload
    await promisify(fs.unlink)(file.path);
    console.log('🚀 ~ uploadPromises ~ file: after Upload file to GCS', file);
    return file;
  });

  // Wait for all uploads to complete
  return Promise.all(uploadPromises);
};

// Helper function to get download URLs for multiple files
export const getMultipleDownloadURLs = async (fileKeys: string[]) => {
  const urlPromises = fileKeys.map(async (fileKey) => {
    const [url] = await bucket.file(fileKey).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 3600 * 1000, // URL expires in 1 hour
    });
    return {
      filename: fileKey,
      downloadUrl: url,
    };
  });

  return Promise.all(urlPromises);
};

// Optional: Get public URLs for multiple files
export const getMultiplePublicURLs = (fileKeys: string[]) => {
  return fileKeys.map((fileKey) => ({
    filename: fileKey,
    publicUrl: `https://storage.googleapis.com/${config.gcp.bucketName}/${fileKey}`,
  }));
};
