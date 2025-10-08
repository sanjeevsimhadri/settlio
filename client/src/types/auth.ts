export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  mobile?: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  username?: string;
  name?: string;
  email?: string;
  mobile?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  data: User;
}

export interface ApiError {
  success: boolean;
  error: string;
}