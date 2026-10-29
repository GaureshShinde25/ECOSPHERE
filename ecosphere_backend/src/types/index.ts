import { Request } from 'express';

export type UserRole = 'customer' | 'seller' | 'administrator';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  currentMode?: UserRole;
  sellerType?: string;
  avatarUrl?: string;
  city?: string;
  location?: string;
  createdAt?: string;
  verified?: boolean;
  status?: 'active' | 'suspended' | 'pending' | 'deleted';
  walletBalance?: number;
  sellerAccessStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  sellerEnabled?: boolean;
  canSwitchToSeller?: boolean;
  hasSellerCapability?: boolean;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  mobile: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiSuccessResponse<T = Record<string, unknown>> {
  success: true;
  data?: T;
  [key: string]: unknown;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T = Record<string, unknown>> = ApiSuccessResponse<T> | ApiErrorResponse;
