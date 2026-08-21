import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

export const resolveImageUrl = async (imagePath, req = null) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80';
  
  // If it's a standard URL (like unsplash, cloudfront, or external), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's an S3 key (starts with uploads/)
  if (imagePath.startsWith('uploads/')) {
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: imagePath,
      });
      // Generate presigned URL valid for 1 hour (3600 seconds)
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return presignedUrl;
    } catch (err) {
      console.error('Error generating presigned URL for key:', imagePath, err.message);
      // Fallback
      const region = process.env.AWS_REGION || 'ap-south-1';
      const bucket = process.env.S3_BUCKET_NAME;
      return `https://${bucket}.s3.${region}.amazonaws.com/${imagePath}`;
    }
  }

  // If it's a local fallback (starts with local/)
  if (imagePath.startsWith('local/')) {
    const fileName = imagePath.replace('local/', '');
    const host = req ? (req.get('host') || 'localhost:5001') : 'localhost:5001';
    const protocol = req ? (req.protocol || 'http') : 'http';
    return `${protocol}://${host}/uploads/${fileName}`;
  }

  return imagePath;
};

export const resolveImages = async (imagesArray, req = null) => {
  if (!Array.isArray(imagesArray)) return [];
  const urls = await Promise.all(imagesArray.map(img => resolveImageUrl(img, req)));
  return urls;
};
