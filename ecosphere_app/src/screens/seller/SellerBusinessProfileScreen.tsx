import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Camera,
  Store,
  MapPin,
  Clock,
  Phone,
  Mail,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { businessService } from '../../services/businessService';
import { activeBusinessService } from '../../services/activeBusinessService';
import { Business } from '../../types';

interface SellerBusinessProfileScreenProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

export const SellerBusinessProfileScreen: React.FC<SellerBusinessProfileScreenProps> = ({
  onBack,
  onSuccess,
}) => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form states
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [openingTime, setOpeningTime] = useState<string>('08:00 AM');
  const [closingTime, setClosingTime] = useState<string>('09:00 PM');

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        let biz = activeBusinessService.getActiveBusiness();
        if (!biz) {
          const list = await businessService.getMyBusinesses();
          if (list && list.length > 0) {
            biz = list[0];
            activeBusinessService.setActiveBusiness(biz);
          }
        }
        if (biz) {
          setBusiness(biz);
          setName(biz.name || biz.businessName || '');
          setCategory(biz.category || biz.businessType || 'General Retail');
          setDescription(biz.description || '');
          setPhone(biz.phone || '');
          setEmail(biz.email || '');
          setAddress(biz.address || biz.addressLine1 || '');
          setCity(biz.city || biz.location?.city || 'Chiplun');
          setCoverUrl(biz.coverUrl || biz.coverImageUrl || '');
          setLogoUrl(biz.logoUrl || '');
        }
      } catch (err) {
        if (__DEV__) console.warn('[SellerBusinessProfileScreen] Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your business name.');
      return;
    }

    try {
      setSaving(true);
      const bizId = business?.id || '1';
      const updated = await businessService.updateBusiness(bizId, {
        name: name.trim(),
        businessName: name.trim(),
        category: category.trim(),
        description: description.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        addressLine1: address.trim(),
        city: city.trim(),
        coverUrl: coverUrl.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
      });

      activeBusinessService.setActiveBusiness(updated);
      Alert.alert('Success', 'Business profile updated successfully!');
      if (onSuccess) onSuccess();
      else if (onBack) onBack();
    } catch (err) {
      if (__DEV__) console.warn('[SellerBusinessProfileScreen] Save error:', err);
      Alert.alert('Error', 'Failed to update business profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.emerald} />
        <Text style={styles.loadingText}>Loading store profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={22} color={Theme.colors.primaryText} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <Text style={styles.headerTitle}>Business Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover & Logo Section */}
        <View style={styles.brandingCard}>
          {/* Store Cover Image */}
          <View style={styles.coverWrapper}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <Image
                source={require('../../../assets/images/seller/businesses/storefront-cover.png')}
                style={styles.coverImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.coverOverlay} />
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color="#16A34A" />
              <Text style={styles.verifiedText}>Verified Store</Text>
            </View>
          </View>

          {/* Store Logo Avatar */}
          <View style={styles.logoRow}>
            <View style={styles.logoWrapper}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="cover" />
              ) : (
                <Image
                  source={require('../../../assets/images/seller/businesses/business-logo-default.png')}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              )}
            </View>

            <View style={styles.brandTitleCol}>
              <Text style={styles.brandTitle} numberOfLines={1}>
                {name || 'My Local Business'}
              </Text>
              <Text style={styles.brandCategory}>{category || 'Local Merchant'}</Text>
            </View>
          </View>

          {/* Store Open/Close Toggle */}
          <View style={styles.storeStatusToggle}>
            <View>
              <Text style={styles.statusToggleTitle}>
                Store Status: {isOpen ? 'Open & Taking Orders' : 'Store Paused'}
              </Text>
              <Text style={styles.statusToggleSub}>
                Controls whether local customers can checkout items right now.
              </Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
              thumbColor={isOpen ? '#16A34A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Store Information Form */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Store Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Green Valley Farm Store"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Category</Text>
            <TextInput
              style={styles.textInput}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Organic Groceries & Farm Produce"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell customers about your fresh produce, values, and story..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Contact & Address Form */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Location & Contact</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Support Email</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="contact@store.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Shop No. 12, Market Square"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City / Region</Text>
            <TextInput
              style={styles.textInput}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Chiplun"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Operating Hours */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Operating Hours</Text>

          <View style={styles.hoursRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Opens At</Text>
              <TextInput
                style={styles.textInput}
                value={openingTime}
                onChangeText={setOpeningTime}
                placeholder="08:00 AM"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Closes At</Text>
              <TextInput
                style={styles.textInput}
                value={closingTime}
                onChangeText={setClosingTime}
                placeholder="09:00 PM"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Theme.colors.secondaryText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  scrollContent: {
    padding: 16,
  },
  brandingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  coverWrapper: {
    height: 140,
    width: '100%',
    position: 'relative',
    backgroundColor: '#064E3B',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -32,
    marginBottom: 12,
  },
  logoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitleCol: {
    flex: 1,
    marginLeft: 12,
    marginTop: 26,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  brandCategory: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  storeStatusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F0',
    backgroundColor: '#FBFDFB',
  },
  statusToggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  statusToggleSub: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    maxWidth: 240,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 18,
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primaryText,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: Theme.colors.primaryText,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: Theme.colors.emerald,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: Theme.colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
});
