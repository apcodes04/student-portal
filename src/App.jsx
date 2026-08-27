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
        return <span className="badge bg-success text-white px-3 py-2 rounded-pill font-bold" style={{ fontSize: '0.85rem' }}>✓ ACCEPTED</span>;
      case 'REJECTED':
        return <span className="badge bg-danger text-white px-3 py-2 rounded-pill font-bold" style={{ fontSize: '0.85rem' }}>✕ REJECTED</span>;
      case 'VERIFIED':
        return <span className="badge bg-info text-white px-3 py-2 rounded-pill font-bold" style={{ fontSize: '0.85rem' }}>🔍 VERIFIED</span>;
      default:
        return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill font-bold" style={{ fontSize: '0.85rem' }}>⏳ PENDING</span>;
    }
  };

  // Status Change Handler (Verify, Accept, Reject)
  const handleStatusChange = async (id, newStatus) => {
    try {
      setActionSuccess('');
      await apiClient.patch(`/applications/${id}/status`, { status: newStatus });
      setActionSuccess(`Record updated to ${newStatus} successfully!`);
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="type-lead font-bold m-0" style={{ color: 'var(--foreground)', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
            STUDENT ADMISSION PORTAL
          </h1>

          <span className="badge-acad">
            ● System Online
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* 1. Admission Form (Top) */}
        <AdmissionForm onApplicationCreated={fetchApplications} />

        {/* 2. Applications Records Table (Below Form) */}
        <div className="acad-card">
          <div className="ink-blot" style={{ backgroundColor: 'var(--ink-lemon)' }}></div>

          <div className="flex items-center justify-between mb-4">
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
            <div className="p-3 mb-4 rounded-3 fw-bold alert alert-success">
              ✓ {actionSuccess}
            </div>
          )}

          {loading && (
            <p className="body-text text-center py-6">Loading application records...</p>
          )}

          {error && (
            <div className="p-3 mb-4 rounded-3 text-sm fw-semibold alert alert-danger">
              ⚠️ {error}
            </div>
          )}

          {!loading && applications.length === 0 && (
            <div
              className="p-6 text-center rounded-2"
              style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border)' }}
            >
              <p className="body-text m-0">No application records found. Submit a form above to begin.</p>
            </div>
          )}

          {/* Table with Bolder and Bigger Details */}
          {applications.length > 0 && (
            <div className="table-responsive mb-4">
              <table className="table align-middle border-top" style={{ borderColor: 'var(--border)' }}>
                <thead>
                  <tr className="type-label" style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                    <th className="py-3">#</th>
                    <th className="py-3">FULL NAME</th>
                    <th className="py-3">EMAIL ADDRESS</th>
                    <th className="py-3">PROGRAM</th>
                    <th className="py-3 text-center">GPA</th>
                    <th className="py-3 text-center">STATUS</th>
                    <th className="py-3 text-end">DECISIONS & ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((app, index) => {
                    const serialNumber = indexOfFirstRecord + index + 1;
                    return (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* Serial Index (No UUID) */}
                        <td className="fw-bold text-secondary" style={{ fontSize: '1.1rem' }}>
                          #{serialNumber}
                        </td>

                        {/* Bolder & Bigger Full Name */}
                        <td className="fw-bold text-dark" style={{ fontSize: '1.15rem', color: 'var(--foreground)' }}>
                          {app.full_name}
                        </td>

                        {/* Email */}
                        <td className="fw-semibold text-muted" style={{ fontSize: '1rem' }}>
                          {app.email}
                        </td>

                        {/* Program */}
                        <td className="fw-bold text-success font-mono" style={{ fontSize: '1.05rem', color: 'var(--brand)' }}>
                          {app.program}
                        </td>

                        {/* GPA */}
                        <td className="text-center font-bold" style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                          {app.gpa}
                        </td>

                        {/* Status Badge */}
                        <td className="text-center">
                          {getStatusBadge(app.status)}
                        </td>

                        {/* Action Buttons */}
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1 flex-wrap">
                            {/* Verify Button */}
                            <button
                              onClick={() => handleStatusChange(app.id, 'VERIFIED')}
                              className="btn btn-sm btn-outline-info fw-bold"
                              title="Verify Application"
                            >
                              Verify
                            </button>

                            {/* Accept Button */}
                            <button
                              onClick={() => handleStatusChange(app.id, 'ACCEPTED')}
                              className="btn btn-sm btn-outline-success fw-bold"
                              title="Accept Application"
                            >
                              Accept
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => handleStatusChange(app.id, 'REJECTED')}
                              className="btn btn-sm btn-outline-warning fw-bold"
                              title="Reject Application"
                            >
                              Reject
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(app)}
                              className="btn btn-sm btn-outline-primary fw-bold"
                              title="Edit Details"
                            >
                              ✏️ Edit
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(app.id, app.full_name)}
                              className="btn btn-sm btn-outline-danger fw-bold"
                              title="Delete Record"
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
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-4" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title font-bold" style={{ color: 'var(--foreground)' }}>
                  ✏️ Edit Application Record
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingRecord(null)}
                ></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body space-y-4 p-4">
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
                </div>

                <div className="modal-footer border-top p-3">
                  <button
                    type="button"
                    className="btn btn-secondary fw-bold"
                    onClick={() => setEditingRecord(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success fw-bold">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
