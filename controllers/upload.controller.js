import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3.js";
import crypto from "crypto";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const file = req.file;
    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    const key = `uploads/${fileName}`;

    try {
      // Try S3 upload first
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      const region = process.env.AWS_REGION || 'ap-south-1';
      const bucket = process.env.S3_BUCKET_NAME;
      
      let url;
      if (process.env.CLOUDFRONT_URL) {
        const cfBase = process.env.CLOUDFRONT_URL.replace(/\/$/, "");
        url = `${cfBase}/${key}`;
      } else {
        url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      }

      return res.status(200).json({
        message: "File uploaded successfully to S3",
        key,
        url,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        provider: "s3"
      });
    } catch (s3Error) {
      // If credential error or any S3 issue, fallback to local storage for local testing
      console.warn("S3 upload failed, falling back to local storage:", s3Error.message);
      
      const serverDir = path.join(__dirname, '..');
      const localUploadsDir = path.join(serverDir, 'uploads');
      if (!fs.existsSync(localUploadsDir)) {
        fs.mkdirSync(localUploadsDir, { recursive: true });
      }

      const filePath = path.join(localUploadsDir, fileName);
      fs.writeFileSync(filePath, file.buffer);

      // Construct local URL
      const host = req.get('host') || 'localhost:5001';
      const protocol = req.protocol || 'http';
      const url = `${protocol}://${host}/uploads/${fileName}`;

      return res.status(200).json({
        message: "File uploaded successfully (Local Fallback)",
        key: `local/${fileName}`,
        url,
        originalName: file.originalname,
        contentType: file.mimetype,
        size: file.size,
        provider: "local"
      });
    }

  } catch (error) {
    console.error("Upload controller error:", error);
    return res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
};
