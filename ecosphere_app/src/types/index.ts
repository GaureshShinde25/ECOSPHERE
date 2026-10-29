export type UserRole = 'customer' | 'seller' | 'administrator';

export type SellerType =
  | 'SHOP_OWNER'
  | 'SERVICE_PROVIDER'
  | 'TECHNICIAN'
  | 'RESTAURANT_OWNER'
  | 'HOTEL_OWNER'
  | 'WHOLESALER_DEALER'
  | 'DELIVERY_AGENT'
  | 'EMPLOYER';

export interface CategoryOption {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  count?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  mobileNumber?: string;
  role: UserRole;
  currentMode?: UserRole;
  sellerType?: string;
  avatarUrl?: string;
  location: string;
  createdAt: string;
  verified: boolean;
  status: 'active' | 'suspended' | 'pending' | 'deleted';
  walletBalance: number;
  preferences?: string[];
  sellerAccessStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  sellerEnabled?: boolean;
  canSwitchToSeller?: boolean;
  hasSellerCapability?: boolean;
}

export interface Business {
  id: string;
  businessId?: string;
  ownerId: string;
  ownerUserId?: string;
  name: string;
  businessName?: string;
  category: string;
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  coverImageUrl?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  status: 'active' | 'pending' | 'suspended';
  address?: string;
  addressLine1?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    city: string;
    area: string;
  };
  city?: string;
  productsCount?: number;
  phone?: string;
  email?: string;
  website?: string;
  operatingHours?: string;
  isOpen?: boolean;
  isActive?: boolean;
  healthScore?: number;
  revenueToday?: number;
  ordersCount?: number;
  customersCount?: number;
  activeVisitors?: number;
  businessType?: string;
  type?: string;
  attributes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ProductVariant {
  id?: string;
  variantId?: string | number;
  productId?: string | number;
  size: string;
  stockQuantity: number;
  price?: number;
  sku?: string;
  isAvailable?: boolean;
}

export interface Product {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  name?: string;
  productName?: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl: string;
  productImageUrl?: string;
  rating: number;
  inStock: boolean;
  salesCount: number;
  stockQuantity?: number;
  unitName?: string;
  isAvailable?: boolean;
  productCategoryId?: number;
  brandName?: string;
  variants?: ProductVariant[];
}

export interface Service {
  id: string;
  businessId: string;
  businessName: string;
  providerName: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  distance?: string;
  location: string;
  availability?: string;
}

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Temporary'
  | 'Internship'
  | 'Apprenticeship'
  | 'Freelance'
  | 'Gig Work'
  | 'Small Tasks'
  | 'On-Demand Work';

export type WorkMode = 'On-site' | 'Remote' | 'Hybrid';

export type SalaryPeriod = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY' | 'PROJECT' | 'UNPAID';

export interface Job {
  id: string;
  businessId?: string;
  employerUserId?: string;
  employerName: string;
  employerLogo?: string;
  title: string;
  category: string;
  description: string;
  salary: string;
  annualSalaryDisplay?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: SalaryPeriod | string;
  location: string;
  city?: string;
  state?: string;
  area?: string;
  locationText?: string;
  jobType: EmploymentType | string;
  workMode?: WorkMode | string;
  postedDate?: string;
  skills?: string[];
  applicantsCount?: number;
  status: 'active' | 'closed' | 'flagged' | 'OPEN' | string;
  isActive?: boolean;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  employerName: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  appliedDate: string;
  status: 'Applied' | 'Under Review' | 'Interview' | 'Selected' | 'Rejected';
  coverNote?: string;
}

export interface Booking {
  id: string;
  bookingNumber?: string;
  serviceId: string;
  serviceTitle: string;
  businessId?: string;
  businessName?: string;
  providerName: string;
  customerUserId?: string;
  customerName: string;
  date: string;
  bookingDate?: string;
  time: string;
  startTime?: string;
  endTime?: string;
  location: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPostalCode?: string;
  customerNotes?: string;
  providerNotes?: string;
  price: number;
  amount?: number;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  product?: Partial<Product>;
  selectedSize?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  businessId: string;
  businessName?: string;
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  items: OrderItem[];
  totalPrice?: number;
  totalAmount?: number;
  orderDate?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'Pending' | 'Processing' | 'Completed' | 'Cancelled' | string;
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    mobile?: string;
  };
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  verified: boolean;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  postedAt: string;
  category: 'Discussion' | 'Announcement' | 'Success Story' | 'Scheme';
  likedByUser?: boolean;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  growthPercentage: number;
  opportunityScore: number;
  category: string;
  location: string;
  actionableStep: string;
}

export interface EconomicIndicator {
  growthRate: number;
  totalOpportunities: number;
  activeJobsCount: number;
  registeredBusinessesCount: number;
  employmentRate: number;
  gdpScore: number;
  totalTransactionsVolume: string;
}

export interface AdminReport {
  id: string;
  targetId: string;
  targetType: 'User' | 'Business' | 'Job' | 'Post';
  targetTitle: string;
  reportedBy: string;
  reason: string;
  date: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
}

export interface EcosystemMapZone {
  id: string;
  name: string;
  type: 'Business Density' | 'Job Demand' | 'Service Demand' | 'Growth Zone';
  intensity: number; // 1-100
  coordinates: { x: number; y: number };
  activeNodes: number;
}

export interface Payment {
  id: string;
  userId: string;
  orderId?: string;
  bookingId?: string;
  paymentReference: string;
  gatewayName?: string;
  gatewayTransactionId?: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  status: string;
  gatewayResponse?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  orderNumber?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
