import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Sparkles,
  Search,
  Minus,
  Save,
  ShoppingBag,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  GroceryShoppingList,
  GroceryListItem,
  GroceryProduct,
} from '../../services/groceryService';

interface SmartGroceryListScreenProps {
  listId?: string;
  list?: GroceryShoppingList;
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGroceryListScreen: React.FC<SmartGroceryListScreenProps> = ({
  listId,
  list: initialList,
  onBack,
  onNavigate,
}) => {
  const [listName, setListName] = useState<string>(initialList?.name || 'My Shopping List');
  const [items, setItems] = useState<GroceryListItem[]>(initialList?.items || []);
  const [catalog, setCatalog] = useState<GroceryProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [cat, fetchedList] = await Promise.all([
          groceryService.getCatalog(),
          listId && !initialList ? groceryService.getShoppingListById(listId) : null,
        ]);
        setCatalog(cat || []);
        if (fetchedList) {
          setListName(fetchedList.name);
          setItems(
            (fetchedList.items || []).map((it) => ({
              ...it,
              unitPrice:
                it.unitPrice !== undefined
                  ? it.unitPrice
                  : it.quantity > 0
                  ? Math.round((it.estimatedPrice / it.quantity) * 100) / 100
                  : 40,
            }))
          );
        } else if (!initialList && items.length === 0 && cat && cat.length > 0) {
          // Starter items for fresh list (matched with ECOSPHERE DB prices)
          const starterNames = [
            'Audit Lifecycle Organic Apple',
            'Milk',
            'Bread',
            'Eggs',
            'Tomato',
          ];
          const fallbackPrices: Record<string, { price: number; unit: string; category: string }> = {
            'Audit Lifecycle Organic Apple': { price: 180, unit: 'Unit', category: 'Food & Grocery' },
            Milk: { price: 50, unit: '1 Litre', category: 'Dairy' },
            Bread: { price: 30, unit: '400g Loaf', category: 'Bakery' },
            Eggs: { price: 58, unit: '1 Dozen', category: 'Poultry' },
            Tomato: { price: 25, unit: '1 kg', category: 'Produce' },
          };

          const starterItems: GroceryListItem[] = starterNames.map((name, idx) => {
            const meta = cat.find((c) => c.item_name.toLowerCase() === name.toLowerCase());
            const fb = fallbackPrices[name] || { price: 40, unit: 'item', category: 'General' };
            const unitPrice = meta?.typical_price || fb.price;

            return {
              id: `itm_${Date.now()}_${idx}`,
              name: meta?.item_name || name,
              category: meta?.category || fb.category,
              quantity: 1,
              unit: meta?.unit || fb.unit,
              unitPrice,
              estimatedPrice: unitPrice,
              cheapestStore: 'D-Mart',
              isPurchased: false,
            };
          });
          setItems(starterItems);
        }
      } catch (err) {
        if (__DEV__) console.warn('[SmartGroceryListScreen] Load error:', err);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [listId]);

