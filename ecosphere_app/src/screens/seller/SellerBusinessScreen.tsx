import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import {
  Plus,
  ShoppingBag,
  Wrench,
  Trash2,
  Check,
  ChevronLeft,
  Store,
  Smartphone,
  Laptop,
  ArrowRight,
  MapPin,
  Package,
  Edit3,
  MoreVertical,
  Settings,
  Camera,
  Layers,
  Box,
  RefreshCw,
  ChevronDown,
  Coffee,
  Utensils,
  Hotel,
  Briefcase,
  Clock,
  Phone,
  Mail,
  Globe,
  Star,
  CheckSquare,
  Square,
  Truck,
  Building,
  UserCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Business, Product, Service } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { Modal } from '../../components/common/Modal';
import { ProductImage } from '../../components/ui/ProductImage';
import { ServiceImage } from '../../components/ui/ServiceImage';
import { EmptyState } from '../../components/ui/EmptyState';
import { ShopSwitcher } from '../../components/common/ShopSwitcher';
import { ImagePickerModal } from '../../components/common/ImagePickerModal';
import { businessService } from '../../services/businessService';
import { serviceService } from '../../services/serviceService';
import { productService } from '../../services/productService';
import { activeBusinessService } from '../../services/activeBusinessService';
import { Theme } from '../../theme';
import { resolveImageUrl } from '../../services/apiConfig';



export interface BusinessTypeItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  subtypes: string[];
}

