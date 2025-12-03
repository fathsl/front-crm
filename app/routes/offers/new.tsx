import { useAtomValue } from "jotai";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import ClientsOffers from "~/components/ClientsOffers";
import { SellingStep } from "~/components/OfferSellingStep";
import {
  OrderDetailsForm,
  type OrderDetailsData,
} from "~/components/OrderDetailsForm";
import OrderItemsManager from "~/components/OrderItemsManager";
import type { Category, Client, Customer } from "~/help";
import { userAtom, type User } from "~/utils/userAtom";

type UnifiedPerson = Client | Customer;

export default function NewOfferPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<UnifiedPerson | null>(
    null
  );
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData | null>(
    null
  );
  const [itemsTotal, setItemsTotal] = useState(0);
  const currentUser = useAtomValue<User | null>(userAtom);
  const [unifiedList, setUnifiedList] = useState<UnifiedPerson[]>([]);
  const isAdmin =
    currentUser?.permissionType === "Yonetici" ||
    currentUser?.role === "Yonetici";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [finalCalculations, setFinalCalculations] = useState({
    montaj: 0,
    teslimat: 0,
    indirim: 0,
    kdv: 0,
    toplamFiyat: 0,
    pesinYuzde: 0,
    kapora: 0,
    paraTipi: "TRY",
  });

  const filterByRole = (list: Client[]) => {
    if (isAdmin) return list;
    const uid = currentUser?.userId ?? -1;
    return list.filter((c) => c.createdBy === uid);
  };

  const baseUrl = "https://api-crm-tegd.onrender.com";

  const steps = [
    {
      id: 1,
      title: "Basic Information",
      description: "Enter offer details and description",
    },
    {
      id: 2,
      title: "Pricing & Terms",
      description: "Set pricing and offer conditions",
    },
    {
      id: 3,
      title: "Review & Confirm",
      description: "Review all information before submitting",
    },
    {
      id: 4,
      title: "Complete",
      description: "Your offer has been created successfully",
    },
  ];

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Customers`);
      if (response.ok) {
        const data = await response.json();
        const customersWithType = data.map((customer: Customer) => ({
          ...customer,
          type: "customer" as const,
        }));
        setCustomers(customersWithType);
      } else {
        throw new Error("Failed to fetch customers");
      }
    } catch (err) {
      setError("Error loading customers");
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Clients`);
      if (response.ok) {
        const data = await response.json();
        const clientsWithType = data.map((client: Client) => ({
          ...client,
          type: "client" as const,
        }));
        setClients(clientsWithType);
        const visible = filterByRole(clientsWithType);
        setFilteredClients(visible);
      } else {
        throw new Error("Failed to fetch clients");
      }
    } catch (err) {
      setError("Kullanıcılar yüklenirken hata oluştu");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${baseUrl}/api/Categories`);
      if (!response.ok) throw new Error("Kategoriler yüklenemedi");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setError("Kategoriler yüklenirken bir hata oluştu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchClients(), fetchCustomers(), fetchCategories()]);
  }, []);

  useEffect(() => {
    const merged = [...clients, ...customers];
    setUnifiedList(merged);
  }, [clients, customers]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getDisplayName = (person: UnifiedPerson) => {
    if (person.type === "client") {
      const client = person as Client;
      return `${client.first_name} ${client.last_name}`;
    } else {
      const customer = person as Customer;
      return customer.musteriAd;
    }
  };

  const getEmail = (person: UnifiedPerson) => {
    return person.type === "client"
      ? (person as Client).email ?? null
      : (person as Customer).eMail ?? null;
  };

  const getPhone = (person: UnifiedPerson) => {
    return person.type === "client"
      ? (person as Client).phone ?? null
      : (person as Customer).telefon ?? null;
  };

  const getAddress = (person: UnifiedPerson) => {
    return person.type === "client"
      ? (person as Client).address ?? null
      : (person as Customer).adres ?? null;
  };

  useEffect(() => {
    const merged = [...filteredClients, ...customers];

    const sorted = merged.sort((a, b) => {
      const nameA = getDisplayName(a).toLowerCase();
      const nameB = getDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setUnifiedList(sorted);
  }, [filteredClients, customers]);
  
  const handleCreateOffer = async () => {
    if (!selectedPerson) {
      alert("Lütfen bir müşteri/bayi seçin");
      return;
    }
    if (orderItems.length === 0) {
      alert("En az bir ürün eklemelisiniz");
      return;
    }
    if (!orderDetails || !finalCalculations) {
      alert("Teslimat ve detay bilgileri eksik");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const person = selectedPerson;
      const isCustomer = person.type === "customer";
      const musteriId = isCustomer ? (person as Customer).musteriID : null;
      const clientId = isCustomer ? null : (person as Client).id;

      const payload = {
        createDto: {
          MusteriId: musteriId,
          ClientId: clientId,
          TeklifNo: `T-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
          SiparisNo: null,
          SiparisNotu: orderNotes || null,
          KullaniciID: currentUser?.userId ?? null,
          UpdatedBy: currentUser?.userId ?? null,
          UpdatedAt: new Date().toISOString(),
          STelefon: getPhone(person) || null,
          SE_Mail: getEmail(person) || null,
          SAdres: getAddress(person) || null,
          SVatNumarasi: null,
          SUlke: "Türkiye",
          Montaj: finalCalculations.montaj > 0 ? "Var" : "Yok",
          Teslimat: finalCalculations.teslimat > 0 ? "Var" : "Yok",
          MontajFiyat: finalCalculations.montaj || 0,
          TeslimatFiyat: finalCalculations.teslimat || 0,
          PesinYüzde: finalCalculations.pesinYuzde || 0,
          ParaTipi: finalCalculations.paraTipi,
          Indirim: finalCalculations.indirim || 0,
          Kdv: finalCalculations.kdv || 0,
          ToplamFiyat: finalCalculations.toplamFiyat,
          BrutToplamFiyat: itemsTotal,
          OdenenMiktar: finalCalculations.kapora || 0,
          OdemeDurum: finalCalculations.kapora > 0 ? "Kısmi Ödendi" : "Ödenmedi",
          TeslimatÇeşiti: orderDetails.deliveryType || "Karayolu",
          MTeslimat: null,
          STarih: orderDetails.offerDate
            ? new Date(orderDetails.offerDate).toISOString()
            : new Date().toISOString(),
          Tarih: new Date().toISOString(),
          SiparisMiTeklifMi: "Teklif",
          Status: "Teklif",
          MAdet: orderItems.reduce((sum, i) => sum + i.Adet, 0),
        },
        items: orderItems.map((item) => ({
          KategoriID: item.KategoriID,
          BilesenID: item.BilesenID,
          OznitelikAdi: item.OznitelikAdi || item.name || item.title,
          Adet: item.Adet,
          Fiyat: item.Fiyat,
        })),
      };

      const response = await fetch(`${baseUrl}/api/Offers/WithItems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Sunucu hatası");
      }

      alert(`Teklif başarıyla oluşturuldu!\nTeklif No: ${payload.createDto.TeklifNo}`);
    } catch (err: any) {
      setError(err.message);
      alert("Hata: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="text-center text-black mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
            Create New Offer
          </h1>
          <p className="text-sm sm:text-base text-black">
            Follow the steps below to create your offer
          </p>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div></div>
        )}

        <div className="hidden md:block relative mb-16">
          <div className="absolute top-8 left-0 w-full h-1 bg-purple-300/30">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            />
          </div>

          <div className="relative flex justify-between">
            {steps.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center"
                  style={{ flex: 1 }}
                >
                  <div
                    className={`
                      relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                      transition-all duration-300 transform
                      ${isCompleted ? "bg-white text-purple-600 scale-110" : ""}
                      ${isCurrent ? "bg-purple-400 text-white scale-125 shadow-lg" : ""}
                      ${!isCompleted && !isCurrent ? "bg-purple-300/50 text-white" : ""}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <span className="text-xl font-bold">{step.id}</span>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <h3
                      className={`
                      font-semibold text-sm mb-1 transition-colors
                      ${isCurrent ? "text-black text-base" : "text-black"}
                    `}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-black max-w-[140px]">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:hidden mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 bg-purple-300/30 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
            <span className="ml-4 text-black font-semibold text-sm">
              {currentStep}/{steps.length}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-black">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center font-bold">
                {currentStep < steps.length ? (
                  currentStep
                ) : (
                  <CheckCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {steps[currentStep - 1].title}
                </h3>
                <p className="text-sm text-black">
                  {steps[currentStep - 1].description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="min-h-[250px] sm:min-h-[300px]">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              Step {currentStep}: {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              {steps[currentStep - 1].description}
            </p>

            <div className="space-y-4">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <ClientsOffers
                    unifiedList={unifiedList}
                    getDisplayName={getDisplayName}
                    getEmail={getEmail}
                    getPhone={getPhone}
                    getAddress={getAddress}
                    onSelect={(p) => setSelectedPerson(p)}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <OrderItemsManager
                    categories={categories}
                    baseUrl={baseUrl}
                    onOrderItemsChange={(items, total) => {
                      setOrderItems(items);
                      setItemsTotal(total);
                    }}
                    orderNotes={orderNotes}
                    onOrderNotesChange={setOrderNotes}
                  />
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <SellingStep
                    itemsSubtotal={itemsTotal}
                    currency={orderItems[0]?.categoryCurrency || "TRY"}
                    onCalculationsChange={setFinalCalculations}
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <OrderDetailsForm
                    onSubmit={(data) => {
                      setOrderDetails(data);
                      console.log("Order submitted with details:", data);
                    }}
                    onChange={(data) => {
                      setOrderDetails(data);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`
              px-4 sm:px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
              ${
                currentStep === 1
                  ? "text-gray-500 cursor-not-allowed"
                  : "text-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg active:scale-95"
              }
            `}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Back</span>
          </button>

          {currentStep !== 4 && (
            <>
              <button
                onClick={handleNext}
                disabled={currentStep === steps.length}
                className={`
                    px-4 sm:px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                    ${
                      currentStep === steps.length
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-purple-600 hover:bg-purple-50"
                    }
                  `}
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {currentStep === 4 && (
            <button
              onClick={handleCreateOffer}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
