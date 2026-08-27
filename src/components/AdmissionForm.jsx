/**
 * Controlled Component Admission Form with Real-time Client Validation
 * 
 * [PRESENTATION-TAG: REACT-UI]
 * [PRESENTATION-TAG: INPUT-SANITIZATION]
 * [PRESENTATION-TAG: CLIENT-VALIDATION]
 * [PRESENTATION-TAG: AXIOS-CLIENT]
 */

import React, { useState } from 'react';
import apiClient from '../api/client';
import { sanitizeInput } from '../utils/sanitize';

export function AdmissionForm({ onApplicationCreated }) {
  // [PRESENTATION-TAG: REACT-UI] Controlled Component Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    program: 'CS',
    gpa: '',
  });

  // [PRESENTATION-TAG: CLIENT-VALIDATION] Real-time inline field validation errors
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // [PRESENTATION-TAG: CLIENT-VALIDATION] Validate input values instantly on client
  const validateField = (name, value) => {
    let errorMsg = '';
    const trimmedVal = typeof value === 'string' ? value.trim() : '';

    if (name === 'full_name') {
      if (!trimmedVal) {
        errorMsg = 'Full name is required';
      } else if (trimmedVal.length < 2) {
        errorMsg = 'Full name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedVal)) {
        errorMsg = 'Name can only contain alphabetic letters and spaces';
      }
    } else if (name === 'email') {
      if (!trimmedVal) {
        errorMsg = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedVal)) {
        errorMsg = 'Enter a valid email address';
      }
    } else if (name === 'gpa') {
      const num = parseFloat(value);
      if (value === '' || value === null || value === undefined) {
        errorMsg = 'GPA is required';
      } else if (isNaN(num)) {
        errorMsg = 'GPA is required';
      } else if (num < 0.0 || num > 10.0) {
        errorMsg = 'GPA must be between 0.0 and 10.0';
      }
    }
    return errorMsg;
  };

  // [PRESENTATION-TAG: INPUT-SANITIZATION] Input Change Handler with Anti-XSS Sanitization
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // [PRESENTATION-TAG: INPUT-SANITIZATION] Contextual client-side script stripping
    const cleanValue = sanitizeInput(value);

    setFormData((prev) => ({ ...prev, [name]: cleanValue }));

    // [PRESENTATION-TAG: CLIENT-VALIDATION] Immediate feedback validation on keystroke
    const fieldError = validateField(name, cleanValue);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  // [PRESENTATION-TAG: REACT-UI] [PRESENTATION-TAG: AXIOS-CLIENT] Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    // Run client validation across all fields before network request
    const newErrors = {
      full_name: validateField('full_name', formData.full_name),
      email: validateField('email', formData.email),
      gpa: validateField('gpa', formData.gpa),
    };

    if (Object.values(newErrors).some((err) => err !== '')) {
      setErrors(newErrors);
      return;
    }

    // Lock submit button immediately to prevent double clicks
    setIsLoading(true);

    try {
      // [PRESENTATION-TAG: AXIOS-CLIENT] Send JSON payload to FastAPI backend
      const response = await apiClient.post('/applications', {
        ...formData,
        gpa: parseFloat(formData.gpa),
      });

      setSuccessMessage(`Application created successfully! (ID: ${response.data.id})`);
      setFormData({ full_name: '', email: '', program: 'CS', gpa: '' });
      setErrors({});

      if (onApplicationCreated) {
        onApplicationCreated(response.data);
      }
    } catch (err) {
      if (err.response?.data?.details) {
        const backendErrors = {};
        err.response.data.details.forEach((item) => {
          backendErrors[item.field] = item.message;
        });
        setErrors(backendErrors);
        setServerError('Validation failed. Please correct the highlighted fields.');
      } else {
        setServerError(err.response?.data?.detail || 'Failed to submit application.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h5 className="mb-0 text-black fw-bold" style={{ color: '#000000', fontWeight: '800' }}>
          New Student Admission Form
        </h5>
      </div>
      <div className="card-body">
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {serverError && <div className="alert alert-danger fw-bold">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label text-dark fw-semibold">Full Name *</label>
            <input
              type="text"
              name="full_name"
              className={`form-control ${errors.full_name ? 'is-invalid border-danger' : ''}`}
              value={formData.full_name}
              onChange={handleChange}
            />
            {errors.full_name && (
              <div className="invalid-feedback d-block text-danger fw-bold mt-1" style={{ color: '#dc3545', fontWeight: '700' }}>
                ⚠️ {errors.full_name}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label text-dark fw-semibold">Email Address *</label>
            <input
              type="email"
              name="email"
              className={`form-control ${errors.email ? 'is-invalid border-danger' : ''}`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className="invalid-feedback d-block text-danger fw-bold mt-1" style={{ color: '#dc3545', fontWeight: '700' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label text-dark fw-semibold">Degree Program *</label>
              <select
                name="program"
                className="form-select"
                value={formData.program}
                onChange={handleChange}
              >
                <option value="CS">Computer Science (CS)</option>
                <option value="AI">Artificial Intelligence (AI)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="DATA_SCIENCE">Data Science</option>
                <option value="EXTC">Electronics & Telecom (EXTC)</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label text-dark fw-semibold">GPA (0.0 to 10.0) *</label>
              <input
                type="number"
                step="0.1"
                name="gpa"
                className={`form-control ${errors.gpa ? 'is-invalid border-danger' : ''}`}
                value={formData.gpa}
                onChange={handleChange}
              />
              {errors.gpa && (
                <div className="invalid-feedback d-block text-danger fw-bold mt-1" style={{ color: '#dc3545', fontWeight: '700' }}>
                  ⚠️ {errors.gpa}
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-success w-100 fw-bold" disabled={isLoading}>
            {isLoading ? 'Submitting Application...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdmissionForm;
