import { useAtomValue } from "jotai";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import ClientsOffers from "~/components/ClientsOffers";
import type { Client } from "~/help";
import { userAtom, type User } from '~/utils/userAtom';

export default function NewOfferPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [clients,setClients]= useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const currentUser = useAtomValue<User | null>(userAtom);
  const isAdmin = (currentUser?.permissionType === 'Yonetici') || (currentUser?.role === 'Yonetici');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filterByRole = (list: Client[]) => {
      if (isAdmin) return list;
      const uid = currentUser?.userId ?? -1;
      return list.filter(c => c.createdBy === uid);
  };

  const baseUrl = "http://localhost:5178";

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Enter offer details and description',
    },
    {
      id: 2,
      title: 'Pricing & Terms',
      description: 'Set pricing and offer conditions',
    },
    {
      id: 3,
      title: 'Review & Confirm',
      description: 'Review all information before submitting',
    },
    {
      id: 4,
      title: 'Complete',
      description: 'Your offer has been created successfully',
    },
  ];

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/Clients`);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        console.log("dattaa",clients);
        
        
        const visible = filterByRole(data);
        setFilteredClients(visible);
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (err) {
      setError('Kullanıcılar yüklenirken hata oluştu');
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

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

  return (
    <div className="min-h-screen bg-white py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="text-center text-black mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">Create New Offer</h1>
          <p className="text-sm sm:text-base text-black">Follow the steps below to create your offer</p>
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
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          <div className="relative flex justify-between">
            {steps.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                  <div 
                    className={`
                      relative z-10 w-16 h-16 rounded-full flex items-center justify-center
                      transition-all duration-300 transform
                      ${isCompleted ? 'bg-white text-purple-600 scale-110' : ''}
                      ${isCurrent ? 'bg-purple-400 text-white scale-125 shadow-lg' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-purple-300/50 text-white' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <span className="text-xl font-bold">{step.id}</span>
                    )}
                  </div>

                  <div className="mt-4 text-center">
                    <h3 className={`
                      font-semibold text-sm mb-1 transition-colors
                      ${isCurrent ? 'text-black text-base' : 'text-black'}
                    `}>
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
                {currentStep < steps.length ? currentStep : <CheckCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{steps[currentStep - 1].title}</h3>
                <p className="text-sm text-black">{steps[currentStep - 1].description}</p>
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
                  <ClientsOffers clients={filteredClients} />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Terms & Conditions
                    </label>
                    <textarea 
                      placeholder="Enter terms and conditions"
                      rows={4}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="font-semibold text-base sm:text-lg mb-4">Review Your Offer</h3>
                  <div className="space-y-3 text-sm sm:text-base">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">Ready to Submit</span>
                    </div>
                    <p className="text-gray-600">
                      Please review all the information before submitting your offer.
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center py-6 sm:py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                    Offer Created Successfully!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Your offer has been created and is now active.
                  </p>
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
              ${currentStep === 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg active:scale-95'
              }
            `}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Back</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length}
            className={`
              px-4 sm:px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2
              ${currentStep === steps.length
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white text-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg active:scale-95'
              }
            `}
          >
            {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
            {currentStep !== steps.length && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}