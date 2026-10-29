import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Store,
  Briefcase,
  Users,
  Check,
  AlertCircle,
  ShoppingBag,
  Wrench,
  Utensils,
  Hotel,
  Package,
  Truck,
} from 'lucide-react-native';
import { UserRole, SellerType } from '../types';
import { CategoryMultiSelect, CategoryItem } from '../components/common/CategoryMultiSelect';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { Theme } from '../theme';

interface RoleSelectionScreenProps {
  onBack: () => void;
  onSelectRole: (
    role: UserRole,
    sellerConfig?: { sellerType: string; shopType?: string; categories: string[] }
  ) => void;
}

type OnboardingStep = 'ROLE' | 'SELLER_TYPE' | 'SHOP_TYPE' | 'CATEGORIES';
type RoleChoice = 'customer' | 'business_owner' | 'service_provider' | 'job_seeker';

interface RoleOption {
  id: RoleChoice;
  title: string;
  description: string;
  icon: any;
  targetRole: UserRole;
  defaultSellerType?: SellerType;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'customer',
    title: 'User / Customer',
    description: 'Discover and access local businesses and services.',
    icon: UserCheck,
    targetRole: 'customer',
  },
  {
    id: 'business_owner',
    title: 'Business Owner',
    description: 'List and grow your business.',
    icon: Store,
    targetRole: 'seller',
    defaultSellerType: 'SHOP_OWNER',
  },
  {
    id: 'service_provider',
    title: 'Service Provider',
    description: 'Offer your services.',
    icon: Briefcase,
    targetRole: 'seller',
    defaultSellerType: 'SERVICE_PROVIDER',
  },
  {
    id: 'job_seeker',
    title: 'Job Seeker',
    description: 'Find jobs and gig opportunities.',
    icon: Users,
    targetRole: 'customer',
  },
];

// Supported canonical seller types for detailed setup
interface SellerTypeOption {
  id: SellerType;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
}

const SELLER_TYPE_OPTIONS: SellerTypeOption[] = [
  {
    id: 'SHOP_OWNER',
    title: 'Shop Owner',
    subtitle: 'Retail & Local Merchandise',
    description: 'Own a grocery, electronics, fashion, pharmacy or local store.',
    icon: ShoppingBag,
  },
  {
    id: 'SERVICE_PROVIDER',
    title: 'Service Provider',
    subtitle: 'Services & Consultations',
    description: 'Provide home repairs, beauty, tutoring, media or professional services.',
    icon: Briefcase,
  },
  {
    id: 'TECHNICIAN',
    title: 'Technician',
    subtitle: 'Technical Skills & Diagnostics',
    description: 'Skilled electrical, AC, refrigeration, plumbing or mechanics.',
    icon: Wrench,
  },
  {
    id: 'RESTAURANT_OWNER',
    title: 'Restaurant Owner',
    subtitle: 'Dining & Culinary',
    description: 'Operate a cafe, restaurant, bakery, eatery or cloud kitchen.',
    icon: Utensils,
  },
  {
    id: 'HOTEL_OWNER',
    title: 'Hotel Owner',
    subtitle: 'Hospitality & Stays',
    description: 'Manage guest accommodations, resorts, homestays or lodging.',
    icon: Hotel,
  },
  {
    id: 'WHOLESALER_DEALER',
    title: 'Wholesaler / Dealer',
    subtitle: 'B2B & Distribution',
    description: 'Supply bulk commodities, industrial items or commercial goods.',
    icon: Package,
  },
  {
    id: 'DELIVERY_AGENT',
    title: 'Delivery Agent',
    subtitle: 'Logistics & Dispatch',
    description: 'Local courier, parcel transport and dispatch partner.',
    icon: Truck,
  },
  {
    id: 'EMPLOYER',
    title: 'Employer',
    subtitle: 'Jobs & Workforce Hiring',
    description: 'Recruit skilled local talent and publish employment opportunities.',
    icon: Users,
  },
];

