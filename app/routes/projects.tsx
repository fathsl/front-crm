import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  ListTodo,
  PauseCircle,
  PlayCircle,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { userAtom } from "~/utils/userAtom";
import { ProjectStatus, type Project } from "~/help";
import { useNavigate } from "react-router";

export default function ProjectsPage() {
  const { t } = useTranslation();
  const [user] = useAtom(userAtom);
  const baseUrl = "https://api-crm-tegd.onrender.com";
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalMode, setModalMode] = useState("add");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: 0,
    title: "",
    details: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    createdByUserId: user?.userId || 0,
    updatedByUserId: user?.userId || 0,
    status: ProjectStatus.NotStarted,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    EstimationTime: "0",
  });

  const isAdmin =
    user?.permissionType === "Yonetici" || user?.role === "Yonetici";

  const resetForm = () => {
    setFormData({
      id: 0,
      title: "",
      details: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByUserId: user?.userId || 0,
      updatedByUserId: user?.userId || 0,
      status: ProjectStatus.NotStarted,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      EstimationTime: "0",
    });
    setSelectedProject(null);
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(
        "https://api-crm-tegd.onrender.com/api/Project"
      );
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Projects fetch error:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (projectData: Project) => {
    try {
      const response = await fetch(`${baseUrl}/api/Project`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        await fetchProjects();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      return {
        success: false,
        message: "Kullanıcı oluşturulurken hata oluştu",
      };
    }
  };

  const updateProject = async (projectId: number, projectData: Project) => {
    try {
      const response = await fetch(`${baseUrl}/api/Project/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        await fetchProjects();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, message: errorData.message };
      }
    } catch (err) {
      return {
        success: false,
        message: "Kullanıcı güncellenirken hata oluştu",
      };
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.title ||
      !formData.details ||
      !formData.startDate ||
      !formData.endDate ||
      !formData.EstimationTime
    ) {
      alert("Missing required fields");
      return;
    }

    if (modalMode === "add" && !formData.status) {
      alert("Missing required fields");
      return;
    }

    const projectData: Project = {
      ...formData,
      createdByUserId: user?.userId || formData.createdByUserId,
      updatedByUserId: user?.userId || formData.updatedByUserId,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    };

    let result;
    if (modalMode === "add") {
      result = await createProject(projectData);
    } else {
      result = await updateProject(selectedProject?.id || 0, projectData);
    }

    if (result.success) {
      setIsAddModalOpen(false);
      resetForm();
      alert(
        modalMode === "add"
          ? "Project created successfully"
          : "Project updated successfully"
      );
    } else {
      alert(result.message);
    }
  };

  const getStatusConfig = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.NotStarted:
        return {
          label: "Not Started",
          color: "bg-gray-100 text-gray-800 border-gray-300",
          icon: AlertCircle,
          iconColor: "text-gray-500",
        };
      case ProjectStatus.InProgress:
        return {
          label: "In Progress",
          color: "bg-blue-100 text-blue-800 border-blue-300",
          icon: PlayCircle,
          iconColor: "text-blue-500",
        };
      case ProjectStatus.OnHold:
        return {
          label: "On Hold",
          color: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: PauseCircle,
          iconColor: "text-yellow-500",
        };
      case ProjectStatus.Completed:
        return {
          label: "Completed",
          color: "bg-green-100 text-green-800 border-green-300",
          icon: CheckCircle,
          iconColor: "text-green-500",
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800 border-gray-300",
          icon: AlertCircle,
          iconColor: "text-gray-500",
        };
    }
  };

  const formatDate = (dateString: Date) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                Proje Yönetimi
              </h1>
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                Sistem projelerini yönetin
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Yeni Proje</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {(isAdmin
            ? projects
            : projects.filter((p) => p.createdByUserId === (user?.userId ?? -1))
          ).map((project) => {
            const statusConfig = getStatusConfig(project.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}
                    >
                      <StatusIcon
                        className={`h-3 w-3 mr-1.5 ${statusConfig.iconColor}`}
                      />
                      {statusConfig.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="View Tasks"
                      >
                        <ListTodo className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {project.details}
                  </p>

                  <div className="space-y-2">
                    {project.EstimationTime && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {project.EstimationTime}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
                      </span>
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <User className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        User ID: {project.createdByUserId}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Created: {formatDate(project.createdAt)}</span>
                      <span className="text-blue-600 font-medium">
                        #{project.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by creating your first project.
              </p>
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </button>
            </div>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-opacity-20 z-40"
            onClick={() => closeAddModal()}
          ></div>

          <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                {isAddModalOpen ? "Yeni Proje Ekle" : "Proje Düzenle"}
              </h2>
              <button
                onClick={() => closeAddModal()}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="Enter project title"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimation Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.EstimationTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        EstimationTime: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors"
                    placeholder="e.g., 2 weeks, 40 hours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: Number(e.target.value) as ProjectStatus,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-colors bg-white"
                  >
                    <option value={ProjectStatus.NotStarted}>
                      Not Started
                    </option>
                    <option value={ProjectStatus.InProgress}>
                      In Progress
                    </option>
                    <option value={ProjectStatus.OnHold}>On Hold</option>
                    <option value={ProjectStatus.Completed}>Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Details
                  </label>
                  <textarea
                    required
                    value={formData.details}
                    onChange={(e) =>
                      setFormData({ ...formData, details: e.target.value })
                    }
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none transition-colors"
                    placeholder="Enter project details, requirements, notes..."
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-base transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-base flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save className="h-5 w-5" />
                    {isAddModalOpen ? "Add Project" : "Update Project"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
