import { CheckCircle, FileText, MapPin, Package, Plus, Search, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import type { Offer } from '~/help';

export default function Offers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
    offer.siparisNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.teklifNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.musteriAd?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.mUlke?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.kullaniciAdi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    offer.siparisAlID?.toString().includes(searchTerm) ||
    offer.odemeDurum?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarih yok';
    
    const [day, month, year] = dateString.split('/');
    
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ödendi': return 'bg-green-100 text-green-800';
      case 'beklemede': return 'bg-yellow-100 text-yellow-800';
      case 'iptal': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency?: string | null) => {
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ''}`;
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openDetailModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDetailModal(true);
  };

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
              key={offer.siparisAlID}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between pb-3 border-b mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-base sm:text-lg text-gray-900 block truncate">
                          {offer.siparisNo || `#${offer.siparisAlID}`}
                        </span>
                        {offer.teklifNo && (
                          <span className="text-xs text-gray-500">Teklif: {offer.teklifNo}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.odemeDurum)}`}>
                        {offer.odemeDurum}
                      </span>
                      {offer.siparisMiTeklifMi && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {offer.siparisMiTeklifMi}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {offer.sirket}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="text-lg sm:text-xl font-bold text-blue-600">
                      {formatCurrency(offer.toplamFiyat, offer.paraTipi)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatDate(offer.tarih)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1.5 mb-1">
                      <UserIcon className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600">CUSTOMER</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{offer.musteriAd || 'N/A'}</p>
                    {offer.mTelefon && <p className="text-xs text-gray-600 truncate">{offer.mTelefon}</p>}
                    {offer.mMail && <p className="text-xs text-gray-600 truncate">{offer.mMail}</p>}
                    {offer.mVATNumarasi && <p className="text-xs text-gray-500 truncate">VAT: {offer.mVATNumarasi}</p>}
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600">LOCATION</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{offer.mUlke || 'N/A'}</p>
                    {offer.mZipKod && <p className="text-xs text-gray-600 truncate">ZIP: {offer.mZipKod}</p>}
                    {offer.mAdres && <p className="text-xs text-gray-600 line-clamp-2">{offer.mAdres}</p>}
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1.5 mb-1">
                      <UserIcon className="w-3 h-3 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600">ASSIGNED TO</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{offer.kullaniciAdi || 'N/A'}</p>
                    {offer.updatedAt && (
                      <p className="text-xs text-gray-500">Updated: {formatDate(offer.updatedAt)}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-3">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600 mb-0.5">Total</p>
                    <p className="text-sm font-bold text-blue-600 truncate">{formatCurrency(offer.toplamFiyat, offer.paraTipi)}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-xs text-gray-600 mb-0.5">Paid</p>
                    <p className="text-sm font-bold text-green-600 truncate">{formatCurrency(offer.odenenMiktar, offer.paraTipi)}</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <p className="text-xs text-gray-600 mb-0.5">Deposit</p>
                    <p className="text-sm font-bold text-yellow-600 truncate">{formatCurrency(offer.kaparoFiyat, offer.paraTipi)}</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="text-xs text-gray-600 mb-0.5">Remaining</p>
                    <p className="text-sm font-bold text-orange-600 truncate">{formatCurrency(offer.kalanBakiye, offer.paraTipi)}</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600 mb-0.5">Advance %</p>
                    <p className="text-sm font-bold text-purple-600">{offer.pesinYüzde}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Quantity</p>
                    <p className="text-sm font-medium text-gray-900">{offer.mAdet} units</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Delivery Count</p>
                    <p className="text-sm font-medium text-gray-900">{offer.mTeslimat}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Delivery Type</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{offer.teslimatÇeşiti || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Assembly</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{offer.montaj || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {offer.muhasebe && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      <CheckCircle className="w-3 h-3" /> Muhasebe
                    </span>
                  )}
                  {offer.fabrika && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      <CheckCircle className="w-3 h-3" /> Fabrika
                    </span>
                  )}
                  {offer.satinAlma && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                      <CheckCircle className="w-3 h-3" /> Satın Alma
                    </span>
                  )}
                  {offer.uretim && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                      <CheckCircle className="w-3 h-3" /> Üretim
                    </span>
                  )}
                  {offer.lojistik && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs">
                      <CheckCircle className="w-3 h-3" /> Lojistik
                    </span>
                  )}
                </div>

                {(offer.siparisNotu || offer.kontrolNot || offer.fabrikaNot || offer.lojistikNot) && (
                  <div className="space-y-1.5 mb-3">
                    {offer.siparisNotu && (
                      <div className="p-2 bg-blue-50 rounded text-xs">
                        <span className="font-semibold text-blue-900">Order Note: </span>
                        <span className="text-blue-800">{offer.siparisNotu}</span>
                      </div>
                    )}
                    {offer.kontrolNot && (
                      <div className="p-2 bg-gray-50 rounded text-xs">
                        <span className="font-semibold text-gray-900">Control Note: </span>
                        <span className="text-gray-800">{offer.kontrolNot}</span>
                      </div>
                    )}
                    {offer.fabrikaNot && (
                      <div className="p-2 bg-yellow-50 rounded text-xs">
                        <span className="font-semibold text-yellow-900">Factory Note: </span>
                        <span className="text-yellow-800">{offer.fabrikaNot}</span>
                      </div>
                    )}
                    {offer.lojistikNot && (
                      <div className="p-2 bg-teal-50 rounded text-xs">
                        <span className="font-semibold text-teal-900">Logistics Note: </span>
                        <span className="text-teal-800">{offer.lojistikNot}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => openDetailModal(offer)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1.5 px-4 rounded transition-colors"
                  >
                    View Full Details
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