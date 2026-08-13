import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Upload PDF to Cloudinary
export async function uploadPDFToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string = 'regulasi'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`;
    
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw', // For PDF files
        folder: folder,
        public_id: uniqueFileName,
        type: 'upload',
        access_mode: 'public',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    ).end(buffer);
  });
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
