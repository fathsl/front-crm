import { Edit2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Category } from "~/help";

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  currentUserId: number;
  onSuccess: () => void;
}

export const AddCategoryDrawer = ({
  isOpen,
  onClose,
  category,
  currentUserId,
  onSuccess,
}: CategoryDrawerProps) => {
  const [formData, setFormData] = useState({
    kategoriAdi: '',
    stok: '',
    fiyat: '',
    currency: 'TRY',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = "https://api-crm-tegd.onrender.com";

  const isEditMode = category !== null;

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          kategoriAdi: category.kategoriAdi || '',
          stok: category.stok?.toString() || '',
          fiyat: category.fiyat?.toString() || '',
          currency: category.currency || 'TRY',
        });
        setImagePreview(category.imageUrl || '');
      } else {
        setFormData({
          kategoriAdi: '',
          stok: '',
          fiyat: '',
          currency: 'TRY',
        });
        setImagePreview('');
      }
      setImageFile(null);
      setError('');
    }
  }, [isOpen, category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.kategoriAdi.trim()) {
      setError('Category name is required');
      return false;
    }
    if (!formData.fiyat || parseFloat(formData.fiyat) < 0) {
      setError('Valid price is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('kategoriAdi', formData.kategoriAdi.trim());
      formDataToSend.append('stok', formData.stok || '');
      formDataToSend.append('fiyat', formData.fiyat);
      formDataToSend.append('currency', formData.currency);
      
      if (isEditMode) {
        formDataToSend.append('updatedBy', currentUserId.toString());
      } else {
        formDataToSend.append('createdBy', currentUserId.toString());
      }

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const url = isEditMode
        ? `${baseUrl}/api/Categories/${category.kategoriID}`
        : `${baseUrl}/api/Categories`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save category');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currencyOptions = ['TRY', 'USD', 'EUR'];

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl z-50 transform transition-transform">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditMode ? 'Edit Category' : 'Add New Category'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="kategoriAdi" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="kategoriAdi"
                  name="kategoriAdi"
                  value={formData.kategoriAdi}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Enter category name"
                />
              </div>

                <div>
                    <label htmlFor="stok" className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                    </label>
                    <input
                    type="number"
                    id="stok"
                    name="stok"
                    value={formData.stok}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter stock quantity"
                    min="0"
                    />
                </div>

                <div className="flex flex-row gap-2 justify-between">
                    <div>
                    <label htmlFor="fiyat" className="block text-sm font-medium text-gray-700 mb-1">
                        Price <span className="text-red-500">*</span>
                    </label>
                    <input
                    type="number"
                    id="fiyat"
                    name="fiyat"
                    value={formData.fiyat}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter price"
                    step="0.01"
                    min="0"
                    />
                </div>
                <div className="mt-6">
                    <select
                        value={formData.currency}
                        onChange={(e) =>
                            setFormData({ ...formData, currency: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={loading}
                        >
                        {currencyOptions.map((option) => (
                            <option key={option} value={option}>
                            {option}
                            </option>
                        ))}
                    </select>
                </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {imagePreview ? (
                        <div className="">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                          />
                          <div className="flex gap-2 mt-2">
                            <label
                              htmlFor="image-upload"
                              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer text-center"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview('');
                              }}
                              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="mt-2 text-sm text-gray-600">
                            Click to upload image
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}