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
    const trimmedVal = typeof value === 'string' ? value.trim() : (value !== null && value !== undefined ? String(value).trim() : '');

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
      if (!trimmedVal) {
        errorMsg = 'GPA is required';
      } else {
        const num = parseFloat(trimmedVal);
        if (isNaN(num)) {
          errorMsg = 'GPA is required';
        } else if (num < 0.0 || num > 10.0) {
          errorMsg = 'GPA must be between 0.0 and 10.0';
        }
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

  // Trigger validation on field blur (when user tabs away from input)
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const cleanValue = sanitizeInput(value);
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

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err !== '')) {
      setServerError('Please fix the highlighted required errors before submitting.');
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
    <div className="card shadow-sm mb-4 border-0 rounded-3">
      <div className="card-header bg-light py-3 border-bottom">
        <h5 className="mb-0 text-black fw-bold" style={{ color: '#000000', fontWeight: '800', fontSize: '1.25rem' }}>
          New Student Admission Form
        </h5>
      </div>
      <div className="card-body p-4">
        {successMessage && <div className="alert alert-success fw-bold">{successMessage}</div>}
        {serverError && <div className="alert alert-danger fw-bold">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label className="form-label text-dark fw-semibold">Full Name *</label>
            <input
              type="text"
              name="full_name"
              className={`form-control form-control-lg ${errors.full_name ? 'is-invalid border-danger border-2' : ''}`}
              value={formData.full_name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.full_name && (
              <div className="text-danger fw-bold mt-1" style={{ color: '#dc3545', fontWeight: '700', fontSize: '0.9rem' }}>
                ⚠️ {errors.full_name}
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label text-dark fw-semibold">Email Address *</label>
            <input
              type="email"
              name="email"
              className={`form-control form-control-lg ${errors.email ? 'is-invalid border-danger border-2' : ''}`}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.email && (
              <div className="text-danger fw-bold mt-1" style={{ color: '#dc3545', fontWeight: '700', fontSize: '0.9rem' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          <div className="row mb-4">
            <div className="col-md-6">
              <label className="form-label text-dark fw-semibold">Degree Program *</label>
              <select
                name="program"
                className="form-select form-select-lg"
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
                className={`form-control form-control-lg ${errors.gpa ? 'is-invalid border-danger border-2' : ''}`}
                value={formData.gpa}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.gpa && (
                <div className="text-danger fw-bold mt-1" style={{ color: '#dc3545', fontWeight: '700', fontSize: '0.9rem' }}>
                  ⚠️ {errors.gpa}
                </div>
              )}
            </div>
          </div>

          {/* Bold Green Pressable Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-100 text-white fw-bold py-3 text-uppercase border-0 shadow"
            style={{
              backgroundColor: isLoading ? '#6c757d' : '#198754',
              fontSize: '1.1rem',
              letterSpacing: '1px',
              borderRadius: '10px',
              boxShadow: isLoading ? 'none' : '0 6px 16px rgba(25, 135, 84, 0.4)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease-in-out',
              transform: 'scale(1)',
            }}
            onMouseDown={(e) => {
              if (!isLoading) e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              if (!isLoading) e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#157347';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(25, 135, 84, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#198754';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(25, 135, 84, 0.4)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isLoading ? '⏳ Submitting Application...' : '🚀 Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdmissionForm;
