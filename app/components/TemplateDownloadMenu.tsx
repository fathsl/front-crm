import { toast } from 'sonner';
import { Menu, Transition } from '@headlessui/react';
import { Download, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Fragment } from 'react';
import { FileIcon } from 'lucide-react';

interface TemplateDownloadMenuProps {
  className?: string;
}

export default function TemplateDownloadMenu({ className = '' }: TemplateDownloadMenuProps) {
  const headers = [
    'PLATFORM',
    'DATE', 
    'NAME',
    'NUMBER',
    'E-MAIL',
    'REQUEST',
    'REQUEST_2',
    'LOCATION',
    'REQUESTED DATE',
    'PROGRESS',
    'CRM STATUS'
  ];

  const downloadExcelTemplate = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      
      const colWidths = [
        { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, 
        { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, 
        { wch: 15 }, { wch: 12 }, { wch: 12 }
      ];
      worksheet['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Client Template');
      XLSX.writeFile(workbook, 'client_import_template.xlsx');
      
      toast.success('Excel template downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel template:', error);
      toast.error('Failed to download Excel template');
    }
  };

  const downloadCSVTemplate = () => {
    try {
      const csvContent = headers.join(',');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', 'client_import_template.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV template downloaded successfully');
    } catch (error) {
      console.error('Error downloading CSV template:', error);
      toast.error('Failed to download CSV template');
    }
  };

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <div>
        <Menu.Button className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          <Download className="h-4 w-4" />
          <span className="hidden md:block">Download Template</span>
          <ChevronDown className="h-4 w-4" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={downloadExcelTemplate}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors`}
                >
                  <FileIcon className="h-4 w-4 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Excel Template</div>
                    <div className="text-xs text-gray-500">.xlsx format</div>
                  </div>
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={downloadCSVTemplate}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors`}
                >
                  <FileIcon className="h-4 w-4 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">CSV Template</div>
                    <div className="text-xs text-gray-500">.csv format</div>
                  </div>
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}