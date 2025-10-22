import { X } from "lucide-react";
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
      } else {
        setFormData({
          kategoriAdi: '',
          stok: '',
          fiyat: '',
          currency: 'TRY',
        });
      }
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
      const payload = {
        kategoriAdi: formData.kategoriAdi.trim(),
        stok: formData.stok ? parseInt(formData.stok) : null,
        fiyat: parseFloat(formData.fiyat),
        currency: formData.currency,
        createdBy: currentUserId,
        updatedBy: isEditMode ? currentUserId : undefined,
      };

      const url = isEditMode
        ? `${baseUrl}/api/Categories/${category.kategoriID}`
        : `${baseUrl}/api/Categories`;

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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