export const BUSINESS_TYPE_CONFIGS: BusinessTypeItem[] = [
  {
    id: 'shop',
    name: 'Shop',
    emoji: '🛒',
    description: 'Sell products locally',
    subtypes: [
      'Grocery Shop',
      'Clothing Shop',
      'Electronics Shop',
      'Mobile Shop',
      'Pharmacy',
      'Bakery',
      'General Store',
      'Household Store',
      'Furniture',
      'Hardware',
      'Other',
    ],
  },
  {
    id: 'cafe',
    name: 'Café',
    emoji: '☕',
    description: 'Coffee, food & beverages',
    subtypes: [
      'Café',
      'Bakery Café',
      'Coffee Shop',
      'Tea House',
      'Dessert Café',
      'Fast Café',
      'Other',
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    emoji: '🍽',
    description: 'Meals, dining & delivery',
    subtypes: [
      'Fine Dining',
      'Casual Dining',
      'Family Restaurant',
      'Fast Food',
      'Cloud Kitchen',
      'Street Food',
      'Buffet',
      'Multi-Cuisine',
      'Other',
    ],
  },
  {
    id: 'hotel',
    name: 'Hotel',
    emoji: '🏨',
    description: 'Rooms & hospitality',
    subtypes: [
      'Budget',
      'Business',
      'Boutique',
      'Luxury',
      'Resort',
      'Guest House',
      'Other',
    ],
  },
  {
    id: 'service_provider',
    name: 'Service Provider',
    emoji: '🔧',
    description: 'Offer professional services',
    subtypes: [
      'Cleaning',
      'Beauty',
      'Education',
      'Fitness',
      'Healthcare',
      'Home Services',
      'Professional Services',
      'Photography',
      'Events',
      'Other',
    ],
  },
  {
    id: 'technician',
    name: 'Technician',
    emoji: '🛠',
    description: 'Repair & technical work',
    subtypes: [
      'Mobile Repair',
      'Computer Repair',
      'AC Repair',
      'Electrical',
      'Plumbing',
      'Automobile',
      'Appliance Repair',
      'Electronics',
      'Other',
    ],
  },
  {
    id: 'wholesaler',
    name: 'Wholesaler / Dealer',
    emoji: '📦',
    description: 'Bulk products & supply',
    subtypes: [
      'Grocery',
      'Electronics',
      'Pharma',
      'Clothing',
      'Hardware',
      'Industrial',
      'Other',
    ],
  },
  {
    id: 'employer',
    name: 'Employer',
    emoji: '👷',
    description: 'Hire people & create jobs',
    subtypes: [
      'IT',
      'Manufacturing',
      'Retail',
      'Healthcare',
      'Education',
      'Hospitality',
      'Construction',
      'Finance',
      'Other',
    ],
  },
  {
    id: 'other',
    name: 'Other',
    emoji: '🏢',
    description: 'Other local businesses',
    subtypes: [
      'General Business',
      'Consultancy',
      'Agency',
      'Co-Working Space',
      'Community Organization',
      'Other',
    ],
  },
];

// Shop-specific taxonomy mapping per Section 9
const SHOP_CATEGORIES_PRESETS: Record<string, string[]> = {
  grocery: ['All', 'Biscuits', 'Grains', 'Dairy', 'Fruits', 'Vegetables', 'Beverages'],
  mobile: ['All', 'Smartphones', 'Feature Phones', 'Cases', 'Chargers', 'Cables', 'Earphones'],
  electronics: ['All', 'Laptops', 'Televisions', 'Cameras', 'Audio', 'Home Appliances'],
  default: ['All', 'General', 'Featured', 'Best Sellers', 'New Arrivals'],
};

export const SellerBusinessScreen: React.FC = () => {
  // View mode: 'list' (My Businesses directory) vs 'manage' (Active Shop Catalog)
  const [viewMode, setViewMode] = useState<'list' | 'manage'>('list');

  // Businesses list & active business state
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);

  // Catalog items state
  const [productsByShop, setProductsByShop] = useState<Record<string, Product[]>>({});
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Active Catalog Tab: 'products' vs 'services'
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');

  // Categories state
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals state
  const [addProductModal, setAddProductModal] = useState<boolean>(false);
  const [editProductModal, setEditProductModal] = useState<boolean>(false);
  const [manageShopModal, setManageShopModal] = useState<boolean>(false);
  const [productActionModal, setProductActionModal] = useState<boolean>(false);
  const [addCategoryModal, setAddCategoryModal] = useState<boolean>(false);
  const [addShopModal, setAddShopModal] = useState<boolean>(false);
  const [businessTypePickerModal, setBusinessTypePickerModal] = useState<boolean>(false);
  const [subtypePickerModal, setSubtypePickerModal] = useState<boolean>(false);
  const [imagePickerModal, setImagePickerModal] = useState<boolean>(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<
    'newProduct' | 'editProduct' | 'shopLogo' | 'shopCover' | 'newShopLogo' | 'newShopCover'
  >('newProduct');
  const [selectedProductForAction, setSelectedProductForAction] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Add Product Form states (Image REQUIRED per Section 8 & 9)
  const [itemImage, setItemImage] = useState<string>('');
  const [itemTitle, setItemTitle] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemStock, setItemStock] = useState<string>('50');
  const [itemUnit, setItemUnit] = useState<string>('KG');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<string>('Grains & Pulses');
  // itemCategoryId: the numeric DB ProductCategoryId – required for backend
  const [itemCategoryId, setItemCategoryId] = useState<number>(4); // default: Food & Grocery
  const [itemInStock, setItemInStock] = useState<boolean>(true);
  const [savingItem, setSavingItem] = useState<boolean>(false);
  const [saveItemError, setSaveItemError] = useState<string>('');

  // DB product categories loaded from backend
  const [dbProductCategories, setDbProductCategories] = useState<Array<{ id: number; name: string }>>([]);

  // Apparel size variants for clothing products
  const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
  type ApparelSize = typeof APPAREL_SIZES[number];
  const [selectedSizes, setSelectedSizes] = useState<ApparelSize[]>([]);
  const [sizeStocks, setSizeStocks] = useState<Record<ApparelSize, string>>({
    XS: '', S: '', M: '', L: '', XL: '', XXL: '', XXXL: '',
  });

  // Edit Product Form states (Section 5 & 6)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdImage, setEditProdImage] = useState<string>('');
  const [editProdTitle, setEditProdTitle] = useState<string>('');
  const [editProdPrice, setEditProdPrice] = useState<string>('');
  const [editProdStock, setEditProdStock] = useState<string>('50');
  const [editProdUnit, setEditProdUnit] = useState<string>('KG');
  const [editProdCategory, setEditProdCategory] = useState<string>('Grains & Pulses');
  const [editProdCategoryId, setEditProdCategoryId] = useState<number>(4);
  const [editProdDescription, setEditProdDescription] = useState<string>('');
  const [editProdInStock, setEditProdInStock] = useState<boolean>(true);
  const [savingEditProd, setSavingEditProd] = useState<boolean>(false);
  const [saveEditProdError, setSaveEditProdError] = useState<string>('');

  // Edit product variant state
  const [editSelectedSizes, setEditSelectedSizes] = useState<ApparelSize[]>([]);
  const [editSizeStocks, setEditSizeStocks] = useState<Record<ApparelSize, string>>({
    XS: '', S: '', M: '', L: '', XL: '', XXL: '', XXXL: '',
  });

  // Manage Shop Form states (Section 1 & 14)
  const [editShopName, setEditShopName] = useState<string>('');
  const [editShopCategory, setEditShopCategory] = useState<string>('Grocery Shop');
  const [editShopDescription, setEditShopDescription] = useState<string>('');
  const [editShopAddress, setEditShopAddress] = useState<string>('');
  const [editShopCity, setEditShopCity] = useState<string>('Chiplun');
  const [editShopPhone, setEditShopPhone] = useState<string>('');
  const [editShopEmail, setEditShopEmail] = useState<string>('');
  const [editShopWebsite, setEditShopWebsite] = useState<string>('');
  const [editShopHours, setEditShopHours] = useState<string>('9:00 AM - 9:00 PM');
  const [editShopIsOpen, setEditShopIsOpen] = useState<boolean>(true);
  const [editShopLogoUrl, setEditShopLogoUrl] = useState<string>('');
  const [editShopCoverUrl, setEditShopCoverUrl] = useState<string>('');
  const [savingShop, setSavingShop] = useState<boolean>(false);

  // Add New Business Form states (Enhanced Specialized Multi-Type System)
  const [creationStep, setCreationStep] = useState<'select_type' | 'setup_form'>('select_type');
  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopLogoUrl, setNewShopLogoUrl] = useState<string>('');
  const [newShopCoverUrl, setNewShopCoverUrl] = useState<string>('');
  const [newShopBusinessType, setNewShopBusinessType] = useState<string>('Shop');
  const [newShopSubtype, setNewShopSubtype] = useState<string>('Grocery Shop');
  const [newShopCustomSubtype, setNewShopCustomSubtype] = useState<string>('');
  const [newShopCity, setNewShopCity] = useState<string>('Chiplun');
  const [newShopAddress, setNewShopAddress] = useState<string>('');
  const [newShopDescription, setNewShopDescription] = useState<string>('');
  const [newBizPhone, setNewBizPhone] = useState<string>('');
  const [newBizEmail, setNewBizEmail] = useState<string>('');
  const [newBizHours, setNewBizHours] = useState<string>('9:00 AM - 9:00 PM');
  const [newBizWebsite, setNewBizWebsite] = useState<string>('');

  // Specialized attributes for Cafe & Restaurant
  const [newBizCuisines, setNewBizCuisines] = useState<string[]>(['Indian']);
  const [newBizServiceModes, setNewBizServiceModes] = useState<Record<string, boolean>>({
    'Dine-In': true,
    'Takeaway': true,
    'Delivery': false,
  });
  const [newBizAmenities, setNewBizAmenities] = useState<Record<string, boolean>>({
    'Outdoor Seating': false,
    'Wi-Fi': true,
    'Parking': false,
    'Air Conditioning': true,
  });
  const [newBizAvgPrice, setNewBizAvgPrice] = useState<string>('₹₹');

  // Hotel
  const [newBizStarRating, setNewBizStarRating] = useState<number>(3);
  const [newBizCheckIn, setNewBizCheckIn] = useState<string>('12:00 PM');
  const [newBizCheckOut, setNewBizCheckOut] = useState<string>('11:00 AM');

  // Service Provider & Technician
  const [newBizRadius, setNewBizRadius] = useState<string>('Within 10 km');
  const [newBizPricingModel, setNewBizPricingModel] = useState<string>('Fixed');
  const [newBizAvailability, setNewBizAvailability] = useState<string>('All Days');
  const [newBizExperience, setNewBizExperience] = useState<string>('3–5 Years');

  // Wholesaler / Dealer
  const [newBizWarehouse, setNewBizWarehouse] = useState<string>('');
  const [newBizMoq, setNewBizMoq] = useState<string>('50 units');
  const [newBizBulkPricing, setNewBizBulkPricing] = useState<boolean>(true);
  const [newBizQuotation, setNewBizQuotation] = useState<boolean>(true);
  const [newBizDeliveryScope, setNewBizDeliveryScope] = useState<string>('Regional');

  // Employer
  const [newBizCompanySize, setNewBizCompanySize] = useState<string>('11–50');

  const [creatingShop, setCreatingShop] = useState<boolean>(false);

  // ── Helper: detect if a category is clothing/apparel ──────────────────
  const isClothingCategory = (catName: string): boolean => {
    const lower = catName.toLowerCase();
    return lower.includes('fashion') || lower.includes('cloth') || lower.includes('apparel')
      || lower.includes('wear') || lower.includes('textile') || lower.includes('garment');
  };

  // ── Helper: detect if the active business deals in clothing ────────────
  const isClothingBusiness = (): boolean => {
    if (!activeBiz) return false;
    const text = `${activeBiz.category || ''} ${activeBiz.name || ''}`.toLowerCase();
    return text.includes('cloth') || text.includes('fashion') || text.includes('apparel')
      || text.includes('wear') || text.includes('garment') || text.includes('textile')
      || text.includes('shirt') || text.includes('jersey') || text.includes('kit');
  };

  // ── Helper: check if currently selected category is clothing ──────────
  const isAddProductClothing = (): boolean => {
    // Check the DB category name
    const cat = dbProductCategories.find((c) => c.id === itemCategoryId);
    if (cat && isClothingCategory(cat.name)) return true;
    // Fallback: check item category text
    return isClothingCategory(itemCategory) || isClothingBusiness();
  };

  const isEditProductClothing = (): boolean => {
    const cat = dbProductCategories.find((c) => c.id === editProdCategoryId);
    if (cat && isClothingCategory(cat.name)) return true;
    return isClothingCategory(editProdCategory);
  };

  // 1. Initial Load: fetch businesses & active business
  const fetchBusinesses = async () => {
    try {
      const myBizList = await businessService.getMyBusinesses();
      const safeList = Array.isArray(myBizList) ? myBizList : [];
      setBusinesses(safeList);
      if (safeList.length > 0) {
        const resolved = await activeBusinessService.resolveActiveBusiness(safeList);
        setActiveBiz(resolved || safeList[0]);
      } else {
        await activeBusinessService.setActiveBusiness(null);
        setActiveBiz(null);
        setViewMode('list');
      }
    } catch (err) {
      if (__DEV__) console.warn('[SellerBusinessScreen] fetchBusinesses error:', err);
      setBusinesses([]);
      await activeBusinessService.setActiveBusiness(null);
      setActiveBiz(null);
      setViewMode('list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();

    // Load DB product categories for the add/edit product forms
    productService.getCategories().then((cats) => {
      if (cats && cats.length > 0) {
        setDbProductCategories(cats.map((c) => ({ id: c.id, name: c.name })));
      }
    }).catch(() => {/* non-critical */});

    // Subscribe to active business changes
    const unsubscribe = activeBusinessService.subscribe((biz) => {
      if (biz) {
        setActiveBiz(biz);
        setSelectedCategory('All');
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch products for active business
  useEffect(() => {
    if (!activeBiz) return;

    productService
      .getMyProducts(activeBiz.id)
      .then((realProducts) => {
        if (Array.isArray(realProducts)) {
          setProductsByShop((prev) => ({
            ...prev,
            [activeBiz.id]: realProducts,
          }));
        } else {
          setProductsByShop((prev) => ({
            ...prev,
            [activeBiz.id]: [],
          }));
        }
      })
      .catch(() => {
        setProductsByShop((prev) => ({
          ...prev,
          [activeBiz.id]: [],
        }));
      });
  }, [activeBiz?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBusinesses();
    if (activeBiz) {
      productService
        .getMyProducts(activeBiz.id)
        .then((realProducts) => {
          if (Array.isArray(realProducts)) {
            setProductsByShop((prev) => ({
              ...prev,
              [activeBiz.id]: realProducts,
            }));
          } else {
            setProductsByShop((prev) => ({
              ...prev,
              [activeBiz.id]: [],
            }));
          }
        })
        .catch(() => {
          setProductsByShop((prev) => ({
            ...prev,
            [activeBiz.id]: [],
          }));
        })
        .finally(() => setRefreshing(false));
    }
  };

  // Determine current shop categories based on business type / name
  const currentCategories = useMemo(() => {
    if (!activeBiz) return SHOP_CATEGORIES_PRESETS.default;
    const bizKey = String(activeBiz.id);
    if (categoriesMap[bizKey]) {
      return categoriesMap[bizKey];
    }

    const typeStr = `${activeBiz.category || ''} ${activeBiz.name || ''}`.toLowerCase();
    if (typeStr.includes('grocery') || typeStr.includes('mart') || typeStr.includes('fresh')) {
      return SHOP_CATEGORIES_PRESETS.grocery;
    }
    if (typeStr.includes('mobile') || typeStr.includes('phone')) {
      return SHOP_CATEGORIES_PRESETS.mobile;
    }
    if (typeStr.includes('electronic') || typeStr.includes('tech') || typeStr.includes('appliance')) {
      return SHOP_CATEGORIES_PRESETS.electronics;
    }
    return SHOP_CATEGORIES_PRESETS.default;
  }, [activeBiz, categoriesMap]);

  // Current shop products
  const currentShopProducts = useMemo(() => {
    if (!activeBiz) return [];
    return productsByShop[activeBiz.id] || [];
  }, [activeBiz, productsByShop]);

  // Filtered products for active shop & category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return currentShopProducts;
    const q = selectedCategory.toLowerCase();
    return currentShopProducts.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const tit = (p.title || '').toLowerCase();
      return cat.includes(q) || tit.includes(q);
    });
  }, [currentShopProducts, selectedCategory]);

  // Handle Switch Shop
  const handleSelectBusiness = async (biz: Business) => {
    await activeBusinessService.setActiveBusiness(biz);
    setActiveBiz(biz);
    setSelectedCategory('All');
  };

  // Handle Add Category to current shop
  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed || !activeBiz) return;

    const bizKey = String(activeBiz.id);
    const existing = currentCategories;
    if (!existing.includes(trimmed)) {
      setCategoriesMap((prev) => ({
        ...prev,
        [bizKey]: [...existing, trimmed],
      }));
    }
    setSelectedCategory(trimmed);
    setItemCategory(trimmed);
    setNewCategoryName('');
    setAddCategoryModal(false);
  };

  // Open Add Product form with fresh state
  const handleOpenAddProduct = () => {
    setItemImage('');
    setItemTitle('');
    setItemPrice('');
    setItemStock('50');
    setItemUnit('KG');
    setItemDescription('');
    // Default to Fashion (id=2) for clothing shops, else Food & Grocery (id=4)
    const defaultCatId = isClothingBusiness() ? 2 : 4;
    const defaultCat = dbProductCategories.find((c) => c.id === defaultCatId);
    setItemCategoryId(defaultCatId);
    setItemCategory(defaultCat?.name || (isClothingBusiness() ? 'Fashion' : 'Food & Grocery'));
    setItemInStock(true);
    setSaveItemError('');
    setSelectedSizes([]);
    setSizeStocks({ XS: '', S: '', M: '', L: '', XL: '', XXL: '', XXXL: '' });
    setAddProductModal(true);
  };

  // Open Edit Product form (Section 5)
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setEditProdTitle(prod.title || '');
    setEditProdPrice(String(prod.price || 0));
    setEditProdStock(String(prod.stockQuantity !== undefined ? prod.stockQuantity : 50));
    setEditProdUnit(prod.unitName || 'KG');
    setEditProdCategory(prod.category || 'General');
    // Resolve category ID from DB categories list
    const matchedCat = dbProductCategories.find(
      (c) => c.name.toLowerCase() === (prod.category || '').toLowerCase()
    );
    setEditProdCategoryId(matchedCat?.id || (prod as any).productCategoryId || 4);
    setEditProdDescription(prod.description || '');
    setEditProdImage(prod.imageUrl || '');
    setEditProdInStock(prod.inStock !== false);
    setSaveEditProdError('');
    // Load existing variants into edit state
    const existingVariants = prod.variants || [];
    const newEditSizes: typeof APPAREL_SIZES[number][] = [];
    const newEditStocks: Record<typeof APPAREL_SIZES[number], string> = {
      XS: '', S: '', M: '', L: '', XL: '', XXL: '', XXXL: '',
    };
    for (const v of existingVariants) {
      const sizeKey = v.size as typeof APPAREL_SIZES[number];
      if (APPAREL_SIZES.includes(sizeKey)) {
        newEditSizes.push(sizeKey);
        newEditStocks[sizeKey] = String(v.stockQuantity || 0);
      }
    }
    setEditSelectedSizes(newEditSizes);
    setEditSizeStocks(newEditStocks);
    setEditProductModal(true);
  };

  // Open Manage Shop form (Section 1 & 14)
  const handleOpenManageShop = () => {
    if (!activeBiz) return;
    setEditShopName(activeBiz.name || '');
    setEditShopCategory(activeBiz.category || 'Grocery Shop');
    setEditShopDescription(activeBiz.description || '');
    setEditShopAddress(activeBiz.address || activeBiz.addressLine1 || '');
    setEditShopCity(activeBiz.location?.city || activeBiz.city || 'Chiplun');
    setEditShopPhone(activeBiz.phone || '');
    setEditShopEmail(activeBiz.email || '');
    setEditShopWebsite(activeBiz.website || '');
    setEditShopHours(activeBiz.operatingHours || '9:00 AM - 9:00 PM');
    setEditShopIsOpen(activeBiz.status === 'active' || activeBiz.isOpen !== false);
    setEditShopLogoUrl(activeBiz.logoUrl || '');
    setEditShopCoverUrl(activeBiz.coverUrl || activeBiz.coverImageUrl || '');
    setManageShopModal(true);
  };

  // Open Product Action Menu (Section 18 & 23)
  const handleOpenProductActionSheet = (prod: Product) => {
    setSelectedProductForAction(prod);
    setProductActionModal(true);
  };

  // Image selection modal launcher
  const handleOpenImagePicker = (
    target: 'newProduct' | 'editProduct' | 'shopLogo' | 'shopCover' | 'newShopLogo' | 'newShopCover'
  ) => {
    setImagePickerTarget(target);
    setImagePickerModal(true);
  };

  const handleImageSelected = (url: string) => {
    if (imagePickerTarget === 'newProduct') {
      setItemImage(url);
    } else if (imagePickerTarget === 'editProduct') {
      setEditProdImage(url);
    } else if (imagePickerTarget === 'shopLogo') {
      setEditShopLogoUrl(url);
    } else if (imagePickerTarget === 'shopCover') {
      setEditShopCoverUrl(url);
    } else if (imagePickerTarget === 'newShopLogo') {
      setNewShopLogoUrl(url);
    } else if (imagePickerTarget === 'newShopCover') {
      setNewShopCoverUrl(url);
    }
  };

  // Handle Save New Product strictly linked to activeBusinessId (Section 8 & 9)
  const handleSaveProduct = async () => {
    if (__DEV__) console.log('[handleSaveProduct] invoked — savingItem:', savingItem, 'activeBiz:', activeBiz?.id);

    if (!itemImage || !itemImage.trim()) {
      const msg = 'Please select or upload a product photograph before saving.';
      setSaveItemError(msg);
      Alert.alert('Product Image Required', msg);
      return;
    }

    if (!itemTitle.trim() || !itemPrice.trim()) {
      const msg = 'Please enter a product title and price.';
      setSaveItemError(msg);
      Alert.alert('Required Fields', msg);
      return;
    }

    if (!activeBiz) {
      const msg = 'Please select a shop first.';
      setSaveItemError(msg);
      Alert.alert('Notice', msg);
      return;
    }

    const numericPrice = parseFloat(itemPrice.replace(/[^0-9.]/g, '')) || 0;
    if (numericPrice <= 0) {
      const msg = 'Please enter a valid price greater than 0.';
      setSaveItemError(msg);
      Alert.alert('Invalid Price', msg);
      return;
    }

    const clothingMode = isAddProductClothing();

    // Validate variant sizes if clothing category
    if (clothingMode) {
      if (selectedSizes.length === 0) {
        const msg = 'Please select at least one size for this clothing product.';
        setSaveItemError(msg);
        Alert.alert('Sizes Required', msg);
        return;
      }
      for (const sz of selectedSizes) {
        const stock = parseInt(sizeStocks[sz] || '0', 10);
        if (isNaN(stock) || stock < 0) {
          const msg = `Please enter a valid stock quantity for size ${sz}.`;
          setSaveItemError(msg);
          Alert.alert('Invalid Stock', msg);
          return;
        }
      }
    }

    setSavingItem(true);
    setSaveItemError('');

    try {
      const numericStock = parseInt(itemStock.replace(/[^0-9]/g, ''), 10);
      const stockVal = isNaN(numericStock) ? 50 : numericStock;

      // Build variants array for clothing
      const variantsPayload = clothingMode && selectedSizes.length > 0
        ? selectedSizes.map((sz) => ({
            size: sz,
            stockQuantity: parseInt(sizeStocks[sz] || '0', 10) || 0,
            price: numericPrice,
          }))
        : undefined;

      const payload: any = {
        businessId: activeBiz.id,
        productName: itemTitle.trim(),
        title: itemTitle.trim(),
        description: itemDescription.trim() || `${itemTitle.trim()} from ${activeBiz.name}`,
        price: numericPrice,
        stockQuantity: stockVal,
        productCategoryId: itemCategoryId,
        categoryId: itemCategoryId,
        productImageUrl: itemImage.trim(),
        imageUrl: itemImage.trim(),
        unitName: clothingMode ? 'Piece' : (itemUnit.trim() || 'Unit'),
        isAvailable: itemInStock,
        inStock: itemInStock,
        ...(variantsPayload ? { variants: variantsPayload } : {}),
      };

      if (__DEV__) console.log('[handleSaveProduct] calling createProduct, payload businessId:', payload.businessId, 'categoryId:', payload.productCategoryId);
      const created = await productService.createProduct(payload);
      if (__DEV__) console.log('[handleSaveProduct] backend confirmed, new product id:', created?.id);

      // Reload actual product list from backend for the active business
      const freshProducts = await productService.getMyProducts(activeBiz.id);
      setProductsByShop((prev) => ({
        ...prev,
        [activeBiz.id]: Array.isArray(freshProducts) ? freshProducts : prev[activeBiz.id] || [],
      }));

      // Reset form and close modal
      setItemImage('');
      setItemTitle('');
      setItemPrice('');
      setItemStock('50');
      setItemUnit('KG');
      setItemDescription('');
      setSelectedSizes([]);
      setSizeStocks({ XS: '', S: '', M: '', L: '', XL: '', XXL: '', XXXL: '' });
      setSaveItemError('');
      setAddProductModal(false);
      Alert.alert('Product Saved', `"${created.title || itemTitle.trim()}" was added to ${activeBiz.name}.`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to save product. Please try again.';
      setSaveItemError(msg);
      // Keep modal open, preserve entered values, show error
      Alert.alert('Save Failed', msg);
    } finally {
      setSavingItem(false);
    }
  };

  // Handle Save Edited Product (Section 5, 6, 7)
  const handleSaveEditProduct = async () => {
    if (!editingProduct || !activeBiz) return;
    if (!editProdTitle.trim() || !editProdPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter a product title and price.');
      return;
    }

    const numericProdId = parseInt(String(editingProduct.id).replace(/\D/g, ''), 10);
    if (isNaN(numericProdId) || numericProdId <= 0) {
      Alert.alert('Mock Product', 'Cannot update mock demo product on the server. Please add as a new product.');
      return;
    }

    const numericPrice = parseFloat(editProdPrice.replace(/[^0-9.]/g, '')) || 0;
    if (numericPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
      return;
    }

    const clothingMode = isEditProductClothing();
    if (clothingMode && editSelectedSizes.length > 0) {
      for (const sz of editSelectedSizes) {
        const stock = parseInt(editSizeStocks[sz] || '0', 10);
        if (isNaN(stock) || stock < 0) {
          Alert.alert('Invalid Stock', `Please enter a valid stock quantity for size ${sz}.`);
          return;
        }
      }
    }

    setSavingEditProd(true);
    setSaveEditProdError('');

    try {
      const numericStock = parseInt(editProdStock.replace(/[^0-9]/g, ''), 10);
      const stockVal = isNaN(numericStock) ? 50 : numericStock;

      const variantsPayload = clothingMode && editSelectedSizes.length > 0
        ? editSelectedSizes.map((sz) => ({
            size: sz,
            stockQuantity: parseInt(editSizeStocks[sz] || '0', 10) || 0,
            price: numericPrice,
          }))
        : undefined;

      const updatedData: any = {
        title: editProdTitle.trim(),
        productName: editProdTitle.trim(),
        price: numericPrice,
        stockQuantity: stockVal,
        unitName: clothingMode ? 'Piece' : (editProdUnit.trim() || 'KG'),
        productCategoryId: editProdCategoryId,
        categoryId: editProdCategoryId,
        description: editProdDescription.trim(),
        productImageUrl: editProdImage.trim() || editingProduct.imageUrl,
        imageUrl: editProdImage.trim() || editingProduct.imageUrl,
        inStock: editProdInStock,
        isAvailable: editProdInStock,
        ...(variantsPayload !== undefined ? { variants: variantsPayload } : {}),
      };

      // Sync to backend PUT /api/products/:id — errors will throw
      const updated = await productService.updateProduct(String(numericProdId), updatedData);

      // Reload product list from backend
      const freshProducts = await productService.getMyProducts(activeBiz.id);
      setProductsByShop((prev) => ({
        ...prev,
        [activeBiz.id]: Array.isArray(freshProducts) ? freshProducts : prev[activeBiz.id] || [],
      }));

      setEditProductModal(false);
      setEditingProduct(null);
      setSaveEditProdError('');
      Alert.alert('Product Updated', `"${updated?.title || editProdTitle.trim()}" updated successfully.`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to update product on server.';
      setSaveEditProdError(msg);
      Alert.alert('Update Failed', msg);
    } finally {
      setSavingEditProd(false);
    }
  };

  // Handle Save Shop Details strictly for ACTIVE BUSINESS (Section 1, 2, 14)
  const handleSaveShop = async () => {
    if (!activeBiz) return;
    if (!editShopName.trim()) {
      Alert.alert('Shop Name Required', 'Please enter a shop name.');
      return;
    }

    const numericBizId = parseInt(String(activeBiz.id).replace(/\D/g, ''), 10);
    if (isNaN(numericBizId) || numericBizId <= 0) {
      Alert.alert('Invalid Business', 'Cannot update a business with an invalid ID.');
      return;
    }

    setSavingShop(true);
    try {
      const updatePayload: Partial<Business> = {
        name: editShopName.trim(),
        description: editShopDescription.trim(),
        category: editShopCategory.trim(),
        address: editShopAddress.trim(),
        city: editShopCity.trim(),
        phone: editShopPhone.trim(),
        email: editShopEmail.trim(),
        website: editShopWebsite.trim(),
        operatingHours: editShopHours.trim(),
        status: editShopIsOpen ? 'active' : 'suspended',
        logoUrl: editShopLogoUrl.trim() || undefined,
        coverUrl: editShopCoverUrl.trim() || undefined,
      };

      const updatedFromApi = await businessService.updateBusiness(String(numericBizId), updatePayload);

      const mergedShop: Business = {
        ...activeBiz,
        ...updatedFromApi,
        name: editShopName.trim(),
        description: editShopDescription.trim(),
        category: editShopCategory.trim(),
        address: editShopAddress.trim(),
        city: editShopCity.trim(),
        phone: editShopPhone.trim(),
        email: editShopEmail.trim(),
        website: editShopWebsite.trim(),
        operatingHours: editShopHours.trim(),
        status: editShopIsOpen ? 'active' : 'suspended',
        logoUrl: editShopLogoUrl.trim() || updatedFromApi?.logoUrl || activeBiz.logoUrl,
        coverUrl: editShopCoverUrl.trim() || updatedFromApi?.coverUrl || activeBiz.coverUrl,
      };

      setActiveBiz(mergedShop);
      await activeBusinessService.setActiveBusiness(mergedShop);

      // Scoped strictly to active business ID (does NOT leak to other businesses)
      setBusinesses((prev) =>
        prev.map((b) => (String(b.id) === String(activeBiz.id) ? mergedShop : b))
      );

      // Trigger background refresh so activeBusinessService and server state remain strictly in sync
      fetchBusinesses().catch(() => {});

      setManageShopModal(false);
      Alert.alert('Shop Updated', `Shop details for "${mergedShop.name}" saved successfully.`);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Failed to update shop on server.');
    } finally {
      setSavingShop(false);
    }
  };

  // Handle Toggle Stock Availability (Section 10 & 13)
  const handleToggleStockAvailability = async (prod: Product) => {
    if (!activeBiz) return;
    const nextInStock = !prod.inStock;
    try {
      await productService.updateProduct(prod.id, { inStock: nextInStock, isAvailable: nextInStock });
    } catch {
      // optimistic
    }
    setProductsByShop((prev) => ({
      ...prev,
      [activeBiz.id]: (prev[activeBiz.id] || []).map((p) =>
        p.id === prod.id ? { ...p, inStock: nextInStock } : p
      ),
    }));
  };

  // Handle Delete Product with Authorized Deletion & Confirmation (Section 17 & 22)
  const handleDeleteProductWithConfirm = (prod: Product) => {
    if (!activeBiz) return;
    Alert.alert(
      `Delete ${prod.title}?`,
      'This product will no longer be available for sale.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(prod.id);
            } catch {
              // optimistic
            }
            setProductsByShop((prev) => ({
              ...prev,
              [activeBiz.id]: (prev[activeBiz.id] || []).filter((p) => p.id !== prod.id),
            }));
            Alert.alert('Product Deleted', `"${prod.title}" was removed from your shop catalog.`);
          },
        },
      ]
    );
  };

  // Reset Multi-Type Business Creation Form
  const resetCreationForm = () => {
    setCreationStep('select_type');
    setNewShopName('');
    setNewShopLogoUrl('');
    setNewShopCoverUrl('');
    setNewShopBusinessType('Shop');
    setNewShopSubtype('Grocery Shop');
    setNewShopCustomSubtype('');
    setNewShopCity('Chiplun');
    setNewShopAddress('');
    setNewShopDescription('');
    setNewBizPhone('');
    setNewBizEmail('');
    setNewBizHours('9:00 AM - 9:00 PM');
    setNewBizWebsite('');
    setNewBizCuisines(['Indian']);
    setNewBizServiceModes({ 'Dine-In': true, 'Takeaway': true, 'Delivery': false });
    setNewBizAmenities({ 'Outdoor Seating': false, 'Wi-Fi': true, 'Parking': false, 'Air Conditioning': true });
    setNewBizAvgPrice('₹₹');
    setNewBizStarRating(3);
    setNewBizCheckIn('12:00 PM');
    setNewBizCheckOut('11:00 AM');
    setNewBizRadius('Within 10 km');
    setNewBizPricingModel('Fixed');
    setNewBizAvailability('All Days');
    setNewBizExperience('3–5 Years');
    setNewBizWarehouse('');
    setNewBizMoq('50 units');
    setNewBizBulkPricing(true);
    setNewBizQuotation(true);
    setNewBizDeliveryScope('Regional');
    setNewBizCompanySize('11–50');
  };

  // Step 1: Handle selecting a business type from the 9 cards
  const handleSelectTypeToCreate = (item: BusinessTypeItem) => {
    setNewShopBusinessType(item.name);
    setNewShopSubtype(item.subtypes[0] || 'General');
    setNewShopCustomSubtype('');

    // Pre-populate sensible defaults according to business type
    if (item.name === 'Café' || item.name === 'Cafe') {
      setNewBizCuisines(['Beverages', 'Bakery']);
      setNewBizServiceModes({ 'Dine-In': true, 'Takeaway': true, 'Delivery': false });
      setNewBizAvgPrice('₹₹');
      setNewShopDescription('Artisanal coffee, freshly baked goods & beverages.');
    } else if (item.name === 'Restaurant') {
      setNewBizCuisines(['Indian']);
      setNewBizServiceModes({ 'Dine-In': true, 'Takeaway': true, 'Delivery': true });
      setNewBizAvgPrice('₹₹');
      setNewShopDescription('Multi-cuisine dining, authentic flavors & quick takeaway.');
    } else if (item.name === 'Hotel') {
      setNewBizStarRating(3);
      setNewBizCheckIn('12:00 PM');
      setNewBizCheckOut('11:00 AM');
      setNewShopDescription('Comfortable hospitality, modern amenities & relaxing stay.');
    } else if (item.name === 'Service Provider') {
      setNewBizRadius('Within 10 km');
      setNewBizPricingModel('Starting From');
      setNewShopDescription('Certified local services delivered at your doorstep.');
    } else if (item.name === 'Technician') {
      setNewBizRadius('Within 10 km');
      setNewBizPricingModel('Inspection Fee');
      setNewBizExperience('3–5 Years');
      setNewShopDescription('Experienced technical repair, maintenance & troubleshooting.');
    } else if (item.name === 'Wholesaler / Dealer') {
      setNewBizMoq('50 units');
      setNewBizBulkPricing(true);
      setNewBizQuotation(true);
      setNewBizDeliveryScope('Regional');
      setNewShopDescription('Wholesale distributor providing bulk quantities & competitive pricing.');
    } else if (item.name === 'Employer') {
      setNewBizCompanySize('11–50');
      setNewShopDescription('Growing organization offering local career opportunities.');
    } else {
      setNewShopDescription('');
    }

    setCreationStep('setup_form');
  };

  // Step 2: Handle Add New Business (Specialized Dynamic Flow)
  const handleCreateShop = async () => {
    if (!newShopName.trim()) {
      Alert.alert('Business Name Required', 'Please enter a name for your new business.');
      return;
    }

    if (!newShopBusinessType.trim()) {
      Alert.alert('Business Type Required', 'Please select a business type.');
      return;
    }

    if (!newShopCity.trim()) {
      Alert.alert('Location Required', 'Please select a location / city.');
      return;
    }

    const effectiveCategory =
      newShopSubtype === 'Other' && newShopCustomSubtype.trim()
        ? newShopCustomSubtype.trim()
        : (newShopSubtype.trim() || newShopBusinessType);

    const isCafe = newShopBusinessType === 'Café' || newShopBusinessType === 'Cafe';
    const isRestaurant = newShopBusinessType === 'Restaurant';
    const isHotel = newShopBusinessType === 'Hotel';
    const isServiceProvider = newShopBusinessType === 'Service Provider';
    const isTechnician = newShopBusinessType === 'Technician';
    const isWholesaler = newShopBusinessType.includes('Wholesal') || newShopBusinessType.includes('Dealer');
    const isEmployer = newShopBusinessType === 'Employer';

    const selectedServiceModes = Object.keys(newBizServiceModes).filter((k) => newBizServiceModes[k]);
    const selectedAmenities = Object.keys(newBizAmenities).filter((k) => newBizAmenities[k]);

    // Validation per business type
    if (isCafe && selectedServiceModes.length === 0) {
      Alert.alert('Service Mode Required', 'Please select at least one service mode (Dine-In, Takeaway, or Delivery).');
      return;
    }

    if (isRestaurant) {
      if (newBizCuisines.length === 0) {
        Alert.alert('Cuisine Required', 'Please select at least one cuisine for your restaurant.');
        return;
      }
      if (selectedServiceModes.length === 0) {
        Alert.alert('Service Mode Required', 'Please select at least one service mode (Dine-In, Takeaway, or Delivery).');
        return;
      }
    }

    setCreatingShop(true);
    try {
      const payload: any = {
        name: newShopName.trim(),
        businessName: newShopName.trim(),
        businessType: newShopBusinessType,
        type: newShopBusinessType,
        category: effectiveCategory,
        city: newShopCity,
        address: newShopAddress.trim() || `${newShopCity}, Maharashtra`,
        addressLine1: newShopAddress.trim() || `${newShopCity}, Maharashtra`,
        description: newShopDescription.trim() || `${effectiveCategory} in ${newShopCity}`,
        phone: newBizPhone.trim() || undefined,
        email: newBizEmail.trim() || undefined,
        website: newBizWebsite.trim() || undefined,
        openingHours: newBizHours.trim() || undefined,
        logoUrl: newShopLogoUrl.trim() || undefined,
        coverUrl: newShopCoverUrl.trim() || undefined,
        coverImageUrl: newShopCoverUrl.trim() || undefined,
      };

      if (isCafe) {
        payload.cafeCategory = effectiveCategory;
        payload.cuisines = newBizCuisines;
        payload.serviceModes = selectedServiceModes;
        payload.amenities = selectedAmenities;
        payload.averagePrice = newBizAvgPrice;
      } else if (isRestaurant) {
        payload.restaurantCategory = effectiveCategory;
        payload.cuisines = newBizCuisines;
        payload.serviceModes = selectedServiceModes;
        payload.amenities = selectedAmenities;
        payload.averagePrice = newBizAvgPrice;
      } else if (isHotel) {
        payload.hotelCategory = effectiveCategory;
        payload.starRating = newBizStarRating;
        payload.checkInTime = newBizCheckIn;
        payload.checkOutTime = newBizCheckOut;
        payload.amenities = selectedAmenities;
      } else if (isServiceProvider) {
        payload.serviceCategory = effectiveCategory;
        payload.serviceArea = `${newShopCity} (${newBizRadius})`;
        payload.radius = newBizRadius;
        payload.pricingModel = newBizPricingModel;
        payload.workingDays = newBizAvailability;
      } else if (isTechnician) {
        payload.technicalCategory = effectiveCategory;
        payload.serviceArea = `${newShopCity} (${newBizRadius})`;
        payload.radius = newBizRadius;
        payload.pricingModel = newBizPricingModel;
        payload.experience = newBizExperience;
        payload.availability = newBizAvailability;
      } else if (isWholesaler) {
        payload.wholesaleCategory = effectiveCategory;
        payload.warehouseLocation = newBizWarehouse.trim() || `${newShopCity} Warehouse`;
        payload.minOrderQuantity = newBizMoq;
        payload.bulkPricingSupported = newBizBulkPricing;
        payload.quotationSupported = newBizQuotation;
        payload.deliveryScope = newBizDeliveryScope;
      } else if (isEmployer) {
        payload.industry = effectiveCategory;
        payload.companySize = newBizCompanySize;
      } else if (newShopBusinessType === 'Shop') {
        payload.shopCategory = effectiveCategory;
      }

      let createdBiz: Business;
      try {
        createdBiz = await businessService.createBusiness(payload);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to create business.');
        return;
      }

      setBusinesses((prev) => [createdBiz, ...prev]);
      await activeBusinessService.setActiveBusiness(createdBiz);
      setActiveBiz(createdBiz);

      resetCreationForm();
      setAddShopModal(false);
      setViewMode('manage');

      Alert.alert(
        `${newShopBusinessType} Created!`,
        `"${createdBiz.name}" is now active and ready for business operations.`
      );
    } finally {
      setCreatingShop(false);
    }
  };

  const getSubmitButtonLabel = (type: string) => {
    switch (type) {
      case 'Shop':
        return 'Create Shop';
      case 'Café':
      case 'Cafe':
        return 'Create Café';
      case 'Restaurant':
        return 'Create Restaurant';
      case 'Hotel':
        return 'Create Hotel';
      case 'Service Provider':
        return 'Create Service Business';
      case 'Technician':
        return 'Create Technician Business';
      case 'Wholesaler / Dealer':
        return 'Create Wholesale Business';
      case 'Employer':
        return 'Create Employer';
      default:
        return 'Create Business';
    }
  };

  const getSetupModalTitle = (type: string) => {
    switch (type) {
      case 'Shop':
        return 'SHOP SETUP';
      case 'Café':
      case 'Cafe':
        return 'CAFÉ SETUP';
      case 'Restaurant':
        return 'RESTAURANT SETUP';
      case 'Hotel':
        return 'HOTEL SETUP';
      case 'Service Provider':
        return 'SERVICE BUSINESS SETUP';
      case 'Technician':
        return 'TECHNICIAN PROFILE';
      case 'Wholesaler / Dealer':
        return 'WHOLESALE BUSINESS SETUP';
      case 'Employer':
        return 'EMPLOYER / ORGANIZATION SETUP';
      default:
        return `${type.toUpperCase()} SETUP`;
    }
  };

  const getShopEmoji = (category?: string, name?: string) => {
    const text = `${category || ''} ${name || ''}`.toLowerCase();
    if (text.includes('mobile') || text.includes('phone')) return '📱';
    if (text.includes('electronic') || text.includes('laptop') || text.includes('tech')) return '💻';
    if (text.includes('grocery') || text.includes('mart') || text.includes('fresh')) return '🛒';
    return '🏪';
  };

  const renderSpecializedFormSection = () => {
    const isShop = newShopBusinessType === 'Shop';
    const isCafe = newShopBusinessType === 'Café' || newShopBusinessType === 'Cafe';
    const isRestaurant = newShopBusinessType === 'Restaurant';
    const isHotel = newShopBusinessType === 'Hotel';
    const isServiceProvider = newShopBusinessType === 'Service Provider';
    const isTechnician = newShopBusinessType === 'Technician';
    const isWholesaler = newShopBusinessType.includes('Wholesal') || newShopBusinessType.includes('Dealer');
    const isEmployer = newShopBusinessType === 'Employer';

    const currentConfig = BUSINESS_TYPE_CONFIGS.find((b) => b.name === newShopBusinessType);
    const subtypes = currentConfig?.subtypes || [];

    if (isShop) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>SHOP CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {newShopSubtype === 'Other' && (
            <TextInput
              style={[styles.formInput, { marginTop: 8 }]}
              value={newShopCustomSubtype}
              onChangeText={setNewShopCustomSubtype}
              placeholder="Enter custom shop category..."
              placeholderTextColor={Theme.colors.secondaryText}
            />
          )}
        </View>
      );
    }

    if (isCafe) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>CAFÉ CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cuisines / Food Styles */}
          <Text style={styles.formLabel}>Cuisine / Food Style (Select multiple)</Text>
          <View style={styles.multiPillsWrap}>
            {['Indian', 'Continental', 'Italian', 'Bakery', 'Desserts', 'Fast Food', 'Beverages', 'Other'].map((c) => {
              const isSel = newBizCuisines.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => {
                    setNewBizCuisines((prev) =>
                      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  {isSel && <Check size={13} color="#040814" style={{ marginRight: 4 }} />}
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Services Offered */}
          <Text style={styles.formLabel}>Services Offered *</Text>
          <View style={styles.checkboxRow}>
            {['Dine-In', 'Takeaway', 'Delivery'].map((s) => {
              const isChecked = Boolean(newBizServiceModes[s]);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.checkboxPill, isChecked && styles.checkboxPillActive]}
                  onPress={() => setNewBizServiceModes((prev) => ({ ...prev, [s]: !prev[s] }))}
                  activeOpacity={0.8}
                >
                  {isChecked ? (
                    <CheckSquare size={16} color={Theme.colors.primary} />
                  ) : (
                    <Square size={16} color={Theme.colors.secondaryText} />
                  )}
                  <Text style={[styles.checkboxPillText, isChecked && styles.checkboxPillTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amenities */}
          <Text style={styles.formLabel}>Features & Facilities (Optional)</Text>
          <View style={styles.multiPillsWrap}>
            {['Outdoor Seating', 'Wi-Fi', 'Parking', 'Air Conditioning'].map((am) => {
              const isChecked = Boolean(newBizAmenities[am]);
              return (
                <TouchableOpacity
                  key={am}
                  style={[styles.multiPill, isChecked && styles.multiPillActive]}
                  onPress={() => setNewBizAmenities((prev) => ({ ...prev, [am]: !prev[am] }))}
                  activeOpacity={0.8}
                >
                  {isChecked && <Check size={13} color="#040814" style={{ marginRight: 4 }} />}
                  <Text style={[styles.multiPillText, isChecked && styles.multiPillTextActive]}>{am}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Average Price */}
          <Text style={styles.formLabel}>Average Price Range</Text>
          <View style={styles.multiPillsWrap}>
            {['₹', '₹₹', '₹₹₹', '₹₹₹₹'].map((price) => {
              const isSel = newBizAvgPrice === price;
              return (
                <TouchableOpacity
                  key={price}
                  style={[styles.pricePill, isSel && styles.pricePillActive]}
                  onPress={() => setNewBizAvgPrice(price)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pricePillText, isSel && styles.pricePillTextActive]}>{price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (isRestaurant) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>RESTAURANT CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Cuisines */}
          <Text style={styles.formLabel}>Cuisine (Select at least one) *</Text>
          <View style={styles.multiPillsWrap}>
            {[
              'Indian',
              'Chinese',
              'Italian',
              'South Indian',
              'North Indian',
              'Maharashtrian',
              'Punjabi',
              'Mughlai',
              'Continental',
              'Mexican',
              'Other',
            ].map((c) => {
              const isSel = newBizCuisines.includes(c);
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => {
                    setNewBizCuisines((prev) =>
                      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                    );
                  }}
                  activeOpacity={0.8}
                >
                  {isSel && <Check size={13} color="#040814" style={{ marginRight: 4 }} />}
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Services */}
          <Text style={styles.formLabel}>Dining & Delivery Modes *</Text>
          <View style={styles.checkboxRow}>
            {['Dine-In', 'Takeaway', 'Delivery'].map((s) => {
              const isChecked = Boolean(newBizServiceModes[s]);
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.checkboxPill, isChecked && styles.checkboxPillActive]}
                  onPress={() => setNewBizServiceModes((prev) => ({ ...prev, [s]: !prev[s] }))}
                  activeOpacity={0.8}
                >
                  {isChecked ? (
                    <CheckSquare size={16} color={Theme.colors.primary} />
                  ) : (
                    <Square size={16} color={Theme.colors.secondaryText} />
                  )}
                  <Text style={[styles.checkboxPillText, isChecked && styles.checkboxPillTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Facilities */}
          <Text style={styles.formLabel}>Facilities & Hospitality (Optional)</Text>
          <View style={styles.multiPillsWrap}>
            {['Table Reservation', 'Outdoor Seating', 'Parking', 'Wi-Fi', 'Air Conditioning'].map((f) => {
              const isChecked = Boolean(newBizAmenities[f]);
              return (
                <TouchableOpacity
                  key={f}
                  style={[styles.multiPill, isChecked && styles.multiPillActive]}
                  onPress={() => setNewBizAmenities((prev) => ({ ...prev, [f]: !prev[f] }))}
                  activeOpacity={0.8}
                >
                  {isChecked && <Check size={13} color="#040814" style={{ marginRight: 4 }} />}
                  <Text style={[styles.multiPillText, isChecked && styles.multiPillTextActive]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Average Price */}
          <Text style={styles.formLabel}>Average Price Range</Text>
          <View style={styles.multiPillsWrap}>
            {['₹', '₹₹', '₹₹₹', '₹₹₹₹'].map((price) => {
              const isSel = newBizAvgPrice === price;
              return (
                <TouchableOpacity
                  key={price}
                  style={[styles.pricePill, isSel && styles.pricePillActive]}
                  onPress={() => setNewBizAvgPrice(price)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pricePillText, isSel && styles.pricePillTextActive]}>{price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (isHotel) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>HOTEL CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Star Rating */}
          <Text style={styles.formLabel}>Star Rating</Text>
          <View style={styles.multiPillsWrap}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isSel = newBizStarRating === star;
              return (
                <TouchableOpacity
                  key={star}
                  style={[styles.starPill, isSel && styles.starPillActive]}
                  onPress={() => setNewBizStarRating(star)}
                  activeOpacity={0.8}
                >
                  <Star size={14} color={isSel ? '#040814' : '#F59E0B'} fill={isSel ? '#040814' : '#F59E0B'} style={{ marginRight: 4 }} />
                  <Text style={[styles.starPillText, isSel && styles.starPillTextActive]}>
                    {star} {star === 1 ? 'Star' : 'Stars'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Check-in & Check-out times */}
          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.formLabel}>Check-in Time</Text>
              <TextInput
                style={styles.formInput}
                value={newBizCheckIn}
                onChangeText={setNewBizCheckIn}
                placeholder="12:00 PM"
                placeholderTextColor={Theme.colors.secondaryText}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.formLabel}>Check-out Time</Text>
              <TextInput
                style={styles.formInput}
                value={newBizCheckOut}
                onChangeText={setNewBizCheckOut}
                placeholder="11:00 AM"
                placeholderTextColor={Theme.colors.secondaryText}
              />
            </View>
          </View>

          {/* Amenities */}
          <Text style={styles.formLabel}>Hotel Amenities</Text>
          <View style={styles.multiPillsWrap}>
            {['Wi-Fi', 'Parking', 'Restaurant', 'Pool', 'Gym', 'Room Service', 'Air Conditioning', '24/7 Front Desk'].map((am) => {
              const isChecked = Boolean(newBizAmenities[am]);
              return (
                <TouchableOpacity
                  key={am}
                  style={[styles.multiPill, isChecked && styles.multiPillActive]}
                  onPress={() => setNewBizAmenities((prev) => ({ ...prev, [am]: !prev[am] }))}
                  activeOpacity={0.8}
                >
                  {isChecked && <Check size={13} color="#040814" style={{ marginRight: 4 }} />}
                  <Text style={[styles.multiPillText, isChecked && styles.multiPillTextActive]}>{am}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (isServiceProvider) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>SERVICE CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Service Area / Radius */}
          <Text style={styles.formLabel}>Service Coverage Radius *</Text>
          <View style={styles.multiPillsWrap}>
            {['Within 5 km', 'Within 10 km', 'Within 25 km', 'Entire City / District'].map((rad) => {
              const isSel = newBizRadius === rad;
              return (
                <TouchableOpacity
                  key={rad}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizRadius(rad)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{rad}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pricing Model */}
          <Text style={styles.formLabel}>Pricing Model</Text>
          <View style={styles.multiPillsWrap}>
            {['Fixed', 'Starting From', 'Hourly', 'Per Visit', 'Per Unit', 'Package', 'Quote'].map((pm) => {
              const isSel = newBizPricingModel === pm;
              return (
                <TouchableOpacity
                  key={pm}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizPricingModel(pm)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{pm}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Availability */}
          <Text style={styles.formLabel}>Working Days / Availability</Text>
          <View style={styles.multiPillsWrap}>
            {['All Days', 'Mon-Fri', 'Mon-Sat', 'Weekends Only'].map((av) => {
              const isSel = newBizAvailability === av;
              return (
                <TouchableOpacity
                  key={av}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizAvailability(av)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{av}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (isTechnician) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>TECHNICAL SPECIALIZATION *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Service Area / Radius */}
          <Text style={styles.formLabel}>Service Coverage Radius *</Text>
          <View style={styles.multiPillsWrap}>
            {['Within 5 km', 'Within 10 km', 'Within 20 km', 'City-wide'].map((rad) => {
              const isSel = newBizRadius === rad;
              return (
                <TouchableOpacity
                  key={rad}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizRadius(rad)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{rad}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pricing Model */}
          <Text style={styles.formLabel}>Pricing Model</Text>
          <View style={styles.multiPillsWrap}>
            {['Inspection Fee', 'Starting From', 'Fixed', 'Hourly', 'Quote'].map((pm) => {
              const isSel = newBizPricingModel === pm;
              return (
                <TouchableOpacity
                  key={pm}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizPricingModel(pm)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{pm}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Experience */}
          <Text style={styles.formLabel}>Years of Professional Experience</Text>
          <View style={styles.multiPillsWrap}>
            {['1–2 Years', '3–5 Years', '5–10 Years', '10+ Years'].map((exp) => {
              const isSel = newBizExperience === exp;
              return (
                <TouchableOpacity
                  key={exp}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizExperience(exp)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{exp}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Availability */}
          <Text style={styles.formLabel}>Service Availability</Text>
          <View style={styles.multiPillsWrap}>
            {['Immediate / Same-Day', 'Mon-Sat', '24/7 Emergency'].map((av) => {
              const isSel = newBizAvailability === av;
              return (
                <TouchableOpacity
                  key={av}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizAvailability(av)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{av}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (isWholesaler) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>WHOLESALE CATEGORY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Warehouse Location */}
          <Text style={styles.formLabel}>Warehouse / Depot Location</Text>
          <TextInput
            style={styles.formInput}
            value={newBizWarehouse}
            onChangeText={setNewBizWarehouse}
            placeholder="e.g. Industrial Area Phase 2, Chiplun"
            placeholderTextColor={Theme.colors.secondaryText}
          />

          {/* Minimum Order Quantity (MOQ) */}
          <Text style={styles.formLabel}>Minimum Order Quantity (MOQ)</Text>
          <TextInput
            style={styles.formInput}
            value={newBizMoq}
            onChangeText={setNewBizMoq}
            placeholder="e.g. 50 units / ₹10,000 minimum"
            placeholderTextColor={Theme.colors.secondaryText}
          />

          {/* Bulk Pricing & Quotation Toggles */}
          <View style={styles.rowTwoCols}>
            <TouchableOpacity
              style={[styles.toggleCard, newBizBulkPricing && styles.toggleCardActive]}
              onPress={() => setNewBizBulkPricing(!newBizBulkPricing)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleCardTitle}>Bulk Pricing</Text>
              <Text style={[styles.toggleCardStatus, newBizBulkPricing && styles.toggleCardStatusActive]}>
                {newBizBulkPricing ? 'Supported' : 'Not Supported'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleCard, newBizQuotation && styles.toggleCardActive]}
              onPress={() => setNewBizQuotation(!newBizQuotation)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleCardTitle}>Quotations</Text>
              <Text style={[styles.toggleCardStatus, newBizQuotation && styles.toggleCardStatusActive]}>
                {newBizQuotation ? 'Supported' : 'Not Supported'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Scope */}
          <Text style={styles.formLabel}>Delivery Scope</Text>
          <View style={styles.multiPillsWrap}>
            {['Local', 'Regional', 'Pan-India', 'Other'].map((scope) => {
              const isSel = newBizDeliveryScope === scope;
              return (
                <TouchableOpacity
                  key={scope}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizDeliveryScope(scope)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{scope}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (isEmployer) {
      return (
        <View style={styles.specSectionWrapper}>
          <Text style={styles.formSectionTitle}>INDUSTRY / SECTOR *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCatPillsScroll}>
            {subtypes.map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                  onPress={() => setNewShopSubtype(sub)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Company Size */}
          <Text style={styles.formLabel}>Organization / Company Size</Text>
          <View style={styles.multiPillsWrap}>
            {['1–10', '11–50', '51–200', '201–500', '500+'].map((sz) => {
              const isSel = newBizCompanySize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  style={[styles.multiPill, isSel && styles.multiPillActive]}
                  onPress={() => setNewBizCompanySize(sz)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.multiPillText, isSel && styles.multiPillTextActive]}>{sz} Employees</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Website */}
          <Text style={styles.formLabel}>Company Website</Text>
          <TextInput
            style={styles.formInput}
            value={newBizWebsite}
            onChangeText={setNewBizWebsite}
            placeholder="https://company.com"
            keyboardType="url"
            autoCapitalize="none"
            placeholderTextColor={Theme.colors.secondaryText}
          />
        </View>
      );
    }

    // Default / Other
    return (
      <View style={styles.specSectionWrapper}>
        <Text style={styles.formSectionTitle}>BUSINESS CATEGORY</Text>
        <TextInput
          style={styles.formInput}
          value={newShopCustomSubtype}
          onChangeText={setNewShopCustomSubtype}
          placeholder="Enter business category or specialty..."
          placeholderTextColor={Theme.colors.secondaryText}
        />
      </View>
    );
  };

  // Render business-type-specific operations hub under active business hero card
  const renderActiveBusinessTypeHub = () => {
    if (!activeBiz) return null;
    const type = (activeBiz.businessType || activeBiz.type || 'Shop').trim();

    if (type === 'Restaurant' || type === 'Café' || type === 'Cafe') {
      return (
        <GlassCard style={styles.typeSpecificHubCard}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubHeaderLeft}>
              <Utensils size={18} color={Theme.colors.primary} />
              <Text style={styles.hubHeaderTitle}>{type.toUpperCase()} MANAGEMENT SUITE</Text>
            </View>
            <View style={styles.hubBadge}>
              <Text style={styles.hubBadgeText}>F&B Operational</Text>
            </View>
          </View>
          <Text style={styles.hubSubText}>
            Specialized tools for culinary catalog, seating layouts, and delivery modes:
          </Text>
          <View style={styles.hubModulesGrid}>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🍽️</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Dishes & Menu</Text>
              <Text style={styles.hubModuleSub}>Variants & Add-ons</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🪑</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Table Seating</Text>
              <Text style={styles.hubModuleSub}>Dine-in Capacity</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🛵</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Order Modes</Text>
              <Text style={styles.hubModuleSub}>Dine-In • Takeaway • Delivery</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🏷️</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Offers & Combos</Text>
              <Text style={styles.hubModuleSub}>Specials & Discounts</Text>
            </View>
          </View>
        </GlassCard>
      );
    }

    if (type === 'Hotel') {
      return (
        <GlassCard style={styles.typeSpecificHubCard}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubHeaderLeft}>
              <Hotel size={18} color="#A78BFA" />
              <Text style={styles.hubHeaderTitle}>HOTEL HOSPITALITY SUITE</Text>
            </View>
            <View style={[styles.hubBadge, { backgroundColor: 'rgba(167, 139, 250, 0.15)', borderColor: 'rgba(167, 139, 250, 0.4)' }]}>
              <Text style={[styles.hubBadgeText, { color: '#A78BFA' }]}>Lodging Active</Text>
            </View>
          </View>
          <Text style={styles.hubSubText}>
            Front desk management, guest accommodation, and room booking telemetry:
          </Text>
          <View style={styles.hubModulesGrid}>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🏨</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Room Inventory</Text>
              <Text style={styles.hubModuleSub}>Single, Deluxe & Suites</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🛎️</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Guest Desk</Text>
              <Text style={styles.hubModuleSub}>Check-in & Reservations</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🏊</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Amenities</Text>
              <Text style={styles.hubModuleSub}>Facility Services</Text>
            </View>
          </View>
        </GlassCard>
      );
    }

    if (type === 'Service Provider' || type === 'Technician') {
      return (
        <GlassCard style={styles.typeSpecificHubCard}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubHeaderLeft}>
              <Wrench size={18} color="#38BDF8" />
              <Text style={styles.hubHeaderTitle}>{type.toUpperCase()} WORKBENCH</Text>
            </View>
            <View style={[styles.hubBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)' }]}>
              <Text style={[styles.hubBadgeText, { color: '#38BDF8' }]}>On-Demand Services</Text>
            </View>
          </View>
          <Text style={styles.hubSubText}>
            Service appointments, client booking schedule, and coverage zone:
          </Text>
          <View style={styles.hubModulesGrid}>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🛠️</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Rate Cards</Text>
              <Text style={styles.hubModuleSub}>Fixed & Hourly Rates</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>📅</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Job Requests</Text>
              <Text style={styles.hubModuleSub}>Appointments & Slots</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>📍</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Service Radius</Text>
              <Text style={styles.hubModuleSub}>Doorstep Coverage</Text>
            </View>
          </View>
        </GlassCard>
      );
    }

    if (type.includes('Wholesal') || type.includes('Dealer')) {
      return (
        <GlassCard style={styles.typeSpecificHubCard}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubHeaderLeft}>
              <Truck size={18} color="#F59E0B" />
              <Text style={styles.hubHeaderTitle}>WHOLESALE & B2B OPERATIONS</Text>
            </View>
            <View style={[styles.hubBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
              <Text style={[styles.hubBadgeText, { color: '#F59E0B' }]}>B2B Merchant</Text>
            </View>
          </View>
          <Text style={styles.hubSubText}>
            Bulk commodity catalog, minimum order quantities, and enterprise quotation requests:
          </Text>
          <View style={styles.hubModulesGrid}>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>📦</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Bulk Catalog</Text>
              <Text style={styles.hubModuleSub}>MOQ & Volume Tiers</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>📑</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Quotations</Text>
              <Text style={styles.hubModuleSub}>Inquiries & B2B Orders</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>🚚</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Freight & Dispatch</Text>
              <Text style={styles.hubModuleSub}>Regional Distribution</Text>
            </View>
          </View>
        </GlassCard>
      );
    }

    if (type === 'Employer') {
      return (
        <GlassCard style={styles.typeSpecificHubCard}>
          <View style={styles.hubHeaderRow}>
            <View style={styles.hubHeaderLeft}>
              <Briefcase size={18} color="#EC4899" />
              <Text style={styles.hubHeaderTitle}>EMPLOYER RECRUITING HUB</Text>
            </View>
            <View style={[styles.hubBadge, { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: 'rgba(236, 72, 153, 0.4)' }]}>
              <Text style={[styles.hubBadgeText, { color: '#EC4899' }]}>Workforce Active</Text>
            </View>
          </View>
          <Text style={styles.hubSubText}>
            Job openings, candidate review pipeline, and organizational staff management:
          </Text>
          <View style={styles.hubModulesGrid}>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>👷</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Job Openings</Text>
              <Text style={styles.hubModuleSub}>Active Postings</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>📄</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Applications</Text>
              <Text style={styles.hubModuleSub}>Candidate Pipeline</Text>
            </View>
            <View style={styles.hubModuleItem}>
              <View style={styles.hubModuleIconBox}>
                <Text style={{ fontSize: 18 }}>👥</Text>
              </View>
              <Text style={styles.hubModuleTitle}>Team Roster</Text>
              <Text style={styles.hubModuleSub}>Company Profile</Text>
            </View>
          </View>
        </GlassCard>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Theme.colors.primary}
            />
          }
        >
          {/* ======================================================== */}
          {/* VIEW MODE 1: MY BUSINESSES DIRECTORY (Section 4)         */}
          {/* ======================================================== */}
          {viewMode === 'list' || !activeBiz ? (
            <View>
              <View style={styles.topHeader}>
                <Text style={styles.pageTitle}>My Businesses</Text>
                <Text style={styles.pageSub}>
                  Select an enterprise or add a new independent shop
                </Text>
              </View>

              {businesses.length === 0 ? (
                <EmptyState
                  icon={<Store size={44} color={Theme.colors.primary} />}
                  title="No businesses yet"
                  description="You don't have any registered businesses or enterprises. Create your first business to start operating."
                  actionLabel="+ Add New Business"
                  onAction={() => {
                    setCreationStep('select_type');
                    setAddShopModal(true);
                  }}
                />
              ) : (
                <>
                  <View style={styles.directoryList}>
                    {businesses.map((biz) => {
                      const pCount = (productsByShop[biz.id] || []).length;
                      const emoji = getShopEmoji(biz.category, biz.name);
                      const isCurrentActive = String(biz.id) === String(activeBiz?.id);

                      return (
                        <GlassCard key={biz.id} style={styles.bizDirectoryCard}>
                          {biz.coverUrl ? (
                            <Image
                              source={{ uri: resolveImageUrl(biz.coverUrl) }}
                              style={styles.bizCardCoverImg}
                              resizeMode="cover"
                            />
                          ) : null}
                          <View style={styles.bizCardHeaderRow}>
                            <View style={styles.bizCardEmojiBox}>
                              {biz.logoUrl ? (
                                <Image
                                  source={{ uri: resolveImageUrl(biz.logoUrl) }}
                                  style={styles.bizCardLogoImg}
                                  resizeMode="cover"
                                />
                              ) : (
                                <Text style={styles.bizCardEmoji}>{emoji}</Text>
                              )}
                            </View>
                            <View style={styles.bizCardInfoCol}>
                              <View style={styles.bizCardTitleRow}>
                                <Text style={styles.bizCardName} numberOfLines={1}>
                                  {biz.name}
                                </Text>
                                {isCurrentActive && (
                                  <View style={styles.activePillBadge}>
                                    <Text style={styles.activePillText}>ACTIVE</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.bizCardType}>{biz.category || 'Retail Shop'}</Text>
                              <View style={styles.bizCardMetaRow}>
                                <Package size={12} color={Theme.colors.primary} />
                                <Text style={styles.bizCardMetaText}>{pCount} Products</Text>
                                <Text style={styles.bizCardMetaDot}>•</Text>
                                <MapPin size={12} color={Theme.colors.secondaryText} />
                                <Text style={styles.bizCardMetaText}>
                                  {biz.location?.city || biz.city || 'Chiplun'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.manageShopBtn,
                              isCurrentActive ? styles.manageShopBtnActive : styles.manageShopBtnInactive,
                            ]}
                            onPress={async () => {
                              await handleSelectBusiness(biz);
                              setViewMode('manage');
                            }}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.manageShopBtnText,
                                isCurrentActive && styles.manageShopBtnTextActive,
                              ]}
                            >
                              {isCurrentActive ? 'Manage Active Shop' : 'Manage Shop'}
                            </Text>
                            <ArrowRight
                              size={15}
                              color={isCurrentActive ? '#040814' : Theme.colors.primary}
                            />
                          </TouchableOpacity>
                        </GlassCard>
                      );
                    })}
                  </View>

                  {/* + Add New Business CTA */}
                  <TouchableOpacity
                    style={styles.addShopCtaBtn}
                    onPress={() => {
                      setCreationStep('select_type');
                      setAddShopModal(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Plus size={18} color={Theme.colors.primary} />
                    <Text style={styles.addShopCtaText}>+ Add New Business</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            /* ======================================================== */
            /* VIEW MODE 2: ACTIVE SHOP CATALOG & INVENTORY (Section 5) */
            /* ======================================================== */
            <View>
              {/* Back to All Businesses directory */}
              <TouchableOpacity
                style={styles.backToDirectoryBtn}
                onPress={() => setViewMode('list')}
                activeOpacity={0.75}
              >
                <ChevronLeft size={18} color={Theme.colors.primary} />
                <Text style={styles.backToDirectoryText}>My Businesses</Text>
              </TouchableOpacity>

              {/* Prominent Active Shop Card with ShopSwitcher */}
              <GlassCard style={styles.activeShopHeroCard}>
                {activeBiz?.coverUrl ? (
                  <Image
                    key={`active-shop-cover-${activeBiz?.id}-${activeBiz?.coverUrl}`}
                    source={{ uri: resolveImageUrl(activeBiz.coverUrl) }}
                    style={styles.activeShopCoverImg}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.activeShopHeaderRow}>
                  <View style={styles.activeShopLeft}>
                    <View style={styles.activeShopEmojiBox}>
                      {activeBiz?.logoUrl ? (
                        <Image
                          key={`active-shop-logo-${activeBiz?.id}-${activeBiz?.logoUrl}`}
                          source={{ uri: resolveImageUrl(activeBiz.logoUrl) }}
                          style={styles.activeShopLogoImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.activeShopEmoji}>
                          {getShopEmoji(activeBiz?.category, activeBiz?.name)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.activeShopTextCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={styles.activeShopTitle} numberOfLines={1}>
                          {activeBiz?.name || 'My Enterprise'}
                        </Text>
                        <View style={styles.activeTypePillBadge}>
                          <Text style={styles.activeTypePillText}>
                            {(activeBiz?.businessType || activeBiz?.type || 'Shop').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.activeShopSub}>
                        {activeBiz?.category || 'Retail Shop'} •{' '}
                        {activeBiz?.location?.city || activeBiz?.city || 'Chiplun'}
                      </Text>
                    </View>
                  </View>

                  {/* Switch Shop Dropdown Trigger */}
                  <View style={{ alignSelf: 'center' }}>
                    <ShopSwitcher
                      businesses={businesses}
                      activeBusiness={activeBiz}
                      onSelectBusiness={handleSelectBusiness}
                      onAddNewShop={() => {
                        resetCreationForm();
                        setAddShopModal(true);
                      }}
                      compact
                    />
                  </View>
                </View>

                {/* Active Shop Action Bar with [ Manage Shop ] (Section 1 & 14) */}
                <View style={styles.activeShopActionsRow}>
                  <TouchableOpacity
                    style={styles.manageShopHeaderBtn}
                    onPress={handleOpenManageShop}
                    activeOpacity={0.8}
                  >
                    <Settings size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.manageShopHeaderBtnText}>Manage Shop</Text>
                  </TouchableOpacity>

                  <View style={styles.statusBadgePill}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            activeBiz?.status === 'active' || activeBiz?.isOpen !== false
                              ? Theme.colors.success
                              : '#EF4444',
                        },
                      ]}
                    />
                    <Text style={styles.statusBadgeText}>
                      {activeBiz?.status === 'active' || activeBiz?.isOpen !== false
                        ? 'Open for Business'
                        : 'Closed'}
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Business-type-specific operations hub (F&B / Hospitality / Services / Wholesale / Employer) */}
              {renderActiveBusinessTypeHub()}

              {/* Divider */}
              <View style={styles.shopDivider} />

              {/* Sub-Navigation Cards: Products vs Services */}
              <View style={styles.topTabsGrid}>
                <TouchableOpacity
                  style={[
                    styles.modeTabCard,
                    activeTab === 'products' ? styles.modeTabCardActive : styles.modeTabCardInactive,
                  ]}
                  onPress={() => setActiveTab('products')}
                  activeOpacity={0.85}
                >
                  <View style={styles.modeTabInner}>
                    <Text style={styles.modeTabEmoji}>🛍</Text>
                    <Text
                      style={[
                        styles.modeTabTitle,
                        activeTab === 'products'
                          ? styles.modeTabTitleActive
                          : styles.modeTabTitleInactive,
                      ]}
                    >
                      Products
                    </Text>
                    <View
                      style={[
                        styles.modeCountBadge,
                        activeTab === 'products'
                          ? styles.modeCountBadgeActive
                          : styles.modeCountBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modeCountText,
                          activeTab === 'products'
                            ? styles.modeCountTextActive
                            : styles.modeCountTextInactive,
                        ]}
                      >
                        {currentShopProducts.length}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeTabCard,
                    activeTab === 'services' ? styles.modeTabCardActive : styles.modeTabCardInactive,
                  ]}
                  onPress={() => setActiveTab('services')}
                  activeOpacity={0.85}
                >
                  <View style={styles.modeTabInner}>
                    <Text style={styles.modeTabEmoji}>🛠</Text>
                    <Text
                      style={[
                        styles.modeTabTitle,
                        activeTab === 'services'
                          ? styles.modeTabTitleActive
                          : styles.modeTabTitleInactive,
                      ]}
                    >
                      Services
                    </Text>
                    <View
                      style={[
                        styles.modeCountBadge,
                        activeTab === 'services'
                          ? styles.modeCountBadgeActive
                          : styles.modeCountBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.modeCountText,
                          activeTab === 'services'
                            ? styles.modeCountTextActive
                            : styles.modeCountTextInactive,
                        ]}
                      >
                        {servicesList.length}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Shop-Specific Categories Section */}
              <View style={styles.categorySection}>
                <Text style={styles.categoryHeading}>
                  {activeTab === 'products' ? 'Product Categories' : 'Service Categories'}
                </Text>
                <View style={styles.categoryDivider} />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryPillsScroll}
                >
                  {currentCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryPill,
                          isSelected ? styles.categoryPillActive : styles.categoryPillInactive,
                        ]}
                        onPress={() => setSelectedCategory(cat)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.categoryPillText,
                            isSelected
                              ? styles.categoryPillTextActive
                              : styles.categoryPillTextInactive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.addCategoryPill}
                    onPress={() => setAddCategoryModal(true)}
                    activeOpacity={0.75}
                  >
                    <Plus size={13} color={Theme.colors.primary} style={{ marginRight: 2 }} />
                    <Text style={styles.addCategoryPillText}>Add</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* Action CTA: + Add Product / Service */}
              <TouchableOpacity
                style={styles.addCtaBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (activeTab === 'products') {
                    handleOpenAddProduct();
                  } else {
                    setAddProductModal(true);
                  }
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addCtaGradient}
                >
                  <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.addCtaText}>
                    {activeTab === 'products'
                      ? `+ Add Product to ${activeBiz?.name || 'Shop'}`
                      : '+ Add New Service'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Product / Service Catalog Cards */}
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color={Theme.colors.primary} />
                  <Text style={styles.loadingText}>Loading catalog...</Text>
                </View>
              ) : activeTab === 'products' ? (
                filteredProducts.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingBag size={42} color={Theme.colors.secondaryText} />}
                    title={
                      selectedCategory === 'All'
                        ? `No products listed in ${activeBiz?.name || 'this shop'}`
                        : `No products in ${selectedCategory}`
                    }
                    description={`Add products to ${activeBiz?.name || 'this shop'} to reach buyers.`}
                    actionLabel="Add Product"
                    onAction={handleOpenAddProduct}
                  />
                ) : (
                  <View style={styles.listContainer}>
                    {filteredProducts.map((prod) => (
                      <GlassCard key={prod.id} style={styles.itemCard}>
                        <View style={styles.itemRow}>
                          <ProductImage
                            product={prod}
                            title={prod.title}
                            imageUrl={prod.imageUrl}
                            category={prod.category}
                            id={prod.id}
                            style={styles.itemImg}
                          />
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemTitle} numberOfLines={1}>
                              {prod.title}
                            </Text>
                            <Text style={styles.itemCat} numberOfLines={1}>
                              {prod.category}
                            </Text>
                            <View style={styles.itemPriceStockRow}>
                              <Text style={styles.itemPrice}>₹{prod.price}</Text>
                              <Text style={styles.itemStockText}>
                                Stock: {prod.stockQuantity !== undefined ? prod.stockQuantity : 50} {prod.unitName || 'KG'}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.stockPill,
                                prod.inStock ? styles.stockPillIn : styles.stockPillOut,
                              ]}
                            >
                              <View
                                style={[
                                  styles.stockDot,
                                  {
                                    backgroundColor: prod.inStock ? Theme.colors.success : '#EF4444',
                                  },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.stockPillText,
                                  prod.inStock ? styles.stockPillTextIn : styles.stockPillTextOut,
                                ]}
                              >
                                {prod.inStock ? 'In Stock' : 'Out of Stock'}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.itemActionsCol}>
                            <TouchableOpacity
                              style={styles.editActionBtn}
                              onPress={() => handleOpenEditProduct(prod)}
                              activeOpacity={0.75}
                            >
                              <Edit3 size={13} color={Theme.colors.primary} style={{ marginRight: 3 }} />
                              <Text style={styles.editActionBtnText}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.moreActionBtn}
                              onPress={() => handleOpenProductActionSheet(prod)}
                              activeOpacity={0.7}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <MoreVertical size={18} color={Theme.colors.secondaryText} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </GlassCard>
                    ))}
                  </View>
                )
              ) : (
                <EmptyState
                  icon={<Wrench size={42} color={Theme.colors.secondaryText} />}
                  title="No services configured"
                  description="Publish skilled appointments and service offerings."
                  actionLabel="Add Service Offering"
                  onAction={() => setAddProductModal(true)}
                />
              )}
            </View>
          )}
        </ScrollView>

        {/* ======================================================== */}
        {/* MODAL 1: ADD NEW BUSINESS (SPECIALIZED DYNAMIC WIZARD)   */}
        {/* ======================================================== */}
        <Modal
          visible={addShopModal}
          title={creationStep === 'select_type' ? 'CREATE NEW BUSINESS' : getSetupModalTitle(newShopBusinessType)}
          onClose={() => setAddShopModal(false)}
          contentStyle={styles.addShopModalContent}
          footer={
            creationStep === 'select_type' ? (
              <View style={styles.addShopFooterRow}>
                <TouchableOpacity
                  style={styles.addShopCancelBtn}
                  onPress={() => setAddShopModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addShopCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.addShopFooterRow}>
                <TouchableOpacity
                  style={styles.addShopCancelBtn}
                  onPress={() => setCreationStep('select_type')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addShopCancelBtnText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCreateShop}
                  style={styles.addShopSaveBtn}
                  disabled={creatingShop}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.addShopSaveGradient}
                  >
                    {creatingShop ? (
                      <ActivityIndicator size="small" color="#040814" />
                    ) : (
                      <Text style={styles.saveSubmitText}>
                        {getSubmitButtonLabel(newShopBusinessType)}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )
          }
        >
          {creationStep === 'select_type' ? (
            <ScrollView
              style={styles.addShopScrollView}
              contentContainerStyle={styles.addShopScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.stepIntroBox}>
                <Text style={styles.stepIntroTitle}>What type of business are you creating?</Text>
                <Text style={styles.stepIntroSub}>
                  Select your enterprise model to launch tailored operational workflows, catalog options, and services.
                </Text>
              </View>

              <View style={styles.typeCardsList}>
                {BUSINESS_TYPE_CONFIGS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.typeSelectCard}
                    onPress={() => handleSelectTypeToCreate(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.typeSelectCardLeft}>
                      <View style={styles.typeSelectEmojiBox}>
                        <Text style={styles.typeSelectEmoji}>{item.emoji}</Text>
                      </View>
                      <View style={styles.typeSelectTextCol}>
                        <Text style={styles.typeSelectTitle}>{item.name}</Text>
                        <Text style={styles.typeSelectDesc}>{item.description}</Text>
                      </View>
                    </View>
                    <View style={styles.typeSelectChevronBox}>
                      <ArrowRight size={18} color={Theme.colors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <ScrollView
              style={styles.addShopScrollView}
              contentContainerStyle={styles.addShopScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Back to Business Types bar */}
              <View style={styles.setupTopBarRow}>
                <TouchableOpacity
                  style={styles.backToTypesBtn}
                  onPress={() => setCreationStep('select_type')}
                  activeOpacity={0.75}
                >
                  <ChevronLeft size={16} color={Theme.colors.primary} />
                  <Text style={styles.backToTypesText}>Back to Business Types</Text>
                </TouchableOpacity>

                <View style={styles.selectedTypeBadge}>
                  <Text style={styles.selectedTypeBadgeEmoji}>
                    {BUSINESS_TYPE_CONFIGS.find((b) => b.name === newShopBusinessType)?.emoji || '🏪'}
                  </Text>
                  <Text style={styles.selectedTypeBadgeText}>{newShopBusinessType}</Text>
                </View>
              </View>

              {/* 1. BUSINESS LOGO */}
              <Text style={styles.formSectionTitle}>BUSINESS LOGO</Text>
              {newShopLogoUrl ? (
                <View style={styles.newShopLogoPreviewCard}>
                  <Image
                    source={{ uri: resolveImageUrl(newShopLogoUrl) }}
                    style={styles.newShopLogoPreviewImg}
                    resizeMode="cover"
                  />
                  <View style={styles.newShopLogoPreviewActions}>
                    <Text style={styles.newShopLogoStatusText}>Logo selected</Text>
                    <View style={styles.imageActionBtnRow}>
                      <TouchableOpacity
                        style={styles.imageActionChangeBtn}
                        onPress={() => handleOpenImagePicker('newShopLogo')}
                        activeOpacity={0.8}
                      >
                        <RefreshCw size={12} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={styles.imageActionChangeBtnText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.imageActionRemoveBtn}
                        onPress={() => setNewShopLogoUrl('')}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={12} color="#EF4444" style={{ marginRight: 4 }} />
                        <Text style={styles.imageActionRemoveBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.newShopLogoDropzone}
                  onPress={() => handleOpenImagePicker('newShopLogo')}
                  activeOpacity={0.8}
                >
                  <Store size={26} color={Theme.colors.primary} />
                  <Text style={styles.dropzonePromptText}>+ Add Logo</Text>
                  <Text style={styles.dropzoneSubText}>JPG, PNG, WEBP (Max 5MB)</Text>
                </TouchableOpacity>
              )}

              {/* 2. COVER / BANNER */}
              <Text style={styles.formSectionTitle}>COVER / BANNER</Text>
              {newShopCoverUrl ? (
                <View style={styles.newShopBannerPreviewCard}>
                  <Image
                    source={{ uri: resolveImageUrl(newShopCoverUrl) }}
                    style={styles.newShopBannerPreviewImg}
                    resizeMode="cover"
                  />
                  <View style={styles.newShopBannerOverlay}>
                    <View style={styles.imageActionBtnRow}>
                      <TouchableOpacity
                        style={styles.bannerOverlayBtn}
                        onPress={() => handleOpenImagePicker('newShopCover')}
                        activeOpacity={0.8}
                      >
                        <RefreshCw size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.bannerOverlayBtnText}>Change</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.bannerOverlayBtn, styles.bannerOverlayRemoveBtn]}
                        onPress={() => setNewShopCoverUrl('')}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.bannerOverlayBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.newShopBannerDropzone}
                  onPress={() => handleOpenImagePicker('newShopCover')}
                  activeOpacity={0.8}
                >
                  <Camera size={26} color={Theme.colors.primary} />
                  <Text style={styles.dropzonePromptText}>+ Add Banner Image</Text>
                  <Text style={styles.dropzoneSubText}>Wide landscape banner for customer profile & discovery</Text>
                </TouchableOpacity>
              )}

              {/* 3. BUSINESS NAME */}
              <Text style={styles.formLabel}>
                {newShopBusinessType === 'Employer'
                  ? 'Organization Name *'
                  : newShopBusinessType === 'Technician'
                  ? 'Name / Business Name *'
                  : `${newShopBusinessType} Name *`}
              </Text>
              <TextInput
                style={styles.formInput}
                value={newShopName}
                onChangeText={setNewShopName}
                placeholder={`e.g. ${
                  newShopBusinessType === 'Café' || newShopBusinessType === 'Cafe'
                    ? 'Sunrise Café'
                    : newShopBusinessType === 'Restaurant'
                    ? 'Royal Spice Restaurant'
                    : newShopBusinessType === 'Hotel'
                    ? 'Grand Heritage Hotel'
                    : newShopBusinessType === 'Technician'
                    ? 'Apex AC Repair & Tech'
                    : newShopBusinessType === 'Service Provider'
                    ? 'Elite Home Services'
                    : newShopBusinessType.includes('Wholesal')
                    ? 'Supreme Traders Wholesale'
                    : newShopBusinessType === 'Employer'
                    ? 'Infotech Solutions Ltd'
                    : 'Ecosphere Business'
                }`}
                placeholderTextColor={Theme.colors.secondaryText}
              />

              {/* DYNAMIC SPECIALIZED SECTION PER BUSINESS TYPE */}
              {renderSpecializedFormSection()}

              {/* 4. LOCATION & CONTACT INFORMATION */}
              <Text style={styles.formSectionTitle}>LOCATION & CONTACT</Text>
              <Text style={styles.formLabel}>Location / City *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formCatPillsScroll}
              >
                {['Chiplun', 'Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Kolhapur'].map((city) => {
                  const isSelected = newShopCity === city;
                  return (
                    <TouchableOpacity
                      key={city}
                      style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                      onPress={() => setNewShopCity(city)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                        {city}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Address */}
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={styles.formInput}
                value={newShopAddress}
                onChangeText={setNewShopAddress}
                placeholder="Street address, shop / office number, landmark..."
                placeholderTextColor={Theme.colors.secondaryText}
              />

              {/* Contact Number */}
              <Text style={styles.formLabel}>Contact Number</Text>
              <TextInput
                style={styles.formInput}
                value={newBizPhone}
                onChangeText={setNewBizPhone}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                placeholderTextColor={Theme.colors.secondaryText}
              />

              {/* Email */}
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={newBizEmail}
                onChangeText={setNewBizEmail}
                placeholder="contact@business.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Theme.colors.secondaryText}
              />

              {/* Business Hours */}
              <Text style={styles.formLabel}>Business Hours</Text>
              <TextInput
                style={styles.formInput}
                value={newBizHours}
                onChangeText={setNewBizHours}
                placeholder="9:00 AM - 9:00 PM"
                placeholderTextColor={Theme.colors.secondaryText}
              />

              {/* Description */}
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
                multiline
                value={newShopDescription}
                onChangeText={setNewShopDescription}
                placeholder="Business profile, specialities, customer offerings..."
                placeholderTextColor={Theme.colors.secondaryText}
              />
            </ScrollView>
          )}
        </Modal>

        {/* Modal for selecting Business Type */}
        <Modal
          visible={businessTypePickerModal}
          title="Select Business Type"
          onClose={() => setBusinessTypePickerModal(false)}
          contentStyle={styles.pickerModalContent}
        >
          <ScrollView
            style={styles.pickerModalScroll}
            contentContainerStyle={styles.pickerModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {BUSINESS_TYPE_CONFIGS.map((item) => {
              const isSelected = newShopBusinessType === item.name;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.typeOptionCard, isSelected && styles.typeOptionCardSelected]}
                  onPress={() => {
                    setNewShopBusinessType(item.name);
                    setNewShopSubtype(item.subtypes[0] || 'General');
                    setNewShopCustomSubtype('');
                    setBusinessTypePickerModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.typeOptionLeft}>
                    <Text style={styles.typeOptionEmoji}>{item.emoji}</Text>
                    <View style={styles.typeOptionTextCol}>
                      <Text style={[styles.typeOptionTitle, isSelected && styles.typeOptionTitleSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.typeOptionDesc} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Modal>

        {/* Modal for selecting Business Category / Subtype */}
        <Modal
          visible={subtypePickerModal}
          title={`Select ${newShopBusinessType} Category`}
          onClose={() => setSubtypePickerModal(false)}
          contentStyle={styles.pickerModalContent}
        >
          <ScrollView
            style={styles.pickerModalScroll}
            contentContainerStyle={styles.pickerModalScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {(
              BUSINESS_TYPE_CONFIGS.find((b) => b.name === newShopBusinessType)?.subtypes || []
            ).map((sub) => {
              const isSelected = newShopSubtype === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.subtypeOptionRow, isSelected && styles.subtypeOptionRowSelected]}
                  onPress={() => {
                    setNewShopSubtype(sub);
                    setSubtypePickerModal(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subtypeOptionText, isSelected && styles.subtypeOptionTextSelected]}>
                    {sub}
                  </Text>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 2: ADD PRODUCT TO ACTIVE SHOP (Section 3 & 13)     */}
        {/* ======================================================== */}
        {/* MODAL 2: ADD PRODUCT                                     */}
        {/* ======================================================== */}
        <Modal
          visible={addProductModal}
          title={`Add Product to ${activeBiz?.name || 'Shop'}`}
          onClose={() => !savingItem && setAddProductModal(false)}
          footer={
            <View>
              {/* Error displayed above the Save button in the sticky footer */}
              {saveItemError ? (
                <Text style={{
                  color: '#EF4444',
                  fontSize: 12,
                  marginBottom: 8,
                  fontFamily: Theme.typography.fontFamily,
                }}>
                  {saveItemError}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={handleSaveProduct}
                style={styles.saveSubmitBtn}
                disabled={savingItem}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveSubmitGradient}
                >
                  {savingItem ? (
                    <ActivityIndicator size="small" color="#040814" />
                  ) : (
                    <Text style={styles.saveSubmitText}>Save to {activeBiz?.name || 'Shop'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        >
          {/* ── Scrollable form body ──────────────────────────────── */}
          <ScrollView
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* ── Product Image ─────────────────────────────────────── */}
            <Text style={styles.formLabel}>Product Image *</Text>
            <TouchableOpacity
              style={itemImage ? styles.imageUploadBoxWithPreview : styles.imageUploadBox}
              onPress={() => handleOpenImagePicker('newProduct')}
              activeOpacity={0.8}
            >
              {itemImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: itemImage }} style={styles.imagePreviewImg} resizeMode="cover" />
                  <View style={styles.changeImageBadge}>
                    <RefreshCw size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.changeImageBadgeText}>Change Image</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imageUploadBoxEmpty}>
                  <Camera size={28} color={Theme.colors.primary} />
                  <Text style={styles.imageUploadPromptText}>+ Add Product Photo</Text>
                  <Text style={styles.imageUploadSubText}>JPEG · PNG · WEBP</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── Product Name ───────────────────────────────────────── */}
            <Text style={styles.formLabel}>Product Name *</Text>
            <TextInput
              style={styles.formInput}
              value={itemTitle}
              onChangeText={setItemTitle}
              placeholder="e.g. Real Madrid Jersey, Raw Rice 1 KG"
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* ── Product Category (DB-backed) ───────────────────────── */}
            <Text style={styles.formLabel}>Product Category *</Text>
            {dbProductCategories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formCatPillsScroll}
              >
                {dbProductCategories.map((cat) => {
                  const isSelected = itemCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                      onPress={() => {
                        setItemCategoryId(cat.id);
                        setItemCategory(cat.name);
                        if (!isClothingCategory(cat.name)) {
                          setSelectedSizes([]);
                          setSizeStocks({ XS: '', S: '', M: '', L: '', XL: '', XXL: '', XXXL: '' });
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={{ color: Theme.colors.secondaryText, fontSize: 12, marginBottom: 14 }}>
                Loading categories…
              </Text>
            )}

            {/* ── Price ─────────────────────────────────────────────── */}
            <View style={styles.formInlineRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>Base Price (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  placeholder="e.g. 799"
                  placeholderTextColor={Theme.colors.secondaryText}
                />
              </View>

              {!isAddProductClothing() && (
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Stock</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={itemStock}
                    onChangeText={setItemStock}
                    placeholder="e.g. 50"
                    placeholderTextColor={Theme.colors.secondaryText}
                  />
                </View>
              )}
            </View>

            {/* ── Unit selector — shown only for non-clothing ─────────── */}
            {!isAddProductClothing() && (
              <>
                <Text style={styles.formLabel}>Unit / Packaging</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.formCatPillsScroll}
                >
                  {['KG', 'G', 'L', 'ML', 'Pack', 'Piece', 'Unit'].map((u) => {
                    const isSel = itemUnit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        style={[styles.formCatChip, isSel && styles.formCatChipActive]}
                        onPress={() => setItemUnit(u)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.formCatChipText, isSel && styles.formCatChipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* ── Clothing / Apparel Size Variants ──────────────────── */}
            {isAddProductClothing() && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.formLabel}>Available Sizes *</Text>
                <Text style={{ fontSize: 11, color: Theme.colors.secondaryText, marginBottom: 10 }}>
                  Select the sizes you stock. Set quantity for each size below.
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {APPAREL_SIZES.map((sz) => {
                    const isSel = selectedSizes.includes(sz);
                    return (
                      <TouchableOpacity
                        key={sz}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          backgroundColor: isSel ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.05)',
                          borderColor: isSel ? Theme.colors.primary : 'rgba(255,255,255,0.12)',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          if (isSel) {
                            setSelectedSizes((prev) => prev.filter((s) => s !== sz));
                          } else {
                            setSelectedSizes((prev) => [...prev, sz]);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {isSel && (
                          <Check size={12} color={Theme.colors.primary} strokeWidth={3} style={{ marginRight: 4 }} />
                        )}
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: isSel ? '#FFFFFF' : Theme.colors.secondaryText,
                          fontFamily: Theme.typography.fontFamily,
                        }}>
                          {sz}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedSizes.length > 0 && (
                  <View style={{
                    backgroundColor: 'rgba(16, 27, 46, 0.6)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    padding: 12,
                  }}>
                    <Text style={{ fontSize: 12, color: Theme.colors.secondaryText, marginBottom: 10 }}>
                      Stock quantity per size:
                    </Text>
                    {selectedSizes.map((sz) => (
                      <View key={sz} style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}>
                        <View style={{
                          width: 46,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: 'rgba(56,189,248,0.15)',
                          borderWidth: 1,
                          borderColor: Theme.colors.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary, fontFamily: Theme.typography.fontFamily }}>
                            {sz}
                          </Text>
                        </View>
                        <TextInput
                          style={[styles.formInput, { flex: 1, marginBottom: 0, height: 36 }]}
                          keyboardType="numeric"
                          value={sizeStocks[sz]}
                          onChangeText={(val) => setSizeStocks((prev) => ({ ...prev, [sz]: val }))}
                          placeholder="qty"
                          placeholderTextColor={Theme.colors.secondaryText}
                        />
                        <Text style={{ fontSize: 11, color: Theme.colors.secondaryText, marginLeft: 8 }}>
                          units
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Description ───────────────────────────────────────── */}
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
              multiline
              value={itemDescription}
              onChangeText={setItemDescription}
              placeholder="Brand, specifications, pack size, material…"
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* ── Availability toggle ───────────────────────────────── */}
            <View style={styles.stockToggleRow}>
              <Text style={styles.stockToggleLabel}>Available for Sale:</Text>
              <TouchableOpacity
                style={[styles.stockToggleBtn, itemInStock ? styles.stockToggleBtnActive : styles.stockToggleBtnInactive]}
                onPress={() => setItemInStock((v) => !v)}
                activeOpacity={0.8}
              >
                {itemInStock && <Check size={14} color="#040814" strokeWidth={3} style={{ marginRight: 4 }} />}
                <Text style={[styles.stockToggleBtnText, itemInStock ? styles.stockToggleBtnTextActive : styles.stockToggleBtnTextInactive]}>
                  {itemInStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 3: ADD CATEGORY MODAL                              */}
        {/* ======================================================== */}
        <Modal
          visible={addCategoryModal}
          title={`Add Category to ${activeBiz?.name || 'Shop'}`}
          onClose={() => setAddCategoryModal(false)}
        >
          <Text style={styles.formLabel}>New Category Name</Text>
          <TextInput
            style={styles.formInput}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder="e.g. Snacks, Spices, Headphones, Gaming"
            placeholderTextColor={Theme.colors.secondaryText}
            autoFocus
          />

          <TouchableOpacity
            onPress={handleAddCategory}
            style={styles.saveSubmitBtn}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveSubmitGradient}
            >
              <Text style={styles.saveSubmitText}>Add Category</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 4: EDIT PRODUCT                                    */}
        {/* ======================================================== */}
        <Modal
          visible={editProductModal}
          title={editingProduct ? `Edit: ${editingProduct.title}` : 'Edit Product'}
          onClose={() => {
            if (!savingEditProd) {
              setEditProductModal(false);
              setEditingProduct(null);
            }
          }}
          contentStyle={styles.editProductModalContent}
          footer={
            <View style={styles.editProductFooterRow}>
              {saveEditProdError ? (
                <Text style={{ color: '#EF4444', fontSize: 11, marginBottom: 8, fontFamily: Theme.typography.fontFamily }}>
                  {saveEditProdError}
                </Text>
              ) : null}
              <TouchableOpacity
                onPress={handleSaveEditProduct}
                style={styles.saveSubmitBtn}
                disabled={savingEditProd}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveSubmitGradient}
                >
                  {savingEditProd ? (
                    <ActivityIndicator size="small" color="#040814" />
                  ) : (
                    <Text style={styles.saveSubmitText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        >
          <ScrollView
            style={styles.editProductScrollView}
            contentContainerStyle={styles.editProductScrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Product Image ──────────────────────────────────── */}
            <Text style={styles.formLabel}>Product Image</Text>
            <TouchableOpacity
              style={editProdImage ? styles.imageUploadBoxWithPreview : styles.imageUploadBox}
              onPress={() => handleOpenImagePicker('editProduct')}
              activeOpacity={0.8}
            >
              {editProdImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: editProdImage }} style={styles.imagePreviewImg} resizeMode="cover" />
                  <View style={styles.changeImageBadge}>
                    <RefreshCw size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.changeImageBadgeText}>Change Image</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.imageUploadBoxEmpty}>
                  <Camera size={28} color={Theme.colors.primary} />
                  <Text style={styles.imageUploadPromptText}>+ Select Image</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── Product Name ─────────────────────────────────── */}
            <Text style={styles.formLabel}>Product Name *</Text>
            <TextInput
              style={styles.formInput}
              value={editProdTitle}
              onChangeText={setEditProdTitle}
              placeholder="e.g. Premium Raw Rice (1 KG)"
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* ── Product Category (DB-backed) ──────────────────── */}
            <Text style={styles.formLabel}>Product Category</Text>
            {dbProductCategories.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formCatPillsScroll}
              >
                {dbProductCategories.map((cat) => {
                  const isSelected = editProdCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                      onPress={() => {
                        setEditProdCategoryId(cat.id);
                        setEditProdCategory(cat.name);
                        if (!isClothingCategory(cat.name)) {
                          setEditSelectedSizes([]);
                          setEditSizeStocks({ XS: '', S: '', M: '', L: '', XL: '', XXL: '', XXXL: '' });
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* ── Price ────────────────────────────────────────── */}
            <View style={styles.formInlineRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>Price (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={editProdPrice}
                  onChangeText={setEditProdPrice}
                  placeholder="e.g. 60"
                  placeholderTextColor={Theme.colors.secondaryText}
                />
              </View>
              {!isEditProductClothing() && (
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Stock</Text>
                  <TextInput
                    style={styles.formInput}
                    keyboardType="numeric"
                    value={editProdStock}
                    onChangeText={setEditProdStock}
                    placeholder="e.g. 20"
                    placeholderTextColor={Theme.colors.secondaryText}
                  />
                </View>
              )}
            </View>

            {/* ── Unit — only for non-clothing ──────────────────── */}
            {!isEditProductClothing() && (
              <>
                <Text style={styles.formLabel}>Unit / Packaging</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.formCatPillsScroll}
                >
                  {['KG', 'G', 'L', 'ML', 'Pack', 'Piece', 'Unit'].map((u) => {
                    const isSel = editProdUnit === u;
                    return (
                      <TouchableOpacity
                        key={u}
                        style={[styles.formCatChip, isSel && styles.formCatChipActive]}
                        onPress={() => setEditProdUnit(u)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.formCatChipText, isSel && styles.formCatChipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* ── Clothing size variants ─────────────────────────── */}
            {isEditProductClothing() && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.formLabel}>Sizes in Stock</Text>
                <Text style={{ fontSize: 11, color: Theme.colors.secondaryText, marginBottom: 10 }}>
                  Select available sizes and set stock quantities.
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {APPAREL_SIZES.map((sz) => {
                    const isSel = editSelectedSizes.includes(sz);
                    return (
                      <TouchableOpacity
                        key={sz}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          backgroundColor: isSel ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.05)',
                          borderColor: isSel ? Theme.colors.primary : 'rgba(255,255,255,0.12)',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          if (isSel) {
                            setEditSelectedSizes((prev) => prev.filter((s) => s !== sz));
                          } else {
                            setEditSelectedSizes((prev) => [...prev, sz]);
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        {isSel && (
                          <Check size={12} color={Theme.colors.primary} strokeWidth={3} style={{ marginRight: 4 }} />
                        )}
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: isSel ? '#FFFFFF' : Theme.colors.secondaryText,
                          fontFamily: Theme.typography.fontFamily,
                        }}>
                          {sz}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {editSelectedSizes.length > 0 && (
                  <View style={{
                    backgroundColor: 'rgba(16, 27, 46, 0.6)',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    padding: 12,
                  }}>
                    <Text style={{ fontSize: 12, color: Theme.colors.secondaryText, marginBottom: 10 }}>
                      Stock quantity per size:
                    </Text>
                    {editSelectedSizes.map((sz) => (
                      <View key={sz} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <View style={{
                          width: 46,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: 'rgba(56,189,248,0.15)',
                          borderWidth: 1,
                          borderColor: Theme.colors.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.primary, fontFamily: Theme.typography.fontFamily }}>
                            {sz}
                          </Text>
                        </View>
                        <TextInput
                          style={[styles.formInput, { flex: 1, marginBottom: 0, height: 36 }]}
                          keyboardType="numeric"
                          value={editSizeStocks[sz]}
                          onChangeText={(val) => setEditSizeStocks((prev) => ({ ...prev, [sz]: val }))}
                          placeholder="qty"
                          placeholderTextColor={Theme.colors.secondaryText}
                        />
                        <Text style={{ fontSize: 11, color: Theme.colors.secondaryText, marginLeft: 8 }}>units</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Description ───────────────────────────────────── */}
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
              multiline
              value={editProdDescription}
              onChangeText={setEditProdDescription}
              placeholder="Product details, specifications, packaging…"
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* ── Availability toggle ───────────────────────────── */}
            <View style={styles.stockToggleRow}>
              <Text style={styles.stockToggleLabel}>Availability:</Text>
              <TouchableOpacity
                style={[styles.stockToggleBtn, editProdInStock ? styles.stockToggleBtnActive : styles.stockToggleBtnInactive]}
                onPress={() => setEditProdInStock((v) => !v)}
                activeOpacity={0.8}
              >
                {editProdInStock && <Check size={14} color="#040814" strokeWidth={3} style={{ marginRight: 4 }} />}
                <Text style={[styles.stockToggleBtnText, editProdInStock ? styles.stockToggleBtnTextActive : styles.stockToggleBtnTextInactive]}>
                  {editProdInStock ? 'In Stock' : 'Out of Stock'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Delete ───────────────────────────────────────── */}
            {editingProduct && (
              <TouchableOpacity
                style={styles.destructiveBtn}
                onPress={() => {
                  setEditProductModal(false);
                  handleDeleteProductWithConfirm(editingProduct);
                }}
                activeOpacity={0.8}
              >
                <Trash2 size={15} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.destructiveBtnText}>Delete This Product</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 5: MANAGE SHOP (Section 14 & 24)                   */}
        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* MODAL 5: MANAGE SHOP (Section 14 & 24)                   */}
        {/* ======================================================== */}
        <Modal
          visible={manageShopModal}
          title={`Manage ${activeBiz?.name || 'Shop'}`}
          onClose={() => setManageShopModal(false)}
          contentStyle={styles.manageShopModalContent}
          footer={
            <View style={styles.manageShopFooterRow}>
              <TouchableOpacity
                style={styles.manageShopCancelBtn}
                onPress={() => setManageShopModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.manageShopCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveShop}
                style={styles.manageShopSaveBtn}
                disabled={savingShop}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.manageShopSaveGradient}
                >
                  {savingShop ? (
                    <ActivityIndicator size="small" color="#040814" />
                  ) : (
                    <Text style={styles.saveSubmitText}>Save Shop Details</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        >
          <ScrollView
            style={styles.manageShopScrollView}
            contentContainerStyle={styles.manageShopScrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section: Business Information */}
            <Text style={styles.shopSectionHeader}>Business Information</Text>

            <Text style={styles.formLabel}>Shop Name *</Text>
            <TextInput
              style={styles.formInput}
              value={editShopName}
              onChangeText={setEditShopName}
              placeholder="e.g. Fresh Mart Grocery"
              placeholderTextColor={Theme.colors.secondaryText}
            />

            <Text style={styles.formLabel}>Business Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.formCatPillsScroll}
            >
              {[
                'Grocery Shop',
                'Mobile Shop',
                'Electronics Shop',
                'Clothing Shop',
                'Pharmacy',
                'Service Provider',
                'Restaurant',
              ].map((cat) => {
                const isSelected = editShopCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                    onPress={() => setEditShopCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.formLabel}>Shop Description</Text>
            <TextInput
              style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
              multiline
              value={editShopDescription}
              onChangeText={setEditShopDescription}
              placeholder="Tell customers about your shop..."
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* Section: Images (Section 15) */}
            <Text style={styles.shopSectionHeader}>Shop Images</Text>
            <View style={styles.shopImagesRow}>
              {/* Logo Image */}
              <View style={styles.shopImageCol}>
                <Text style={styles.formLabel}>Shop Logo</Text>
                <TouchableOpacity
                  style={styles.shopImageContainer}
                  onPress={() => handleOpenImagePicker('shopLogo')}
                  activeOpacity={0.8}
                >
                  {editShopLogoUrl ? (
                    <Image source={{ uri: editShopLogoUrl }} style={styles.shopImagePreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.shopImagePlaceholder}>
                      <Store size={22} color={Theme.colors.primary} />
                      <Text style={styles.shopImagePlaceholderText}>Add Logo</Text>
                    </View>
                  )}
                  <View style={styles.shopImageOverlayBtn}>
                    <Text style={styles.shopImageOverlayBtnText}>Change</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cover Image */}
              <View style={styles.shopImageCol}>
                <Text style={styles.formLabel}>Cover Photo</Text>
                <TouchableOpacity
                  style={styles.shopImageContainer}
                  onPress={() => handleOpenImagePicker('shopCover')}
                  activeOpacity={0.8}
                >
                  {editShopCoverUrl ? (
                    <Image source={{ uri: editShopCoverUrl }} style={styles.shopImagePreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.shopImagePlaceholder}>
                      <Camera size={22} color={Theme.colors.primary} />
                      <Text style={styles.shopImagePlaceholderText}>Add Cover</Text>
                    </View>
                  )}
                  <View style={styles.shopImageOverlayBtn}>
                    <Text style={styles.shopImageOverlayBtnText}>Change</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section: Location */}
            <Text style={styles.shopSectionHeader}>Location</Text>
            <Text style={styles.formLabel}>City</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.formCatPillsScroll}
            >
              {['Chiplun', 'Pune', 'Mumbai', 'Nashik', 'Nagpur', 'Kolhapur'].map((c) => {
                const isSelected = editShopCity === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                    onPress={() => setEditShopCity(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.formCatChipText, isSelected && styles.formCatChipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.formLabel}>Street Address</Text>
            <TextInput
              style={styles.formInput}
              value={editShopAddress}
              onChangeText={setEditShopAddress}
              placeholder="Shop address, street, landmark..."
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* Section: Hours & Contact */}
            <Text style={styles.shopSectionHeader}>Hours & Contact</Text>
            <Text style={styles.formLabel}>Operating Hours</Text>
            <TextInput
              style={styles.formInput}
              value={editShopHours}
              onChangeText={setEditShopHours}
              placeholder="e.g. 9:00 AM - 9:00 PM"
              placeholderTextColor={Theme.colors.secondaryText}
            />

            <View style={styles.formInlineRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="phone-pad"
                  value={editShopPhone}
                  onChangeText={setEditShopPhone}
                  placeholder="+91..."
                  placeholderTextColor={Theme.colors.secondaryText}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={editShopEmail}
                  onChangeText={setEditShopEmail}
                  placeholder="shop@..."
                  placeholderTextColor={Theme.colors.secondaryText}
                />
              </View>
            </View>

            <Text style={styles.formLabel}>Website</Text>
            <TextInput
              style={styles.formInput}
              autoCapitalize="none"
              value={editShopWebsite}
              onChangeText={setEditShopWebsite}
              placeholder="https://..."
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* Section: Operational Status */}
            <View style={styles.stockToggleRow}>
              <Text style={styles.stockToggleLabel}>Operational Status:</Text>
              <TouchableOpacity
                style={[
                  styles.stockToggleBtn,
                  editShopIsOpen ? styles.stockToggleBtnActive : styles.stockToggleBtnInactive,
                ]}
                onPress={() => setEditShopIsOpen(!editShopIsOpen)}
                activeOpacity={0.8}
              >
                {editShopIsOpen && (
                  <Check size={14} color="#040814" strokeWidth={3} style={{ marginRight: 4 }} />
                )}
                <Text
                  style={[
                    styles.stockToggleBtnText,
                    editShopIsOpen
                      ? styles.stockToggleBtnTextActive
                      : styles.stockToggleBtnTextInactive,
                  ]}
                >
                  {editShopIsOpen ? 'Open for Business' : 'Temporarily Closed'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL 6: PRODUCT ACTION MENU (Section 23)                */}
        {/* ======================================================== */}
        <Modal
          visible={productActionModal}
          title={selectedProductForAction?.title || 'Manage Product'}
          onClose={() => {
            setProductActionModal(false);
            setSelectedProductForAction(null);
          }}
        >
          {selectedProductForAction && (
            <View style={styles.actionSheetContainer}>
              <View style={styles.actionSheetHeader}>
                <ProductImage
                  product={selectedProductForAction}
                  title={selectedProductForAction.title}
                  imageUrl={selectedProductForAction.imageUrl}
                  id={selectedProductForAction.id}
                  style={styles.actionSheetThumb}
                />
                <View style={styles.actionSheetHeaderInfo}>
                  <Text style={styles.actionSheetProdTitle} numberOfLines={1}>
                    {selectedProductForAction.title}
                  </Text>
                  <Text style={styles.actionSheetProdSub}>
                    ₹{selectedProductForAction.price} • Stock: {selectedProductForAction.stockQuantity ?? 50} {selectedProductForAction.unitName || 'KG'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionSheetDivider} />

              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  const prod = selectedProductForAction;
                  setProductActionModal(false);
                  handleOpenEditProduct(prod);
                }}
                activeOpacity={0.8}
              >
                <Edit3 size={18} color={Theme.colors.primary} />
                <Text style={styles.actionSheetItemText}>Edit Product Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  setEditingProduct(selectedProductForAction);
                  setEditProdImage(selectedProductForAction.imageUrl || '');
                  setProductActionModal(false);
                  handleOpenImagePicker('editProduct');
                }}
                activeOpacity={0.8}
              >
                <Camera size={18} color={Theme.colors.primary} />
                <Text style={styles.actionSheetItemText}>Change Product Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionSheetItem}
                onPress={() => {
                  const prod = selectedProductForAction;
                  setProductActionModal(false);
                  handleToggleStockAvailability(prod);
                }}
                activeOpacity={0.8}
              >
                <Check size={18} color={selectedProductForAction.inStock ? '#EF4444' : Theme.colors.success} />
                <Text style={styles.actionSheetItemText}>
                  {selectedProductForAction.inStock ? 'Mark as Out of Stock' : 'Mark as In Stock'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionSheetItem, styles.actionSheetItemDanger]}
                onPress={() => {
                  const prod = selectedProductForAction;
                  setProductActionModal(false);
                  handleDeleteProductWithConfirm(prod);
                }}
                activeOpacity={0.8}
              >
                <Trash2 size={18} color="#EF4444" />
                <Text style={styles.actionSheetItemTextDanger}>Delete Product</Text>
              </TouchableOpacity>
            </View>
          )}
        </Modal>

        {/* Centralized Image Picker Modal (Section 1, 3, 4, 15) */}
        <ImagePickerModal
          visible={imagePickerModal}
          title={
            imagePickerTarget === 'shopLogo' || imagePickerTarget === 'newShopLogo'
              ? 'Select Shop Logo'
              : imagePickerTarget === 'shopCover' || imagePickerTarget === 'newShopCover'
              ? 'Select Cover Image'
              : 'Select Product Image'
          }
          type={
            imagePickerTarget === 'shopLogo' || imagePickerTarget === 'newShopLogo'
              ? 'logo'
              : imagePickerTarget === 'shopCover' || imagePickerTarget === 'newShopCover'
              ? 'cover'
              : 'product'
          }
          initialImageUrl={
            imagePickerTarget === 'newProduct'
              ? itemImage
              : imagePickerTarget === 'editProduct'
              ? editProdImage
              : imagePickerTarget === 'shopLogo'
              ? editShopLogoUrl
              : imagePickerTarget === 'shopCover'
              ? editShopCoverUrl
              : imagePickerTarget === 'newShopLogo'
              ? newShopLogoUrl
              : newShopCoverUrl
          }
          onSelectImage={handleImageSelected}
          onClose={() => setImagePickerModal(false)}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  topHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    letterSpacing: -0.3,
  },
  pageSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 3,
    fontFamily: Theme.typography.fontFamily,
  },

  /* My Businesses Directory */
  directoryList: {
    gap: 14,
    marginBottom: 20,
  },
  bizDirectoryCard: {
    padding: 16,
    borderRadius: 18,
  },
  bizCardHeaderRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  bizCardEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bizCardLogoImg: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  bizCardEmoji: {
    fontSize: 24,
  },
  bizCardInfoCol: {
    flex: 1,
  },
  bizCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bizCardName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    flex: 1,
  },
  activePillBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.success,
  },
  bizCardType: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  bizCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  bizCardMetaText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  bizCardMetaDot: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  manageShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  manageShopBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  manageShopBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  manageShopBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  manageShopBtnTextActive: {
    color: '#040814',
    fontWeight: '800',
  },
  addShopCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  addShopCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },

  /* Active Shop Management Header */
  backToDirectoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backToDirectoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  activeShopHeroCard: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  activeShopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  activeShopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  activeShopEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeShopLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  activeShopEmoji: {
    fontSize: 22,
  },
  activeShopTextCol: {
    flex: 1,
  },
  activeShopTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  activeShopSub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  activeShopActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  manageShopHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  manageShopHeaderBtnText: {
    color: '#040814',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  shopDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },

  /* Top Switcher Cards */
  topTabsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modeTabCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  modeTabCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: Theme.colors.primary,
  },
  modeTabCardInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modeTabEmoji: {
    fontSize: 18,
  },
  modeTabTitle: {
    fontSize: 15,
    fontFamily: Theme.typography.fontFamily,
  },
  modeTabTitleActive: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modeTabTitleInactive: {
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  modeCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  modeCountBadgeActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  modeCountBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeCountText: {
    fontSize: 13,
    fontFamily: Theme.typography.fontFamily,
  },
  modeCountTextActive: {
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  modeCountTextInactive: {
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },

  /* Categories Section */
  categorySection: {
    marginBottom: 16,
  },
  categoryHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  categoryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  categoryPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: Theme.colors.primary,
  },
  categoryPillInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  categoryPillText: {
    fontSize: 13,
    fontFamily: Theme.typography.fontFamily,
  },
  categoryPillTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryPillTextInactive: {
    fontWeight: '500',
    color: Theme.colors.secondaryText,
  },
  addCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  addCategoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },

  /* Action CTA */
  addCtaBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  addCtaGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addCtaText: {
    color: '#07111F',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Loading */
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },

  /* List & Cards */
  listContainer: {
    gap: 12,
  },
  itemCard: {
    padding: 14,
    borderRadius: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemImg: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  itemCat: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 3,
    fontFamily: Theme.typography.fontFamily,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.success,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  itemPriceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  itemStockText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: '600',
  },
  itemActionsCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  editActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  moreActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockPillIn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  stockPillOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  stockPillTextIn: {
    color: Theme.colors.success,
  },
  stockPillTextOut: {
    color: '#EF4444',
  },
  deleteActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },

  /* Form Elements in Modal */
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 14,
  },
  formCatPillsScroll: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  formCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  formCatChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: Theme.colors.primary,
  },
  formCatChipText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  formCatChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stockToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stockToggleLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    fontWeight: '600',
  },
  stockToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  stockToggleBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  stockToggleBtnInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stockToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  stockToggleBtnTextActive: {
    color: '#040814',
  },
  stockToggleBtnTextInactive: {
    color: Theme.colors.secondaryText,
  },
  saveSubmitBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  saveSubmitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveSubmitText: {
    color: '#07111F',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Product Image Upload Box & Preview */
  imageUploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    marginBottom: 14,
  },
  imageUploadBoxEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageUploadPromptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  imageUploadSubText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  imageUploadBoxWithPreview: {
    height: 130,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0B1320',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 14,
    position: 'relative',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreviewImg: {
    width: '100%',
    height: '100%',
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(4, 8, 20, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  changeImageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Inline Forms */
  formInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  destructiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginTop: 8,
    marginBottom: 8,
  },
  destructiveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Manage Shop Sections */
  shopSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginTop: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  shopImagesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  shopImageCol: {
    flex: 1,
  },
  shopImageContainer: {
    height: 85,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F1A2C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  shopImagePreview: {
    width: '100%',
    height: '100%',
  },
  shopImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  shopImagePlaceholderText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontWeight: '500',
    fontFamily: Theme.typography.fontFamily,
  },
  shopImageOverlayBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(4, 8, 20, 0.8)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shopImageOverlayBtnText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Action Sheet Modal */
  actionSheetContainer: {
    paddingVertical: 4,
  },
  actionSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actionSheetThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  actionSheetHeaderInfo: {
    flex: 1,
  },
  actionSheetProdTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  actionSheetProdSub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  actionSheetDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  actionSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 8,
  },
  actionSheetItemDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  actionSheetItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  actionSheetItemTextDanger: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Manage Shop Scroll & Sticky Footer Layout (Section 2, 4, 5, 6) */
  manageShopModalContent: {
    flex: 1,
    minHeight: 0,
    paddingTop: 4,
  },
  manageShopScrollView: {
    flex: 1,
  },
  manageShopScrollContent: {
    paddingBottom: 24,
  },
  manageShopFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'web' ? 4 : 0,
  },
  manageShopCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageShopCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  manageShopSaveBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  manageShopSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Edit Product Scroll & Sticky Footer Layout (Issue 1) */
  editProductModalContent: {
    flex: 1,
    minHeight: 0,
    paddingTop: 4,
  },
  editProductScrollView: {
    flex: 1,
  },
  editProductScrollContent: {
    paddingBottom: 24,
  },
  /* Edit Product Footer Row */
  editProductFooterRow: {
    paddingTop: 4,
    paddingBottom: Platform.OS === 'web' ? 4 : 0,
  },

  /* Enhanced Add New Shop Modal Styles */
  addShopModalContent: {
    flex: 1,
    minHeight: 0,
    paddingTop: 4,
  },
  addShopScrollView: {
    flex: 1,
  },
  addShopScrollContent: {
    paddingBottom: 24,
  },
  addShopFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'web' ? 4 : 0,
  },
  addShopCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addShopCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  addShopSaveBtn: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  addShopSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontFamily: Theme.typography.fontFamily,
  },

  /* Logo Picker Dropzone & Preview */
  newShopLogoDropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    marginBottom: 14,
  },
  newShopLogoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  newShopLogoPreviewImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#0B1320',
  },
  newShopLogoPreviewActions: {
    flex: 1,
    justifyContent: 'center',
  },
  newShopLogoStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.success,
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  imageActionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageActionChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  imageActionChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: Theme.typography.fontFamily,
  },
  imageActionRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  imageActionRemoveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Banner Picker Dropzone & Preview */
  newShopBannerDropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
    marginBottom: 14,
  },
  newShopBannerPreviewCard: {
    height: 125,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0B1320',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 14,
    position: 'relative',
  },
  newShopBannerPreviewImg: {
    width: '100%',
    height: '100%',
  },
  newShopBannerOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  bannerOverlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 8, 20, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bannerOverlayRemoveBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  bannerOverlayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  dropzonePromptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  dropzoneSubText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 3,
    fontFamily: Theme.typography.fontFamily,
  },

  /* Dropdown Selector Triggers */
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1320',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownTriggerEmoji: {
    fontSize: 18,
  },
  dropdownTriggerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  dropdownTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownTriggerHint: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },

  /* Selection Sheet / Modal */
  pickerModalContent: {
    maxHeight: Platform.OS === 'web' ? ('75vh' as any) : 480,
    minHeight: 0,
  },
  pickerModalScroll: {
    flex: 1,
  },
  pickerModalScrollContent: {
    paddingVertical: 6,
  },
  typeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 8,
  },
  typeOptionCardSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  typeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  typeOptionEmoji: {
    fontSize: 22,
  },
  typeOptionTextCol: {
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  typeOptionTitleSelected: {
    color: Theme.colors.primary,
  },
  typeOptionDesc: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  subtypeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 8,
  },
  subtypeOptionRowSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  subtypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  subtypeOptionTextSelected: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: Theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
  },
  bizCardCoverImg: {
    width: '100%',
    height: 80,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 10,
  },
  activeShopCoverImg: {
    width: '100%',
    height: 100,
    borderRadius: 14,
    marginBottom: 12,
  },

  /* Multi-Type Business Creation Wizard Styles */
  stepIntroBox: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  stepIntroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 6,
  },
  stepIntroSub: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
    lineHeight: 18,
  },
  typeCardsList: {
    gap: 10,
    paddingBottom: 16,
  },
  typeSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 14,
  },
  typeSelectCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  typeSelectEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectEmoji: {
    fontSize: 22,
  },
  typeSelectTextCol: {
    flex: 1,
  },
  typeSelectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 2,
  },
  typeSelectDesc: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  typeSelectChevronBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  setupTopBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backToTypesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backToTypesText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  selectedTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  selectedTypeBadgeEmoji: {
    fontSize: 14,
  },
  selectedTypeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: Theme.typography.fontFamily,
  },

  /* Specialized Input Controls */
  specSectionWrapper: {
    marginVertical: 4,
  },
  multiPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  multiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  multiPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  multiPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  multiPillTextActive: {
    color: '#040814',
    fontWeight: '800',
  },
  checkboxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  checkboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  checkboxPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  checkboxPillTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  pricePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pricePillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  pricePillTextActive: {
    color: '#040814',
    fontWeight: '900',
  },
  starPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  starPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  starPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  starPillTextActive: {
    color: '#040814',
    fontWeight: '800',
  },
  rowTwoCols: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  toggleCardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  toggleCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  toggleCardStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Theme.typography.fontFamily,
  },
  toggleCardStatusActive: {
    color: '#10B981',
    fontWeight: '700',
  },

  /* Active Business Hero & Hub */
  activeTypePillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  activeTypePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  typeSpecificHubCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hubHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hubHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  hubBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  hubBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: Theme.typography.fontFamily,
  },
  hubSubText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Theme.typography.fontFamily,
  },
  hubModulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hubModuleItem: {
    flex: 1,
    minWidth: 90,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  hubModuleIconBox: {
    marginBottom: 6,
  },
  hubModuleTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  hubModuleSub: {
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily,
  },
});