// Canonical shop types for SHOP_OWNER
const SHOP_TYPE_OPTIONS = [
  { id: 'GROCERY', title: 'Grocery & Staples', description: 'Packaged foods, grains, dairy and daily essentials', icon: '🍎' },
  { id: 'ELECTRONICS', title: 'Electronics & Mobiles', description: 'Gadgets, appliances and accessories', icon: '⚡' },
  { id: 'CLOTHING', title: 'Clothing & Fashion', description: 'Apparel, footwear, garments and lifestyle', icon: '👕' },
  { id: 'PHARMACY', title: 'Pharmacy & Wellness', description: 'Medicines, supplements and health care', icon: '💊' },
  { id: 'HARDWARE', title: 'Hardware & Tools', description: 'Paints, power tools, plumbing fixtures and fittings', icon: '🔨' },
  { id: 'FURNITURE', title: 'Furniture & Living', description: 'Home decor, beds, chairs, desks and storage', icon: '🪑' },
  { id: 'STATIONERY', title: 'Books & Stationery', description: 'Office supplies, notebooks and educational items', icon: '📚' },
  { id: 'OTHER', title: 'General Retail', description: 'Novelties, gift stores, toys and pet supplies', icon: '🛍️' },
];

const CATEGORY_TAXONOMY: Record<string, string[]> = {
  GROCERY: [
    'Biscuits',
    'Grains & Pulses',
    'Dairy & Eggs',
    'Vegetables',
    'Fruits',
    'Snacks & Munchies',
    'Beverages',
    'Personal Care',
    'Household & Cleaning',
    'Spices & Condiments',
    'Bakery & Bread',
    'Frozen Foods',
  ],
  ELECTRONICS: [
    'Mobiles & Accessories',
    'Laptops & Computers',
    'Audio & Headphones',
    'Home Appliances',
    'Smart Devices & IoT',
    'Cables & Chargers',
    'TV & Entertainment',
    'Cameras & Optics',
  ],
  CLOTHING: [
    "Men's Apparel",
    "Women's Apparel",
    "Kids' Wear",
    'Footwear',
    'Fashion Accessories',
    'Ethnic & Traditional Wear',
    'Sportswear',
    'Bags & Luggage',
  ],
  PHARMACY: [
    'Prescription Medicines',
    'Health Supplements',
    'First Aid & Emergency Care',
    'Baby Care & Maternity',
    'Personal Hygiene',
    'Medical Monitors & Devices',
    'Ayurveda & Herbal Wellness',
  ],
  HARDWARE: [
    'Hand Tools',
    'Power Tools & Equipment',
    'Electrical Supplies',
    'Plumbing Fixtures & Pipes',
    'Paints & Primers',
    'Fasteners & Screws',
    'Safety Gear & Workwear',
  ],
  FURNITURE: [
    'Living Room Furniture',
    'Bedroom & Mattresses',
    'Office & Study Desks',
    'Kitchen & Dining Sets',
    'Storage & Wardrobes',
    'Home Decor & Lighting',
  ],
  STATIONERY: [
    'Notebooks & Diaries',
    'Pens, Pencils & Art Supplies',
    'School & Office Supplies',
    'Educational Books',
    'Paper & Printing Supplies',
    'Desk Organizers',
  ],
  OTHER: [
    'Packaged Goods',
    'Gift Items & Novelties',
    'Toys & Games',
    'Pet Supplies & Food',
    'Sports & Outdoor Equipment',
  ],
  SERVICE_PROVIDER: [
    'Electrical Installation & Repair',
    'Plumbing & Pipefitting',
    'Home Appliance Repair',
    'House Cleaning & Deep Sanitization',
    'Beauty, Hair & Salon Services',
    'Tutoring & Academic Coaching',
    'Photography & Videography',
    'Carpentry & Woodwork',
    'Interior Painting & Wall Decor',
    'Pest Control & Treatment',
    'Fitness & Yoga Coaching',
    'Event Management & Catering',
  ],
  TECHNICIAN: [
    'AC Repair & Servicing',
    'Refrigerator & Deep Freezer Repair',
    'Washing Machine & Dryer Service',
    'Microwave & Kitchen Appliance Repair',
    'Water Purifier & RO Service',
    'Home Inverter & UPS Repair',
    'Television & Audio Repair',
    'Electrical Switchboard & Wiring',
  ],
  RESTAURANT_OWNER: [
    'North Indian & Tandoori',
    'South Indian & Tiffins',
    'Street Food & Chaat',
    'Bakery, Cakes & Pastries',
    'Chinese & Asian',
    'Italian & Pizza / Pasta',
    'Beverages & Fresh Juices',
    'Biryani & Mughlai',
  ],
  HOTEL_OWNER: [
    'Boutique & Heritage Hotel',
    'Business & Corporate Hotel',
    'Budget Hotel & Lodge',
  ],
  WHOLESALER_DEALER: [
    'Agricultural & Grains Bulk',
    'FMCG & Packaged Goods Bulk',
    'Hardware & Industrial Supplies',
    'Textiles & Garment Lots',
    'Electronics Wholesale',
  ],
  DELIVERY_AGENT: [
    'Last-Mile Parcel Delivery',
    'Grocery & Food Dispatch',
    'Bulk Freight & Logistics',
  ],
  EMPLOYER: [
    'Retail Associates & Cashiers',
    'Technicians & Electricians',
    'Delivery Drivers & Riders',
    'Hospitality & Cooks',
    'Office & Administrative',
  ],
};

