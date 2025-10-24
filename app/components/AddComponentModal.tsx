import { Check, ChevronLeft, ChevronRight, Edit2, Plus, SearchIcon, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type {  Category, Component } from "~/help";
import { AddComponentDrawer } from "./AddComponentDrawer";

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
  onSubmit: (component: Component, isEdit: boolean) => void;
}) => {
  const [selectedComponents, setSelectedComponents] = useState<number[]>([]);
  const [componentDrawer, setComponentDrawer] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredComponents, setFilteredComponents] = useState(componentsByCategories);
  const [filteredComponentsSelected, setFilteredComponentsSelected] = useState(components);
  const [searchTermSelected, setSearchTermSelected] = useState('');
  const [currentEditingComponent, setCurrentEditingComponent] = useState<Component |
   null>(null);

  const baseUrl = "http://localhost:5178";

  useEffect(() => {
    if (showAddDrawer) {
      const existingIds = componentsByCategories.map(c => c.bilesenID);
      setSelectedComponents(existingIds);
      setStep(1);
    }
  }, [showAddDrawer]);

  useEffect(() => {
    setFilteredComponents(componentsByCategories);
  }, [componentsByCategories]);

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

  const calculateNewComponentsTotal = () => {
    const existingIds = componentsByCategories.map(c => c.bilesenID);
    const newComponents = components.filter(c => 
      selectedComponents.includes(c.bilesenID) && !existingIds.includes(c.bilesenID)
    );
    return newComponents.reduce((total, c) => total + (c.fiyat * (c.adet || 1)), 0);
  };

  const handleFinish = async () => {
    if (!category) return;

    const newComponents = getSelectedComponentsDetails().filter(
      c => !componentsByCategories.some(existing => existing.bilesenID === c.bilesenID)
    );

    if (newComponents.length === 0) {
      setShowAddDrawer(false);
      onClose();
      return;
    }

    try {
      const componentsToAdd = newComponents.map(c => ({
        bilesenID: c.bilesenID,
        adet: c.adet || 1
      }));
      await addComponentsToCategory(category.kategoriID, componentsToAdd);
      newComponents.forEach(component => onSubmit(component, false));
      setShowAddDrawer(false);
      onClose();
    } catch (error) {
      console.error('Error adding components:', error);
      alert('Failed to add components. Please try again.');
    }
  };

  const handleComponentSubmit = (component: Component, isEdit: boolean) => {
    onSubmit(component, isEdit);
    setComponentDrawer(false);
    setCurrentEditingComponent(null);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredComponents(componentsByCategories);
      return;
    }
    const searchLower = value.toLowerCase();
    const filtered = componentsByCategories.filter(component =>
      component.bilesenAdi?.toLowerCase().includes(searchLower) ||
      component.fiyat?.toString().includes(searchLower) ||
      component.stok?.toString().includes(searchLower)
    );
    setFilteredComponents(filtered);
  };

  const handleSearchSelected = (value: string) => {
    setSearchTermSelected(value);
    if (!value.trim()) {
      setFilteredComponents(components);
      return;
    }
    const searchLower = value.toLowerCase();
    const filtered = components.filter(component =>
      component.bilesenAdi?.toLowerCase().includes(searchLower) ||
      component.fiyat?.toString().includes(searchLower) ||
      component.stok?.toString().includes(searchLower)
    );
    setFilteredComponentsSelected(filtered);
  };

  const handleDrawerClose = () => {
    setComponentDrawer(false);
    setCurrentEditingComponent(null);
  };

  const handleAddComponent = () => {
    setCurrentEditingComponent(null);
    setComponentDrawer(true);
  };

  const handleEditComponent = (component: Component) => {
    setCurrentEditingComponent(component);
    setComponentDrawer(true);
  };

  const addComponentsToCategory = async (kategoriId: number, components: { bilesenID: number; adet: number }[]) => {
    try {
      const response = await fetch(`${baseUrl}/api/Bilesen/AddComponentsToCategory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kategoriID: kategoriId,
          components: components.map(c => ({
            bilesenID: c.bilesenID,
            adet: c.adet
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add components');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding components:', error);
      throw error;
    }
  };

  const removeComponentFromCategory = async (kategoriId: number, bilesenId: number) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/Bilesen/RemoveComponentFromCategory?kategoriId=${kategoriId}&bilesenId=${bilesenId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove component');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing component:', error);
      throw error;
    }
  };

  const handleDeleteComponent = async (component: Component) => {
    if (!category) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to remove "${component.bilesenAdi}" from this category?`
    );
    if (!confirmDelete) return;
    try {
      await removeComponentFromCategory(category.kategoriID, component.bilesenID);
      
      setFilteredComponents(prev => 
        prev.filter(c => c.bilesenID !== component.bilesenID)
      );
      
      setSelectedComponents(prev => 
        prev.filter(id => id !== component.bilesenID)
      );
      
      alert('Component removed successfully');
    } catch (error) {
      console.error('Error deleting component:', error);
      alert('Failed to remove component. Please try again.');
    }
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
            {category && (
              <p className="text-xs text-gray-600 text-center mt-1">
                {category.fiyat}{category.currency}
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
              <div className="mb-4 sm:mb-6">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Toplantı ara..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              {filteredComponents.map((component) => (
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
                      <span className="font-medium text-gray-900">{component.fiyat}{component.currency}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium text-gray-900">{component.stok}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">{component.adet || 1}</span>
                    </div>
                  </div>
                  <div className="flex flex-row justify-between items-center bg-gray-100 rounded-lg w-full mt-2 h-12 px-4">
                    <button 
                      className="flex flex-row items-center gap-2 px-2 py-1" 
                      onClick={() => handleEditComponent(component)}
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <div className="border border-gray-300 border-1 h-full"/>
                    <button onClick={() => handleDeleteComponent(component)} className="flex flex-row items-center gap-2 px-2 py-1">
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
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
                <div className="flex flex-col items-start gap-2">
                  <h2 className="text-lg font-bold text-gray-800">
                  {step === 1 ? 'Select Components' : 'Review & Confirm'}
                </h2>
                <span className="text-xs text-gray-600">
                  {category?.fiyat}₺ + {calculateNewComponentsTotal()}₺ = {(category?.fiyat || 0) + calculateNewComponentsTotal()}₺
                </span>
                </div>
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
                <div className="relative w-full mb-2">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Toplantı ara..."
                  value={searchTermSelected}
                  onChange={(e) => handleSearchSelected(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
                <div className="space-y-2">
                  {filteredComponentsSelected.map((component) => {
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
                      <span className="font-semibold text-blue-600">{(category?.fiyat || 0) + calculateNewComponentsTotal()}</span>
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
                            <span className="font-medium">{component.fiyat.toFixed(2)}{component.currency}</span>
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
                 {step === 1 && (
                  <button
                    onClick={handleAddComponent}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                )}
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
                      <div className="flex items-center gap-2">
                        <span>Next</span>
                        <ChevronRight size={18} />
                      </div>
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

      {componentDrawer && category && (
        <AddComponentDrawer
          category={category}
          onClose={handleDrawerClose}
          onSubmit={handleComponentSubmit}
          editingComponent={currentEditingComponent}
        />
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