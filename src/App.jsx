/**
 * Student Admission Portal - Main Single-Column Vertical Layout
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;

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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="type-lead font-bold m-0" style={{ color: 'var(--foreground)', fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
            STUDENT ADMISSION PORTAL
          </h1>

          <span className="badge-acad">
            ● System Online
          </span>
        </div>
      </header>

      {/* Main Single-Column Vertical Container */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* 1. Admission Form (Top) */}
        <AdmissionForm onApplicationCreated={fetchApplications} />

        {/* 2. Applications Records Section (Below Form) */}
        <div className="acad-card">
          {/* Ink Blot Accent */}
          <div className="ink-blot" style={{ backgroundColor: 'var(--ink-lemon)' }}></div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="type-label block mb-1">RECORDS</span>
              <h3 className="type-lead m-0">Recent Applications</h3>
            </div>
            <span className="badge-acad">
              {applications.length} Total Records
            </span>
          </div>

          {loading && (
            <p className="body-text text-center py-6">Loading application records...</p>
          )}

          {error && (
            <div
              className="p-3 mb-4 rounded-3 text-sm fw-semibold"
              style={{ backgroundColor: 'var(--incorrect-soft)', color: 'var(--incorrect)' }}
            >
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

          {/* Records List */}
          <div className="space-y-3 mb-6">
            {currentRecords.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2 transition-calm"
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-base m-0" style={{ color: 'var(--foreground)' }}>
                      {app.full_name}
                    </h4>
                    <span className="text-xs body-text">{app.email}</span>
                  </div>
                  <span className="badge-acad">
                    GPA {app.gpa}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="font-mono font-semibold" style={{ color: 'var(--brand)' }}>
                    PROGRAM: {app.program}
                  </span>
                  <span style={{ color: 'var(--muted-foreground)' }}>
                    ID: #{app.id}
                  </span>
                </div>
              </div>
            ))}
          </div>

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

              <span className="type-label" style={{ color: 'var(--foreground)' }}>
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
    </div>
  );
}

export default App;
