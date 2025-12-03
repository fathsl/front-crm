import {
  CheckCircle,
  Download,
  FileText,
  MapPin,
  MoreVertical,
  Package,
  Plus,
  Search,
  UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";
import type { Offer } from "~/help";

export default function Offers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        throw new Error("Failed to fetch offers");
      }
    } catch (err) {
      setError("Teklifler yüklenirken hata oluştu");
      console.error("Error fetching offers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfferItems = async (offerId: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/Offers/${offerId}/Items`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (err) {
      console.error("Error fetching offer items:", err);
      return [];
    }
  };

  const filteredOffers = offers.filter(
    (offer) =>
      offer.siparisNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.teklifNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.musteriAd?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.mUlke?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.kullaniciAdi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.siparisAlID?.toString().includes(searchTerm) ||
      offer.odemeDurum?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "Tarih yok";

    const [day, month, year] = dateString.split("/");

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ödendi":
        return "bg-green-100 text-green-800";
      case "beklemede":
        return "bg-yellow-100 text-yellow-800";
      case "iptal":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number, currency?: string | null) => {
    return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || ""}`;
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openDetailModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowDetailModal(true);
  };

  const downloadExcelTurkish = async (offer: Offer) => {
    try {
      setLoading(true);
      const items = await fetchOfferItems(offer.siparisAlID);

      const wb = XLSX.utils.book_new();

      const offerData = [
        ["SİPARİŞ BİLGİLERİ"],
        [],
        ["Sipariş No", offer.siparisNo || "N/A"],
        ["Teklif No", offer.teklifNo || "N/A"],
        ["Tarih", formatDate(offer.tarih)],
        ["Durum", offer.odemeDurum || "N/A"],
        ["Tip", offer.siparisMiTeklifMi || "N/A"],
        ["Şirket", offer.sirket || "N/A"],
        [],
        ["MÜŞTERİ BİLGİLERİ"],
        [],
        ["Müşteri Adı", offer.musteriAd || "N/A"],
        ["Telefon", offer.mTelefon || "N/A"],
        ["E-posta", offer.mMail || "N/A"],
        ["VAT Numarası", offer.mVATNumarasi || "N/A"],
        ["Ülke", offer.mUlke || "N/A"],
        ["Posta Kodu", offer.mZipKod || "N/A"],
        ["Adres", offer.mAdres || "N/A"],
        [],
        ["FİYAT BİLGİLERİ"],
        [],
        ["Toplam Fiyat", formatCurrency(offer.toplamFiyat, offer.paraTipi)],
        ["Ödenen Miktar", formatCurrency(offer.odenenMiktar, offer.paraTipi)],
        ["Kaparo Fiyat", formatCurrency(offer.kaparoFiyat, offer.paraTipi)],
        ["Kalan Bakiye", formatCurrency(offer.kalanBakiye, offer.paraTipi)],
        ["Peşin Yüzde", `${offer.pesinYüzde}%`],
        [],
        ["SİPARİŞ DETAYLARI"],
        [],
        ["Adet", `${offer.mAdet} adet`],
        ["Teslimat Sayısı", offer.mTeslimat || "N/A"],
        ["Teslimat Çeşidi", offer.teslimatÇeşiti || "N/A"],
        ["Montaj", offer.montaj || "N/A"],
        [],
        ["DEPARTMAN DURUMU"],
        [],
        ["Muhasebe", offer.muhasebe ? "Evet" : "Hayır"],
        ["Fabrika", offer.fabrika ? "Evet" : "Hayır"],
        ["Satın Alma", offer.satinAlma ? "Evet" : "Hayır"],
        ["Üretim", offer.uretim ? "Evet" : "Hayır"],
        ["Lojistik", offer.lojistik ? "Evet" : "Hayır"],
        [],
        ["NOTLAR"],
        [],
        ["Sipariş Notu", offer.siparisNotu || "N/A"],
        ["Kontrol Notu", offer.kontrolNot || "N/A"],
        ["Fabrika Notu", offer.fabrikaNot || "N/A"],
        ["Lojistik Notu", offer.lojistikNot || "N/A"],
        [],
        ["ATANAN KİŞİ"],
        [],
        ["Kullanıcı Adı", offer.kullaniciAdi || "N/A"],
        ["Güncellenme Tarihi", formatDate(offer.updatedAt || "")],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(offerData);
      ws1["!cols"] = [{ wch: 20 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Sipariş Bilgileri");

      if (items && items.length > 0) {
        const itemsData = [
          ["ÜRÜN LİSTESİ"],
          [],
          [
            "Sipariş No",
            "Teklif No",
            "Kategori ID",
            "Bileşen ID",
            "Öznitelik Adı",
            "Adet",
            "Fiyat",
          ],
        ];

        items.forEach((item: any) => {
          itemsData.push([
            item.siparisNo || "N/A",
            item.teklifNo || "N/A",
            item.kategoriID || "N/A",
            item.bilesenID || "N/A",
            item.oznitelikAdi || "N/A",
            item.adet || 0,
            `${offer.paraTipi} ${parseFloat(item.fiyat || 0).toFixed(2)}`,
          ]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(itemsData);
        ws2["!cols"] = [
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 30 },
          { wch: 10 },
          { wch: 15 },
        ];
        XLSX.utils.book_append_sheet(wb, ws2, "Ürünler");
      }

      XLSX.writeFile(
        wb,
        `Siparis_${offer.siparisNo || offer.siparisAlID}_TR.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Excel dosyası oluşturulurken hata oluştu");
    } finally {
      setLoading(false);
      setOpenMenuId(null);
    }
  };

  const downloadExcelEnglish = async (offer: Offer) => {
    try {
      setLoading(true);
      const items = await fetchOfferItems(offer.siparisAlID);

      const wb = XLSX.utils.book_new();

      const offerData = [
        ["ORDER INFORMATION"],
        [],
        ["Order No", offer.siparisNo || "N/A"],
        ["Offer No", offer.teklifNo || "N/A"],
        ["Date", formatDate(offer.tarih)],
        ["Payment Status", offer.odemeDurum || "N/A"],
        ["Type", offer.siparisMiTeklifMi || "N/A"],
        ["Company", offer.sirket || "N/A"],
        [],
        ["CUSTOMER INFORMATION"],
        [],
        ["Customer Name", offer.musteriAd || "N/A"],
        ["Phone", offer.mTelefon || "N/A"],
        ["Email", offer.mMail || "N/A"],
        ["VAT Number", offer.mVATNumarasi || "N/A"],
        ["Country", offer.mUlke || "N/A"],
        ["Zip Code", offer.mZipKod || "N/A"],
        ["Address", offer.mAdres || "N/A"],
        [],
        ["PRICE INFORMATION"],
        [],
        ["Total Price", formatCurrency(offer.toplamFiyat, offer.paraTipi)],
        ["Paid Amount", formatCurrency(offer.odenenMiktar, offer.paraTipi)],
        ["Deposit", formatCurrency(offer.kaparoFiyat, offer.paraTipi)],
        [
          "Remaining Balance",
          formatCurrency(offer.kalanBakiye, offer.paraTipi),
        ],
        ["Advance Percentage", `${offer.pesinYüzde}%`],
        [],
        ["ORDER DETAILS"],
        [],
        ["Quantity", `${offer.mAdet} units`],
        ["Delivery Count", offer.mTeslimat || "N/A"],
        ["Delivery Type", offer.teslimatÇeşiti || "N/A"],
        ["Assembly", offer.montaj || "N/A"],
        [],
        ["DEPARTMENT STATUS"],
        [],
        ["Accounting", offer.muhasebe ? "Yes" : "No"],
        ["Factory", offer.fabrika ? "Yes" : "No"],
        ["Purchasing", offer.satinAlma ? "Yes" : "No"],
        ["Production", offer.uretim ? "Yes" : "No"],
        ["Logistics", offer.lojistik ? "Yes" : "No"],
        [],
        ["NOTES"],
        [],
        ["Order Note", offer.siparisNotu || "N/A"],
        ["Control Note", offer.kontrolNot || "N/A"],
        ["Factory Note", offer.fabrikaNot || "N/A"],
        ["Logistics Note", offer.lojistikNot || "N/A"],
        [],
        ["ASSIGNED TO"],
        [],
        ["User Name", offer.kullaniciAdi || "N/A"],
        ["Updated At", formatDate(offer.updatedAt || "")],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(offerData);
      ws1["!cols"] = [{ wch: 20 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, ws1, "Order Information");

      if (items && items.length > 0) {
        const itemsData = [
          ["PRODUCT LIST"],
          [],
          [
            "Order No",
            "Offer No",
            "Category ID",
            "Component ID",
            "Attribute Name",
            "Quantity",
            "Price",
          ],
        ];

        items.forEach((item: any) => {
          itemsData.push([
            item.siparisNo || "N/A",
            item.teklifNo || "N/A",
            item.kategoriID || "N/A",
            item.bilesenID || "N/A",
            item.oznitelikAdi || "N/A",
            item.adet || 0,
            `${offer.paraTipi} ${parseFloat(item.fiyat || 0).toFixed(2)}`,
          ]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(itemsData);
        ws2["!cols"] = [
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 30 },
          { wch: 10 },
          { wch: 15 },
        ];
        XLSX.utils.book_append_sheet(wb, ws2, "Products");
      }

      XLSX.writeFile(
        wb,
        `Order_${offer.siparisNo || offer.siparisAlID}_EN.xlsx`
      );
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Error creating Excel file");
    } finally {
      setLoading(false);
      setOpenMenuId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-white shadow-sm">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Offers
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your offers and their information
              </p>
            </div>
            <div className="flex flex-row gap-4 items-center justify-center">
              <button
                onClick={() => navigate("/offers/new")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:block">New</span>
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
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 relative"
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === offer.siparisAlID
                                ? null
                                : offer.siparisAlID
                            )
                          }
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          disabled={loading}
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {openMenuId === offer.siparisAlID && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                              onClick={() => downloadExcelTurkish(offer)}
                              disabled={loading}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 disabled:opacity-50"
                            >
                              <Download className="w-4 h-4" />
                              Excel İndir (Türkçe)
                            </button>
                            <button
                              onClick={() => downloadExcelEnglish(offer)}
                              disabled={loading}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 disabled:opacity-50"
                            >
                              <Download className="w-4 h-4" />
                              Download Excel (English)
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between pb-3 border-b mb-3">
                          <div className="flex-1 min-w-0 pr-12">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-base sm:text-lg text-gray-900 block truncate">
                                  {offer.siparisNo || `#${offer.siparisAlID}`}
                                </span>
                                {offer.teklifNo && (
                                  <span className="text-xs text-gray-500">
                                    Teklif: {offer.teklifNo}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.odemeDurum)}`}
                              >
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
                              {formatCurrency(
                                offer.toplamFiyat,
                                offer.paraTipi
                              )}
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
                              <span className="text-xs font-semibold text-gray-600">
                                CUSTOMER
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {offer.musteriAd || "N/A"}
                            </p>
                            {offer.mTelefon && (
                              <p className="text-xs text-gray-600 truncate">
                                {offer.mTelefon}
                              </p>
                            )}
                            {offer.mMail && (
                              <p className="text-xs text-gray-600 truncate">
                                {offer.mMail}
                              </p>
                            )}
                          </div>

                          <div className="bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="w-3 h-3 text-gray-600" />
                              <span className="text-xs font-semibold text-gray-600">
                                LOCATION
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {offer.mUlke || "N/A"}
                            </p>
                            {offer.mZipKod && (
                              <p className="text-xs text-gray-600 truncate">
                                ZIP: {offer.mZipKod}
                              </p>
                            )}
                          </div>

                          <div className="bg-gray-50 p-2 rounded">
                            <div className="flex items-center gap-1.5 mb-1">
                              <UserIcon className="w-3 h-3 text-gray-600" />
                              <span className="text-xs font-semibold text-gray-600">
                                ASSIGNED TO
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {offer.kullaniciAdi || "N/A"}
                            </p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No offers found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "No offers found" : "No offers added yet"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate("/offers/new")}
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
