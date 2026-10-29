import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Animated, BackHandler } from 'react-native';
import { Theme } from './src/theme';
import { UserRole } from './src/types';

// Auth & Setup Screens
import SplashScreen from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpScreen from './src/screens/OtpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import LocationPermissionScreen from './src/screens/LocationPermissionScreen';
import AiPersonalizationScreen from './src/screens/AiPersonalizationScreen';
import { BasicProfileScreen, BasicProfileData } from './src/screens/onboarding/BasicProfileScreen';
import { LocationSetupScreen } from './src/screens/onboarding/LocationSetupScreen';
import { PersonalizationScreen } from './src/screens/onboarding/PersonalizationScreen';
import { SkillsSetupScreen } from './src/screens/onboarding/SkillsSetupScreen';
import { CompletionScreen } from './src/screens/onboarding/CompletionScreen';

// Customer Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { ExploreScreen } from './src/screens/ExploreScreen';
import { AiScreen } from './src/screens/AiScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ServiceDetailScreen } from './src/screens/ServiceDetailScreen';
import { BookingServiceScreen } from './src/screens/service/BookingServiceScreen';
import { MyBookingsScreen } from './src/screens/customer/MyBookingsScreen';
import { BookingDetailsScreen } from './src/screens/customer/BookingDetailsScreen';
import { BusinessProfileScreen } from './src/screens/BusinessProfileScreen';
import { JobDetailsScreen } from './src/screens/JobDetailsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { OpportunityDetailsScreen } from './src/screens/OpportunityDetailsScreen';
import { RecommendationDetailScreen } from './src/screens/RecommendationDetailScreen';
import { LocalActivityScreen } from './src/screens/LocalActivityScreen';
import { SkillDetailsScreen } from './src/screens/SkillDetailsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SearchResultsScreen } from './src/screens/SearchResultsScreen';
import { CategoryDiscoveryScreen } from './src/screens/CategoryDiscoveryScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';

// Seller Screens
import { SellerDashboardScreen } from './src/screens/seller/SellerDashboardScreen';
import { SellerProductsScreen } from './src/screens/seller/SellerProductsScreen';
import { SellerAddProductScreen } from './src/screens/seller/SellerAddProductScreen';
import { SellerOrdersScreen } from './src/screens/seller/SellerOrdersScreen';
import { SellerOrderDetailsScreen } from './src/screens/seller/SellerOrderDetailsScreen';
import { SellerBusinessProfileScreen } from './src/screens/seller/SellerBusinessProfileScreen';
import { SellerAnalyticsScreen } from './src/screens/seller/SellerAnalyticsScreen';
import { SellerCustomersScreen } from './src/screens/seller/SellerCustomersScreen';
import { SellerSettingsScreen } from './src/screens/seller/SellerSettingsScreen';
import { SellerPromotionsScreen } from './src/screens/seller/SellerPromotionsScreen';
import { SellerMoreScreen } from './src/screens/seller/SellerMoreScreen';

// Admin Screens
import { EconomicDashboardScreen } from './src/screens/EconomicDashboardScreen';
import { AdminUserManagementScreen } from './src/screens/admin/AdminUserManagementScreen';
import { AdminBusinessManagementScreen } from './src/screens/admin/AdminBusinessManagementScreen';
import { AdminModerationScreen } from './src/screens/admin/AdminModerationScreen';
import { AdminAnalyticsScreen } from './src/screens/admin/AdminAnalyticsScreen';
import { AdminMapScreen } from './src/screens/admin/AdminMapScreen';

// Smart Grocery Screens
import {
  SmartGroceryDashboardScreen,
  SmartGroceryListScreen,
  SmartGroceryOptimizerScreen,
  SmartGroceryCompareScreen,
  SmartGroceryRecommendationsScreen,
  SmartGroceryBudgetScreen,
  SmartGroceryHistoryScreen,
  SmartGrocerySummaryScreen,
} from './src/screens/grocery';

