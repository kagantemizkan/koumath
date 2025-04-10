// API Status constants
export const API_STATUS = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
  };
  
  // Error message constants
  export const ERRORS = {
    PERMISSION_DENIED: 'Permission to access camera or gallery was denied',
    CAMERA_ERROR: 'An error occurred while taking the picture',
    GALLERY_ERROR: 'An error occurred while selecting the image',
    PROCESSING_ERROR: 'Failed to process the equation. Please try again or use a clearer image',
    NETWORK_ERROR: 'Network error. Please check your connection and try again',
    INVALID_EQUATION: 'Could not recognize a valid equation in the image',
    UNKNOWN_ERROR: 'An unexpected error occurred'
  };
  
  // Function degree mapping
  export const DEGREE_WORD_MAP = {
    '1': 'First',
    '2': 'Second',
    '3': 'Third',
    '4': 'Fourth',
    '5': 'Fifth'
  };
  
  // Operation type mapping
  export const OPERATION_TYPES = {
    ADDITION: 'Addition',
    SUBTRACTION: 'Subtraction',
    MULTIPLICATION: 'Multiplication',
    DIVISION: 'Division'
  };