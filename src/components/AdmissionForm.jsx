/**
 * The Acadbyte Brand Bible - Light Version Admission Form Component
 * 
 * [PRESENTATION-TAG: REACT-UI]
 * [PRESENTATION-TAG: ACADBYTE-LIGHT-THEME]
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
      setServerError('Answer honestly — the schedule only works if it knows the truth. Please fix the highlighted fields.');
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
    <div className="acad-card mb-6">
      {/* Decorative Brand Bible Ink Blot */}
      <div className="ink-blot" style={{ backgroundColor: 'var(--ink-sky)' }}></div>

      <div className="mb-4">
        <span className="type-label block mb-1" style={{ color: 'var(--brand)' }}>
          APPLY · ADMISSION GATEWAY
        </span>
        <h3 className="type-lead m-0" style={{ color: 'var(--foreground)', fontWeight: '600' }}>
          New Student Admission Form
        </h3>
      </div>

      {successMessage && (
        <div
          className="p-3 mb-4 rounded-3 fw-semibold"
          style={{
            backgroundColor: 'var(--correct-soft)',
            color: 'var(--correct)',
            border: '1px solid var(--correct)',
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {serverError && (
        <div
          className="p-3 mb-4 rounded-3 fw-semibold"
          style={{
            backgroundColor: 'var(--incorrect-soft)',
            color: 'var(--incorrect)',
            border: '1px solid var(--incorrect)',
          }}
        >
          ⚠️ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="type-label block mb-2">FULL NAME *</label>
          <input
            type="text"
            name="full_name"
            className={`acad-input ${errors.full_name ? 'is-invalid' : ''}`}
            value={formData.full_name}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.full_name && (
            <div
              className="fw-semibold mt-2"
              style={{ color: 'var(--incorrect)', fontSize: '0.875rem' }}
            >
              ⚠️ {errors.full_name}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="type-label block mb-2">EMAIL ADDRESS *</label>
          <input
            type="email"
            name="email"
            className={`acad-input ${errors.email ? 'is-invalid' : ''}`}
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.email && (
            <div
              className="fw-semibold mt-2"
              style={{ color: 'var(--incorrect)', fontSize: '0.875rem' }}
            >
              ⚠️ {errors.email}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="type-label block mb-2">DEGREE PROGRAM *</label>
            <select
              name="program"
              className="acad-input"
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

          <div>
            <label className="type-label block mb-2">GPA (0.0 TO 10.0) *</label>
            <input
              type="number"
              step="0.1"
              name="gpa"
              className={`acad-input ${errors.gpa ? 'is-invalid' : ''}`}
              value={formData.gpa}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.gpa && (
              <div
                className="fw-semibold mt-2"
                style={{ color: 'var(--incorrect)', fontSize: '0.875rem' }}
              >
                ⚠️ {errors.gpa}
              </div>
            )}
          </div>
        </div>

        {/* Acadbyte Brand Bible Green Pill Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-acad-brand w-full"
        >
          {isLoading ? 'Submitting Application...' : 'Submit Application →'}
        </button>
      </form>
    </div>
  );
}

export default AdmissionForm;
