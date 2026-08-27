import React, { useState, useEffect } from "react";
import AdmissionForm from "./components/AdmissionForm";
import apiClient from "./api/client";

export default function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for View Details & Edit Modals
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({ full_name: "", email: "", program: "AI", gpa: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/applications");
      setApplications(response.data);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleViewDetails = async (id) => {
    try {
      const response = await apiClient.get(`/applications/${id}`);
      setViewStudent(response.data);
    } catch (err) {
      alert("Failed to fetch student details: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleOpenEdit = (student) => {
    setEditStudent(student);
    setEditFormData({
      full_name: student.full_name,
      email: student.email,
      program: student.program,
      gpa: student.gpa,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;
    setIsUpdating(true);

    try {
      await apiClient.put(`/applications/${editStudent.id}`, {
        ...editFormData,
        gpa: parseFloat(editFormData.gpa),
      });
      setEditStudent(null);
      fetchApplications();
    } catch (err) {
      alert("Failed to update student record: " + (err.response?.data?.detail || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await apiClient.patch(`/applications/${id}/status`, { status: newStatus });
      fetchApplications();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate application record?")) return;
    try {
      await apiClient.delete(`/applications/${id}`);
      fetchApplications();
    } catch (err) {
      alert("Failed to delete application: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <header className="bg-slate-900 text-white p-6 rounded-xl shadow-lg flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl font-black tracking-tight">Student Admission Portal</h1>
            <p className="text-xs text-slate-400 font-medium">
              Enterprise Production Architecture (FastAPI + Async Database + React)
            </p>
          </div>
          <button
            onClick={fetchApplications}
            className="bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow-sm"
          >
            Refresh Registry
          </button>
        </header>

        {/* Admission Submission Form */}
        <AdmissionForm onSuccess={fetchApplications} />

        {/* Applications Registry Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Active Candidate Registry ({applications.length} Records)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 text-slate-500 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Applicant Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Program</th>
                  <th className="p-3">GPA</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-slate-400 font-medium">
                      Loading data from backend database engine...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center p-8 text-slate-400 font-medium">
                      No active student applications registered.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-semibold text-slate-900">{app.full_name}</td>
                      <td className="p-3 text-slate-600">{app.email}</td>
                      <td className="p-3 text-slate-800 font-semibold">{app.program}</td>
                      <td className="p-3 font-bold">{Number(app.gpa).toFixed(2)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            app.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : app.status === "UNDER_REVIEW"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetails(app.id)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[11px] font-bold border border-indigo-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-1 rounded text-[11px] font-bold border border-sky-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, "ACCEPTED")}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[11px] font-bold border border-emerald-300"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, "REJECTED")}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1 rounded text-[11px] font-bold border border-amber-300"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 px-2 py-1 rounded text-[11px] font-bold border border-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal 1: View Individual Student Details */}
      {viewStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Individual Student Record Details</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <p><strong>Student ID:</strong> <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{viewStudent.id}</span></p>
              <p><strong>Full Name:</strong> {viewStudent.full_name}</p>
              <p><strong>Email Address:</strong> {viewStudent.email}</p>
              <p><strong>Program Code:</strong> {viewStudent.program}</p>
              <p><strong>GPA Score:</strong> {viewStudent.gpa}</p>
              <p><strong>Application Status:</strong> {viewStudent.status}</p>
              <p><strong>Created At:</strong> {new Date(viewStudent.created_at).toLocaleString()}</p>
              <p><strong>Last Updated:</strong> {new Date(viewStudent.updated_at).toLocaleString()}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewStudent(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Student Record */}
      {editStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-800 border-b pb-2">Edit Student Record</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Program</label>
                <select
                  value={editFormData.program}
                  onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="AI">AI</option>
                  <option value="CS">CS</option>
                  <option value="IT">IT</option>
                  <option value="DATA_SCIENCE">Data Science</option>
                  <option value="EXTC">EXTC</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">GPA (0.00 - 10.00)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.gpa}
                  onChange={(e) => setEditFormData({ ...editFormData, gpa: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-1.5 rounded"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
