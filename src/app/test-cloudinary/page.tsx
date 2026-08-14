import CloudinaryTest from '@/components/dashboard/CloudinaryTest';

export const metadata = {
  title: 'Cloudinary Upload Test',
  description: 'Test unsigned upload to Cloudinary',
};

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-center mb-8">
        ☁️ Cloudinary Unsigned Upload Test
      </h1>
      <p className="text-center mb-8 text-gray-600">
        Halaman test untuk memastikan upload TANPA signature berfungsi
      </p>
      <CloudinaryTest />
    </div>
  );
}