  const handleAddItemFromCatalog = (product: GroceryProduct) => {
    // Duplicate prevention: if already in list, increase quantity
    const existingIndex = items.findIndex(
      (it) => it.name.toLowerCase() === product.item_name.toLowerCase()
    );

    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx === existingIndex) {
            const uPrice = it.unitPrice !== undefined ? it.unitPrice : product.typical_price;
            const newQty = it.quantity + 1;
            return {
              ...it,
              unitPrice: uPrice,
              quantity: newQty,
              estimatedPrice: Math.round(uPrice * newQty * 100) / 100,
            };
          }
          return it;
        })
      );
    } else {
      const newItem: GroceryListItem = {
        id: `itm_${Date.now()}_${items.length}`,
        name: product.item_name,
        category: product.category,
        quantity: 1,
        unit: product.unit,
        unitPrice: product.typical_price,
        estimatedPrice: product.typical_price,
        cheapestStore: 'D-Mart',
        isPurchased: false,
      };
      setItems((prev) => [newItem, ...prev]);
    }
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => {
          if (it.id === itemId) {
            const uPrice =
              it.unitPrice !== undefined
                ? it.unitPrice
                : it.quantity > 0
                ? Math.round((it.estimatedPrice / it.quantity) * 100) / 100
                : 40;
            const newQty = it.quantity + delta;
            // Quantity 0 removes product from list
            if (newQty <= 0) return null;
            return {
              ...it,
              unitPrice: uPrice,
              quantity: newQty,
              estimatedPrice: Math.round(uPrice * newQty * 100) / 100,
            };
          }
          return it;
        })
        .filter(Boolean) as GroceryListItem[]
    );
  };

  const handleTogglePurchased = (itemId: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, isPurchased: !it.isPurchased } : it))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  const handleSaveList = async () => {
    if (!listName.trim()) {
      Alert.alert('Validation Error', 'Please enter a name for your shopping list.');
      return;
    }
    try {
      setSaving(true);
      if (listId || initialList?.id) {
        const id = listId || initialList!.id;
        await groceryService.updateShoppingList(id, {
          name: listName.trim(),
          items,
        });
        Alert.alert('Saved', 'Shopping list updated successfully!');
      } else {
        await groceryService.createShoppingList(listName.trim(), items);
        Alert.alert('Created', 'New shopping list created and saved!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save shopping list.');
    } finally {
      setSaving(false);
    }
  };

  const handleOptimize = () => {
    if (items.length === 0) {
      Alert.alert('Empty List', 'Please add items to your shopping list to optimize cost.');
      return;
    }

    const uncheckedItems = items.filter((it) => !it.isPurchased);
    const targetItems = uncheckedItems.length > 0 ? uncheckedItems : items;

    onNavigate('SmartGroceryOptimizer', {
      items: targetItems.map((i) => `${i.name}: ${i.quantity}`),
      returnScreen: 'SmartGroceryList',
    });
  };

  // ==========================================================================
  // EXACT CALCULATION RULES
  // ==========================================================================
  // A. Full Shopping List Total: sum(unitPrice * quantity) for all items
  const fullTotal = Math.round(
    items.reduce((sum, it) => {
      const uPrice =
        it.unitPrice !== undefined
          ? it.unitPrice
          : it.quantity > 0
          ? it.estimatedPrice / it.quantity
          : 0;
      return sum + uPrice * it.quantity;
    }, 0) * 100
  ) / 100;

  // B. Remaining Purchase Total: sum(unitPrice * quantity) for unchecked items
  const remainingTotal = Math.round(
    items.reduce((sum, it) => {
      if (it.isPurchased) return sum;
      const uPrice =
        it.unitPrice !== undefined
          ? it.unitPrice
          : it.quantity > 0
          ? it.estimatedPrice / it.quantity
          : 0;
      return sum + uPrice * it.quantity;
    }, 0) * 100
  ) / 100;

  const purchasedTotal = Math.round((fullTotal - remainingTotal) * 100) / 100;
  const purchasedCount = items.filter((it) => it.isPurchased).length;
  const remainingCount = items.length - purchasedCount;

  const categories = [
    'All',
    'Dairy',
    'Produce',
    'Bakery',
    'Pantry',
    'Beverages',
    'Breakfast',
    'Snacks',
    'Household',
  ];

  const filteredCatalog = catalog.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderItemRow = ({ item }: { item: GroceryListItem }) => (
    <View style={[styles.itemCard, item.isPurchased && styles.itemCardPurchased]}>
      <TouchableOpacity
        style={styles.checkboxTouch}
        onPress={() => handleTogglePurchased(item.id)}
        activeOpacity={0.7}
        accessibilityLabel={item.isPurchased ? 'Mark as unpurchased' : 'Mark as purchased'}
      >
        {item.isPurchased ? (
          <CheckCircle2 size={22} color={Theme.colors.emerald} />
        ) : (
          <Circle size={22} color="#CBD5E1" />
        )}
      </TouchableOpacity>

      <View style={styles.itemMetaCol}>
        <Text
          style={[styles.itemName, item.isPurchased && styles.itemNamePurchased]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={styles.itemCategory}>
          {item.category} • {item.unit}
        </Text>
      </View>

      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => handleQuantityChange(item.id, -1)}
          activeOpacity={0.7}
          accessibilityLabel="Decrease quantity"
        >
          <Minus size={14} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.stepperQty}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => handleQuantityChange(item.id, 1)}
          activeOpacity={0.7}
          accessibilityLabel="Increase quantity"
        >
          <Plus size={14} color={Theme.colors.primaryText} />
        </TouchableOpacity>
      </View>

      <View style={styles.itemPriceCol}>
        <Text style={styles.itemPrice}>
          ₹{item.estimatedPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </Text>
        {item.quantity > 1 && (
          <Text style={styles.itemUnitPrice}>
            ₹{(item.unitPrice || (item.estimatedPrice / item.quantity)).toLocaleString()} ea
          </Text>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleRemoveItem(item.id)}
          activeOpacity={0.7}
          accessibilityLabel="Delete item"
        >
          <Trash2 size={15} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <TextInput
            style={styles.listNameInput}
            value={listName}
            onChangeText={setListName}
            placeholder="Shopping List Name"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.headerMeta}>
            {items.length} items • {purchasedCount} purchased • {remainingCount} remaining
          </Text>
        </View>

        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSaveList}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Theme.colors.emerald} />
          ) : (
            <Save size={20} color={Theme.colors.emerald} />
          )}
        </TouchableOpacity>
      </View>

      {/* Item List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.emerald} />
          <Text style={styles.loadingText}>Loading shopping items...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItemRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.addBar}>
              <TouchableOpacity
                style={styles.addBarBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addBarBtnText}>Add Grocery Product</Text>
              </TouchableOpacity>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ShoppingBag size={42} color={Theme.colors.emerald} />
              <Text style={styles.emptyTitle}>Your shopping list is empty</Text>
              <Text style={styles.emptySub}>
                Tap the button above to add milk, eggs, fresh vegetables, or pantry staples.
              </Text>
            </View>
          }
        />
      )}

      {/* Sticky Bottom Cost & Optimization Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalBlock}>
          <View style={styles.totalSecondaryRow}>
            <Text style={styles.totalSecondaryLabel}>Total Shopping List Value:</Text>
            <Text style={styles.totalSecondaryValue}>
              ₹{fullTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.totalPrimaryRow}>
            <Text style={styles.totalPrimaryLabel}>Remaining Purchase Cost:</Text>
            <Text style={styles.totalPrimaryValue}>
              ₹{remainingTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
          </View>
          {purchasedCount > 0 && (
            <Text style={styles.purchasedMeta}>
              {purchasedCount} of {items.length} items purchased (₹{purchasedTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })})
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.optimizeBtn, items.length === 0 && styles.optimizeBtnDisabled]}
          onPress={handleOptimize}
          disabled={items.length === 0}
          activeOpacity={0.85}
          accessibilityLabel="Optimize Cost"
        >
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={styles.optimizeBtnText}>Optimize Cost</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Catalog Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product to List</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBox}>
              <Search size={18} color={Theme.colors.secondaryText} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search products (e.g. Milk, Rice, Oats)..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modalCategoryScroll}
            >
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoryChip, selectedCategory === c && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(c)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === c && styles.categoryChipTextActive,
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Catalog List */}
            <FlatList
              data={filteredCatalog}
              keyExtractor={(p) => p.item_id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.catalogItemRow}
                  onPress={() => handleAddItemFromCatalog(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.catalogItemMeta}>
                    <Text style={styles.catalogItemName}>{item.item_name}</Text>
                    <Text style={styles.catalogItemBrand}>
                      {item.brand} • {item.unit}
                    </Text>
                  </View>
                  <View style={styles.catalogItemPriceCol}>
                    <Text style={styles.catalogItemPrice}>
                      ₹{item.typical_price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.catalogAddBtn}>
                      <Plus size={14} color="#16A34A" />
                      <Text style={styles.catalogAddBtnText}>Add</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleCol: {
    flex: 1,
  },
  listNameInput: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
    padding: 0,
  },
  headerMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  saveHeaderBtn: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  addBar: {
    marginBottom: 14,
  },
  addBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.forestGreen,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  addBarBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  itemCardPurchased: {
    backgroundColor: '#F9FBF9',
    borderColor: '#EDF2EC',
    opacity: 0.75,
  },
  checkboxTouch: {
    paddingRight: 10,
  },
  itemMetaCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
    color: Theme.colors.secondaryText,
  },
  itemCategory: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    borderRadius: 10,
    padding: 2,
    marginRight: 10,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQty: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 8,
    color: Theme.colors.primaryText,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  itemUnitPrice: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    marginTop: 1,
  },
  deleteBtn: {
    marginTop: 4,
    padding: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  totalBlock: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  totalSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  totalSecondaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  totalSecondaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  totalPrimaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  totalPrimaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  totalPrimaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  purchasedMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.emerald,
    marginTop: 2,
  },
  optimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.forestGreen,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  optimizeBtnDisabled: {
    opacity: 0.5,
  },
  optimizeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.primaryText,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.emerald,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Theme.colors.primaryText,
  },
  modalCategoryScroll: {
    maxHeight: 38,
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Theme.colors.forestGreen,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  catalogItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F0',
  },
  catalogItemMeta: {
    flex: 1,
  },
  catalogItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  catalogItemBrand: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  catalogItemPriceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catalogItemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  catalogAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  catalogAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
});
