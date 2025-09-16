import { useAtomValue } from "jotai";
import { Calendar, Check, CheckCircle, ChevronDown, Circle, Clock, Eye, FileIcon, Folder, Loader2, Mail, MapPin, Mic, MicOff, Pause, Phone, Play, Plus, Save, Search, UploadIcon, UserIcon, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectStatus, type Client, type Project, type Resource, type Task } from "~/help";
import type { TaskPriority } from "~/types/task";
import { userAtom } from "~/utils/userAtom";
import { toast } from "sonner";

interface ExtendedClient extends Client {
  projectIds?: number[];
  ModifiedBy?: number | null;
}

const ClientDetailsPage = () => {
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [client, setClient] = useState<ExtendedClient | null>(null);
  const [originalClient, setOriginalClient] = useState<ExtendedClient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState({
    clients: false,
    projects: false,
    resources: false,
    tasks: false,
  });
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = "http://localhost:5178";
  const currentUser = useAtomValue(userAtom);
  const currentUserId = currentUser?.userId;

  const hasChanges = useRef(false);

  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, clients: true }));
      const response = await fetch(`${baseUrl}/api/Clients`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ExtendedClient[] = await response.json();
      
      setClients(data);
      
      if (id) {
        const currentClient = data.find(c => c.id === Number(id)) || null;
        setClient(currentClient);
        setOriginalClient(JSON.parse(JSON.stringify(currentClient)));
        
        const projectIds = currentClient?.projectIds || [];
        setSelectedProjects([...projectIds]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error fetching clients');
    } finally {
      setIsLoading(prev => ({ ...prev, clients: false }));
    }
  }, [id, baseUrl]);

  const fetchProjects = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, projects: true }));
    try {
      const response = await fetch(`${baseUrl}/api/Project`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data: Project[] = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(prev => ({ ...prev, projects: false }));
    }
  }, [baseUrl]);

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchResources = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(prev => ({ ...prev, resources: true }));
    try {
      const response = await fetch(`${baseUrl}/api/clients/${id}/resources`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      
      const data: Resource[] = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(prev => ({ ...prev, resources: false }));
    }
  }, [id, baseUrl]);

  const fetchTasks = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(prev => ({ ...prev, tasks: true }));
    try {
      const response = await fetch(`${baseUrl}/api/clients/${id}/tasks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data: Task[] = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [id, baseUrl]);

  const playAudio = (url: string, id: string) => {
    if (audioRef.current) {
      if (playingAudio === id) {
        audioRef.current.pause();
        setPlayingAudio(null);
      } else {
        audioRef.current.src = url;
        audioRef.current.play()
          .then(() => setPlayingAudio(id))
          .catch(error => {
            console.error('Error playing audio:', error);
            toast.error('Error playing audio');
          });
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        setSelectedFile(null);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'InProgress': return 'text-blue-600 bg-blue-100';
      case 'Pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: number | TaskPriority) => {
    switch (priority) {
      case 0: return 'text-red-600 bg-red-100';
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'In Progress':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRecordedAudio(null);
      if (!resourceTitle) {
        setResourceTitle(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const hasUnsavedChanges = useCallback((): boolean => {
    if (!originalClient) return false;
    
    const originalProjectIds = [...(originalClient.projectIds || [])].sort();
    const currentProjectIds = [...selectedProjects].sort();
    
    return JSON.stringify(originalProjectIds) !== JSON.stringify(currentProjectIds);
  }, [originalClient, selectedProjects]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (client?.projectIds && Array.isArray(client.projectIds)) {
      setSelectedProjects(client.projectIds);
    }
  }, [client]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchClients();
        await Promise.all([
          fetchProjects(),
          fetchResources(),
          fetchTasks()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      }
    };
    
    loadData();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [id, fetchClients, fetchProjects, fetchResources, fetchTasks, isRecording]);

  useEffect(() => {
    const originalProjectIds = originalClient?.projectIds || [];
    const currentProjectIds = selectedProjects;
   
    const projectsChanged =
      originalProjectIds.length !== currentProjectIds.length ||
      !originalProjectIds.every(id => currentProjectIds.includes(id)) ||
      !currentProjectIds.every(id => originalProjectIds.includes(id));
   
    hasChanges.current = projectsChanged;
   
    setClient(prev => prev ? { ...prev } : prev);
   
  }, [selectedProjects, originalClient?.projectIds]);

  const selectedProjectsData = projects.filter(p => selectedProjects.includes(p.id));

  const handleProjectToggle = (projectId: number) => {    
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(prev => prev.filter(id => id !== projectId));
    } else {
      setSelectedProjects(prev => [...prev, projectId]);
    }
  };

  const handleUpdateClient = async () => {
    if (!hasUnsavedChanges() || !client || !id) return;

    setIsLoading(prev => ({ ...prev, clients: true }));
    try {
      const updateData = {
        ...client,
        projectIds: selectedProjects,
        modifiedBy: currentUser?.userId || 0,
      };

      const response = await fetch(`${baseUrl}/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedClient = { ...client, projectIds: selectedProjects };
        setOriginalClient(updatedClient);
        setClient(updatedClient);
        hasChanges.current = false;
        toast.success('Client updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error updating client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Error updating client');
    } finally {
      setIsLoading(prev => ({ ...prev, clients: false }));
    }
  };

  const removeProject = (projectId: number) => {
    setSelectedProjects(prev => prev.filter(id => id !== projectId));
  };

  const clearAll = () => {
    setSelectedProjects([]);
  };

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Completed:
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' };
      case ProjectStatus.InProgress:
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' };
      default:
        return { icon: Folder, color: 'text-gray-600', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700' };
    }
  };

  const handleAddResource = async () => {
    if (!selectedFile && !recordedAudio) {
      toast.error('Please select a file or record audio');
      return;
    }

    if (!resourceTitle.trim()) {
      toast.error('Please enter a title for the resource');
      return;
    }

    if (!id) {
      toast.error('Client ID is missing');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('Title', resourceTitle);
      formData.append('Description', resourceDescription);
      formData.append('CreatedBy', currentUserId?.toString() || '');

      if (selectedFile) {
        formData.append('file', selectedFile);
      } else if (recordedAudio) {
        const audioFile = new File([recordedAudio], `recording_${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        formData.append('audioFile', audioFile);
      }

      const response = await fetch(`${baseUrl}/api/clients/${id}/resources`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSelectedFile(null);
        setRecordedAudio(null);
        setResourceTitle('');
        setResourceDescription('');
        setPlayingAudio(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        await fetchResources();
        toast.success('Resource added successfully');
        setIsDrawerOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error adding resource');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Error adding resource');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{client?.first_name + " " + client?.last_name}</h1>
              <p className="text-sm text-gray-500">Client ID: #{client?.id}</p>
            </div>
          </div>
          <button
            onClick={handleUpdateClient}
            disabled={!hasChanges.current}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              hasChanges.current
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Update</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{client?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{client?.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Client Since</p>
                <p className="font-medium">{client?.createdAt ? new Date(client?.createdAt).toDateString() : ""}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{client?.address}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Projects</h2>
          <div className="space-y-3">
          {selectedProjectsData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Selected Projects ({selectedProjectsData.length})
                </h3>
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProjectsData.map(project => {
                  const statusConfig = getStatusConfig(project.status);
                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium"
                    >
                      <statusConfig.icon className="w-3.5 h-3.5" />
                      <span>{project.title}</span>
                      <button
                        onClick={() => removeProject(project.id)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1">
                  {isLoading.projects ? (
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
                        const statusConfig = getStatusConfig(project.status);
                        const isSelected = selectedProjects.includes(project.id);
                        
                        return (
                          <button
                            key={project.id}
                            onClick={() => handleProjectToggle(project.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 ${
                              isSelected 
                                ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                                : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}>
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                            </div>

                            <div className={`p-1.5 rounded-lg ${statusConfig.bg} flex-shrink-0`}>
                              <statusConfig.icon className={`w-4 h-4 ${statusConfig.color}`} />
                            </div>

                            <div className="text-left min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{project.title}</p>
                              <p className="text-xs text-gray-500 capitalize">{project.status}</p>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.badge}`}>
                                {project.status}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}          
        </div>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Resource</span>
            </button>
          </div>

          
          {resources.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No resources added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map(resource => (
                <div key={resource.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Added {new Date(resource.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {resource.fileUrl && (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View File"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      )}
                     {/*  {resource.voiceUrl && (
                        <button
                          onClick={() => playAudio(resource.voiceUrl, resource.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title={playingAudio === resource.id ? "Pause" : "Play"}
                        >
                          {playingAudio === resource.id ? 
                            <Pause className="h-4 w-4" /> : 
                            <Play className="h-4 w-4" />
                          }
                        </button>
                      )} */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Tasks</h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No tasks assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`${getStatusColor(task.status)} p-1 rounded-full`}>
                        {getStatusIcon(task.status)}
                      </div>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>By {task.createdByUserId}</span>
                      {task.dueDate && (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.fileUrl && (
                        <a
                          href={task.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <FileIcon className="h-3 w-3" />
                          <span>{task.fileName}</span>
                        </a>
                      )}
                      {task.voiceUrl && (
                        <button
                          onClick={() => playAudio(task.voiceUrl || '', `task-${task.id}`)}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                        >
                          {playingAudio === `task-${task.id}` ? 
                            <Pause className="h-3 w-3" /> : 
                            <Play className="h-3 w-3" />
                          }
                          <span>Voice Note</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 bg-opacity-50" onClick={() => setIsDrawerOpen(false)} />
          <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Add Resource</h3>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    placeholder="Resource title (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={resourceDescription}
                    onChange={(e) => setResourceDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <UploadIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {selectedFile ? selectedFile.name : 'Click to upload file'}
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-500">OR</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Record Voice Note</label>
                    <div className="space-y-3">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-full p-4 rounded-lg font-medium transition-colors ${
                          isRecording 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          <span>
                            {isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Start Recording'}
                          </span>
                        </div>
                      </button>
                      
                      {recordedAudio && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Mic className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800">Voice recorded ({formatTime(recordingTime)})</span>
                            </div>
                            <button
                              onClick={() => setRecordedAudio(null)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddResource}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Resource
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        onEnded={() => setPlayingAudio(null)}
        style={{ display: 'none' }}
      />
    </div>
    );
};

export default ClientDetailsPage;