import { useState } from "react";

interface SellingStepProps {
  itemsSubtotal: number;
  currency: string;
  onCalculationsChange?: (calculations: {
    montaj: number;
    teslimat: number;
    indirim: number;
    kdv: number;
    toplamFiyat: number;
    pesinYuzde: number;
    kapora: number;
    paraTipi: string;
  }) => void;
}

export function SellingStep({
  itemsSubtotal,
  currency,
  onCalculationsChange,
}: SellingStepProps) {
  const [montajEnabled, setMontajEnabled] = useState(false);
  const [montajFiyat, setMontajFiyat] = useState("0");
  const [teslimatEnabled, setTeslimatEnabled] = useState(false);
  const [teslimatFiyat, setTeslimatFiyat] = useState("0");
  const [indirim, setIndirim] = useState("0");
  const [kdv, setKdv] = useState("0");
  const [pesinYuzde, setPesinYuzde] = useState("0");
  const [selectedCurrency, setSelectedCurrency] = useState(currency || "TRY");

  const parseDecimal = (value: string): number => {
    if (!value) return 0;
    const normalized = value.replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: number): string => {
    return value.toFixed(2).replace(".", ",");
  };

  const calculateTotals = () => {
    const montajVal = montajEnabled ? parseDecimal(montajFiyat) : 0;
    const teslimatVal = teslimatEnabled ? parseDecimal(teslimatFiyat) : 0;
    const indirimVal = parseDecimal(indirim);
    const kdvVal = parseDecimal(kdv);

    const subtotalWithServices = itemsSubtotal + montajVal + teslimatVal;
    const afterDiscount = subtotalWithServices - indirimVal;
    const toplamFiyat = afterDiscount + kdvVal;

    const pesinYuzdeVal = parseDecimal(pesinYuzde);
    const kapora = toplamFiyat * (pesinYuzdeVal / 100);

    return {
      montaj: montajVal,
      teslimat: teslimatVal,
      subtotalWithServices,
      indirim: indirimVal,
      afterDiscount,
      kdv: kdvVal,
      toplamFiyat,
      pesinYuzde: pesinYuzdeVal,
      kapora,
    };
  };

  const totals = calculateTotals();

  useState(() => {
    if (onCalculationsChange) {
      onCalculationsChange({
        montaj: totals.montaj,
        teslimat: totals.teslimat,
        indirim: totals.indirim,
        kdv: totals.kdv,
        toplamFiyat: totals.toplamFiyat,
        pesinYuzde: totals.pesinYuzde,
        kapora: totals.kapora,
        paraTipi: selectedCurrency,
      });
    }
  });

  const handleNumberInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const char = e.key;
    const input = e.currentTarget;

    if (!char.match(/[0-9,.\b]/) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      return;
    }

    if (char === ".") {
      e.preventDefault();
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const value = input.value;
      const newValue = value.substring(0, start) + "," + value.substring(end);
      input.value = newValue;
      input.setSelectionRange(start + 1, start + 1);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }

    if (char === "," && input.value.includes(",")) {
      e.preventDefault();
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-6">
      <h3 className="font-semibold text-base sm:text-lg mb-4 text-gray-800">
        Review & Finalize Your Offer
      </h3>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Currency
        </label>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Items Subtotal:</span>
          <span className="text-xl font-bold text-purple-600">
            {formatCurrency(itemsSubtotal)} {selectedCurrency}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={montajEnabled}
              onChange={(e) => setMontajEnabled(e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Assembly
            </span>
          </label>
        </div>
        {montajEnabled && (
          <div>
            <input
              type="text"
              value={montajFiyat}
              onChange={(e) => setMontajFiyat(e.target.value)}
              onKeyDown={handleNumberInput}
              placeholder="0,00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Assembly cost: {formatCurrency(totals.montaj)} {selectedCurrency}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={teslimatEnabled}
              onChange={(e) => setTeslimatEnabled(e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Delivery
            </span>
          </label>
        </div>
        {teslimatEnabled && (
          <div>
            <input
              type="text"
              value={teslimatFiyat}
              onChange={(e) => setTeslimatFiyat(e.target.value)}
              onKeyDown={handleNumberInput}
              placeholder="0,00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Delivery cost: {formatCurrency(totals.teslimat)}{" "}
              {selectedCurrency}
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">
            Subtotal (with services):
          </span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(totals.subtotalWithServices)} {selectedCurrency}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Discount
        </label>
        <input
          type="text"
          value={indirim}
          onChange={(e) => setIndirim(e.target.value)}
          onKeyDown={handleNumberInput}
          placeholder="0,00"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Discount amount: {formatCurrency(totals.indirim)} {selectedCurrency}
        </p>
      </div>

      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">After Discount:</span>
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(totals.afterDiscount)} {selectedCurrency}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          VAT/KDV
        </label>
        <input
          type="text"
          value={kdv}
          onChange={(e) => setKdv(e.target.value)}
          onKeyDown={handleNumberInput}
          placeholder="0,00"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          VAT amount: {formatCurrency(totals.kdv)} {selectedCurrency}
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-300">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-800">
            Total Price:
          </span>
          <span className="text-xl sm:text-3xl font-bold text-purple-600">
            {formatCurrency(totals.toplamFiyat)} {selectedCurrency}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Down Payment Percentage %
        </label>
        <input
          type="text"
          value={pesinYuzde}
          onChange={(e) => setPesinYuzde(e.target.value)}
          onKeyDown={handleNumberInput}
          placeholder="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
        />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">
              Down Payment Amount :
            </span>
            <span className="text-xl font-bold text-yellow-600">
              {formatCurrency(totals.kapora)} {selectedCurrency}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Price Breakdown:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Items Subtotal:</span>
            <span className="font-medium">
              {formatCurrency(itemsSubtotal)} {selectedCurrency}
            </span>
          </div>
          {montajEnabled && (
            <div className="flex justify-between">
              <span className="text-gray-600">+ Assembly:</span>
              <span className="font-medium">
                {formatCurrency(totals.montaj)} {selectedCurrency}
              </span>
            </div>
          )}
          {teslimatEnabled && (
            <div className="flex justify-between">
              <span className="text-gray-600">+ Delivery:</span>
              <span className="font-medium">
                {formatCurrency(totals.teslimat)} {selectedCurrency}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              {formatCurrency(totals.subtotalWithServices)} {selectedCurrency}
            </span>
          </div>
          {totals.indirim > 0 && (
            <div className="flex justify-between text-red-600">
              <span>- Discount:</span>
              <span className="font-medium">
                -{formatCurrency(totals.indirim)} {selectedCurrency}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">After Discount:</span>
            <span className="font-medium">
              {formatCurrency(totals.afterDiscount)} {selectedCurrency}
            </span>
          </div>
          {totals.kdv > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">+ VAT/KDV:</span>
              <span className="font-medium">
                {formatCurrency(totals.kdv)} {selectedCurrency}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-purple-200 pt-2 text-base">
            <span className="font-semibold text-gray-800">Total:</span>
            <span className="font-bold text-purple-600">
              {formatCurrency(totals.toplamFiyat)} {selectedCurrency}
            </span>
          </div>
          {totals.pesinYuzde > 0 && (
            <div className="flex justify-between bg-yellow-50 -mx-4 px-4 py-2 mt-2">
              <span className="font-medium text-gray-700">
                Down Payment ({totals.pesinYuzde}%):
              </span>
              <span className="font-bold text-yellow-600">
                {formatCurrency(totals.kapora)} {selectedCurrency}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">
              Ready to Submit
            </p>
            <p className="text-sm text-blue-700">
              Please review all the information above before submitting your
              offer. You can go back to previous steps to make changes if
              needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
