import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  ShoppingBag,
  Wrench,
  Info,
  Heart,
} from 'lucide-react-native';
import { Business, Product, Service } from '../types';
import {
  Card,
  BusinessImage,
  ProductCard,
  ServiceCard,
  EmptyState,
} from '../components/ui';
import { productService } from '../services/productService';
import { serviceService } from '../services/serviceService';
import { favoriteService } from '../services/favoriteService';
import { Theme } from '../theme';

interface BusinessProfileScreenProps {
  business: any;
  onBack: () => void;
  onSelectProduct?: (product: any) => void;
  onSelectService?: (service: any) => void;
}

export const BusinessProfileScreen: React.FC<BusinessProfileScreenProps> = ({
  business,
  onBack,
  onSelectProduct,
  onSelectService,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'about'>('products');
  const [bizProducts, setBizProducts] = useState<Product[]>([]);
  const [bizServices, setBizServices] = useState<Service[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loadingItems, setLoadingItems] = useState<boolean>(true);

  useEffect(() => {
    if (business?.id) {
      favoriteService.isFavorite('business', String(business.id)).then(setIsFollowing);

      Promise.allSettled([
        productService.getProducts({ businessId: String(business.id), limit: 50 }),
        serviceService.getServices({ businessId: String(business.id), limit: 50 }),
      ]).then(([prodsRes, srvsRes]) => {
        if (prodsRes.status === 'fulfilled') setBizProducts(prodsRes.value || []);
        if (srvsRes.status === 'fulfilled') setBizServices(srvsRes.value || []);
        setLoadingItems(false);
      });
    }
  }, [business?.id]);

  const handleToggleFollow = async () => {
    if (!business?.id) return;
    const nextState = await favoriteService.toggleFavorite('business', String(business.id), isFollowing);
    setIsFollowing(nextState);
  };

  const category = business?.category || 'Local Business';
  const locationText =
    typeof business?.location === 'object'
      ? business.location?.area || business.location?.city || 'Local Area'
      : business?.area || business?.city || 'Local Area';

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header image & back button */}
          <View style={styles.heroWrapper}>
            <BusinessImage
              type="cover"
              uri={business?.coverUrl}
              category={category}
              id={business?.id}
              borderRadius={0}
              style={styles.coverImage}
            />

            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleFollow} style={styles.followHeaderBtn} activeOpacity={0.7}>
              <Heart
                size={18}
                color={isFollowing ? '#EF4444' : '#FFFFFF'}
                fill={isFollowing ? '#EF4444' : 'transparent'}
              />
            </TouchableOpacity>

            <View style={styles.logoOverlay}>
              <BusinessImage
                type="logo"
                uri={business?.logoUrl}
                category={category}
                id={business?.id}
                borderRadius={18}
                style={styles.logoImage}
              />
            </View>
          </View>

          {/* Main Info */}
          <View style={styles.infoSection}>
            <View style={styles.titleRow}>
              <Text style={styles.bizName}>{business?.name || 'ECOSPHERE Enterprise'}</Text>
              {(business?.verified ?? true) && <CheckCircle2 size={18} color={Theme.colors.primary} />}
            </View>

            <Text style={styles.categoryText}>{category}</Text>

            <View style={styles.metaRow}>
              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{Number(business?.rating || 4.8).toFixed(1)}</Text>
                <Text style={styles.reviewText}>({business?.reviewCount ?? 24} reviews)</Text>
              </View>

              <View style={styles.locationTag}>
                <MapPin size={12} color={Theme.colors.primary} />
                <Text style={styles.locationText}>{locationText}</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]}
              onPress={() => setActiveTab('products')}
            >
              <ShoppingBag
                size={16}
                color={activeTab === 'products' ? Theme.colors.primary : '#94A3B8'}
              />
              <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
                Products ({bizProducts.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
              onPress={() => setActiveTab('services')}
            >
              <Wrench
                size={16}
                color={activeTab === 'services' ? Theme.colors.primary : '#94A3B8'}
              />
              <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
                Services ({bizServices.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'about' && styles.tabBtnActive]}
              onPress={() => setActiveTab('about')}
            >
              <Info
                size={16}
                color={activeTab === 'about' ? Theme.colors.primary : '#94A3B8'}
              />
              <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
                About
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content: Products */}
          {activeTab === 'products' && (
            <View style={styles.tabContent}>
              {bizProducts.length > 0 ? (
                <View style={styles.productsGrid}>
                  {bizProducts.map((prod) => (
                    <View key={prod.id} style={styles.gridColumn}>
                      <ProductCard
                        product={prod}
                        layout="grid"
                        onPress={(p) => onSelectProduct?.(p)}
                        onAddPress={(p) => onSelectProduct?.(p)}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  title="No products cataloged"
                  description="This merchant has not listed physical items yet. Check their available services."
                  actionTitle="View Services"
                  onAction={() => setActiveTab('services')}
                />
              )}
            </View>
          )}

          {/* Tab Content: Services */}
          {activeTab === 'services' && (
            <View style={styles.tabContent}>
              {bizServices.length > 0 ? (
                bizServices.map((srv) => (
                  <ServiceCard
                    key={srv.id}
                    service={srv}
                    onPress={(s) => onSelectService?.(s)}
                    onBookPress={(s) => onSelectService?.(s)}
                  />
                ))
              ) : (
                <EmptyState
                  title="No services listed"
                  description="This business does not offer on-demand booking services currently."
                  actionTitle="View Products"
                  onAction={() => setActiveTab('products')}
                />
              )}
            </View>
          )}

          {/* Tab Content: About */}
          {activeTab === 'about' && (
            <View style={styles.tabContent}>
              <Card variant="glass" style={styles.aboutCard}>
                <Text style={styles.aboutTitle}>About {business?.name}</Text>
                <Text style={styles.aboutBody}>
                  {business?.description ||
                    'Verified local business participating in the ECOSPHERE local economic operating system.'}
                </Text>

                <View style={styles.contactDivider} />

                <View style={styles.contactRow}>
                  <MapPin size={16} color={Theme.colors.primary} />
                  <Text style={styles.contactText}>
                    {business?.address || business?.addressLine1 || locationText}
                  </Text>
                </View>

                {business?.phone ? (
                  <View style={styles.contactRow}>
                    <Phone size={16} color="#10B981" />
                    <Text style={styles.contactText}>{business.phone}</Text>
                  </View>
                ) : null}

                {business?.email ? (
                  <View style={styles.contactRow}>
                    <Mail size={16} color="#38BDF8" />
                    <Text style={styles.contactText}>{business.email}</Text>
                  </View>
                ) : null}
              </Card>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D18',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroWrapper: {
    position: 'relative',
    height: 220,
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(7, 13, 24, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  followHeaderBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(7, 13, 24, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#0C1524',
    padding: 3,
    borderWidth: 2,
    borderColor: '#070D18',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bizName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    fontFamily: Theme.typography.fontFamily,
  },
  categoryText: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reviewText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  tabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridColumn: {
    width: '50%',
    paddingHorizontal: 5,
  },
  aboutCard: {
    padding: 16,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  aboutBody: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  contactDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontFamily: Theme.typography.fontFamily,
  },
});
