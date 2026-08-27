/**
 * Client-Side Contextual Anti-XSS Sanitizer
 * 
 * [PRESENTATION-TAG: INPUT-SANITIZATION]
 * Strips dangerous HTML markup and executable <script> tags on every keystroke
 * before setting React component state.
 */

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // [PRESENTATION-TAG: INPUT-SANITIZATION]
  // 1. Remove script tags and inline executable event handlers
  let cleaned = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 2. Escape HTML angle brackets while preserving normal spaces and letters
  cleaned = cleaned.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return cleaned;
}
