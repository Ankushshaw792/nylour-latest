/**
 * Phone validation utility for Indian mobile numbers
 */

// Regex for valid 10-digit Indian mobile numbers starting with 6, 7, 8, or 9
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Strips common prefixes from phone number (+91, 91, 0)
 */
export const stripPhonePrefix = (phone: string): string => {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-()]/g, ""); // Remove spaces, dashes, parentheses
  
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }
  
  return cleaned;
};

/**
 * Validates if the phone number is a valid 10-digit Indian mobile number
 */
export const isValidIndianPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = stripPhonePrefix(phone);
  return INDIAN_PHONE_REGEX.test(cleaned);
};

/**
 * Formats phone number for display as +91 XXXXX XXXXX
 */
export const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return "";
  const cleaned = stripPhonePrefix(phone);
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Returns error message for invalid phone, or null if valid
 */
export const getPhoneError = (phone: string): string | null => {
  if (!phone || phone.trim() === "") return null; // Empty is allowed (optional field)
  
  const cleaned = stripPhonePrefix(phone);
  
  if (!/^\d+$/.test(cleaned)) {
    return "Phone number should only contain digits";
  }
  
  if (cleaned.length < 10) {
    return "Phone number must be 10 digits";
  }
  
  if (cleaned.length > 10) {
    return "Phone number must be exactly 10 digits";
  }
  
  if (!/^[6-9]/.test(cleaned)) {
    return "Indian mobile numbers must start with 6, 7, 8, or 9";
  }
  
  return null;
};

/**
 * Zod refinement for Indian phone validation
 */
export const indianPhoneValidation = (phone: string | undefined): boolean => {
  if (!phone || phone.trim() === "") return true; // Empty is allowed
  return isValidIndianPhone(phone);
};

/**
 * Phone warning message to display when valid format is entered
 */
export const PHONE_WARNING_MESSAGE = "Important: Please ensure this is your real, active phone number. If you enter a fake or incorrect number, your bookings will not be recorded and you will not be added to the queue.";
