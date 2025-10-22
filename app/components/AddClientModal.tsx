import { FileIcon, Save, UploadIcon, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { countries } from "~/data/countries";
import type { Resource } from "~/help";
import type { ExtendedClient } from "~/routes/clients";

type FormDataType = Omit<ExtendedClient, 'id'> & {
    city?: string;
    address?: string;
    file?: File;
};
export const AddClientModal = ({
  modalMode,
  formData,
  setFormData,
  open,
  onClose,
  onSubmit,
  existingResources,
  pendingResources,
  setPendingResources,
  isLoadingResources,
}: {
    modalMode: 'add' | 'edit';
    formData: FormDataType;
    setFormData: (formData: FormDataType) => void;
    open: boolean;
    onClose: () => void;
    onSubmit: (formData: FormDataType) => void;
    existingResources?: Resource[];
    pendingResources?: Array<{
        id: string;
        title: string;
        description: string;
        file?: File;
        audioFile?: Blob;
    }>;
    setPendingResources?: React.Dispatch<React.SetStateAction<Array<{
        id: string;
        title: string;
        description: string;
        file?: File;
        audioFile?: Blob;
    }>>>;
    isLoadingResources ?: boolean;
    }) => {
    const [showModal, setShowModal] = useState(false);
    const [resourceTitle, setResourceTitle] = useState('');
    const [resourceDescription, setResourceDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleUpdateResourceDetails = (id: string, field: 'title' | 'description', value: string) => {
        if (!setPendingResources) return;
        setPendingResources(prev =>
            prev.map(r => r.id === id ? { ...r, [field]: value } : r)
        );
    };

    const handleRemovePendingResource = (id: string) => {
        if (!setPendingResources) return;
        setPendingResources(prev => prev.filter(r => r.id !== id));
        toast.info('Resource removed');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const newResource = {
        id: `temp_${Date.now()}`,
        title: resourceTitle || file.name,
        description: resourceDescription || '',
        file: file
        };

        if (!setPendingResources) return;
        setPendingResources(prev => [...prev, newResource]);
        
        setResourceTitle('');
        setResourceDescription('');
        if (fileInputRef.current) {
        fileInputRef.current.value = '';
        }
        
        toast.success('Resource added to upload queue');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
        <div className="bg-white rounded-l-2xl w-full max-w-md h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b text-black">
            <h2 className="text-lg font-semibold">
            {modalMode === 'add' ? 'Yeni Kullanıcı Ekle' : 'Kullanıcı Düzenle'}
            </h2>
           <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded"
            >
            <X className="h-5 w-5 text-black" />
           </button>
        </div>

        <div className="p-4 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
                </label>
                <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter first name"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
                </label>
                <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter last name"
                />
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
                </label>
                <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter email address"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
                </label>
                <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter phone number"
                />
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
                </label>
                <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                >
                <option value="">Select a country</option>
                {countries.map((country) => (
                    <option key={country.code} value={country.name}>
                    {country.name}
                    </option>
                ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                City
                </label>
                <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter city"
                />
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
                </label>
                <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter full address"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
                </label>
                <input
                type="text"
                value={formData.zipCode || ''}
                onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter zip code"
                />
            </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                VAT Number
                </label>
                <input
                type="text"
                value={formData.VATNumber || ''}
                onChange={(e) => setFormData({...formData, VATNumber: e.target.value})}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Enter VAT number"
                />
            </div>
            </div>

            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Image
            </label>
            <div className="flex items-center space-x-4">
                {formData.imageUrl && (
                <img 
                    src={formData.imageUrl} 
                    alt="Client preview" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                />
                )}
                <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                    e.stopPropagation();
                    const file = e.target.files?.[0];
                    if (file) {
                    setFormData({...formData, file, imageUrl: URL.createObjectURL(file)});
                    }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-shadow duration-200 hover:shadow-sm"
                />
            </div>
            </div>

            <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Resources (Optional)
            </label>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
                <input
                type="text"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                placeholder="Resource Title (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            <div>
                <textarea
                value={resourceDescription}
                onChange={(e) => setResourceDescription(e.target.value)}
                placeholder="Resource Description (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                />
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />

            <button
                type="button"
                onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
                <div className="flex flex-col items-center space-y-2">
                <UploadIcon className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">
                    Click to select a file
                </span>
                <span className="text-xs text-gray-500">
                    File will be added automatically when selected
                </span>
                </div>
            </button>
            </div>

            {(pendingResources?.length ?? 0) > 0 && (
            <div className="space-y-3">
            <div className="flex items-center justify-between w-full">
                <label className="block text-sm font-medium text-gray-700">
                Resources to Upload ({pendingResources?.length})
                </label>
                <span className="text-xs text-gray-500">
                Will be uploaded when you create/update client
                </span>
            </div>

            {pendingResources?.map((resource) => (
                <div
                key={resource.id}
                className="p-3 bg-white rounded-lg border border-gray-200 space-y-2 w-full"
                >
                <div className="flex items-start justify-between w-full">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                    {resource.file ? (
                        <FileIcon className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    ) : null}
                    <div className="flex-1 min-w-0">
                        <input
                        type="text"
                        value={resource.title}
                        onChange={(e) => handleUpdateResourceDetails(resource.id, 'title', e.target.value)}
                        placeholder="Resource title"
                        className="w-full text-sm font-medium text-gray-700 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 -mx-1"
                        />
                        <input
                        type="text"
                        value={resource.description}
                        onChange={(e) => handleUpdateResourceDetails(resource.id, 'description', e.target.value)}
                        placeholder="Add description..."
                        className="w-full text-xs text-gray-500 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 -mx-1 mt-1"
                        />
                        <p
                        className="text-xs text-gray-400 mt-1 truncate"
                        title={resource.file?.name || 'Audio Recording'}
                        >
                        {resource.file?.name || 'Audio Recording'}
                        </p>
                    </div>
                    </div>
                    <button
                    type="button"
                    onClick={() => handleRemovePendingResource(resource.id)}
                    className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0"
                    title="Remove resource"
                    >
                    <X className="h-5 w-5" />
                    </button>
                </div>
                </div>
            ))}
            </div>
            )}

            {(existingResources?.length ?? 0) > 0 && (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                Existing Resources
                </label>
                {existingResources?.map((resource) => (
                <div
                    key={resource.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                    <div className="flex items-center space-x-2">
                    <FileIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">{resource.title}</span>
                    </div>    
                    <a 
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                    View
                    </a>
                </div>
                ))}
            </div>
            )}
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Details
            </label>
            <textarea
                rows={4}
                value={formData.details}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200 hover:shadow-sm"
                placeholder="Additional information about the client..."
            />
            </div>
            
            <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors duration-200 hover:shadow"
            >
                Cancel
            </button>
            <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2 transition-colors duration-200 hover:shadow"
            >
                <Save className="h-4 w-4" />
                {modalMode === 'add' ? 'Add' : 'Update'}
            </button>
            </div>
            </form>
        </div>
        </div>
        </div>
    );
};