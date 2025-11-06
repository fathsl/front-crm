import { useState } from "react";
import type { Client } from "~/help";

interface ClientsOffersProps {
  clients: Client[];
}

export default function ClientsOffers({ clients }: ClientsOffersProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const selectedClient = clients.find(client => client.id === selectedClientId);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Client
        </label>
        <select
          value={selectedClientId || ''}
          onChange={(e) => setSelectedClientId(Number(e.target.value))}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">-- Choose a client --</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
      </div>

      {selectedClient && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 sm:p-6 border border-purple-200 animate-fadeIn">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Client Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Name</p>
              <p className="text-sm sm:text-base text-gray-800 font-semibold">{selectedClient.first_name} {selectedClient.last_name}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Email</p>
              <p className="text-sm sm:text-base text-gray-800">{selectedClient.email}</p>
            </div>
            {selectedClient.phone && (
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Phone</p>
                <p className="text-sm sm:text-base text-gray-800">{selectedClient.phone}</p>
              </div>
            )}
            {selectedClient.address && (
              <div className="sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1">Address</p>
                <p className="text-sm sm:text-base text-gray-800">{selectedClient.address}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedClientId && (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm">Select a client to view their details</p>
        </div>
      )}
    </div>
  );
}