import React, { useState } from 'react';
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
  Upload,
  Check,
  Plus,
  Minus,
  Sparkles,
  Package,
  Info,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { productService } from '../../services/productService';
import { activeBusinessService } from '../../services/activeBusinessService';
import { Product } from '../../types';

interface SellerAddProductScreenProps {
  product?: Product;
  isEdit?: boolean;
  onBack: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Fresh Produce',
  'Dairy & Eggs',
  'Grocery & Staples',
  'Bakery & Snacks',
  'Beverages',
  'Personal Care',
  'Home & Cleaning',
  'Handmade Crafts',
  'Specialty Food',
];

const UNIT_OPTIONS = ['kg', 'item', 'pack', 'liter', 'box', 'gram', 'dozen'];

export const SellerAddProductScreen: React.FC<SellerAddProductScreenProps> = ({
  product,
  isEdit = false,
  onBack,
  onSuccess,
}) => {
  const [name, setName] = useState<string>(product?.title || product?.productName || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    (typeof product?.category === 'string' ? product.category : (product?.category as any)?.name) ||
      product?.brandName ||
      CATEGORIES[0]
  );
  const [price, setPrice] = useState<string>(product?.price ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState<string>(
    product?.originalPrice ? String(product.originalPrice) : ''
  );
  const [unit, setUnit] = useState<string>(product?.unitName || 'kg');
  const [stockQuantity, setStockQuantity] = useState<number>(
    product?.stockQuantity !== undefined ? product.stockQuantity : 25
  );
  const [imageUrl, setImageUrl] = useState<string>(
    product?.imageUrl || (product as any)?.productImageUrl || ''
  );
  const [description, setDescription] = useState<string>(product?.description || '');
  const [isAvailable, setIsAvailable] = useState<boolean>(
    product?.inStock ?? product?.isAvailable ?? true
  );
  const [saving, setSaving] = useState<boolean>(false);

  const handleStockChange = (delta: number) => {
    setStockQuantity((prev) => Math.max(0, prev + delta));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid product name.');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive price.');
      return;
    }
    if (originalPrice) {
      const numOriginal = parseFloat(originalPrice);
      if (!isNaN(numOriginal) && numOriginal < numPrice) {
        Alert.alert('Validation Error', 'Regular / Original price should be equal to or greater than selling price.');
        return;
      }
    }

    try {
      setSaving(true);
      const activeBiz = activeBusinessService.getActiveBusiness();
      const productPayload: Partial<Product> = {
        title: name.trim(),
        productName: name.trim(),
        price: numPrice,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        unitName: unit,
        stockQuantity: stockQuantity,
        imageUrl: imageUrl.trim() || undefined,
        description: description.trim(),
        inStock: isAvailable,
        isAvailable: isAvailable,
        brandName: selectedCategory,
        businessId: activeBiz?.id || product?.businessId || '1',
      };

      if (isEdit && product?.id) {
        await productService.updateProduct(product.id, productPayload);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        await productService.createProduct(productPayload);
        Alert.alert('Success', 'Product published to your catalog!');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    } catch (err) {
      if (__DEV__) console.warn('[SellerAddProductScreen] Error saving:', err);
      Alert.alert('Save Failed', 'Unable to save product details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Product' : 'Add New Product'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Preview & Upload Field */}
        <View style={styles.sectionCard}>
          <Text style={styles.fieldLabel}>Product Image</Text>
          <View style={styles.imagePickerContainer}>
            {imageUrl.trim() ? (
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholderBox}>
                <Camera size={32} color={Theme.colors.secondaryText} />
                <Text style={styles.imagePlaceholderText}>No image preview available</Text>
              </View>
            )}

            <View style={styles.imageInputRow}>
              <TextInput
                style={styles.imageUrlInput}
                placeholder="Enter image URL or paste link..."
                placeholderTextColor="#94A3B8"
                value={imageUrl}
                onChangeText={setImageUrl}
                autoCapitalize="none"
              />
              {imageUrl.trim() ? (
                <TouchableOpacity
                  style={styles.clearImageBtn}
                  onPress={() => setImageUrl('')}
                >
                  <Text style={styles.clearImageText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* Basic Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>
              Product Name <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Organic Farm Fresh Tomatoes"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe product quality, origin, storage tips..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Pricing & Unit */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Pricing & Unit</Text>

          <View style={styles.twoColumnRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>
                Selling Price (₹) <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 120"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Original Price (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Optional strike-through"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={originalPrice}
                onChangeText={setOriginalPrice}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>Unit Type</Text>
            <View style={styles.unitRow}>
              {UNIT_OPTIONS.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitChip, unit === u && styles.unitChipActive]}
                  onPress={() => setUnit(u)}
                >
                  <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Inventory & Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Inventory & Visibility</Text>

          <View style={styles.stepperRow}>
            <View>
              <Text style={styles.fieldLabel}>Available Stock Units</Text>
              <Text style={styles.fieldSubLabel}>Tracked item count in your store</Text>
            </View>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleStockChange(-1)}
                activeOpacity={0.7}
              >
                <Minus size={16} color={Theme.colors.primaryText} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{stockQuantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => handleStockChange(1)}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Theme.colors.primaryText} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.fieldLabel}>Publish for Online Orders</Text>
              <Text style={styles.fieldSubLabel}>
                When active, local customers can browse and order this item immediately.
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
              thumbColor={isAvailable ? '#16A34A' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Submit Button */}
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
              <Text style={styles.saveBtnText}>
                {isEdit ? 'Save Changes' : 'Publish Product'}
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 14,
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  imagePickerContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    marginBottom: 12,
  },
  imagePlaceholderBox: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    backgroundColor: '#F1F5F0',
    borderWidth: 1.5,
    borderColor: '#E4EBE3',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 6,
  },
  imageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  imageUrlInput: {
    flex: 1,
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Theme.colors.primaryText,
  },
  clearImageBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearImageText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primaryText,
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  fieldSubLabel: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  requiredAsterisk: {
    color: '#DC2626',
  },
  textInput: {
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Theme.colors.primaryText,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F1F5F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: Theme.colors.emerald,
  },
  categoryChipText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Theme.colors.forestGreen,
    fontWeight: '700',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F0',
  },
  unitChipActive: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: Theme.colors.emerald,
  },
  unitChipText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontWeight: '500',
  },
  unitChipTextActive: {
    color: Theme.colors.forestGreen,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    padding: 4,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 16,
    color: Theme.colors.primaryText,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F0',
    marginVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: Theme.colors.emerald,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
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
