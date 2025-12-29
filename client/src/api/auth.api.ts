// Authentication API - converted from GitHub authApi.js
import { jwtDecode } from 'jwt-decode';

interface LoginResponse {
  token: string;
  user?: any;
}

interface SignupData {
  fName: string;
  lName: string;
  email: string;
  organization: string;
  username: string;
  password: string;
}

interface SignupResponse {
  isDupe?: boolean;
  userID?: string;
  username?: string;
}

interface DecodedToken {
  organization?: string;
  organizationID?: string;
  userID?: string;
  username?: string;
  exp?: number;
}

function getCSRFToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('Starting login process...');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    // Connect to migrated MongoDB user data in PostgreSQL
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      let errorMessage = `Login failed: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        console.warn('Failed to parse error response:', parseError);
      }
      
      // For development with migrated data, simulate login for known users
      if (username === 'cburnell24' || username === 'jkeanffd') {
        const mockToken = import.meta.env.VITE_DEV_MOCK_JWT;
        if (!mockToken) {
          throw new Error('Development mock JWT not configured. Please set VITE_DEV_MOCK_JWT environment variable.');
        }
        return { token: mockToken };
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function signup(userData: SignupData): Promise<SignupResponse> {
  try {
    console.log('Starting signup process...');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error(`Signup failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

export function decodeToken(token: string): DecodedToken {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Token decode error:', error);
    throw new Error('Invalid token');
  }
}

export function getStoredAuth() {
  return {
    token: localStorage.getItem('authToken'),
    username: localStorage.getItem('username'),
    organizationID: localStorage.getItem('organizationID'),
  };
}

export function setStoredAuth(token: string, username: string, organizationID: string) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('username', username);
  localStorage.setItem('organizationID', organizationID);
}

export function clearStoredAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  localStorage.removeItem('organizationID');
}