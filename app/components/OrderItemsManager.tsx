import { useState } from "react";
import type { Category, Component } from "~/help";

interface OrderItem {
  categoryId: number;
  categoryName: string;
  categoryQuantity: number;
  categoryPrice: number;
  categoryCurrency: string;
  components: {
    bilesenId: number;
    bilesenName: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    birim: string;
  }[];
  totalPrice: number;
}

interface OrderItemsManagerProps {
  categories: Category[];
  baseUrl: string;
  onOrderItemsChange?: (items: OrderItem[], total: number) => void;
  orderNotes?: string;
  onOrderNotesChange?: (notes: string) => void;
}

export default function OrderItemsManager({
  categories,
  baseUrl,
  onOrderItemsChange,
  orderNotes = "",
  onOrderNotesChange,
}: OrderItemsManagerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedBilesenIds, setSelectedBilesenIds] = useState<number[]>([]);
  const [categoryQuantity, setCategoryQuantity] = useState(1);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [originalCategoryBilesenIds, setOriginalCategoryBilesenIds] = useState<number[]>([]);
  const [componentsByCategories, setComponentsByCategories] = useState<
    Component[]
  >([]);
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComponentsByCategories = async (categoryId: number) => {
    try {
      setComponentsLoading(true);
      setError("");
      const response = await fetch(
        `${baseUrl}/api/Bilesen/ByCategory/${categoryId}`
      );
      if (!response.ok) throw new Error("Bileşenler yüklenemedi");
      const data = await response.json();

      const allComponentsResponse = await fetch(`${baseUrl}/api/Bilesen`);
      if (!allComponentsResponse.ok)
        throw new Error("Tüm bileşenler yüklenemedi");
      const allComponents = await allComponentsResponse.json();

      setComponentsByCategories(allComponents);

      const relatedBilesenIds = data.map(
        (bilesen: Component) => bilesen.bilesenID
      );
      
      setOriginalCategoryBilesenIds(relatedBilesenIds);
      setSelectedBilesenIds(relatedBilesenIds);

      const initialQuantities: { [key: number]: number } = {};
      data.forEach((bilesen: Component) => {
        initialQuantities[bilesen.bilesenID] = 1;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      setError("Bileşenler yüklenirken bir hata oluştu");
      console.error(error);
    } finally {
      setComponentsLoading(false);
    }
  };

  const calculateGrandTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);

    if (onOrderItemsChange) {
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      onOrderItemsChange(updatedItems, newTotal);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    if (categoryId) {
      const id = parseInt(categoryId);
      setSelectedCategoryId(id);
      setCategoryQuantity(1);
      await fetchComponentsByCategories(id);
    } else {
      setSelectedCategoryId(null);
      setCategoryQuantity(1);
      setComponentsByCategories([]);
      setSelectedBilesenIds([]);
      setQuantities({});
    }
  };

  const handleBilesenToggle = (bilesenId: number) => {
    setSelectedBilesenIds((prev) => {
      if (prev.includes(bilesenId)) {
        const newQuantities = { ...quantities };
        delete newQuantities[bilesenId];
        setQuantities(newQuantities);
        return prev.filter((id) => id !== bilesenId);
      } else {
        setQuantities((prevQty) => ({ ...prevQty, [bilesenId]: 1 }));
        return [...prev, bilesenId];
      }
    });
  };

  const handleQuantityChangeForBilesen = (bilesenId: number, value: number) => {
    setQuantities((prev) => ({
      ...prev,
      [bilesenId]: Math.max(1, value),
    }));
  };

  const calculateBilesenTotal = (bilesen: Component) => {
    const qty = quantities[bilesen.bilesenID] || 1;
    if (originalCategoryBilesenIds.includes(bilesen.bilesenID)) {
      return 0;
    }
    return bilesen.fiyat * qty * categoryQuantity;
  };

  const calculateSelectedTotal = () => {
    const selectedCategory = categories.find((cat) => cat.kategoriID === selectedCategoryId);
    const categoryBasePrice = (selectedCategory?.fiyat || 0) * categoryQuantity;

    const additionalComponentsCost = selectedBilesenIds.reduce((sum, id) => {
      if (originalCategoryBilesenIds.includes(id)) {
        return sum;
      }
      
      const bilesen = componentsByCategories.find((b) => b.bilesenID === id);
      if (!bilesen) return sum;
      const currentQty = quantities[id] || 1;
      return sum + bilesen.fiyat * currentQty * categoryQuantity;
    }, 0);

    return categoryBasePrice + additionalComponentsCost;
  };

  const handleAddSelectedItems = () => {
    if (selectedBilesenIds.length === 0) {
      alert("Please select at least one component");
      return;
    }

    const selectedCategory = categories.find(
      (cat) => cat.kategoriID === selectedCategoryId
    );

    const componentsData = selectedBilesenIds.map((bilesenId) => {
      const bilesen = componentsByCategories.find(
        (b) => b.bilesenID === bilesenId
      );
      const qty = quantities[bilesenId] || 1;

      return {
        bilesenId: bilesenId,
        bilesenName: bilesen?.bilesenAdi || "",
        quantity: qty,
        unitPrice: bilesen?.fiyat || 0,
        currency: bilesen?.currency || "",
        birim: bilesen?.birim || "",
      };
    });

    const categoryPrice = selectedCategory?.fiyat || 0;
    const additionalComponentsTotalPrice = componentsData.reduce(
      (sum, comp) => {
        if (originalCategoryBilesenIds.includes(comp.bilesenId)) {
          return sum;
        }
        return sum + comp.unitPrice * comp.quantity * categoryQuantity;
      },
      0
    );
    const totalPrice = categoryPrice * categoryQuantity + additionalComponentsTotalPrice;

    const newItem: OrderItem = {
      categoryId: selectedCategoryId!,
      categoryName: selectedCategory?.kategoriAdi || "",
      categoryQuantity: categoryQuantity,
      categoryPrice: categoryPrice,
      categoryCurrency: selectedCategory?.currency || "",
      components: componentsData,
      totalPrice: totalPrice,
    };

    const updatedItems = [...orderItems, newItem];
    setOrderItems(updatedItems);

    if (onOrderItemsChange) {
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      onOrderItemsChange(updatedItems, newTotal);
    }

    setSelectedCategoryId(null);
    setCategoryQuantity(1);
    setSelectedBilesenIds([]);
    setOriginalCategoryBilesenIds([]);
    setQuantities({});
    setComponentsByCategories([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Category
        </label>
        <select
          value={selectedCategoryId || ""}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">-- Choose a category --</option>
          {categories.map((category) => (
            <option key={category.kategoriID} value={category.kategoriID}>
              {category.kategoriAdi} - {category.fiyat} {category.currency}
            </option>
          ))}
        </select>
      </div>

      {selectedCategoryId && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCategoryQuantity(Math.max(1, categoryQuantity - 1))}
                className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm font-semibold"
              >
                -
              </button>
              <input
                type="number"
                value={categoryQuantity}
                onChange={(e) => setCategoryQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setCategoryQuantity(categoryQuantity + 1)}
                className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors text-sm font-semibold"
              >
                +
              </button>
              <span className="text-sm text-gray-600 ml-2">
                Category Base: {(categories.find(c => c.kategoriID === selectedCategoryId)?.fiyat || 0) * categoryQuantity} {categories.find(c => c.kategoriID === selectedCategoryId)?.currency}
              </span>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Components
              </label>
              <span className="text-xs sm:text-sm text-gray-500">
                {selectedBilesenIds.length} of {componentsByCategories.length} selected
              </span>
            </div>

            {componentsLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                <p className="text-sm">Loading components...</p>
              </div>
            ) : componentsByCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm">No components available</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[28rem] sm:max-h-96 overflow-y-auto border border-gray-300 rounded-lg p-3 sm:p-4 bg-white">
                {componentsByCategories.map((bilesen) => (
                  <div
                    key={bilesen.bilesenID}
                    className={`border rounded-lg p-3 sm:p-4 transition-all ${
                      selectedBilesenIds.includes(bilesen.bilesenID)
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <input
                        type="checkbox"
                        id={`bilesen-${bilesen.bilesenID}`}
                        checked={selectedBilesenIds.includes(bilesen.bilesenID)}
                        onChange={() => handleBilesenToggle(bilesen.bilesenID)}
                        className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <label htmlFor={`bilesen-${bilesen.bilesenID}`} className="cursor-pointer block">
                          <div className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                            {bilesen.bilesenAdi}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mt-1">
                            <span className="font-medium text-purple-600">
                              {bilesen.fiyat} {bilesen.currency}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>Unit: {bilesen.birim}</span>
                            <span className="text-gray-400">•</span>
                            <span className={bilesen.stok > 0 ? "text-green-600" : "text-red-600"}>
                              Stock: {bilesen.stok}
                            </span>
                          </div>
                        </label>

                        {selectedBilesenIds.includes(bilesen.bilesenID) && (
                          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm text-gray-700 font-medium">Qty:</span>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChangeForBilesen(bilesen.bilesenID, (quantities[bilesen.bilesenID] || 1) - 1)
                                }
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-xs sm:text-sm font-semibold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={quantities[bilesen.bilesenID] || 1}
                                onChange={(e) =>
                                  handleQuantityChangeForBilesen(bilesen.bilesenID, parseInt(e.target.value) || 1)
                                }
                                min="1"
                                className="w-12 sm:w-16 px-1 sm:px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs sm:text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChangeForBilesen(bilesen.bilesenID, (quantities[bilesen.bilesenID] || 1) + 1)
                                }
                                className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors text-xs sm:text-sm font-semibold"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-xs text-gray-500">× {categoryQuantity} (category qty)</span>
                            <span className="text-xs sm:text-sm font-semibold text-purple-600 ml-auto sm:ml-2">
                              = {calculateBilesenTotal(bilesen)} {bilesen.currency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {selectedBilesenIds.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Selected Summary</h3>
            <span className="text-xs sm:text-sm bg-purple-600 text-white px-2 py-1 rounded-full">
              {selectedBilesenIds.length} items
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto text-xs sm:text-sm mb-4">
            <div className="flex justify-between items-center py-2 border-b border-blue-200 bg-blue-100 px-2 rounded">
              <span className="text-gray-700 font-semibold">
                Category Base × {categoryQuantity}
              </span>
              <span className="font-semibold text-gray-800">
                {(categories.find(c => c.kategoriID === selectedCategoryId)?.fiyat || 0) * categoryQuantity}{" "}
                {categories.find(c => c.kategoriID === selectedCategoryId)?.currency}
              </span>
            </div>
            {selectedBilesenIds.map((id) => {
              const bilesen = componentsByCategories.find((b) => b.bilesenID === id);
              if (!bilesen) return null;
              return (
                <div key={id} className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0 gap-2">
                  <span className="text-gray-700 truncate flex-1">
                    {bilesen.bilesenAdi} <span className="text-gray-500">× {quantities[id] || 1} × {categoryQuantity}</span>
                  </span>
                  <span className="font-semibold text-gray-800 whitespace-nowrap">
                    {calculateBilesenTotal(bilesen)} {bilesen.currency}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-blue-300">
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-base text-gray-700 font-medium">Total:</span>
              <span className="text-lg sm:text-xl font-bold text-purple-600">
                {calculateSelectedTotal()} {componentsByCategories[0]?.currency || categories.find(c => c.kategoriID === selectedCategoryId)?.currency || ""}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddSelectedItems}
            className="w-full mt-3 sm:mt-4 px-4 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm sm:text-base shadow-md hover:shadow-lg"
          >
            <span className="hidden sm:inline">Add to Order ({selectedBilesenIds.length} items)</span>
            <span className="sm:hidden">Add to Order ({selectedBilesenIds.length})</span>
          </button>
        </div>
      )}

      {orderItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
            <h3 className="text-lg font-semibold text-white">Order Items</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {orderItems.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{item.categoryName}</p>
                    <p className="text-sm text-gray-600">
                      Category Qty: {item.categoryQuantity} × {item.categoryPrice} {item.categoryCurrency} = {item.categoryPrice * item.categoryQuantity} {item.categoryCurrency}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="text-sm text-red-600 hover:text-red-800 transition-colors font-medium"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="ml-4 space-y-2 border-l-2 border-purple-200 pl-4">
                  {item.components.map((comp, compIndex) => (
                    <div key={compIndex} className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-gray-700">{comp.bilesenName}</span>
                        <span className="text-gray-500 ml-2">
                          ({comp.quantity} {comp.birim} × {item.categoryQuantity} = {comp.quantity * item.categoryQuantity} {comp.birim})
                        </span>
                      </div>
                      <span className="text-gray-600 font-medium">
                        {comp.unitPrice * comp.quantity * item.categoryQuantity} {comp.currency}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Item Total:</span>
                  <span className="text-xl font-bold text-purple-600">
                    {item.totalPrice} {item.categoryCurrency}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-4 py-4 border-t-2 border-purple-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-800">Grand Total:</span>
              <span className="text-2xl font-bold text-purple-600">
                {calculateGrandTotal()} {orderItems[0]?.categoryCurrency}
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Order Notes
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => onOrderNotesChange?.(e.target.value)}
          placeholder="Enter any additional notes or special requirements"
          rows={4}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
