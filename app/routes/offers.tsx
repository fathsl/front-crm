import { Building2, Calendar, DollarSign, FileText, Package, Plus, Search, Tag, UserIcon } from 'lucide-react';
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
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Offer No</p>
                        <p className="text-2xl font-bold text-gray-900">#{offer.teslimatID}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-xl border border-blue-100">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-600 font-semibold uppercase">Total Price</p>
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(offer.fiyat)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Customer</p>
                        <p className="text-gray-900 font-bold text-base truncate">
                          {offer.musteriID || 'Belirtilmemiş'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">User</p>
                        <p className="text-gray-900 font-bold text-base truncate">
                          {offer.kullaniciID || 'Belirtilmemiş'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                        <Tag className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Category</p>
                        <p className="text-gray-900 font-bold text-base truncate">
                          {offer.kategoriID || 'Belirtilmemiş'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Quantity</p>
                        <p className="text-gray-900 font-bold text-base">
                          {offer.miktar}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-rose-600 font-semibold uppercase tracking-wide">Delivery Date</p>
                        <p className="text-gray-900 font-bold text-base">
                          {formatDate(offer.teslimatTarihi)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {offer.teslimatBilgisi && (
                    <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Delivery Information
                      </p>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {offer.teslimatBilgisi}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95">
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