// Navigation Components
import { BottomNavigation } from './src/components/navigation/BottomNavigation';
import { SellerBottomNavigation } from './src/components/navigation/SellerBottomNavigation';
import { AdminNavigation } from './src/components/navigation/AdminNavigation';
import { authService } from './src/services/authService';
import { tokenService } from './src/services/tokenService';
import { profileService } from './src/services/profileService';
import { activeBusinessService } from './src/services/activeBusinessService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('Splash');
  const [currentRole, setCurrentRole] = useState<UserRole>('customer');
  const [pendingMobile, setPendingMobile] = useState<string>('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [activeParams, setActiveParams] = useState<any>(null);

  const [onboardingData, setOnboardingData] = useState<{
    profile?: BasicProfileData;
    city: string;
    interests: string[];
    skills: number[];
    skillNames: string[];
    workPreferences: string[];
  }>({
    city: 'Kolkata',
    interests: ['Services', 'Jobs', 'Shopping'],
    skills: [11, 13],
    skillNames: ['Web Development', 'Software Development'],
    workPreferences: ['Full-Time', 'Freelance'],
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const navigationHistoryRef = useRef<string[]>([]);

  const navigateTo = (screenName: string, params?: any) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      if (currentScreen !== screenName && !['Splash', 'Welcome'].includes(currentScreen)) {
        navigationHistoryRef.current.push(currentScreen);
      }
      setActiveParams(params);
      setCurrentScreen(screenName);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    const onHardwareBack = () => {
      // Exit app on root screens
      if (['Splash', 'Welcome', 'Login'].includes(currentScreen)) {
        return false;
      }
      if (
        (currentScreen === 'Home' && currentRole === 'customer') ||
        (currentScreen === 'SellerDashboard' && currentRole === 'seller') ||
        (currentScreen === 'AdminOverview' && currentRole === 'administrator')
      ) {
        return false;
      }

      // Pop previous screen from history
      if (navigationHistoryRef.current.length > 0) {
        const prev = navigationHistoryRef.current.pop();
        if (prev && prev !== currentScreen) {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            setCurrentScreen(prev);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 180,
              useNativeDriver: true,
            }).start();
          });
          return true;
        }
      }

      // Fallback to role root screen
      if (currentRole === 'seller') {
        navigateTo('SellerDashboard');
        return true;
      } else {
        navigateTo('Home');
        return true;
      }
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [currentScreen, currentRole]);

  const handleSplashFinish = async () => {
    try {
      const token = await tokenService.getToken();
      if (token) {
        const user = await authService.getMe();
        if (user) {
          setAuthUser(user);
          await activeBusinessService.validateActiveBusiness(user.id);
          const role = (user.role || 'customer') as UserRole;
          setCurrentRole(role);
          if (role === 'seller') {
            navigateTo('SellerDashboard');
          } else if (role === 'administrator') {
            navigateTo('AdminOverview');
          } else {
            navigateTo('Home');
          }
          return;
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.log('[App] Session restoration failed, clearing stale credentials:', err);
      }
      await tokenService.clearSession();
      await activeBusinessService.clear();
      setAuthUser(null);
    }
    navigateTo('Onboarding');
  };

  const handleLogout = async () => {
    await authService.logout();
    setAuthUser(null);
    setCurrentRole('customer');
    setPendingMobile('');
    setOnboardingData({
      city: 'Kolkata',
      interests: ['Services', 'Jobs', 'Shopping'],
      skills: [11, 13],
      skillNames: ['Web Development', 'Software Development'],
      workPreferences: ['Full-Time', 'Freelance'],
    });
    navigateTo('Welcome');
  };

  const handleRoleSelection = async (
    role: UserRole,
    sellerConfig?: { sellerType: string; shopType?: string; categories: string[] }
  ) => {
    const currentUser = await authService.getCurrentUser();
    const authorizedRole = currentUser?.role || role;

    if (__DEV__) {
      console.log(`[RoleSelection] Requested: "${role}", Backend Authorized: "${authorizedRole}"`, sellerConfig);
    }

    setCurrentRole(authorizedRole);
    await authService.setUserRole(authorizedRole);

    if (authorizedRole === 'seller') {
      if (sellerConfig) {
        try {
          await profileService.updateProfile({
            sellerType: sellerConfig.sellerType,
            shopType: sellerConfig.shopType,
            categories: sellerConfig.categories,
            occupation: sellerConfig.shopType
              ? `${sellerConfig.sellerType} - ${sellerConfig.shopType}`
              : sellerConfig.sellerType,
          });
        } catch (err) {
          if (__DEV__) {
            console.warn('[handleRoleSelection] Profile update error:', err);
          }
        }
      }
      navigateTo('SellerDashboard');
    } else if (authorizedRole === 'administrator') {
      navigateTo('AdminOverview');
    } else {
      navigateTo('BasicProfile');
    }
  };

  const handleLocationComplete = () => {
    navigateTo('AiPersonalization');
  };

  const handlePersonalizationComplete = () => {
    if (currentRole === 'seller') {
      navigateTo('SellerDashboard');
    } else if (currentRole === 'administrator') {
      navigateTo('AdminOverview');
    } else {
      navigateTo('Home');
    }
  };

  const handleRoleSwitch = async (newRole: UserRole) => {
    setCurrentRole(newRole);
    try {
      const refreshedUser = await authService.getCurrentUser();
      if (refreshedUser) {
        setAuthUser(refreshedUser);
      }
    } catch (err) {
      if (__DEV__) console.warn('[App] Error refreshing user session post-switch:', err);
    }

    if (newRole === 'seller') {
      navigateTo('SellerDashboard');
    } else {
      navigateTo('Home');
    }
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      // Setup & Auth Flow
      case 'Splash':
        return <SplashScreen onFinish={handleSplashFinish} />;
      case 'Welcome':
        return (
          <WelcomeScreen
            onGetStarted={() => navigateTo('Register', { returnScreen: 'Welcome' })}
            onLogin={() => navigateTo('Login', { returnScreen: 'Welcome' })}
          />
        );
      case 'Onboarding':
        return (
          <OnboardingScreen
            onNext={() => navigateTo('Welcome')}
            onSkip={() => navigateTo('Welcome')}
            onBack={() => navigateTo('Welcome')}
          />
        );
      case 'Login':
        return (
          <LoginScreen
            initialIdentifier={activeParams?.identifier}
            onLogin={(mobile?: string, directUser?: any) => {
              if (directUser) {
                setAuthUser(directUser);
                const userRole = (directUser?.role || 'customer') as UserRole;
                setCurrentRole(userRole);
                if (userRole === 'seller') {
                  navigateTo('SellerDashboard');
                } else if (userRole === 'administrator') {
                  navigateTo('AdminOverview');
                } else {
                  navigateTo('Home');
                }
                return;
              }
              if (mobile) setPendingMobile(mobile);
              navigateTo('Otp', { mobile, returnScreen: 'Login' });
            }}
            onRegister={() => navigateTo('Register', { returnScreen: 'Login' })}
            onForgotPassword={() => navigateTo('ForgotPassword', { returnScreen: 'Login' })}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Welcome')}
          />
        );
      case 'ForgotPassword':
        return (
          <ForgotPasswordScreen
            onBack={() => navigateTo('Login')}
            onSuccess={(resetIdentifier?: string) => {
              navigateTo('Login', { identifier: resetIdentifier });
            }}
          />
        );
      case 'Register':
        return (
          <RegisterScreen
            onRegister={(mobile?: string, registrationData?: { name: string; email: string; requestedRole: 'customer' | 'seller' }) => {
              if (mobile) setPendingMobile(mobile);
              navigateTo('Otp', { mobile, registrationData, returnScreen: 'Register' });
            }}
            onLogin={() => navigateTo('Login', { returnScreen: 'Register' })}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Welcome')}
          />
        );
      case 'Otp':
        return (
          <OtpScreen
            mobile={activeParams?.mobile || pendingMobile}
            registrationData={activeParams?.registrationData}
            onVerified={(user?: any) => {
              if (user) setAuthUser(user);
              const userRole = (user?.role || 'customer') as UserRole;
              setCurrentRole(userRole);

              if (activeParams?.returnScreen === 'Login') {
                if (userRole === 'seller') {
                  navigateTo('SellerDashboard');
                } else if (userRole === 'administrator') {
                  navigateTo('AdminOverview');
                } else {
                  navigateTo('Home');
                }
              } else {
                navigateTo('RoleSelection');
              }
            }}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Login')}
          />
        );
      case 'RoleSelection':
        return (
          <RoleSelectionScreen
            onBack={() => navigateTo('Otp')}
            onSelectRole={handleRoleSelection}
          />
        );
      case 'BasicProfile':
        return (
          <BasicProfileScreen
            initialData={onboardingData.profile}
            onBack={() => navigateTo('RoleSelection')}
            onNext={(profileData) => {
              setOnboardingData((prev) => ({ ...prev, profile: profileData }));
              navigateTo('LocationSetup');
            }}
          />
        );
      case 'LocationSetup':
        return (
          <LocationSetupScreen
            initialCity={onboardingData.city}
            onBack={() => navigateTo('BasicProfile')}
            onNext={async (city) => {
              setOnboardingData((prev) => ({ ...prev, city }));
              const currentUser = await authService.getCurrentUser();
              if (currentUser) {
                await tokenService.saveUserSession({ ...currentUser, location: city });
              }
              navigateTo('Personalization');
            }}
          />
        );
      case 'Personalization':
        return (
          <PersonalizationScreen
            role={currentRole}
            initialInterests={onboardingData.interests}
            onBack={() => navigateTo('LocationSetup')}
            onNext={async (interests) => {
              setOnboardingData((prev) => ({ ...prev, interests }));
              const currentUser = await authService.getCurrentUser();
              if (currentUser) {
                await tokenService.saveUserSession({ ...currentUser, preferences: interests });
              }
              navigateTo('SkillsSetup');
            }}
          />
        );
      case 'SkillsSetup':
        return (
          <SkillsSetupScreen
            city={onboardingData.city}
            initialSkills={onboardingData.skills}
            initialWorkPreferences={onboardingData.workPreferences}
            onBack={() => navigateTo('Personalization')}
            onNext={(skillsData) => {
              setOnboardingData((prev) => ({
                ...prev,
                skills: skillsData.skills,
                skillNames: skillsData.skillNames,
                workPreferences: skillsData.workPreferences,
              }));
              navigateTo('Completion');
            }}
          />
        );
      case 'Completion': {
        const fullName = onboardingData.profile
          ? `${onboardingData.profile.firstName} ${onboardingData.profile.lastName}`.trim()
          : authUser?.name || 'ECOSPHERE Member';

        return (
          <CompletionScreen
            data={{
              name: fullName,
              role: currentRole,
              city: onboardingData.city,
              interests: onboardingData.interests,
              skills: onboardingData.skillNames,
              workPreferences: onboardingData.workPreferences,
            }}
            onBack={() => navigateTo('SkillsSetup')}
            onEnterApp={handlePersonalizationComplete}
          />
        );
      }
      case 'LocationPermission':
        return (
          <LocationPermissionScreen
            onEnableLocation={handleLocationComplete}
            onManualLocation={handleLocationComplete}
          />
        );
      case 'AiPersonalization':
        return (
          <AiPersonalizationScreen onComplete={handlePersonalizationComplete} />
        );

      // Customer App
      case 'Home':
        return (
          <HomeScreen
            onNavigate={navigateTo}
            onRoleSwitch={handleRoleSwitch}
            currentRole={currentRole}
          />
        );
      case 'Explore':
        return <ExploreScreen onNavigate={navigateTo} />;
      case 'Search':
        return (
          <SearchScreen
            initialQuery={activeParams?.query || ''}
            initialType={activeParams?.type || 'all'}
            city={activeParams?.city || onboardingData.city}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Explore')}
            onSelectSearch={(query, type) =>
              navigateTo('SearchResults', {
                query,
                type,
                city: activeParams?.city || onboardingData.city,
                returnScreen: 'Search',
              })
            }
          />
        );
      case 'SearchResults':
        return (
          <SearchResultsScreen
            initialQuery={activeParams?.query || ''}
            initialType={activeParams?.type || 'all'}
            initialCity={activeParams?.city || onboardingData.city}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Search', activeParams)}
            onOpenSearch={(query) =>
              navigateTo('Search', {
                query,
                type: activeParams?.type,
                city: activeParams?.city || onboardingData.city,
                returnScreen: 'SearchResults',
              })
            }
            onNavigate={(screen, params) =>
              navigateTo(screen, { ...params, returnScreen: 'SearchResults' })
            }
          />
        );
      case 'CategoryDiscovery':
        return (
          <CategoryDiscoveryScreen
            categoryType={activeParams?.categoryType || 'services'}
            categoryName={activeParams?.categoryName}
            city={activeParams?.city || onboardingData.city}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Explore')}
            onNavigate={(screen, params) =>
              navigateTo(screen, { ...params, returnScreen: 'CategoryDiscovery' })
            }
          />
        );
      case 'ProductDetailScreen':
        return (
          <ProductDetailScreen
            product={activeParams?.product}
            productId={activeParams?.productId}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Explore')}
            onSelectBusiness={(business) =>
              navigateTo('BusinessProfileScreen', {
                business,
                returnScreen: 'ProductDetailScreen',
              })
            }
            onNavigate={(screen, params) =>
              navigateTo(screen, { ...params, returnScreen: 'ProductDetailScreen' })
            }
          />
        );
      case 'AiScreen':
        return <AiScreen onNavigate={navigateTo} />;
      case 'Community':
        return <CommunityScreen />;
      case 'Profile':
        return (
          <ProfileScreen
            onNavigate={navigateTo}
            onLogout={handleLogout}
            currentRole={currentRole}
            onRoleSwitch={handleRoleSwitch}
          />
        );
      case 'ServiceDetailScreen':
        return (
          <ServiceDetailScreen
            service={activeParams?.service}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Explore')}
            onBookNow={(service) => navigateTo('BookingService', { service })}
          />
        );
      case 'BookingService':
        return (
          <BookingServiceScreen
            service={activeParams?.service}
            onBack={() => navigateTo('ServiceDetailScreen', { service: activeParams?.service })}
            onViewBooking={(bookingId) => navigateTo('BookingDetails', { bookingId })}
            onNavigateHome={() => navigateTo('Home')}
          />
        );
      case 'MyBookings':
        return (
          <MyBookingsScreen
            onBack={() => navigateTo('Home')}
            onSelectBooking={(bookingId) => navigateTo('BookingDetails', { bookingId })}
          />
        );
      case 'BookingDetails':
        return (
          <BookingDetailsScreen
            bookingId={activeParams?.bookingId || '1504'}
            onBack={() => navigateTo('MyBookings')}
          />
        );
      case 'BusinessProfileScreen':
        return (
          <BusinessProfileScreen
            business={activeParams?.business}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Home')}
            onSelectProduct={(product) =>
              navigateTo('ProductDetailScreen', {
                product,
                returnScreen: 'BusinessProfileScreen',
              })
            }
            onSelectService={(service) =>
              navigateTo('ServiceDetailScreen', {
                service,
                returnScreen: 'BusinessProfileScreen',
              })
            }
          />
        );
      case 'JobDetailsScreen':
        return (
          <JobDetailsScreen
            job={activeParams?.job}
            onBack={() => navigateTo('Explore')}
          />
        );
      case 'ChatScreen':
        return (
          <ChatScreen
            initialConversation={activeParams?.conversation}
            initialTargetUserId={activeParams?.targetUserId}
            initialTargetUserName={activeParams?.targetUserName}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Home')}
          />
        );
      case 'OpportunityDetailsScreen':
        return (
          <OpportunityDetailsScreen
            opportunityId={activeParams?.opportunityId}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Home')}
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
          />
        );
      case 'RecommendationDetail':
        return (
          <RecommendationDetailScreen
            recommendation={activeParams?.recommendation}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Home')}
            onNavigate={(screenName, params) => navigateTo(screenName, params)}
          />
        );
      case 'LocalActivity':
        return (
          <LocalActivityScreen
            city={activeParams?.city || 'Kolkata'}
            onBack={() => navigateTo(activeParams?.returnScreen || 'Home')}
            onNavigate={(screenName, params) => navigateTo(screenName, params)}
          />
        );
      case 'SkillDetailsScreen':
        return (
          <SkillDetailsScreen
            skillId={activeParams?.skillId || 18}
            city={activeParams?.city || 'Kolkata'}
            onBack={() => navigateTo(activeParams?.returnScreen || 'EconomicDashboard')}
            onNavigateToJob={(jobId) => navigateTo('JobDetailsScreen', { job: { id: jobId } })}
          />
        );

      // Seller App
      case 'SellerDashboard':
        return (
          <SellerDashboardScreen
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
            onOpenAi={() => navigateTo('AiScreen')}
            onLogout={handleLogout}
            onRoleSwitch={handleRoleSwitch}
          />
        );
      case 'SellerProducts':
        return (
          <SellerProductsScreen
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
            onBack={() => navigateTo('SellerDashboard')}
          />
        );
      case 'SellerAddProduct':
        return (
          <SellerAddProductScreen
            product={activeParams?.product}
            isEdit={activeParams?.isEdit}
            onBack={() => navigateTo(activeParams?.returnScreen || 'SellerProducts')}
            onSuccess={() => navigateTo('SellerProducts')}
          />
        );
      case 'SellerOrders':
        return (
          <SellerOrdersScreen
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
            onBack={() => navigateTo('SellerDashboard')}
          />
        );
      case 'SellerOrderDetails':
        return (
          <SellerOrderDetailsScreen
            orderId={activeParams?.orderId}
            order={activeParams?.order}
            onBack={() => navigateTo(activeParams?.returnScreen || 'SellerOrders')}
            onStatusUpdated={() => {}}
          />
        );
      case 'SellerBusinessProfile':
      case 'SellerBusiness':
        return (
          <SellerBusinessProfileScreen
            onBack={() => navigateTo(activeParams?.returnScreen || 'SellerMore')}
            onSuccess={() => navigateTo('SellerMore')}
          />
        );
      case 'SellerAnalytics':
      case 'SellerInsights':
      case 'SellerEarnings':
        return (
          <SellerAnalyticsScreen
            onBack={() => navigateTo('SellerDashboard')}
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
          />
        );
      case 'SellerCustomers':
        return (
          <SellerCustomersScreen
            onBack={() => navigateTo('SellerMore')}
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
          />
        );
      case 'SellerSettings':
        return (
          <SellerSettingsScreen
            onBack={() => navigateTo('SellerMore')}
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
            onLogout={handleLogout}
            onRoleSwitch={handleRoleSwitch}
          />
        );
      case 'SellerPromotions':
        return (
          <SellerPromotionsScreen
            onBack={() => navigateTo('SellerMore')}
          />
        );
      case 'SellerMore':
        return (
          <SellerMoreScreen
            onNavigateTab={(tab, params) => navigateTo(tab, params)}
            onLogout={handleLogout}
            onRoleSwitch={handleRoleSwitch}
            onOpenAi={() => navigateTo('AiScreen')}
          />
        );

      // Admin App
      case 'AdminOverview':
        return <EconomicDashboardScreen onNavigateTab={(tab) => navigateTo(tab)} />;
      case 'AdminUsers':
        return <AdminUserManagementScreen />;
      case 'AdminBusinesses':
        return <AdminBusinessManagementScreen />;
      case 'AdminModeration':
        return <AdminModerationScreen />;
      case 'AdminAnalytics':
        return <AdminAnalyticsScreen />;
      case 'AdminMap':
        return <AdminMapScreen />;

      // Smart Grocery Screens
      case 'SmartGrocery':
        return (
          <SmartGroceryDashboardScreen
            onBack={() => navigateTo('Home')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );
      case 'SmartGroceryList':
        return (
          <SmartGroceryListScreen
            listId={activeParams?.listId}
            list={activeParams?.list}
            onBack={() => navigateTo(activeParams?.returnScreen || 'SmartGrocery')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );
      case 'SmartGroceryOptimizer':
        return (
          <SmartGroceryOptimizerScreen
            initialItems={activeParams?.items}
            onBack={() => navigateTo(activeParams?.returnScreen || 'SmartGrocery')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );
      case 'SmartGroceryCompare':
        return (
          <SmartGroceryCompareScreen
            initialItem={activeParams?.item || 'Milk'}
            onBack={() => navigateTo(activeParams?.returnScreen || 'SmartGrocery')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );
      case 'SmartGroceryRecommendations':
        return (
          <SmartGroceryRecommendationsScreen
            onBack={() => navigateTo(activeParams?.returnScreen || 'SmartGrocery')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );
      case 'SmartGroceryBudget':
        return (
          <SmartGroceryBudgetScreen
            onBack={() => navigateTo(activeParams?.returnScreen || 'SmartGrocery')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );
      case 'SmartGroceryHistory':
        return (
          <SmartGroceryHistoryScreen
            onBack={() => navigateTo(activeParams?.returnScreen || 'SmartGrocery')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );
      case 'SmartGrocerySummary':
        return (
          <SmartGrocerySummaryScreen
            listName={activeParams?.listName}
            optimizedResult={activeParams?.optimizedResult}
            items={activeParams?.items}
            onBack={() => navigateTo(activeParams?.returnScreen || 'SmartGrocery')}
            onNavigate={(screen, params) => navigateTo(screen, params)}
          />
        );

      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  const isAuthOrSetupScreen = [
    'Splash',
    'Welcome',
    'Onboarding',
    'Login',
    'Register',
    'Otp',
    'RoleSelection',
    'LocationPermission',
    'AiPersonalization',
    'BasicProfile',
    'LocationSetup',
    'Personalization',
    'SkillsSetup',
    'Completion',
  ].includes(currentScreen);

  const isFullScreenDetail = [
    'ServiceDetailScreen',
    'BookingServiceScreen',
    'BookingDetails',
    'BusinessProfileScreen',
    'JobDetailsScreen',
    'ProductDetailScreen',
    'OpportunityDetailsScreen',
    'ChatScreen',
    'SellerAddProduct',
    'SellerOrderDetails',
    'SmartGroceryList',
    'SmartGroceryOptimizer',
    'SmartGroceryCompare',
    'SmartGroceryRecommendations',
    'SmartGroceryBudget',
    'SmartGroceryHistory',
    'SmartGrocerySummary',
  ].includes(currentScreen);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Administrator Top Control Navigation Bar */}
      {!isAuthOrSetupScreen && currentRole === 'administrator' && (
        <AdminNavigation
          currentTab={currentScreen}
          onSelectTab={(tabName) => navigateTo(tabName)}
        />
      )}

      {/* Active Screen Container with Fade Transition */}
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {renderActiveScreen()}
      </Animated.View>

      {/* Customer Bottom Navigation Bar */}
      {!isAuthOrSetupScreen && !isFullScreenDetail && currentRole === 'customer' && (
        <BottomNavigation
          currentScreen={currentScreen}
          onTabPress={(screenName: string) => navigateTo(screenName)}
        />
      )}

      {/* Seller Bottom Navigation Bar */}
      {!isAuthOrSetupScreen && !isFullScreenDetail && currentRole === 'seller' && (
        <SellerBottomNavigation
          currentTab={currentScreen}
          onSelectTab={(tabName) => navigateTo(tabName)}
          onOpenAi={() => navigateTo('AiScreen')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  screenContainer: {
    flex: 1,
  },
});
