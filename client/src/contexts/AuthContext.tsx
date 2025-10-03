import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authAPI } from '../services/api';

// Define auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Define action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: User };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    
    default:
      return state;
  }
};

// Context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token and validate user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          dispatch({ type: 'AUTH_START' });
          const response = await authAPI.getCurrentUser();
          
          if (response.success) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: { user: response.data, token },
            });
          } else {
            // Invalid token, remove it
            localStorage.removeItem('token');
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } catch (error: any) {
          console.error('Auth initialization failed:', error);
          localStorage.removeItem('token');
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        // No token found
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.data, token: response.token },
        });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Login failed' });
      }
    } catch (error: any) {
      const errorMessage = error.error || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authAPI.register(credentials);
      
      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.token);
        
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.data, token: response.token },
        });
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Registration failed' });
      }
    } catch (error: any) {
      const errorMessage = error.error || 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Update user function
  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(userData);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_USER', payload: response.data });
      }
    } catch (error: any) {
      const errorMessage = error.error || 'Profile update failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  }, []);

  // Context value
  const contextValue: AuthContextType = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
  }), [state, login, register, logout, clearError, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};