import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Generate signature for direct client-side upload
export function generateSignature(paramsToSign: any): { signature: string; timestamp: number } {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { ...paramsToSign, timestamp },
    process.env.CLOUDINARY_API_SECRET || ''
  );
  
  return { signature, timestamp };
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.destroy(publicId, { resource_type: 'raw' }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Get file info from Cloudinary
export async function getCloudFileInfo(publicId: string) {
  return new Promise((resolve, reject) => {
    cloudinary.api.resource(publicId, { resource_type: 'raw' }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}