export default function RoleSelectionScreen({ onBack, onSelectRole }: RoleSelectionScreenProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('ROLE');
  const [selectedRoleChoice, setSelectedRoleChoice] = useState<RoleChoice>('customer');
  const [authorizedRole, setAuthorizedRole] = useState<UserRole>('customer');
  const [accessNotice, setAccessNotice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seller Type & Category Setup State
  const [selectedSellerType, setSelectedSellerType] = useState<SellerType | null>(null);
  const [selectedShopType, setSelectedShopType] = useState<string>('GROCERY');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Array<string | number>>([]);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user && user.role) {
        setAuthorizedRole(user.role);
        if (user.role === 'seller') {
          setSelectedRoleChoice('business_owner');
        } else {
          setSelectedRoleChoice('customer');
        }
      }
    });
  }, []);

  const handleSelectRoleChoice = (choice: RoleChoice) => {
    setSelectedRoleChoice(choice);
    const chosenOption = ROLE_OPTIONS.find((r) => r.id === choice);
    const targetRole = chosenOption?.targetRole || 'customer';

    if (authorizedRole === 'customer' && targetRole === 'seller') {
      setAccessNotice(
        'Your account is currently registered as Customer. You can continue to explore business setup or register a seller account.'
      );
    } else if (authorizedRole === 'seller' && targetRole === 'customer') {
      setAccessNotice(
        'Your account is authorized as Seller. Sellers also enjoy full discovery features across the ecosystem.'
      );
    } else {
      setAccessNotice('');
    }
  };

  const handleContinueFromRole = () => {
    const chosenOption = ROLE_OPTIONS.find((r) => r.id === selectedRoleChoice);
    if (!chosenOption) {
      onSelectRole('customer');
      return;
    }

    if (chosenOption.targetRole === 'seller') {
      if (chosenOption.id === 'service_provider') {
        setSelectedSellerType('SERVICE_PROVIDER');
        setCurrentStep('CATEGORIES');
      } else {
        setSelectedSellerType(chosenOption.defaultSellerType || 'SHOP_OWNER');
        setCurrentStep('SHOP_TYPE');
      }
    } else {
      onSelectRole('customer');
    }
  };

  const handleSelectSellerType = (sellerTypeId: SellerType) => {
    setSelectedSellerType(sellerTypeId);
    setSelectedCategoryIds([]);
    if (sellerTypeId === 'SHOP_OWNER') {
      setCurrentStep('SHOP_TYPE');
    } else {
      setCurrentStep('CATEGORIES');
    }
  };

  const handleSelectShopType = (shopTypeId: string) => {
    setSelectedShopType(shopTypeId);
    setSelectedCategoryIds([]);
    setCurrentStep('CATEGORIES');
  };

  const handleToggleCategory = (catId: string | number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleCompleteSellerSetup = async () => {
    if (!selectedSellerType || selectedCategoryIds.length === 0) return;

    setIsSubmitting(true);
    const sellerTypeObj = SELLER_TYPE_OPTIONS.find((s) => s.id === selectedSellerType);
    const sellerTypeName = sellerTypeObj?.title || 'Shop Owner';

    const selectedCategoryNames = selectedCategoryIds.map(String);
    const shopTypeObj = SHOP_TYPE_OPTIONS.find((s) => s.id === selectedShopType);
    const shopTypeName = selectedSellerType === 'SHOP_OWNER' ? (shopTypeObj?.title || 'Grocery') : undefined;

    const sellerConfig = {
      sellerType: sellerTypeName,
      shopType: shopTypeName,
      categories: selectedCategoryNames,
    };

    try {
      await profileService.updateProfile({
        sellerType: sellerTypeName,
        shopType: shopTypeName,
        categories: selectedCategoryNames,
        occupation: shopTypeName ? `${sellerTypeName} - ${shopTypeName}` : sellerTypeName,
      });
    } catch (err) {
      if (__DEV__) {
        console.warn('[RoleSelectionScreen] Profile update warning:', err);
      }
    } finally {
      setIsSubmitting(false);
      onSelectRole('seller', sellerConfig);
    }
  };

  const handleStepBack = () => {
    if (currentStep === 'CATEGORIES') {
      if (selectedSellerType === 'SHOP_OWNER') {
        setCurrentStep('SHOP_TYPE');
      } else {
        setCurrentStep('ROLE');
      }
    } else if (currentStep === 'SHOP_TYPE') {
      setCurrentStep('ROLE');
    } else if (currentStep === 'SELLER_TYPE') {
      setCurrentStep('ROLE');
    } else {
      onBack();
    }
  };

  const activeTaxonomyKey =
    selectedSellerType === 'SHOP_OWNER' ? selectedShopType : selectedSellerType || 'GROCERY';
  const rawCategories = CATEGORY_TAXONOMY[activeTaxonomyKey] || CATEGORY_TAXONOMY['GROCERY'];
  const categoryItems: CategoryItem[] = rawCategories.map((name) => ({
    id: name,
    name,
  }));

  // ==========================================
  // RENDER STEP 3: CATEGORIES
  // ==========================================
  if (currentStep === 'CATEGORIES') {
    const sellerTypeObj = SELLER_TYPE_OPTIONS.find((s) => s.id === selectedSellerType);
    const shopTypeObj = SHOP_TYPE_OPTIONS.find((s) => s.id === selectedShopType);

    const title =
      selectedSellerType === 'SHOP_OWNER'
        ? `What does your ${shopTypeObj?.title || 'shop'} sell?`
        : `Select your ${sellerTypeObj?.title || 'business'} categories`;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAF7" />
        <SafeAreaView style={styles.safeArea}>
          <CategoryMultiSelect
            title={title}
            subtitle="Pick the primary categories you offer in your neighbourhood."
            categories={categoryItems}
            selectedCategoryIds={selectedCategoryIds}
            onToggleCategory={handleToggleCategory}
            onClearAll={() => setSelectedCategoryIds([])}
            onContinue={handleCompleteSellerSetup}
            onBack={handleStepBack}
            continueLabel={isSubmitting ? 'Saving Profile...' : 'Complete Business Setup'}
            isLoading={isSubmitting}
            accentColor={Theme.colors.emerald}
          />
        </SafeAreaView>
      </View>
    );
  }

  // ==========================================
  // RENDER STEP 2: SHOP TYPE SELECTION (FOR SHOP_OWNER)
  // ==========================================
  if (currentStep === 'SHOP_TYPE') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAF7" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleStepBack} activeOpacity={0.7} style={styles.backButton}>
              <ArrowLeft size={20} color={Theme.colors.primaryText} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.stepIndicator}>STEP 2 OF 3</Text>
              <Text style={styles.screenHeaderTitle}>Select your shop type</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionSubtitle}>
              Which segment best categorizes your physical or local retail shop?
            </Text>

            <View style={styles.cardsGrid}>
              {SHOP_TYPE_OPTIONS.map((shop) => {
                const isSelected = selectedShopType === shop.id;

                return (
                  <TouchableOpacity
                    key={shop.id}
                    activeOpacity={0.85}
                    onPress={() => handleSelectShopType(shop.id)}
                    style={styles.shopCardWrapper}
                  >
                    <View
                      style={[
                        styles.shopCard,
                        isSelected && styles.cardSelected,
                      ]}
                    >
                      <View style={styles.shopCardHeader}>
                        <Text style={styles.shopEmoji}>{shop.icon}</Text>
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                          ]}
                        >
                          {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </View>
                      <Text style={styles.shopCardTitle}>{shop.title}</Text>
                      <Text style={styles.shopCardDesc}>{shop.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ==========================================
  // RENDER STEP 1: ROLE SELECTION SCREEN (4 CARDS)
  // ==========================================
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <ArrowLeft size={20} color={Theme.colors.primaryText} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Choose Your Role</Text>
            <Text style={styles.subtitle}>Help us personalize your experience.</Text>
          </View>

          {/* Access Notice Banner if needed */}
          {accessNotice ? (
            <View style={styles.noticeBanner}>
              <AlertCircle size={18} color="#D97706" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.noticeText}>{accessNotice}</Text>
            </View>
          ) : null}

          {/* 4 Separate Selectable Cards */}
          <View style={styles.cardsContainer}>
            {ROLE_OPTIONS.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = selectedRoleChoice === opt.id;

              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.88}
                  onPress={() => handleSelectRoleChoice(opt.id)}
                  style={styles.cardWrapper}
                >
                  <View
                    style={[
                      styles.roleCard,
                      isSelected && styles.cardSelected,
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <View
                        style={[
                          styles.iconContainer,
                          isSelected && styles.iconContainerSelected,
                        ]}
                      >
                        <IconComp
                          size={24}
                          color={isSelected ? Theme.colors.emerald : Theme.colors.forestGreen}
                          strokeWidth={2.2}
                        />
                      </View>

                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </View>

                    <Text style={styles.cardTitle}>{opt.title}</Text>
                    <Text style={styles.cardDescription}>{opt.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Prominent Continue Button */}
          <TouchableOpacity
            onPress={handleContinueFromRole}
            activeOpacity={0.85}
            style={styles.continueBtn}
          >
            <Text style={styles.continueText}>Continue</Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Main background
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 10,
  },
  headerTitleWrap: {
    marginLeft: 14,
    flex: 1,
  },
  stepIndicator: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  screenHeaderTitle: {
    color: '#17231B',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#17231B', // Primary text
    fontFamily: Theme.typography.headingFont,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: '#68756B', // Secondary text
    fontFamily: Theme.typography.bodyFont,
    marginTop: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#68756B',
    lineHeight: 20,
    marginBottom: 18,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  noticeText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  cardsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  cardsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  cardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  roleCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E4EBE3',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F9F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSelected: {
    backgroundColor: '#DCFCE7',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17231B',
    fontFamily: Theme.typography.headingFont,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
    lineHeight: 19,
    marginTop: 4,
  },
  shopCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  shopCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E4EBE3',
    backgroundColor: '#FFFFFF',
  },
  shopCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopEmoji: {
    fontSize: 28,
  },
  shopCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17231B',
  },
  shopCardDesc: {
    fontSize: 12,
    color: '#68756B',
    marginTop: 4,
    lineHeight: 17,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    height: 52,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Theme.typography.headingFont,
  },
});
