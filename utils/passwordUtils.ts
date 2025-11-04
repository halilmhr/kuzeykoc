// Simple password hashing utility
// Note: In production, use bcrypt or similar secure hashing library

export function hashPassword(password: string): string {
  // Simple hash for development - DO NOT use in production
  return btoa(password + 'salt123');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: 'Şifre gereklidir' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'Şifre en az 6 karakter olmalıdır' };
  }
  
  return { isValid: true };
}