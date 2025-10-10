import { X } from "lucide-react";
import { useState } from "react";
import type { User } from "~/help";

const ParticipantsDrawer = ({
    users,
    formData,
    handleParticipantToggle,
    setFormData,
    onClose
  }: {
    users: User[];
    formData: any;
    handleParticipantToggle: (userId: number) => void;
    setFormData: React.Dispatch<React.SetStateAction<{
      title: string;
      description: string;
      meetingDate: string;
      durationMinutes: number;
      location: string;
      meetingType: string;
      status: string;
      clientId: number;
      participantIds: number[];
      participantRoles: Record<number, string>;
      createdBy: string | number;
    }>>;
    onClose: () => void;
  }) => {

    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
      user.kullaniciAdi.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return (
        <>        
            <div className={`fixed inset-0 sm:top-0 sm:right-0 sm:left-auto sm:inset-auto sm:h-screen w-full sm:w-80 md:w-96 lg:w-[28rem] bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out flex flex-col translate-x-0`}>
                <div className="flex-shrink-0 flex items-start sm:items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white min-h-[80px] sm:min-h-0">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-lg font-semibold mb-1">Manage Users</h3>
                        <p className="text-purple-100 text-sm break-words line-clamp-2">{formData.title}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                        <button
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-colors text-sm font-medium whitespace-nowrap bg-white/10 text-white/50 cursor-not-allowed bg-white/20 hover:bg-white/30 text-white`}
                        >
                        </button>
                        <button 
                          onClick={onClose}
                          className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X size={18} />
                        </button>
                    </div>
                </div>
          
                <div className="flex-shrink-0 p-4 bg-gray-50 border-b">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm"
                          autoFocus
                        />
                    </div>
                </div>
                {filteredUsers.length > 0 && (
                    <div className="flex-shrink-0 px-4 py-2 bg-purple-50 border-b border-purple-100">
                        <p className="text-sm text-purple-700">
                          <span className="font-medium">{formData.participantIds.length}</span> user{formData.participantIds.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
                  {filteredUsers.map((user) => {
                    const isSelected = formData.participantIds.includes(user.userId);

                    return (
                      <label 
                        key={user.userId} 
                        className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors group border-2 ${
                          isSelected
                            ? 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                            : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleParticipantToggle(user.userId)}
                            className="w-5 h-5 bg-white border-2 rounded focus:ring-2 transition-colors text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium transition-colors truncate ${
                              isSelected
                                ? 'text-blue-900 group-hover:text-blue-700'
                                : 'text-gray-900 group-hover:text-purple-600'
                            }`}>
                              {user.kullaniciAdi}
                            </span>
                            
                            <div className="flex items-center gap-2 ml-2">
                              {isSelected && (
                                <>
                                  <div className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500"></div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-sm font-medium mb-1">No users found</p>
                      <p className="text-gray-400 text-xs">Try adjusting your search terms</p>
                    </div>
                  )}
                </div>
                    
                <div className="flex items-center justify-between text-xs text-gray-500 gap-4 mt-2 pt-2 border-t bg-gray-50 px-4 py-3 rounded-b-lg -mb-2">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          participantIds: filteredUsers.map(u => u.userId)
                        }));
                      }}
                      className="text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          participantIds: []
                        }));
                      }}
                      className="text-gray-600 hover:text-gray-700 font-medium whitespace-nowrap"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
            </div>
        </>
    );
};

export default ParticipantsDrawer;