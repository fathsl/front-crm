import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type {  Category, Component } from "~/help";

export const AddComponentModal = ({
  category,
  componentsByCategories,
  components,
  onClose,
  onSubmit,
}: {
  category: Category | null;
  componentsByCategories: Component[];
  components: Component[];
  onClose: () => void;
  onSubmit: (component: Component) => void;
}) => {
  const [selectedComponents, setSelectedComponents] = useState<number[]>([]);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (showAddDrawer) {
      const existingIds = componentsByCategories.map(c => c.bilesenID);
      setSelectedComponents(existingIds);
      setStep(1);
    }
  }, [showAddDrawer, componentsByCategories]);

  const existingComponentIds = componentsByCategories.map(c => c.bilesenID);

  const availableComponents = components.filter(
    c => !existingComponentIds.includes(c.bilesenID)
  );

  const toggleComponent = (componentId: number) => {
    setSelectedComponents(prev =>
      prev.includes(componentId)
        ? prev.filter(id => id !== componentId)
        : [...prev, componentId]
    );
  };

  const getSelectedComponentsDetails = () => {
    return components.filter(c => selectedComponents.includes(c.bilesenID));
  };

  const calculateTotalPrice = () => {
    return getSelectedComponentsDetails().reduce((total, c) => total + (c.fiyat * (c.adet || 1)), 0);
  };

  const handleAddSelected = () => {
    const componentsToAdd = components.filter(c => 
      selectedComponents.includes(c.bilesenID)
    );
    componentsToAdd.forEach(component => onSubmit(component));
    setSelectedComponents([]);
  };

  const handleFinish = () => {
    const newComponents = getSelectedComponentsDetails().filter(
      c => !componentsByCategories.find(existing => existing.bilesenID === c.bilesenID)
    );
    newComponents.forEach(component => onSubmit(component));
    setShowAddDrawer(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <Plus size={18} />
            <span>Add</span>
          </button>
          
          <div className="flex-1 mx-4">
            <h2 className="text-lg font-bold text-gray-800 text-center">
              Components
            </h2>
            {category && (
              <p className="text-xs text-gray-600 text-center mt-1">
                {category.kategoriAdi}
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {componentsByCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <Plus size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">
                No components in this category yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {componentsByCategories.map((component) => (
                <div
                  key={component.bilesenID}
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-base flex-1">
                      {component.bilesenAdi}
                    </h3>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                      component.stok > 10 
                        ? 'bg-green-100 text-green-800' 
                        : component.stok > 0 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Stock: {component.stok}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Unit:</span>
                      <span className="font-medium text-gray-900">{component.birim}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">₺{component.fiyat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">{component.adet || 1}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddDrawer && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowAddDrawer(false)}
          />

          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[70] flex flex-col animate-slide-in">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  {step === 1 ? 'Select Components' : 'Review & Confirm'}
                </h2>
                <button
                  onClick={() => setShowAddDrawer(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span className={step === 1 ? 'font-semibold text-blue-600' : ''}>Step 1</span>
                <span className={step === 2 ? 'font-semibold text-blue-600' : ''}>Step 2</span>
              </div>
            </div>

            {step === 1 && (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select components for this category. Already assigned components are pre-selected.
                </p>
                <div className="space-y-2">
                  {components.map((component) => {
                    const isSelected = selectedComponents.includes(component.bilesenID);
                    const isExisting = componentsByCategories.some(c => c.bilesenID === component.bilesenID);
                    
                    return (
                      <div
                        key={component.bilesenID}
                        onClick={() => toggleComponent(component.bilesenID)}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {component.bilesenAdi}
                              </h4>
                              {isExisting && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span>{component.birim}</span>
                              <span>₺{component.fiyat.toFixed(2)}</span>
                              <span className={`px-1.5 py-0.5 rounded ${
                                component.stok > 10 
                                  ? 'bg-green-100 text-green-700' 
                                  : component.stok > 0 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                Stock: {component.stok}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Category Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{category?.kategoriAdi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Components:</span>
                      <span className="font-medium">{selectedComponents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Price:</span>
                      <span className="font-semibold text-blue-600">₺{calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-3">Selected Components</h3>
                <div className="space-y-3">
                  {getSelectedComponentsDetails().map((component) => {
                    const isNew = !componentsByCategories.some(c => c.bilesenID === component.bilesenID);
                    
                    return (
                      <div
                        key={component.bilesenID}
                        className={`border rounded-lg p-3 ${
                          isNew ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm flex-1">
                            {component.bilesenAdi}
                          </h4>
                          {isNew && (
                            <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Unit: </span>
                            <span className="font-medium">{component.birim}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price: </span>
                            <span className="font-medium">₺{component.fiyat.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Qty: </span>
                            <span className="font-medium">{component.adet || 1}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Stock: </span>
                            <span className="font-medium">{component.stok}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-3">
                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                )}
                <button
                  onClick={step === 1 ? () => setStep(2) : handleFinish}
                  disabled={selectedComponents.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  {step === 1 ? (
                    <>
                      Next
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};