import { apiClient } from './apiClient';

export interface CustomerDashboardData {
  profile: {
    userId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    mobile: string;
    role: string;
    avatarInitials: string;
    profileImageUrl?: string;
  };
  stats: {
    totalOrders: number;
    pendingOrders: number;
    totalBookings: number;
    upcomingBookings: number;
    totalApplications: number;
    totalSavedItems: number;
    unreadNotifications: number;
    unreadMessages: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    orderStatus: string;
    totalAmount: number;
    createdAt: string;
  }>;
  upcomingBookings: Array<{
    id: string;
    bookingNumber: string;
    serviceTitle: string;
    bookingDate: string;
    bookingTime: string;
    status: string;
  }>;
  recentApplications: Array<{
    id: string;
    jobTitle: string;
    status: string;
    appliedAt: string;
  }>;
  recentConversations: Array<{
    id: string;
    otherParticipantName: string;
    otherParticipantInitials: string;
    lastMessageText?: string;
    unreadCount: number;
    updatedAt?: string;
  }>;
}

export const customerDashboardService = {
  /**
   * Get customer dashboard aggregated data GET /api/customer/dashboard
   */
  async getDashboardData(): Promise<CustomerDashboardData | null> {
    try {
      const response = await apiClient.get<any>('/customer/dashboard', { requiresAuth: true });
      const payload = response?.data || response;
      if (payload && (payload.profile || payload.metrics || payload.stats)) {
        return {
          profile: payload.profile,
          stats: payload.metrics || payload.stats,
          recentOrders: payload.recentOrders || [],
          upcomingBookings: payload.upcomingBookings || [],
          recentApplications: payload.recentApplications || [],
          recentConversations: payload.recentConversations || [],
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[customerDashboardService.getDashboardData] Error:', error);
      }
    }
    return null;
  },
};
