import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3.js";
import crypto from "crypto";

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

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const region = process.env.AWS_REGION || 'ap-south-1';
    const bucket = process.env.S3_BUCKET_NAME;
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return res.status(200).json({
      message: "File uploaded successfully",
      key,
      url,
      originalName: file.originalname,
      contentType: file.mimetype,
      size: file.size,
    });

  } catch (error) {
    console.error("S3 upload error:", error);
    return res.status(500).json({
      message: "Failed to upload file",
      error: error.message,
    });
  }
};
