import React, { useState, useRef, useEffect } from 'react';
import { Folder, ChevronDown, Search, Check, X } from 'lucide-react';

type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | string;

interface ProjectSelectorProps {
  projects: any[];
  selectedProjects: number[];
  setSelectedProjects: React.Dispatch<React.SetStateAction<number[]>>;
  isLoading: boolean;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjects,
  setSelectedProjects,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);


    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const removeProject = (projectId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProjects(selectedProjects.filter(id => id !== projectId));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProjects([]);
  };

  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProjectsData = projects.filter(p => selectedProjects.includes(Number(p.id)));

  const getStatusConfig = (status: string | ProjectStatus | any) => {
    const statusStr = String(status).toLowerCase();
    
    if (statusStr === 'completed' || statusStr === 'tamamlandı') {
      return {
        icon: Check,
        color: 'text-green-600',
        bg: 'bg-green-100',
        badge: 'bg-green-100 text-green-700'
      };
    }
    if (statusStr === 'in-progress' || statusStr === 'devam ediyor' || statusStr === 'in progress') {
      return {
        icon: Folder,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        badge: 'bg-blue-100 text-blue-700'
      };
    }
    if (statusStr === 'pending' || statusStr === 'bekliyor') {
      return {
        icon: Folder,
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        badge: 'bg-yellow-100 text-yellow-700'
      };
    }
    return {
      icon: Folder,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      badge: 'bg-gray-100 text-gray-700'
    };
  };

  return (
    <div className="space-y-3">
      {selectedProjects.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="w-full flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Selected Projects ({selectedProjects.length})
            </span>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
          </div>
          {selectedProjectsData.map(project => {
            const statusConfig = getStatusConfig(project.status);
            return (
              <div
                key={project.id}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className={`p-1 rounded ${statusConfig.bg}`}>
                  <statusConfig.icon className={`w-3 h-3 ${statusConfig.color}`} />
                </div>
                <span className="text-sm text-gray-700">{project.title}</span>
                <button
                  type="button"
                  onClick={(e) => removeProject(project.id, e)}
                  className="ml-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
          className="w-full flex items-center justify-between p-4 bg-white border border-gray-300 rounded-xl hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <Folder className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">
              {selectedProjects.length === 0 
                ? 'Select projects...' 
                : `${selectedProjects.length} project${selectedProjects.length === 1 ? '' : 's'} selected`
              }
            </span>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 flex flex-col">
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-500 text-sm">Loading projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? 'No projects match your search' : 'No projects available'}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {filteredProjects.map(project => {
                    const pid = Number(project.id);
                    const isSelected = selectedProjects.includes(pid);

                    return (
                      <label
                        key={project.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedProjects(prev =>
                              prev.includes(pid)
                                ? prev.filter(id => id !== pid)
                                : [...prev, pid]
                            );
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900">{project.title}</span>
                        <span className="ml-auto text-xs text-gray-500 capitalize">
                          {String(project.status)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}          
      </div>
    </div>
  );
};

export default ProjectSelector;