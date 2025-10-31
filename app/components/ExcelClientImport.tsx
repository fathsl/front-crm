import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadIcon } from 'lucide-react';

interface ExcelRow {
  PLATFORM?: string;
  DATE?: string;
  NAME?: string;
  NUMBERE?: string;
  NUMBER?: string;
  PHONE?: string;
  MAIL?: string;
  'E-MAIL'?: string;
  EMAIL?: string;
  'E MAIL'?: string;
  REQUEST?: string;
  REQUEST_2?: string;
  LOCATION?: string;
  'REQUESTED DATE'?: string;
  PROGRESS?: string;
  [key: string]: any;
}

interface ParsedClient {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  platform: string;
  address: string;
  requestedDate: string;
  progress: string;
  categoryIds: number[];
  createdBy: number;
  createdAt: string;
  details: string;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

const ExcelImportButton: React.FC<{
  onImportComplete: () => void;
  baseUrl: string;
  userId: number;
}> = ({ onImportComplete, baseUrl, userId }) => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [categoryMapping, setCategoryMapping] = useState<{ [key: string]: number }>({});
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/Categories`);
      if (response.ok) {
        const data = await response.json();
        
        const mapping: { [key: string]: number } = {};
        data.forEach((cat: any) => {
          const normalizedName = normalizeCategoryName(cat.kategoriAdi || cat.name || cat.kategori_adi);
          mapping[normalizedName] = cat.kategoriID || cat.id;
          
          const originalName = (cat.kategoriAdi || cat.name || cat.kategori_adi).toLowerCase();
          if (originalName !== normalizedName) {
            mapping[originalName] = cat.kategoriID || cat.id;
          }
        });
        
        setCategoryMapping(mapping);
        setCategoriesLoaded(true);
        console.log('Categories loaded:', Object.keys(mapping).length);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      alert('Failed to load categories. Please refresh the page.');
    }
  };

  const parseNameField = (name: string): { first_name: string; last_name: string } => {
    if (!name || typeof name !== 'string') {
      return { first_name: '', last_name: '' };
    }
    
    const trimmedName = name.trim();
    const nameParts = trimmedName.split(' ');
    
    if (nameParts.length === 1) {
      return { first_name: nameParts[0], last_name: '' };
    }
    
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ');
    
    return { first_name, last_name };
  };

  const normalizePlatform = (platform: string): string => {
    if (!platform) return '';
    const normalized = platform.toLowerCase().trim();
    if (normalized === 'fb') return 'Facebook';
    if (normalized === 'ig') return 'Instagram';
    return platform;
  };

  const normalizeProgress = (progress: string): string => {
    if (!progress) return '';
    const normalized = progress.toLowerCase().trim();
    if (normalized === 'awaiting') return 'Awaiting Response';
    return progress;
  };

  const normalizeCategoryName = (categoryName: string): string => {
    if (!categoryName) return '';
    return categoryName
      .toLowerCase()
      .replace(/[_\-–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const findCategoryId = (excelCategory: string): number | null => {
    const normalized = normalizeCategoryName(excelCategory);
    
    if (categoryMapping[normalized]) {
      return categoryMapping[normalized];
    }
    
    for (const [dbCategory, id] of Object.entries(categoryMapping)) {
      const dbNormalized = normalizeCategoryName(dbCategory);
      
      if (dbNormalized === normalized) {
        return id;
      }
      
      if (dbNormalized.includes(normalized) || normalized.includes(dbNormalized)) {
        return id;
      }
    }
    
    const normalizedNoSpaces = normalized.replace(/\s+/g, '');
    for (const [dbCategory, id] of Object.entries(categoryMapping)) {
      const dbNormalizedNoSpaces = normalizeCategoryName(dbCategory).replace(/\s+/g, '');
      if (dbNormalizedNoSpaces === normalizedNoSpaces || 
          dbNormalizedNoSpaces.includes(normalizedNoSpaces) || 
          normalizedNoSpaces.includes(dbNormalizedNoSpaces)) {
        return id;
      }
    }
    
    return null;
  };

  const parseCategoryField = (categoryText: string): number[] => {
    if (!categoryText || typeof categoryText !== 'string') {
      return [];
    }

    const categoryNames = categoryText
      .split(/[,;]/)
      .map(cat => cat.trim())
      .filter(cat => cat.length > 0);

    const categoryIds: number[] = [];
    const notFoundCategories: string[] = [];
    
    for (const catName of categoryNames) {
      const categoryId = findCategoryId(catName);
      if (categoryId) {
        categoryIds.push(categoryId);
      } else {
        notFoundCategories.push(catName);
      }
    }
    
    if (notFoundCategories.length > 0) {
      console.warn('Categories not found:', notFoundCategories);
    }

    return categoryIds;
  };

  const parseDate = (dateValue: any): string => {
    if (!dateValue) return '';
    
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      return date.toISOString().split('T')[0];
    }
    
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return '';
  };

  const isValidDate = (dateValue: any): boolean => {
    if (!dateValue) return false;
    
    if (typeof dateValue === 'number') {
      return true;
    }
    
    if (dateValue instanceof Date) {
      return !isNaN(dateValue.getTime());
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return !isNaN(date.getTime());
    }
    
    return false;
  };

  const isEmptyRow = (row: ExcelRow): boolean => {
    const allValues = [
      row.NAME, 
      row.MAIL, 
      row.NUMBERE,
      row.NUMBER,
      row.PHONE,
      row.REQUEST, 
      row.REQUEST_2,
      row.PLATFORM,
      row.LOCATION
    ];
    
    return allValues.every(val => 
      val === undefined || 
      val === null || 
      val === '' || 
      (typeof val === 'string' && val.trim() === '')
    );
  };

  const parseExcelRow = (row: ExcelRow, rowIndex: number): ParsedClient | null => {
    try {
      if (isEmptyRow(row)) {
        return null;
      }

      const name = row.NAME?.toString().trim();
      const email = row.MAIL?.toString().trim();

      if (!name || !email) {
        console.log(`Row ${rowIndex} data:`, {
          NAME: row.NAME,
          MAIL: row.MAIL,
          'E-MAIL': row['E-MAIL'],
          EMAIL: row.EMAIL,
          NUMBERE: row.NUMBERE,
          NUMBER: row.NUMBER,
          PHONE: row.PHONE,
          allKeys: Object.keys(row)
        });
      }

      if (!name || name === '') {
        throw new Error(`NAME is required (found: "${row.NAME}")`);
      }

      const mailValue = row.MAIL || row['E-MAIL'] || row.EMAIL || row['E MAIL'];
      const emailParsed = mailValue?.toString().trim();

      if (!emailParsed || emailParsed === '') {
        throw new Error(`MAIL is required (found: "${row.MAIL}"). Check if email column is named differently.`);
      }

      const { first_name, last_name } = parseNameField(name);
      
      if (!first_name) {
        throw new Error('First name cannot be empty');
      }

      const phoneValue = row.NUMBERE || row.NUMBER || row.PHONE;
      const phoneParsed = phoneValue ? phoneValue.toString().trim() : '';

      const categoryIds: number[] = [];
      
      if (row.REQUEST) {
        const requestStr = row.REQUEST.toString().trim();
        categoryIds.push(...parseCategoryField(requestStr));
      }
      if (row.REQUEST_2) {
        const request2Str = row.REQUEST_2.toString().trim();
        categoryIds.push(...parseCategoryField(request2Str));
      }

      const uniqueCategoryIds = Array.from(new Set(categoryIds));

      if (uniqueCategoryIds.length === 0) {
        const requestValues = [row.REQUEST, row.REQUEST_2].filter(Boolean).join(', ');
        throw new Error(`At least one valid category is required. Found in Excel: "${requestValues}". Available categories: ${Object.keys(categoryMapping).join(', ')}`);
      }

      const requestedDateValue = row['REQUESTED DATE'];
      let requestedDate = '';
      let detailsText = '';
      
      if (isValidDate(requestedDateValue)) {
        requestedDate = parseDate(requestedDateValue);
      } else if (requestedDateValue) {
        detailsText = `Requested Date: ${requestedDateValue}`;
      }

      const parsedClient: ParsedClient = {
          first_name,
          last_name: last_name || '',
          phone: phoneParsed,
          email: emailParsed,
          platform: normalizePlatform(row.PLATFORM?.toString().trim() || ''),
          address: row.LOCATION?.toString().trim() || '',
          requestedDate: requestedDate,
          progress: normalizeProgress(row.PROGRESS?.toString().trim() || ''),
          categoryIds: uniqueCategoryIds,
          createdBy: userId,
          createdAt: parseDate(row.DATE),
          details: detailsText
      };

      return parsedClient;
    } catch (error) {
      console.error(`Error parsing row ${rowIndex}:`, error);
      throw error;
    }
  };

  const createClientFromData = async (clientData: ParsedClient): Promise<boolean> => {
    try {
      const formData = new FormData();
      
      formData.append('First_name', clientData.first_name);
      formData.append('Last_name', clientData.last_name);
      formData.append('Email', clientData.email);
      formData.append('categoriesIds', clientData.categoryIds.join(','));
      formData.append('CreatedBy', clientData.createdBy.toString());
      
      if (clientData.phone) {
        formData.append('Phone', clientData.phone);
      }
      if (clientData.platform) {
        formData.append('Platform', clientData.platform);
      }
      if (clientData.address) {
        formData.append('Address', clientData.address);
      }
      if (clientData.requestedDate) {
        formData.append('RequestedDate', clientData.requestedDate);
      }
      if (clientData.progress) {
        formData.append('Progress', clientData.progress);
      }
      if (clientData.details) {
        formData.append('Details', clientData.details);
      }

      console.log('Sending client data:', {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        phone: clientData.phone,
        email: clientData.email,
        categoryIds: clientData.categoryIds,
        platform: clientData.platform,
        progress: clientData.progress
      });

      const response = await fetch(`${baseUrl}/api/Clients`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create client: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('Excel file is empty');
        setImporting(false);
        return;
      }

      const results: ImportResult = {
        total: jsonData.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      let skipped = 0;

      for (let i = 0; i < jsonData.length; i++) {
        setProgress({ current: i + 1, total: jsonData.length });

        try {
          const parsedClient = parseExcelRow(jsonData[i], i + 2);
          
          if (parsedClient) {
            await createClientFromData(parsedClient);
            results.successful++;
          } else {
            skipped++;
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            error: error.message || 'Unknown error'
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (results.successful > 0) {
        alert(`Successfully imported ${results.successful} clients${skipped > 0 ? ` (${skipped} empty rows skipped)` : ''}`);
      }
      
      if (results.failed > 0) {
        alert(`Failed to import ${results.failed} clients. Check console for details.`);
        console.error('Import errors:', results.errors);
      }

      if (results.successful === 0 && results.failed === 0 && skipped > 0) {
        alert(`No valid data found. ${skipped} empty rows skipped.`);
      }

      onImportComplete();
      
    } catch (error: any) {
      console.error('Error processing Excel file:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      setProgress(null);
      event.target.value = '';
    }
  };

  return (
    <div className="inline-block">
      <input
        type="file"
        id="excel-import"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={importing}
        className="hidden"
      />
      <label
        htmlFor="excel-import"
        className={`
          px-4 py-2 rounded-lg font-medium cursor-pointer
          inline-flex items-center gap-2
          ${importing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {importing ? (
          <>
            <div className='flex flex-row items-center gap-2'>
                <span className="animate-spin">⏳</span>
                <span className='hidden md:block'>Importing... {progress && `${progress.current}/${progress.total}`}</span>
            </div>
          </>
        ) : (
          <>
           <UploadIcon className="h-4 w-4" /> <span className='hidden md:block'>Import</span>
          </>
        )}
      </label>
    </div>
  );
};

export default ExcelImportButton;