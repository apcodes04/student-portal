/**
 * The Acadbyte Brand Bible - Light Version Main Application Architecture
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
  const [activeTab, setActiveTab] = useState('applications');
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Fetch system health telemetry
  const fetchHealth = async () => {
    try {
      const response = await apiClient.get('/health');
      setHealthStatus(response.data);
    } catch (err) {
      console.error('Error fetching health status:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchHealth();
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', color: 'var(--foreground)' }}>
      {/* Acadbyte Header Chrome */}
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
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              A
            </div>
            <span className="type-lead m-0 font-bold" style={{ color: 'var(--foreground)' }}>
              Acadbyte <span style={{ color: 'var(--muted-foreground)', fontWeight: '400' }}>/ Admissions</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn-acad-pill">
              Dashboard
            </button>
            <span className="badge-acad">
              ● System Online
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Acadbyte Hero Section */}
        <section className="mb-10 text-center max-w-3xl mx-auto">
          <span className="type-label block mb-3" style={{ color: 'var(--brand)' }}>
            RETRIEVAL ENGINE · STUDENT ADMISSIONS
          </span>
          <h1 className="type-display mb-4">
            Stop consuming admissions data.{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--brand)' }}>Start retaining it.</span>
          </h1>
          <p className="body-text text-lg max-w-2xl mx-auto">
            Learning something is the easy part. Still having it in a month is the product.
            Submit student credentials securely through our PostgreSQL cloud gateway.
          </p>
        </section>

        {/* Acadbyte Segmented Tab Control */}
        <div className="flex justify-center mb-8">
          <div
            className="inline-flex p-1 rounded-full"
            style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setActiveTab('applications')}
              className="px-6 py-2 rounded-full font-semibold transition-calm text-sm"
              style={{
                backgroundColor: activeTab === 'applications' ? 'var(--foreground)' : 'transparent',
                color: activeTab === 'applications' ? 'var(--background)' : 'var(--muted-foreground)',
              }}
            >
              Apply & Records
            </button>

            <button
              onClick={() => setActiveTab('health')}
              className="px-6 py-2 rounded-full font-semibold transition-calm text-sm"
              style={{
                backgroundColor: activeTab === 'health' ? 'var(--foreground)' : 'transparent',
                color: activeTab === 'health' ? 'var(--background)' : 'var(--muted-foreground)',
              }}
            >
              System Telemetry
            </button>
          </div>
        </div>

        {activeTab === 'applications' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-6">
              <AdmissionForm onApplicationCreated={fetchApplications} />
            </div>

            {/* List Column */}
            <div className="lg:col-span-6">
              <div className="acad-card">
                {/* Ink Blot Accent */}
                <div className="ink-blot" style={{ backgroundColor: 'var(--ink-lemon)' }}></div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="type-label block mb-1">RECORDS</span>
                    <h3 className="type-lead m-0">Recent Applications</h3>
                  </div>
                  <span className="badge-acad">
                    {applications.length} Records
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
                    <p className="body-text m-0">No application records found. Submit a form to begin.</p>
                  </div>
                )}

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {applications.map((app) => (
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
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="max-w-2xl mx-auto">
            <div className="acad-card">
              <div className="ink-blot" style={{ backgroundColor: 'var(--ink-coral)' }}></div>

              <span className="type-label block mb-1">OBSERVABILITY</span>
              <h3 className="type-lead mb-4">System Telemetry & Health</h3>

              {healthStatus ? (
                <div className="space-y-4">
                  <div
                    className="p-4 rounded-2"
                    style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border)' }}
                  >
                    <span className="type-label block mb-1">STATUS</span>
                    <span className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                      ● {healthStatus.status?.toUpperCase()}
                    </span>
                  </div>

                  <div
                    className="p-4 rounded-2"
                    style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border)' }}
                  >
                    <span className="type-label block mb-1">DATABASE ENGINE</span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {healthStatus.database}
                    </span>
                  </div>

                  <div
                    className="p-4 rounded-2"
                    style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border)' }}
                  >
                    <span className="type-label block mb-1">ENVIRONMENT</span>
                    <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {healthStatus.environment}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="body-text">Fetching live telemetry data...</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
