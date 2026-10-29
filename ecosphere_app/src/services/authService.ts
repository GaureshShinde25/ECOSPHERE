import { User, UserRole } from '../types';
import { apiClient } from './apiClient';
import { tokenService } from './tokenService';
import { activeBusinessService } from './activeBusinessService';

export const DEV_OTP = '123456';

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  developmentOtp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegistrationPayload {
  name?: string;
  email?: string;
  requestedRole?: UserRole;
  sellerType?: string;
}

export interface SellerAccessStatusResponse {
  success: boolean;
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  canSwitch: boolean;
  hasSellerCapability: boolean;
  sellerEnabled: boolean;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  requestId?: string;
}

export interface ForgotPasswordRequestResponse {
  success: boolean;
  message: string;
  maskedIdentifier: string;
  developmentOtp?: string;
}

export interface ForgotPasswordVerifyResponse {
  success: boolean;
  message: string;
  resetToken: string;
}

export interface ForgotPasswordResetResponse {
  success: boolean;
  message: string;
}

export const authService = {
  /**
   * Request OTP from backend API.
   * If intent is 'login', backend checks existence and rejects unknown accounts.
   */
  async requestOtp(mobile: string, intent?: 'login' | 'register'): Promise<RequestOtpResponse> {
    const cleanMobile = mobile.replace(/\D/g, '');
    const payloadMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    if (!payloadMobile || payloadMobile.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    if (__DEV__) {
      console.log(`[AuthService.requestOtp] Requesting OTP for mobile: "${payloadMobile}", intent: "${intent || 'default'}"`);
    }

    return await apiClient.post<RequestOtpResponse>(
      '/auth/request-otp',
      { mobile: payloadMobile, intent },
      { requiresAuth: false }
    );
  },

  /**
   * Verify OTP against backend API, receiving JWT token & user session.
   * LOGIN NEVER CREATES A NEW USER.
   */
  async verifyOtp(
    mobile: string,
    otp: string,
    registrationData?: RegistrationPayload,
    intent?: 'login' | 'register'
  ): Promise<VerifyOtpResponse> {
    const cleanMobile = mobile.replace(/\D/g, '');
    const payloadMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    if (!payloadMobile || payloadMobile.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    if (__DEV__) {
      console.log(`[AuthService.verifyOtp] Submitting mobile: "${payloadMobile}", OTP length: ${otp.length}, intent: "${intent || 'default'}"`);
    }

    const body: Record<string, any> = {
      mobile: payloadMobile,
      otp,
      intent,
    };
    if (registrationData?.name) body.name = registrationData.name;
    if (registrationData?.email) body.email = registrationData.email;
    if (registrationData?.requestedRole) body.requestedRole = registrationData.requestedRole;
    if (registrationData?.sellerType) body.sellerType = registrationData.sellerType;

    const response = await apiClient.post<VerifyOtpResponse>(
      '/auth/verify-otp',
      body,
      { requiresAuth: false }
    );

    if (response && response.success && response.token) {
      await tokenService.saveToken(response.token);
      if (response.user) {
        await tokenService.saveUserSession(response.user);
      }
      try {
        await activeBusinessService.clear();
      } catch {
        // safe fallback
      }
    }

    return response;
  },

  /**
   * Username / Mobile / Email + Password login.
   * Directly logs in existing accounts (including Administrator Admin.Gauresh).
   */
  async login(identifier: string, password?: string): Promise<{ success: boolean; token: string; user: User }> {
    const response = await apiClient.post<{ success: boolean; token: string; user: User }>(
      '/auth/login',
      { identifier, password },
      { requiresAuth: false }
    );

    if (response && response.success && response.token) {
      await tokenService.saveToken(response.token);
      if (response.user) {
        await tokenService.saveUserSession(response.user);
      }
      try {
        await activeBusinessService.clear();
      } catch {
        // safe fallback
      }
    }

    return response;
  },

  /**
   * Fetch authenticated user profile and authoritative role from GET /api/auth/me
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me', {
      requiresAuth: true,
    });
    if (response && response.user) {
      await tokenService.saveUserSession(response.user);
      return response.user;
    }
    throw new Error('Failed to retrieve user session from backend');
  },

  /**
   * Set active user role in local session, preserving backend authority
   */
  async setUserRole(role: UserRole): Promise<User | null> {
    const currentUser = await tokenService.getUserSession();
    if (!currentUser) return null;
    const updatedUser: User = { ...currentUser, role: currentUser.role || role };
    await tokenService.saveUserSession(updatedUser);
    return updatedUser;
  },

  /**
   * Retrieve active user session from storage (strictly null if unauthenticated)
   */
  async getCurrentUser(): Promise<User | null> {
    const user = await tokenService.getUserSession();
    return user;
  },

  /**
   * Customer requests seller capability.
   */
  async requestSellerAccess(notes?: string): Promise<{ success: boolean; status: string; message: string; requestId?: string }> {
    const response = await apiClient.post<any>(
      '/seller-access/request',
      { notes },
      { requiresAuth: true }
    );
    return response?.data || response;
  },

  /**
   * Get current seller capability approval status.
   */
  async getSellerAccessStatus(): Promise<SellerAccessStatusResponse> {
    const response = await apiClient.get<any>(
      '/seller-access/status',
      { requiresAuth: true }
    );
    const payload = response?.data || response;
    return payload || { success: true, status: 'NONE', canSwitch: false };
  },

  /**
   * Switch active user mode (customer <-> seller) via backend authorization.
   * Generates a newly signed backend JWT token with the requested role.
   */
  async switchMode(
    targetMode: 'customer' | 'seller',
    sellerType?: string
  ): Promise<{ success: boolean; token: string; user: User }> {
    const response = await apiClient.post<{ success: boolean; token: string; user: User }>(
      '/auth/switch-mode',
      { targetMode, sellerType },
      { requiresAuth: true }
    );

    if (response && response.success && response.token) {
      await tokenService.saveToken(response.token);
      if (response.user) {
        await tokenService.saveUserSession(response.user);
      }
    }

    return response;
  },

  /**
   * Clear session and remove stored JWT token & active business context
   */
  async logout(): Promise<void> {
    await tokenService.clearSession();
    try {
      await activeBusinessService.clear();
    } catch {
      // safe fallback
    }
  },

  /**
   * Request Forgot Password OTP for registered account.
   */
  async requestPasswordReset(identifier: string): Promise<ForgotPasswordRequestResponse> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      throw new Error('Registered mobile number, email, or username is required.');
    }

    const response = await apiClient.post<ForgotPasswordRequestResponse>(
      '/auth/forgot-password/request',
      { identifier: trimmed },
      { requiresAuth: false }
    );
    return response;
  },

  /**
   * Verify Forgot Password OTP and receive single-use reset token.
   */
  async verifyPasswordResetOtp(identifier: string, otp: string): Promise<ForgotPasswordVerifyResponse> {
    const trimmed = identifier.trim();
    const trimmedOtp = otp.trim();
    if (!trimmed || !trimmedOtp) {
      throw new Error('Identifier and OTP are required.');
    }

    const response = await apiClient.post<ForgotPasswordVerifyResponse>(
      '/auth/forgot-password/verify',
      { identifier: trimmed, otp: trimmedOtp },
      { requiresAuth: false }
    );
    return response;
  },

  /**
   * Reset Password using verified reset token.
   */
  async resetPassword(
    resetToken: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ForgotPasswordResetResponse> {
    if (!newPassword || !confirmPassword) {
      throw new Error('New password and confirmation are required.');
    }
    if (newPassword !== confirmPassword) {
      throw new Error('Passwords do not match.');
    }
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const response = await apiClient.post<ForgotPasswordResetResponse>(
      '/auth/forgot-password/reset',
      { resetToken, newPassword, confirmPassword },
      { requiresAuth: false }
    );
    return response;
  },
};
