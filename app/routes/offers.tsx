import { FileText, Package, Plus, Search, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { Offer } from '~/help';

export default function Offers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const baseUrl = "https://api-crm-tegd.onrender.com";

  const handleSearch = (query: string) => {
    setSearchTerm(query);
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Offers`);
      if (response.ok) {
        const data = await response.json();
        setOffers(data);
      } else {
        throw new Error('Failed to fetch offers');
      }
    } catch (err) {
      setError('Teklifler yüklenirken hata oluştu');
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter(offer =>
    offer.musteriID?.toString().includes(searchTerm) ||
    offer.kullaniciID?.toString().includes(searchTerm) ||
    offer.kategoriID?.toString().includes(searchTerm) ||
    offer.teslimatID?.toString().includes(searchTerm)
  );

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };


  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-white shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Offers</h1>
              <p className="mt-1 text-sm text-gray-500">Manage your offers and their information</p>
            </div>
            <div className='flex flex-row gap-4 items-center justify-center'>
              <button
              onClick={() => navigate('/offers/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className='hidden md:block'>New</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Teklif ara..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
      <div className="w-full">
      <div className="space-y-4">
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No offer found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <div
                key={offer.teslimatID}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3 pb-3 border-b mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-gray-900">#{offer.teslimatID}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(offer.fiyat)}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Customer</p>
                      <p className="font-medium text-gray-900 truncate">{offer.musteriID || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">User</p>
                      <p className="font-medium text-gray-900 truncate">{offer.kullaniciID || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Category</p>
                      <p className="font-medium text-gray-900 truncate">{offer.kategoriID || 'N/A'}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                      <p className="font-medium text-gray-900">{offer.miktar}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Delivery Date</p>
                      <p className="font-medium text-gray-900">{formatDate(offer.teslimatTarihi)}</p>
                    </div>
                  </div>

                  {offer.teslimatBilgisi && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      {offer.teslimatBilgisi}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      )}

      {!loading && !error && offers.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No offers found' : 'No offers added yet'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/offers/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create New Offer
            </button>
          )}
        </div>
      )}
    </div>
    </div>
  );
}