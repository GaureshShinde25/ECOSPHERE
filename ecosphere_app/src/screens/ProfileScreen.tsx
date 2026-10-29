import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
  AppState,
} from 'react-native';
import {
  User,
  ShoppingBag,
  Briefcase,
  Calendar,
  DollarSign,
  Heart,
  Settings,
  HelpCircle,
  LogOut,
  Edit3,
  X,
  CheckCircle2,
  ChevronRight,
  Shield,
  MapPin,
  Sparkles,
  RefreshCw,
  Store,
  Search,
  Navigation,
  Bell,
  Award,
  Users,
  FileText,
  Wrench,
} from 'lucide-react-native';
import { Theme } from '../theme';
import {
  Card,
  ProfileImage,
  Button,
  Badge,
} from '../components/ui';
import { profileService, UserProfile } from '../services/profileService';
import { locationService, LocationItem } from '../services/locationService';
import { favoriteService, UserFavoritesData } from '../services/favoriteService';
import { tokenService } from '../services/tokenService';
import { authService } from '../services/authService';
import { UserRole } from '../types';

export interface ProfileScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
  onLogout?: () => void;
  currentRole?: UserRole;
  onRoleSwitch?: (newRole: UserRole) => void;
}

const SELLER_TYPES = [
  { id: 'Shop Owner', title: 'Shop Owner', desc: 'Retail, grocery, fashion, electronics', icon: '🛒' },
  { id: 'Service Provider', title: 'Service Provider', desc: 'Home maintenance, salon, repairs', icon: '🛠️' },
  { id: 'Technician', title: 'Technician', desc: 'AC, electrical, appliances & hardware', icon: '🔧' },
  { id: 'Restaurant Owner', title: 'Restaurant Owner', desc: 'Dine-in, cloud kitchens, bakery & cafes', icon: '🍽️' },
  { id: 'Hotel Owner', title: 'Hotel Owner', desc: 'Hospitality, homestays & lodging', icon: '🏨' },
  { id: 'Wholesaler/Dealer', title: 'Wholesaler / Dealer', desc: 'B2B commercial bulk supplies', icon: '📦' },
  { id: 'Delivery Agent', title: 'Delivery Agent', desc: 'Local parcel courier & logistics', icon: '🚚' },
  { id: 'Employer', title: 'Employer', desc: 'Workforce recruitment & job listings', icon: '💼' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigate,
  onLogout,
  currentRole = 'customer',
  onRoleSwitch,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState<boolean>(false);

  // Mode Switch State
  const [isSwitchConfirmModalVisible, setIsSwitchConfirmModalVisible] = useState<boolean>(false);
  const [isSellerSetupModalVisible, setIsSellerSetupModalVisible] = useState<boolean>(false);
  const [selectedSellerType, setSelectedSellerType] = useState<string>('Shop Owner');
  const [switchingMode, setSwitchingMode] = useState<boolean>(false);

  // Seller Access Request State
  const [sellerAccessStatus, setSellerAccessStatus] = useState<any>(null);
  const [isRequestModalVisible, setIsRequestModalVisible] = useState<boolean>(false);
  const [requestNotes, setRequestNotes] = useState<string>('');
  const [submittingRequest, setSubmittingRequest] = useState<boolean>(false);

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editOccupation, setEditOccupation] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Favorites Modal State
  const [isFavoritesModalVisible, setIsFavoritesModalVisible] = useState<boolean>(false);
  const [favoritesData, setFavoritesData] = useState<UserFavoritesData>({
    services: [],
    products: [],
    jobs: [],
    businesses: [],
    total: 0,
  });

  // Location Modal State
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>('');
  const [locationSearchResults, setLocationSearchResults] = useState<LocationItem[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [savingLocation, setSavingLocation] = useState<boolean>(false);

  // Selected Location Fields
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('Maharashtra');
  const [selectedCountry, setSelectedCountry] = useState<string>('India');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedPostalCode, setSelectedPostalCode] = useState<string>('');
  const [selectedLatitude, setSelectedLatitude] = useState<number | undefined>();
  const [selectedLongitude, setSelectedLongitude] = useState<number | undefined>();
  const [locationSource, setLocationSource] = useState<string>('MANUAL');

  const popularCitiesList = locationService.getPopularCities();

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchProfile = async () => {
    try {
      // 1. Authoritative session check from /api/auth/me
      await authService.getMe().catch((err) => {
        if (__DEV__) console.warn('[ProfileScreen] getMe session warning:', err);
        return null;
      });

      // 2. Fetch full profile details from /api/profile
      const data = await profileService.getProfile();
      setProfile(data);
      setEditFirstName(data.firstName || '');
      setEditLastName(data.lastName || '');
      setEditBio(data.bio || '');
      setEditOccupation(data.occupation || '');

      // 3. Fetch explicit seller access status from /api/seller-access/status
      const status = await authService.getSellerAccessStatus();
      setSellerAccessStatus(status);
    } catch (err) {
      if (__DEV__) console.warn('[ProfileScreen] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
    fetchFavorites();
  }, [currentRole]);

  const fetchFavorites = async () => {
    const data = await favoriteService.getFavorites();
    setFavoritesData(data);
  };

  useEffect(() => {
    fetchProfile();
    fetchFavorites();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchProfile();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [currentRole]);

  const activeRole: UserRole = currentRole || profile?.role || 'customer';

  // Seller Access Request Handler
  const handleRequestSellerAccess = async () => {
    setSubmittingRequest(true);
    try {
      await authService.requestSellerAccess(requestNotes.trim());
      Alert.alert('Request Submitted', 'Your seller access request has been submitted for administrator review.');
      setIsRequestModalVisible(false);
      setRequestNotes('');
      const status = await authService.getSellerAccessStatus();
      setSellerAccessStatus(status);
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Failed to submit seller access request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Mode Switch Handler (Customer <-> Seller)
  const handleSwitchMode = async (targetMode: 'customer' | 'seller') => {
    if (switchingMode) return;

    if (targetMode === 'seller') {
      const isApproved =
        sellerAccessStatus?.status === 'APPROVED' ||
        sellerAccessStatus?.canSwitch ||
        sellerAccessStatus?.hasSellerCapability ||
        sellerAccessStatus?.sellerEnabled ||
        profile?.canSwitchToSeller ||
        profile?.hasSellerCapability ||
        profile?.sellerAccessStatus === 'APPROVED';

      if (!isApproved) {
        Alert.alert('Notice', 'Seller access is not approved for this account.');
        return;
      }
    }

    setSwitchingMode(true);

    try {
      const res = await authService.switchMode(targetMode);
      if (res && res.success) {
        // Refresh authoritative current user session
        const refreshed = await authService.getCurrentUser().catch(() => null);
        if (refreshed) {
          setProfile((prev) => (prev ? { ...prev, role: targetMode, currentMode: targetMode } : (refreshed as any)));
        } else {
          setProfile((prev) => (prev ? { ...prev, role: targetMode, currentMode: targetMode } : (res.user as any)));
        }
        onRoleSwitch?.(targetMode);
      }
    } catch (err: any) {
      const statusCode = err.statusCode || err.response?.status;
      const errorCode = err.code || err.response?.data?.error?.code;

      if (statusCode === 403 || errorCode === 'SELLER_ACCESS_UNAPPROVED') {
        Alert.alert('Notice', 'Seller access is not approved for this account.');
      } else if (statusCode === 401 || errorCode === 'UNAUTHORIZED') {
        Alert.alert('Notice', 'Your session has expired. Please log in again.');
      } else if (
        err.message?.includes('Seller setup required') ||
        errorCode === 'SELLER_SETUP_REQUIRED'
      ) {
        setIsSellerSetupModalVisible(true);
      } else {
        Alert.alert('Mode Switch Notice', err.message || 'Unable to switch mode. Please try again.');
      }
    } finally {
      setSwitchingMode(false);
    }
  };

  // Complete Seller Onboarding & Switch Handler
  const handleCompleteSellerSetup = async () => {
    setSwitchingMode(true);
    try {
      const res = await authService.switchMode('seller', selectedSellerType);
      if (res && res.success) {
        setIsSellerSetupModalVisible(false);
        setProfile((prev) => (prev ? { ...prev, role: 'seller', sellerType: selectedSellerType } : (res.user as any)));
        onRoleSwitch?.('seller');
      }
    } catch (err: any) {
      Alert.alert('Setup Error', err.message || 'Failed to complete seller setup.');
    } finally {
      setSwitchingMode(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editFirstName.trim()) {
      Alert.alert('Validation Error', 'First name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const updated = await profileService.updateProfile({
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        bio: editBio.trim(),
        occupation: editOccupation.trim(),
      });
      setProfile(updated);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Update Failed', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalVisible(false);
    onLogout?.();
  };

  const openLocationModal = () => {
    setSelectedCity(profile?.city || 'Pune');
    setSelectedState(profile?.state || 'Maharashtra');
    setSelectedCountry(profile?.country || 'India');
    setSelectedArea(profile?.area || '');
    setSelectedPostalCode(profile?.postalCode || '');
    setSelectedLatitude(profile?.latitude);
    setSelectedLongitude(profile?.longitude);
    setLocationSearchQuery('');
    setLocationSearchResults([]);
    setIsLocationModalVisible(true);
  };

  const handleLocationSearch = async (text: string) => {
    setLocationSearchQuery(text);
    if (!text || text.trim().length < 2) {
      setLocationSearchResults([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const results = await locationService.searchLocations(text.trim());
      setLocationSearchResults(results);
    } catch {
      setLocationSearchResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectLocation = (item: LocationItem) => {
    setSelectedCity(item.city);
    setSelectedState(item.state || 'Maharashtra');
    setSelectedCountry(item.country || 'India');
    setSelectedArea(item.area || '');
    setSelectedPostalCode(item.postalCode || '');
    setSelectedLatitude(item.latitude);
    setSelectedLongitude(item.longitude);
    setLocationSource('SEARCH');
    setLocationSearchResults([]);
    setLocationSearchQuery('');
  };

  const handleSelectPopularCity = (item: LocationItem) => {
    setSelectedCity(item.city);
    setSelectedState(item.state);
    setSelectedCountry(item.country);
    setSelectedArea(item.area || '');
    setSelectedPostalCode(item.postalCode || '');
    setSelectedLatitude(item.latitude);
    setSelectedLongitude(item.longitude);
    setLocationSource('POPULAR');
    setLocationSearchResults([]);
  };

  const handleUseCurrentLocation = async () => {
    setIsDetectingGps(true);
    try {
      const coords = await locationService.requestCurrentPosition();
      const resolved = await locationService.reverseGeocode(coords.latitude, coords.longitude);
      if (resolved && resolved.city) {
        Alert.alert(
          'Confirm Location',
          `Detected Location:\n${resolved.displayName || `${resolved.city}, ${resolved.state}`}\n\nDo you want to use this location?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use Location',
              onPress: () => {
                setSelectedCity(resolved.city);
                setSelectedState(resolved.state);
                setSelectedCountry(resolved.country || 'India');
                setSelectedArea(resolved.area || '');
                setSelectedPostalCode(resolved.postalCode || '');
                setSelectedLatitude(coords.latitude);
                setSelectedLongitude(coords.longitude);
                setLocationSource('GPS');
              },
            },
          ]
        );
      } else {
        setSelectedLatitude(coords.latitude);
        setSelectedLongitude(coords.longitude);
        setLocationSource('GPS');
        Alert.alert('GPS Detected', `Coordinates (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}) detected. Please enter your city.`);
      }
    } catch (err: any) {
      Alert.alert('Location Notice', err.message || 'Location permission was denied. You can search and select a location manually.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedCity.trim()) {
      Alert.alert('Validation Error', 'Please select or enter a city.');
      return;
    }

    setSavingLocation(true);
    try {
      const updated = await profileService.updateLocation({
        city: selectedCity.trim(),
        state: selectedState.trim() || undefined,
        country: selectedCountry.trim() || 'India',
        area: selectedArea.trim() || undefined,
        postalCode: selectedPostalCode.trim() || undefined,
        latitude: selectedLatitude,
        longitude: selectedLongitude,
        locationSource,
      });
      setProfile(updated);
      setIsLocationModalVisible(false);
      Alert.alert('Success', 'Location updated successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update location. Please try again.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleCancelLocation = () => {
    setIsLocationModalVisible(false);
    setLocationSearchQuery('');
    setLocationSearchResults([]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const fullName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : 'ECOSPHERE Member';

  const roleLabel = activeRole === 'seller' ? (profile?.sellerType || 'Verified Merchant') : 'Customer Member';

  const displayLocation =
    profile?.location ||
    (profile?.city ? `${profile.city}${profile?.state ? ', ' + profile.state : ''}` : 'Kolkata, IN');

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.colors.primary}
              colors={[Theme.colors.primary]}
            />
          }
        >
          {/* Header Bar */}
          <View style={styles.topBar}>
            <Text style={styles.topBarTitle}>Profile</Text>
            <TouchableOpacity
              onPress={() => setIsEditModalVisible(true)}
              style={styles.editBtn}
              activeOpacity={0.7}
            >
              <Edit3 size={16} color={Theme.colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* ========================================================
              1. ECONOMIC IDENTITY HERO CARD
             ======================================================== */}
          <Card variant="glass" glow="green" style={styles.heroCard}>
            <View style={styles.heroRow}>
              <ProfileImage
                name={fullName}
                userId={profile?.id}
                size={64}
                showBorder={true}
              />

              <View style={styles.heroInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {fullName}
                  </Text>
                  <CheckCircle2 size={16} color={Theme.colors.primary} />
                </View>

                <Badge label={roleLabel.toUpperCase()} variant="primary" style={{ marginTop: 4 }} />

                <Text style={styles.occupationText} numberOfLines={1}>
                  {profile?.occupation || 'Active Local Economy Participant'}
                </Text>

                <TouchableOpacity
                  style={styles.locationRow}
                  activeOpacity={0.7}
                  onPress={openLocationModal}
                >
                  <MapPin size={12} color={Theme.colors.primary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {displayLocation}
                  </Text>
                  <View style={styles.changeBadge}>
                    <Text style={styles.changeBadgeText}>Change</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {profile?.bio ? (
              <Text style={styles.bioText} numberOfLines={2}>
                "{profile.bio}"
              </Text>
            ) : null}

            {/* Level & Progress Indicator */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelRow}>
                <View style={styles.levelBadge}>
                  <Award size={13} color="#16A34A" />
                  <Text style={styles.levelBadgeText}>Level 5 • Pioneer</Text>
                </View>
                <Text style={styles.levelXpText}>780 / 1,000 EcoXP</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '78%' }]} />
              </View>
            </View>
          </Card>

          {/* ========================================================
              COMPACT STATISTICS ROW (Section 13 Specification)
              Connections, Posts, Saved items, Applications
             ======================================================== */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>142</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>18</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{favoritesData.total || 8}</Text>
              <Text style={styles.statLabel}>Saved items</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>4</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
          </View>

          {/* ========================================================
              MY LOCATION CARD
             ======================================================== */}
          <View style={styles.section}>
            <Card variant="glass" style={styles.myLocationCard}>
              <TouchableOpacity
                style={styles.myLocationRow}
                activeOpacity={0.7}
                onPress={openLocationModal}
              >
                <View style={styles.myLocationLeft}>
                  <View style={styles.myLocationIconBox}>
                    <MapPin size={18} color={Theme.colors.primary} />
                  </View>
                  <View style={styles.myLocationInfo}>
                    <Text style={styles.myLocationSub}>📍 My Location</Text>
                    <Text style={styles.myLocationTitle} numberOfLines={1}>
                      {displayLocation}
                    </Text>
                  </View>
                </View>
                <View style={styles.myLocationRight}>
                  <Text style={styles.myLocationChangeLink}>Change Location</Text>
                  <ChevronRight size={14} color={Theme.colors.primary} />
                </View>
              </TouchableOpacity>
            </Card>
          </View>

          {/* ========================================================
              2. ACCOUNT MODE SWITCH SECTION (Customer / Seller)
             ======================================================== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT MODE</Text>

            <Card variant="glass" style={styles.modeCard}>
              <View style={styles.modeCardContent}>
                <View style={styles.modeCardLeft}>
                  <Text style={styles.modeSubText}>Current mode</Text>
                  <View style={styles.modeBadgeRow}>
                    <Text style={styles.modeEmojiIcon}>
                      {activeRole === 'seller' ? '🏪' : '🛍'}
                    </Text>
                    <Text style={styles.modeTitle}>
                      {activeRole === 'seller' ? 'Seller' : 'Customer'}
                    </Text>
                  </View>
                  <Text style={styles.modeDesc}>
                    {activeRole === 'seller'
                      ? (profile?.sellerType ? `${profile.sellerType} workspace active` : 'Manage your business, inventory & orders')
                      : 'Shop locally, browse products & book services'}
                  </Text>
                  {activeRole === 'customer' && sellerAccessStatus?.status === 'PENDING' ? (
                    <Text style={{ color: '#F59E0B', fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                      ⏳ Seller Access: Pending Admin Approval
                    </Text>
                  ) : null}
                  {activeRole === 'customer' && sellerAccessStatus?.status === 'REJECTED' ? (
                    <Text style={{ color: '#EF4444', fontSize: 11, marginTop: 4, fontWeight: '600' }}>
                      ❌ Seller Access Rejected: {sellerAccessStatus.rejectionReason || 'Please re-apply'}
                    </Text>
                  ) : null}
                </View>

                {activeRole === 'seller' ? (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[styles.switchModeBtn, styles.switchToCustBtn]}
                    onPress={() => handleSwitchMode('customer')}
                    disabled={switchingMode}
                  >
                    {switchingMode ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={[styles.switchModeBtnText, styles.switchToCustBtnText]}>
                          Switching...
                        </Text>
                      </>
                    ) : (
                      <>
                        <RefreshCw
                          size={14}
                          color="#FFFFFF"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.switchModeBtnText, styles.switchToCustBtnText]}>
                          Switch to Customer
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (sellerAccessStatus?.status === 'APPROVED' || sellerAccessStatus?.canSwitch || sellerAccessStatus?.hasSellerCapability || sellerAccessStatus?.sellerEnabled || profile?.canSwitchToSeller || profile?.hasSellerCapability || profile?.sellerAccessStatus === 'APPROVED') ? (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[styles.switchModeBtn, styles.switchToSellerBtn]}
                    onPress={() => handleSwitchMode('seller')}
                    disabled={switchingMode}
                  >
                    {switchingMode ? (
                      <>
                        <ActivityIndicator size="small" color="#040814" style={{ marginRight: 6 }} />
                        <Text style={styles.switchModeBtnText}>
                          Switching...
                        </Text>
                      </>
                    ) : (
                      <>
                        <RefreshCw
                          size={14}
                          color="#040814"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.switchModeBtnText}>
                          Switch to Seller Portal
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : sellerAccessStatus?.status === 'PENDING' ? (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[styles.switchModeBtn, { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderWidth: 1, borderColor: '#F59E0B' }]}
                    onPress={() => Alert.alert('Request Pending', 'Your seller access request is currently pending administrator review.')}
                  >
                    <Text style={[styles.switchModeBtnText, { color: '#F59E0B' }]}>
                      Pending Approval
                    </Text>
                  </TouchableOpacity>
                ) : sellerAccessStatus?.status === 'REJECTED' ? (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[styles.switchModeBtn, styles.switchToSellerBtn]}
                    onPress={() => setIsRequestModalVisible(true)}
                  >
                    <Store size={14} color="#040814" style={{ marginRight: 6 }} />
                    <Text style={styles.switchModeBtnText}>
                      Request Seller Access Again
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={[styles.switchModeBtn, styles.switchToSellerBtn]}
                    onPress={() => setIsRequestModalVisible(true)}
                  >
                    <Store size={14} color="#040814" style={{ marginRight: 6 }} />
                    <Text style={styles.switchModeBtnText}>
                      Request Seller Access
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </View>

          {/* ========================================================
              3. MY ACTIVITY
                 Orders, Bookings, Works, Applications, Earnings
             ======================================================== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MY ACTIVITY</Text>

            <View style={styles.activityGrid}>
              {/* Orders */}
              <TouchableOpacity
                style={styles.activityItem}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert('Orders', 'Viewing active orders in your ECOSPHERE account.')
                }
              >
                <View style={[styles.activityIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <ShoppingBag size={20} color="#10B981" />
                </View>
                <Text style={styles.activityName}>Orders</Text>
                <Text style={styles.activitySub}>Purchases</Text>
              </TouchableOpacity>

              {/* Bookings & Appointments */}
              <TouchableOpacity
                style={styles.activityItem}
                activeOpacity={0.8}
                onPress={() => onNavigate?.('MyBookings')}
              >
                <View style={[styles.activityIconBox, { backgroundColor: 'rgba(20, 184, 166, 0.15)' }]}>
                  <Calendar size={20} color="#14B8A6" />
                </View>
                <Text style={styles.activityName}>Bookings</Text>
                <Text style={styles.activitySub}>Services</Text>
              </TouchableOpacity>

              {/* Applications & Works */}
              <TouchableOpacity
                style={styles.activityItem}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert('Applications', 'Review submitted job applications.')
                }
              >
                <View style={[styles.activityIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Briefcase size={20} color="#38BDF8" />
                </View>
                <Text style={styles.activityName}>Applications</Text>
                <Text style={styles.activitySub}>Work & Gigs</Text>
              </TouchableOpacity>

              {/* Earnings & Wallet */}
              <TouchableOpacity
                style={styles.activityItem}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert('Earnings', `Wallet balance: ₹${profile?.walletBalance || 0}`)
                }
              >
                <View style={[styles.activityIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <DollarSign size={20} color="#F59E0B" />
                </View>
                <Text style={styles.activityName}>Earnings</Text>
                <Text style={styles.activitySub}>₹{profile?.walletBalance || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ========================================================
              4. ACCOUNT & NAVIGATION ROWS (Section 13 Specification)
             ======================================================== */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT & PREFERENCES</Text>

            <Card variant="glass" style={styles.menuCard}>
              {/* 1. My Profile */}
              <TouchableOpacity
                style={styles.menuRow}
                activeOpacity={0.7}
                onPress={() => setIsEditModalVisible(true)}
              >
                <View style={styles.menuLeft}>
                  <User size={18} color="#16A34A" />
                  <Text style={styles.menuText}>My Profile</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* 2. My Businesses (If seller role) */}
              {activeRole === 'seller' ? (
                <>
                  <TouchableOpacity
                    style={styles.menuRow}
                    activeOpacity={0.7}
                    onPress={() => onNavigate?.('SellerDashboard')}
                  >
                    <View style={styles.menuLeft}>
                      <Store size={18} color="#0D9488" />
                      <Text style={styles.menuText}>My Businesses</Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </TouchableOpacity>
                  <View style={styles.menuDivider} />
                </>
              ) : null}

              {/* 3. My Applications */}
              <TouchableOpacity
                style={styles.menuRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert('My Applications', 'You have 4 active work and gig applications submitted.')
                }
              >
                <View style={styles.menuLeft}>
                  <Briefcase size={18} color="#2563EB" />
                  <Text style={styles.menuText}>My Applications</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* 4. Saved Opportunities */}
              <TouchableOpacity
                style={styles.menuRow}
                activeOpacity={0.7}
                onPress={() => setIsFavoritesModalVisible(true)}
              >
                <View style={styles.menuLeft}>
                  <Heart size={18} color="#EF4444" />
                  <Text style={styles.menuText}>Saved Opportunities</Text>
                </View>
                <View style={styles.menuRight}>
                  <Text style={styles.menuCount}>{favoritesData.total}</Text>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* 5. My Services */}
              <TouchableOpacity
                style={styles.menuRow}
                activeOpacity={0.7}
                onPress={() => onNavigate?.('MyBookings')}
              >
                <View style={styles.menuLeft}>
                  <Wrench size={18} color="#D97706" />
                  <Text style={styles.menuText}>My Services & Bookings</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* 6. Notifications */}
              <TouchableOpacity
                style={styles.menuRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert('Notifications', 'You have no unread urgent notifications.')
                }
              >
                <View style={styles.menuLeft}>
                  <Bell size={18} color="#7C3AED" />
                  <Text style={styles.menuText}>Notifications</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* 7. Settings */}
              <TouchableOpacity
                style={styles.menuRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert('Settings', 'Account preferences and security settings.')
                }
              >
                <View style={styles.menuLeft}>
                  <Settings size={18} color="#475569" />
                  <Text style={styles.menuText}>Settings</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              {/* 8. Help & Support */}
              <TouchableOpacity
                style={styles.menuRow}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert('Help & Support', 'ECOSPHERE 24/7 Community Support is active.')
                }
              >
                <View style={styles.menuLeft}>
                  <HelpCircle size={18} color="#16A34A" />
                  <Text style={styles.menuText}>Help & Support</Text>
                </View>
                <ChevronRight size={16} color="#94A3B8" />
              </TouchableOpacity>
            </Card>
          </View>

          {/* ========================================================
              5. LOGOUT
             ======================================================== */}
          <View style={styles.section}>
            <Button
              title="Log Out of ECOSPHERE"
              onPress={() => setIsLogoutModalVisible(true)}
              variant="destructive"
              fullWidth
              leftIcon={<LogOut size={16} color="#EF4444" />}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ========================================================
            CHANGE LOCATION MODAL
           ======================================================== */}
        <Modal
          visible={isLocationModalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCancelLocation}
        >
          <View style={styles.modalBackdrop}>
            <Card variant="solid" style={styles.locationModalCard}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalTitleCol}>
                    <Text style={styles.locationModalTitle}>CHANGE LOCATION</Text>
                    <Text style={styles.locationModalSub}>
                      Choose your location to discover relevant local opportunities.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleCancelLocation}
                    style={styles.closeBtn}
                    disabled={savingLocation}
                  >
                    <X size={18} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* A. SEARCH LOCATION */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>A. SEARCH LOCATION</Text>
                  <View style={styles.searchInputRow}>
                    <Search size={16} color="#94A3B8" style={{ marginLeft: 12 }} />
                    <TextInput
                      style={styles.locationSearchInput}
                      placeholder="Search city, area, or PIN code..."
                      placeholderTextColor="#64748B"
                      value={locationSearchQuery}
                      onChangeText={handleLocationSearch}
                      autoCapitalize="words"
                      editable={!savingLocation}
                    />
                    {isSearchingLocation ? (
                      <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginRight: 12 }} />
                    ) : locationSearchQuery.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => {
                          setLocationSearchQuery('');
                          setLocationSearchResults([]);
                        }}
                        style={{ padding: 8, marginRight: 4 }}
                      >
                        <X size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Search Results Dropdown / List */}
                  {locationSearchResults.length > 0 ? (
                    <View style={styles.searchResultsContainer}>
                      {locationSearchResults.map((res, idx) => (
                        <TouchableOpacity
                          key={`${res.city}-${res.area || ''}-${idx}`}
                          style={styles.searchResultItem}
                          activeOpacity={0.7}
                          onPress={() => handleSelectLocation(res)}
                        >
                          <MapPin size={14} color={Theme.colors.primary} style={{ marginTop: 2, marginRight: 8 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultMainText}>
                              {res.area ? `${res.area}, ${res.city}` : res.city}
                            </Text>
                            <Text style={styles.searchResultSubText} numberOfLines={1}>
                              {[res.state, res.postalCode, res.country].filter(Boolean).join(', ')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : locationSearchQuery.trim().length >= 2 && !isSearchingLocation ? (
                    <View style={styles.noResultsBox}>
                      <Text style={styles.noResultsText}>
                        No locations matching "{locationSearchQuery}". You can enter details manually below.
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* B. CURRENT LOCATION */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>B. CURRENT LOCATION</Text>
                  <TouchableOpacity
                    style={[
                      styles.gpsButton,
                      isDetectingGps && styles.gpsButtonDisabled,
                    ]}
                    activeOpacity={0.8}
                    onPress={handleUseCurrentLocation}
                    disabled={isDetectingGps || savingLocation}
                  >
                    {isDetectingGps ? (
                      <>
                        <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.gpsButtonText}>Detecting location...</Text>
                      </>
                    ) : (
                      <>
                        <Navigation size={16} color={Theme.colors.primary} style={{ marginRight: 8 }} />
                        <Text style={styles.gpsButtonText}>Use My Current Location</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* C. POPULAR CITIES */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>C. POPULAR CITIES</Text>
                  <View style={styles.popularCitiesGrid}>
                    {popularCitiesList.map((c) => {
                      const isSelected = selectedCity.trim().toLowerCase() === c.city.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={c.city}
                          style={[
                            styles.popularCityChip,
                            isSelected && styles.popularCityChipSelected,
                          ]}
                          activeOpacity={0.75}
                          onPress={() => handleSelectPopularCity(c)}
                        >
                          <Text
                            style={[
                              styles.popularCityText,
                              isSelected && styles.popularCityTextSelected,
                            ]}
                          >
                            {c.city}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* D. LOCATION DETAILS */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionLabel}>D. LOCATION DETAILS</Text>
                  <View style={styles.detailsCard}>
                    {/* Country */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Country:</Text>
                      <TextInput
                        style={styles.detailInput}
                        value={selectedCountry}
                        onChangeText={setSelectedCountry}
                        placeholder="Country"
                        placeholderTextColor="#64748B"
                        editable={!savingLocation}
                      />
                    </View>

                    {/* State */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>State:</Text>
                      <TextInput
                        style={styles.detailInput}
                        value={selectedState}
                        onChangeText={setSelectedState}
                        placeholder="State"
                        placeholderTextColor="#64748B"
                        editable={!savingLocation}
                      />
                    </View>

                    {/* City */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>City *:</Text>
                      <TextInput
                        style={[styles.detailInput, styles.detailInputRequired]}
                        value={selectedCity}
                        onChangeText={setSelectedCity}
                        placeholder="City name (required)"
                        placeholderTextColor="#64748B"
                        editable={!savingLocation}
                      />
                    </View>

                    {/* Area / Locality */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Area/Locality:</Text>
                      <TextInput
                        style={styles.detailInput}
                        value={selectedArea}
                        onChangeText={setSelectedArea}
                        placeholder="Optional area or locality"
                        placeholderTextColor="#64748B"
                        editable={!savingLocation}
                      />
                    </View>

                    {/* PIN Code */}
                    <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.detailLabel}>PIN Code:</Text>
                      <TextInput
                        style={styles.detailInput}
                        value={selectedPostalCode}
                        onChangeText={setSelectedPostalCode}
                        placeholder="Optional PIN code"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        editable={!savingLocation}
                      />
                    </View>
                  </View>
                </View>

                {/* E. ACTIONS */}
                <View style={styles.modalBtnRow}>
                  <Button
                    title="Cancel"
                    onPress={handleCancelLocation}
                    variant="secondary"
                    style={styles.modalBtn}
                    disabled={savingLocation}
                  />
                  <Button
                    title={savingLocation ? 'Saving...' : 'Save Location'}
                    onPress={handleSaveLocation}
                    variant="primary"
                    loading={savingLocation}
                    disabled={savingLocation}
                    style={styles.modalBtn}
                  />
                </View>
              </ScrollView>
            </Card>
          </View>
        </Modal>

        {/* ========================================================
            SELLER ACCESS REQUEST MODAL
           ======================================================== */}
        <Modal visible={isRequestModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <Card variant="solid" style={styles.sellerSetupCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.sellerSetupTitle}>Request Seller Access</Text>
                  <Text style={styles.sellerSetupSub}>
                    Submit a request to become a verified seller on ECOSPHERE. Administrator approval is required.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsRequestModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={{ marginVertical: 16 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 6, fontWeight: '600' }}>
                  BUSINESS DETAILS / INTENDED CATEGORY (OPTIONAL)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    borderRadius: 10,
                    padding: 12,
                    color: '#FFFFFF',
                    fontSize: 14,
                    minHeight: 80,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Tell the admin about your shop or service plans..."
                  placeholderTextColor="#64748B"
                  multiline
                  value={requestNotes}
                  onChangeText={setRequestNotes}
                />
              </View>

              <View style={styles.modalBtnRow}>
                <Button
                  title="Cancel"
                  onPress={() => setIsRequestModalVisible(false)}
                  variant="secondary"
                  style={styles.modalBtn}
                />
                <Button
                  title="Submit Request"
                  onPress={handleRequestSellerAccess}
                  variant="primary"
                  loading={submittingRequest}
                  style={styles.modalBtn}
                />
              </View>
            </Card>
          </View>
        </Modal>

        {/* ========================================================
            SELLER SETUP REQUIRED MODAL
           ======================================================== */}
        <Modal visible={isSellerSetupModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <Card variant="solid" style={styles.sellerSetupCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.sellerSetupTitle}>Seller Setup Required</Text>
                  <Text style={styles.sellerSetupSub}>
                    Choose your primary seller role to activate your seller workspace:
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsSellerSetupModalVisible(false)}
                  style={styles.closeBtn}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.sellerTypesScroll} showsVerticalScrollIndicator={false}>
                {SELLER_TYPES.map((st) => {
                  const isSelected = selectedSellerType === st.id;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      activeOpacity={0.8}
                      style={[
                        styles.sellerTypeItem,
                        isSelected && styles.sellerTypeItemSelected,
                      ]}
                      onPress={() => setSelectedSellerType(st.id)}
                    >
                      <View style={styles.sellerTypeLeft}>
                        <Text style={styles.sellerTypeEmoji}>{st.icon}</Text>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                          <Text
                            style={[
                              styles.sellerTypeTitle,
                              isSelected && { color: Theme.colors.primary },
                            ]}
                          >
                            {st.title}
                          </Text>
                          <Text style={styles.sellerTypeDesc}>{st.desc}</Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <Button
                  title="Cancel"
                  onPress={() => setIsSellerSetupModalVisible(false)}
                  variant="secondary"
                  style={styles.modalBtn}
                />
                <Button
                  title="Complete Setup & Switch"
                  onPress={handleCompleteSellerSetup}
                  variant="primary"
                  loading={switchingMode}
                  style={styles.modalBtn}
                />
              </View>
            </Card>
          </View>
        </Modal>

        {/* ========================================================
            LOGOUT CONFIRMATION MODAL
           ======================================================== */}
        <Modal visible={isLogoutModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <Card variant="solid" style={styles.logoutModalCard}>
              <View style={styles.logoutIconBox}>
                <LogOut size={28} color="#EF4444" />
              </View>

              <Text style={styles.logoutTitle}>Confirm Logout</Text>
              <Text style={styles.logoutDesc}>
                Are you sure you want to log out? Your session and authentication token will be safely cleared.
              </Text>

              <View style={styles.modalBtnRow}>
                <Button
                  title="Cancel"
                  onPress={() => setIsLogoutModalVisible(false)}
                  variant="secondary"
                  style={styles.modalBtn}
                />
                <Button
                  title="Log Out"
                  onPress={handleConfirmLogout}
                  variant="destructive"
                  style={styles.modalBtn}
                />
              </View>
            </Card>
          </View>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal visible={isEditModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <Card variant="solid" style={styles.editModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={editFirstName}
                  onChangeText={setEditFirstName}
                  placeholder="First Name"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={editLastName}
                  onChangeText={setEditLastName}
                  placeholder="Last Name"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>Occupation / Trade</Text>
                <TextInput
                  style={styles.input}
                  value={editOccupation}
                  onChangeText={setEditOccupation}
                  placeholder="Occupation or Role"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  title="Cancel"
                  onPress={() => setIsEditModalVisible(false)}
                  variant="secondary"
                  style={styles.modalBtn}
                />
                <Button
                  title="Save"
                  onPress={handleSaveProfile}
                  variant="primary"
                  loading={saving}
                  style={styles.modalBtn}
                />
              </View>
            </Card>
          </View>
        </Modal>

        {/* Favorites Details Modal */}
        <Modal visible={isFavoritesModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <Card variant="solid" style={styles.favoritesModalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Saved Items & Favorites</Text>
                <TouchableOpacity onPress={() => setIsFavoritesModalVisible(false)}>
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.favSection}>
                  <Text style={styles.favSectionTitle}>Services ({favoritesData.services.length})</Text>
                  {favoritesData.services.length === 0 ? (
                    <Text style={styles.emptyText}>No saved services</Text>
                  ) : (
                    favoritesData.services.map((item) => (
                      <View key={item.savedId || item.id} style={styles.favItemRow}>
                        <Text style={styles.favItemName}>{item.title || (item as any).name}</Text>
                        <Text style={styles.favItemMeta}>{item.category} • ₹{item.price}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.favSection}>
                  <Text style={styles.favSectionTitle}>Products ({favoritesData.products.length})</Text>
                  {favoritesData.products.length === 0 ? (
                    <Text style={styles.emptyText}>No saved products</Text>
                  ) : (
                    favoritesData.products.map((item) => (
                      <View key={item.savedId || item.id} style={styles.favItemRow}>
                        <Text style={styles.favItemName}>{item.title || (item as any).name}</Text>
                        <Text style={styles.favItemMeta}>{item.category} • ₹{item.price}</Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </Card>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Main background
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
    paddingTop: Platform.OS === 'android' ? 36 : 4,
  },
  topBarTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17231B',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.headingFont,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.emerald,
  },
  heroCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17231B',
    fontFamily: Theme.typography.headingFont,
  },
  occupationText: {
    fontSize: 12,
    color: '#68756B',
    marginTop: 6,
    fontFamily: Theme.typography.bodyFont,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 11,
    color: '#68756B',
  },
  bioText: {
    fontSize: 12,
    color: '#68756B',
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
  },
  levelProgressContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    fontFamily: Theme.typography.bodyFont,
  },
  levelXpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E4EBE3',
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17231B',
    fontFamily: Theme.typography.headingFont,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
    textAlign: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#68756B',
    letterSpacing: 0.8,
    marginBottom: 8,
    fontFamily: Theme.typography.headingFont,
  },

  // Account Mode Card
  modeCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  modeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeCardLeft: {
    flex: 1,
    marginRight: 10,
  },
  modeSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#68756B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.bodyFont,
  },
  modeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  modeEmojiIcon: {
    fontSize: 18,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17231B',
    fontFamily: Theme.typography.headingFont,
  },
  modeDesc: {
    fontSize: 11,
    color: '#68756B',
    lineHeight: 15,
    fontFamily: Theme.typography.bodyFont,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  switchToSellerBtn: {
    backgroundColor: Theme.colors.emerald,
  },
  switchToCustBtn: {
    backgroundColor: '#F1F5F0',
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  switchModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.bodyFont,
  },
  switchToCustBtnText: {
    color: '#17231B',
  },

  activityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  activityItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  activityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#17231B',
    fontFamily: Theme.typography.bodyFont,
  },
  activitySub: {
    fontSize: 10,
    color: '#68756B',
    marginTop: 2,
  },
  menuCard: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17231B',
    fontFamily: Theme.typography.bodyFont,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuCount: {
    fontSize: 12,
    color: '#68756B',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E4EBE3',
    marginHorizontal: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 35, 27, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
      },
    }),
  },
  switchModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  switchIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  switchModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17231B',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Theme.typography.headingFont,
  },
  switchModalDesc: {
    fontSize: 13,
    color: '#68756B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    fontFamily: Theme.typography.bodyFont,
  },

  // Seller Setup Modal
  sellerSetupCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  sellerSetupTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#17231B',
    fontFamily: Theme.typography.headingFont,
  },
  sellerSetupSub: {
    fontSize: 11,
    color: '#68756B',
    marginTop: 2,
    fontFamily: Theme.typography.bodyFont,
  },
  closeBtn: {
    padding: 4,
  },
  sellerTypesScroll: {
    maxHeight: 320,
    marginBottom: 16,
  },
  sellerTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 10,
    marginBottom: 8,
  },
  sellerTypeItemSelected: {
    borderColor: Theme.colors.emerald,
    backgroundColor: '#DCFCE7',
  },
  sellerTypeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerTypeEmoji: {
    fontSize: 20,
  },
  sellerTypeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17231B',
    fontFamily: Theme.typography.bodyFont,
  },
  sellerTypeDesc: {
    fontSize: 10,
    color: '#68756B',
    marginTop: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CDD7CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: Theme.colors.emerald,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: Theme.colors.emerald,
  },

  logoutModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17231B',
    marginBottom: 8,
    textAlign: 'center',
  },
  logoutDesc: {
    fontSize: 13,
    color: '#68756B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
  },
  editModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  favoritesModalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17231B',
  },
  modalBody: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#68756B',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 10,
    padding: 10,
    color: '#17231B',
    fontSize: 13,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  favSection: {
    marginBottom: 16,
  },
  favSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.emerald,
    marginBottom: 8,
  },
  favItemRow: {
    backgroundColor: '#F8FAF7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  favItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#17231B',
  },
  favItemMeta: {
    fontSize: 11,
    color: '#68756B',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12,
    color: '#68756B',
    fontStyle: 'italic',
  },

  // Location Row Badge in Hero
  changeBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  changeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.bodyFont,
  },

  // My Location Card (Under Hero)
  myLocationCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  myLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  myLocationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  myLocationInfo: {
    flex: 1,
  },
  myLocationSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#68756B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.bodyFont,
  },
  myLocationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17231B',
    marginTop: 2,
    fontFamily: Theme.typography.bodyFont,
  },
  myLocationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myLocationChangeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.emerald,
    fontFamily: Theme.typography.bodyFont,
  },

  // Change Location Modal
  locationModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  locationModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17231B',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.headingFont,
  },
  locationModalSub: {
    fontSize: 11,
    color: '#68756B',
    marginTop: 3,
    lineHeight: 15,
    fontFamily: Theme.typography.bodyFont,
  },
  modalSection: {
    marginTop: 14,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#68756B',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
    fontFamily: Theme.typography.bodyFont,
  },

  // Search input & results
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 12,
  },
  locationSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    color: '#17231B',
    fontSize: 13,
    fontFamily: Theme.typography.bodyFont,
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 180,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  searchResultMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17231B',
    fontFamily: Theme.typography.bodyFont,
  },
  searchResultSubText: {
    fontSize: 11,
    color: '#68756B',
    marginTop: 1,
    fontFamily: Theme.typography.bodyFont,
  },
  noResultsBox: {
    padding: 10,
    marginTop: 4,
    backgroundColor: '#F8FAF7',
    borderRadius: 8,
  },
  noResultsText: {
    fontSize: 11,
    color: '#68756B',
    fontStyle: 'italic',
    lineHeight: 15,
  },

  // GPS Button
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.bodyFont,
  },

  // Popular Cities
  popularCitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularCityChip: {
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  popularCityChipSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: Theme.colors.emerald,
  },
  popularCityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
  },
  popularCityTextSelected: {
    color: Theme.colors.forestGreen,
    fontWeight: '700',
  },

  // Details Card
  detailsCard: {
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  detailLabel: {
    width: 100,
    fontSize: 11,
    fontWeight: '600',
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
  },
  detailInput: {
    flex: 1,
    color: '#17231B',
    fontSize: 12,
    paddingVertical: 2,
    fontFamily: Theme.typography.bodyFont,
  },
  detailInputRequired: {
    color: Theme.colors.emerald,
    fontWeight: '700',
  },
});
