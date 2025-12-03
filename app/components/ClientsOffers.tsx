import { useState } from "react";
import type { Client, Customer } from "~/help";

type UnifiedPerson = Client | Customer;

interface ClientsOffersProps {
  unifiedList: UnifiedPerson[];
  getDisplayName: (person: UnifiedPerson) => string;
  getEmail: (person: UnifiedPerson) => string | null;
  getPhone: (person: UnifiedPerson) => string | null;
  getAddress: (person: UnifiedPerson) => string | null;
  onSelect: (person: UnifiedPerson) => void;
}

export default function ClientsOffers({ unifiedList, getDisplayName, getEmail, getPhone, getAddress, onSelect }: ClientsOffersProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedPerson = unifiedList.find((person) => {
    const key =
      person.type === "client"
        ? (person as Client).id
        : (person as Customer).musteriID;
    return selectedId === `${person.type}-${key}`;
  });

  
  const filteredUnifiedList = unifiedList.filter((person) => {
    const displayName = getDisplayName(person).toLowerCase();
    const email = getEmail(person)?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return displayName.includes(search) || email.includes(search);
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Client
        </label>
        <div className="relative">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer"
          >
            {selectedPerson
              ? getDisplayName(selectedPerson)
              : "-- Choose a client --"}
          </div>

          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="overflow-y-auto max-h-48">
                {filteredUnifiedList.map((person) => {
                  const key =
                    person.type === "client"
                      ? `client-${(person as Client).id}`
                      : `customer-${(person as Customer).musteriID}`;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        setSelectedId(key);
                        setIsOpen(false);
                        setSearchTerm("");
                        onSelect(person);
                      }}
                      className="px-3 py-2 hover:bg-purple-50 cursor-pointer"
                    >
                      {getDisplayName(person)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {searchTerm && filteredUnifiedList.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">No matches found</p>
        )}
      </div>

      {selectedPerson && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 sm:p-6 border border-purple-200 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {selectedPerson.type === "client" ? "Client" : "Customer"} Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                Name
              </p>
              <p className="text-sm sm:text-base text-gray-800 font-semibold">
                {getDisplayName(selectedPerson)}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                Email
              </p>
              <p className="text-sm sm:text-base text-gray-800">
                {getEmail(selectedPerson)}
              </p>
            </div>
            {getPhone(selectedPerson) && (
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                  Phone
                </p>
                <p className="text-sm sm:text-base text-gray-800">
                  {getPhone(selectedPerson)}
                </p>
              </div>
            )}
            {getAddress(selectedPerson) && (
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                  Address
                </p>
                <p className="text-sm sm:text-base text-gray-800">
                  {getAddress(selectedPerson)}
                </p>
              </div>
            )}
            {selectedPerson.type === "customer" &&
              (selectedPerson as Customer).ulkelerID && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                    Country
                  </p>
                  <p className="text-sm sm:text-base text-gray-800">
                    {(selectedPerson as Customer).ulkelerID}
                  </p>
                </div>
              )}
            {selectedPerson.type === "customer" &&
              (selectedPerson as Customer).zipKod && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">
                    Zip Code
                  </p>
                  <p className="text-sm sm:text-base text-gray-800">
                    {(selectedPerson as Customer).zipKod}
                  </p>
                </div>
              )}
          </div>
        </div>
      )}

      {!selectedId && (
        <div className="text-center py-8 text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-sm">Select a client to view their details</p>
        </div>
      )}
    </div>
  );
}
