/**
 * Student Admission Portal - Single-Column Vertical Layout with Table Actions & Edit Modal
 * 
 * [PRESENTATION-TAG: REACT-UI]
 * [PRESENTATION-TAG: ACADBYTE-LIGHT-THEME]
 * [PRESENTATION-TAG: AXIOS-CLIENT]
 */

import React, { useState, useEffect } from 'react';
import { AdmissionForm } from './components/AdmissionForm';
import apiClient from './api/client';

export function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    program: 'CS',
    gpa: '',
  });

  // Fetch applications list from FastAPI backend
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/applications');
      setApplications(response.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Pagination Math
  const totalPages = Math.ceil(applications.length / recordsPerPage) || 1;
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = applications.slice(indexOfFirstRecord, indexOfLastRecord);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs"
            style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
          >
            ✓ ACCEPTED
          </span>
        );
      case 'REJECTED':
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs"
            style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
          >
            ✕ REJECTED
          </span>
        );
      case 'VERIFIED':
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs"
            style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
          >
            🔍 VERIFIED
          </span>
        );
      default:
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-full font-bold text-xs"
            style={{ backgroundColor: '#fef9c3', color: '#a16207', border: '1px solid #fef08a' }}
          >
            ⏳ PENDING
          </span>
        );
    }
  };

  // Status Change Handler (Verify, Accept, Reject)
  const handleStatusChange = async (id, newStatus) => {
    try {
      setActionSuccess('');
      await apiClient.patch(`/applications/${id}/status`, { status: newStatus });
      setActionSuccess(`Record status updated to ${newStatus} successfully!`);
      fetchApplications();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Delete Handler
  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the record for ${name}?`)) {
      try {
        setActionSuccess('');
        await apiClient.delete(`/applications/${id}`);
        setActionSuccess(`Record for ${name} deleted successfully!`);
        fetchApplications();
      } catch (err) {
        alert('Failed to delete record: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setEditFormData({
      full_name: record.full_name,
      email: record.email,
      program: record.program,
      gpa: record.gpa,
    });
  };

  // Submit Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setActionSuccess('');
      await apiClient.put(`/applications/${editingRecord.id}`, {
        ...editFormData,
        gpa: parseFloat(editFormData.gpa),
      });
      setActionSuccess(`Record for ${editFormData.full_name} updated successfully!`);
      setEditingRecord(null);
      fetchApplications();
    } catch (err) {
      alert('Failed to save record updates: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', color: 'var(--foreground)' }}>
      {/* Portal Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
        className="px-6 py-4 transition-calm"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="type-lead font-bold m-0" style={{ color: 'var(--foreground)', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
            STUDENT ADMISSION PORTAL
          </h1>

          <span className="badge-acad">
            ● System Online
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* 1. Admission Form (Top) */}
        <AdmissionForm onApplicationCreated={fetchApplications} />

        {/* 2. Applications Records Table (Below Form) */}
        <div className="acad-card">
          <div className="ink-blot" style={{ backgroundColor: 'var(--ink-lemon)' }}></div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="type-label block mb-1">RECORDS MANAGEMENT</span>
              <h3 className="type-lead m-0" style={{ fontSize: '1.35rem', fontWeight: '700' }}>
                Application Records & Decisions
              </h3>
            </div>
            <span className="badge-acad font-bold" style={{ fontSize: '0.9rem' }}>
              {applications.length} Total Records
            </span>
          </div>

          {actionSuccess && (
            <div
              className="p-3 mb-6 rounded-lg font-semibold"
              style={{ backgroundColor: 'var(--correct-soft)', color: 'var(--correct)', border: '1px solid var(--correct)' }}
            >
              ✓ {actionSuccess}
            </div>
          )}

          {loading && (
            <p className="body-text text-center py-6">Loading application records...</p>
          )}

          {error && (
            <div
              className="p-3 mb-6 rounded-lg font-semibold"
              style={{ backgroundColor: 'var(--incorrect-soft)', color: 'var(--incorrect)', border: '1px solid var(--incorrect)' }}
            >
              ⚠️ {error}
            </div>
          )}

          {!loading && applications.length === 0 && (
            <div
              className="p-8 text-center rounded-lg"
              style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border)' }}
            >
              <p className="body-text m-0 text-base">No application records found. Submit a form above to begin.</p>
            </div>
          )}

          {/* Generous Padding & Styled Table */}
          {applications.length > 0 && (
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse" style={{ minWidth: '850px' }}>
                <thead>
                  <tr className="type-label" style={{ borderBottom: '2px solid var(--border)', color: 'var(--muted-foreground)' }}>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">FULL NAME</th>
                    <th className="py-3 px-4">EMAIL ADDRESS</th>
                    <th className="py-3 px-4">PROGRAM</th>
                    <th className="py-3 px-4 text-center">GPA</th>
                    <th className="py-3 px-4 text-center">STATUS</th>
                    <th className="py-3 px-4 text-right">DECISIONS & ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((app, index) => {
                    const serialNumber = indexOfFirstRecord + index + 1;
                    return (
                      <tr
                        key={app.id}
                        className="transition-calm"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        {/* Serial Number */}
                        <td className="py-4 px-4 font-bold text-gray-500 text-base">
                          #{serialNumber}
                        </td>

                        {/* Bolder & Bigger Full Name */}
                        <td className="py-4 px-4 font-bold text-gray-900 text-lg" style={{ color: 'var(--foreground)' }}>
                          {app.full_name}
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 font-semibold text-gray-600 text-base">
                          {app.email}
                        </td>

                        {/* Program */}
                        <td className="py-4 px-4 font-bold font-mono text-base" style={{ color: 'var(--brand)' }}>
                          {app.program}
                        </td>

                        {/* GPA */}
                        <td className="py-4 px-4 text-center font-extrabold text-gray-900 text-lg">
                          {app.gpa}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 text-center">
                          {getStatusBadge(app.status)}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {/* Verify Button */}
                            <button
                              onClick={() => handleStatusChange(app.id, 'VERIFIED')}
                              className="px-3 py-1.5 rounded-full font-bold text-xs transition-calm"
                              style={{
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0284c7'; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; e.currentTarget.style.color = '#0369a1'; }}
                            >
                              Verify
                            </button>

                            {/* Accept Button */}
                            <button
                              onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                              className="px-3 py-1.5 rounded-full font-bold text-xs transition-calm"
                              style={{
                                backgroundColor: '#dcfce7',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#16a34a'; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; e.currentTarget.style.color = '#15803d'; }}
                            >
                              Accept
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleStatusChange(app.id, 'REJECTED')}
                              className="px-3 py-1.5 rounded-full font-bold text-xs transition-calm"
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fca5a5',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#b91c1c'; }}
                            >
                              Reject
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(app)}
                              className="px-3 py-1.5 rounded-full font-bold text-xs transition-calm"
                              style={{
                                backgroundColor: '#f3e8ff',
                                color: '#6b21a8',
                                border: '1px solid #e9d5ff',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7e22ce'; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3e8ff'; e.currentTarget.style.color = '#6b21a8'; }}
                            >
                              ✏️ Edit
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(app.id, app.full_name)}
                              className="px-2.5 py-1.5 rounded-full font-bold text-xs transition-calm"
                              style={{
                                backgroundColor: '#fef2f2',
                                color: '#991b1b',
                                border: '1px solid #fecaca',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#991b1b'; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#991b1b'; }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls / Page Mover */}
          {applications.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-acad-pill text-xs px-4 py-2"
                style={{
                  opacity: currentPage === 1 ? 0.4 : 1,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Previous Page
              </button>

              <span className="type-label font-bold" style={{ color: 'var(--foreground)', fontSize: '0.85rem' }}>
                PAGE {currentPage} OF {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="btn-acad-pill text-xs px-4 py-2"
                style={{
                  opacity: currentPage === totalPages || totalPages === 0 ? 0.4 : 1,
                  cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Next Page →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Record Modal Overlay */}
      {editingRecord && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 100 }}
        >
          <div className="w-full max-w-md acad-card shadow-2xl p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="type-lead m-0 text-lg">✏️ Edit Application Record</h3>
              <button
                type="button"
                className="text-gray-500 font-bold text-xl hover:text-black"
                onClick={() => setEditingRecord(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="type-label block mb-1">FULL NAME *</label>
                <input
                  type="text"
                  className="acad-input"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="type-label block mb-1">EMAIL ADDRESS *</label>
                <input
                  type="email"
                  className="acad-input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="type-label block mb-1">PROGRAM *</label>
                  <select
                    className="acad-input"
                    value={editFormData.program}
                    onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
                  >
                    <option value="CS">CS</option>
                    <option value="AI">AI</option>
                    <option value="IT">IT</option>
                    <option value="DATA_SCIENCE">DATA SCIENCE</option>
                    <option value="EXTC">EXTC</option>
                  </select>
                </div>

                <div>
                  <label className="type-label block mb-1">GPA *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="acad-input"
                    value={editFormData.gpa}
                    onChange={(e) => setEditFormData({ ...editFormData, gpa: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  className="btn-acad-pill text-sm py-2 px-4"
                  onClick={() => setEditingRecord(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-acad-brand text-sm py-2 px-5">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
