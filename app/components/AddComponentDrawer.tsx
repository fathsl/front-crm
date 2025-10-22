import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { type Category, type Component } from "~/help";

export const AddComponentDrawer = ({
  category,
  onClose,
  onSubmit,
  editingComponent,
}: {
  onClose: () => void;
  onSubmit: (component: Component, isEdit: boolean) => void;
  category: Category;
  editingComponent?: Component | null;
}) => {
  const [formData, setFormData] = useState<{
  bilesenAdi: string;
  birim: string;
  stok: number;
  fiyat: number;
  adet: number;
  currency: string;
  }>({
    bilesenAdi: '',
    birim: 'Set',
    stok: 0,
    fiyat: 0,
    adet: 0,
    currency: 'TRY',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = "https://api-crm-tegd.onrender.com";

  const isEditMode = !!editingComponent;

  useEffect(() => {
    if (editingComponent) {
      setFormData({
        bilesenAdi: editingComponent.bilesenAdi || '',
        birim: editingComponent.birim || 'Set',
        stok: editingComponent.stok || 0,
        fiyat: editingComponent.fiyat || 0,
        adet: editingComponent.adet || 1,
        currency: editingComponent.currency || 'TRY',
      });
    } else {
      setFormData({
        bilesenAdi: '',
        birim: 'Set',
        stok: 0,
        fiyat: 0,
        adet: 1,
        currency: 'TRY',
      });
    }
  }, [editingComponent]);

  const handleDeleteFromKategori = async (kategoriId: number, bilesenId: number) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/bilesen/kategori/${kategoriId}/bilesen/${bilesenId}`,
        {
          method: 'DELETE',
        }
      );
      
      if (response.ok) {
        console.log('Bilesen removed from kategori successfully');
      } else {
        const error = await response.json();
        console.error('Error:', error.message);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = isEditMode 
        ? `${baseUrl}/api/Bilesen/${editingComponent.bilesenID}`
        : `${baseUrl}/api/Bilesen`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kategoriID: category?.kategoriID,
          bilesenAdi: formData.bilesenAdi,
          birim: formData.birim,
          stok: formData.stok,
          fiyat: formData.fiyat,
          adet: formData.adet,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} component`);
      }

      const component = await response.json();
      onSubmit(component, isEditMode);
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getBirimLabel = (value: string): string => {
    switch (value) {
      case 'Set':
        return 'Set';
      case 'M':
        return 'M (Meter)';
      case 'M2':
        return 'M² (Square Meter)';
      case 'Kg':
        return 'Kg (Kilogram)';
      case 'Pcs':
        return 'Pcs (Pieces)';
      default:
        return 'Set';
    }
  };

  const birimOptions = ['Set', 'M', 'M2', 'Kg', 'Pcs'];
  const currencyOptions = ['TRY', 'USD', 'EUR'];

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Component' : 'Add New Component'}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <X  size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Component Name *
            </label>
            <input
              type="text"
              value={formData.bilesenAdi}
              onChange={(e) =>
                setFormData({ ...formData, bilesenAdi: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit *
            </label>
            <select
              value={formData.birim}
              onChange={(e) =>
                setFormData({ ...formData, birim: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            >
              {birimOptions.map((option) => (
                <option key={option} value={option}>
                  {getBirimLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock
            </label>
            <input
              type="number"
              value={formData.stok}
              onChange={(e) =>
                setFormData({ ...formData, stok: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-row gap-2 items-center justify-between">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.fiyat}
              onChange={(e) =>
                setFormData({ ...formData, fiyat: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              disabled={isLoading}
            />
            </div>
            <div className="mt-5">
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({ ...formData, currency: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
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
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {isLoading 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Component' : 'Create Component')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};