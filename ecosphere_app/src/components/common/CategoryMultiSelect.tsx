import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  Search,
  Check,
  X,
  Plus,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface CategoryItem {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
  count?: number;
}

export interface CategoryMultiSelectProps {
  title: string;
  subtitle?: string;
  categories: CategoryItem[];
  selectedCategoryIds: Array<string | number>;
  onToggleCategory: (id: string | number) => void;
  onClearAll?: () => void;
  minSelection?: number;
  onContinue: () => void;
  onBack?: () => void;
  continueLabel?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  errorMessage?: string;
  accentColor?: string;
}

export const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({
  title,
  subtitle,
  categories,
  selectedCategoryIds,
  onToggleCategory,
  onClearAll,
  minSelection = 1,
  onContinue,
  onBack,
  continueLabel = 'Continue',
  searchPlaceholder = 'Search categories...',
  isLoading = false,
  errorMessage,
  accentColor = '#25E68A',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const selectedCount = selectedCategoryIds.length;
  const canContinue = selectedCount >= minSelection;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#17231B" />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>
      </View>

      {/* Error Message */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Search & Actions Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Clear All button */}
        {selectedCount > 0 && onClearAll && (
          <TouchableOpacity onPress={onClearAll} style={styles.clearBtn} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Clear ({selectedCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Status & Add Custom Category Extension */}
      <View style={styles.statusRow}>
        <View style={styles.countBadge}>
          <Sparkles size={13} color={accentColor} style={{ marginRight: 5 }} />
          <Text style={[styles.countBadgeText, { color: accentColor }]}>
            {selectedCount} selected {minSelection > 1 ? `(min ${minSelection})` : ''}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddCustomModal(true)}
          style={styles.addCategoryBtn}
          activeOpacity={0.8}
        >
          <Plus size={14} color="#2FD6FF" style={{ marginRight: 4 }} />
          <Text style={styles.addCategoryBtnText}>+ ADD CATEGORY</Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips / Cards Grid */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : filteredCategories.length === 0 ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={32} color="#64748B" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No matching categories</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search term or add a category request.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.chipsContainer}
          showsVerticalScrollIndicator={false}
        >
          {filteredCategories.map((category) => {
            const isSelected = selectedCategoryIds.includes(category.id);
            return (
              <TouchableOpacity
                key={String(category.id)}
                activeOpacity={0.75}
                onPress={() => onToggleCategory(category.id)}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    borderColor: accentColor,
                    backgroundColor: `${accentColor}15`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.chipCheck,
                    isSelected && {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                    },
                  ]}
                >
                  {isSelected && <Check size={12} color="#07111F" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.chipLabel,
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {category.name}
                </Text>
                {category.count !== undefined && (
                  <Text style={styles.chipCount}>{category.count}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={onContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
          style={[styles.continueButton, !canContinue && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={canContinue ? ['#25E68A', '#2FD6FF'] : ['#334155', '#475569']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGradient}
          >
            <Text style={styles.continueText}>{continueLabel}</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modal: Custom Category Extension Point Notice */}
      <Modal
        visible={showAddCustomModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Info size={22} color="#2FD6FF" />
              </View>
              <Text style={styles.modalTitle}>Category Governance</Text>
            </View>

            <Text style={styles.modalBody}>
              Custom seller-defined categories require backend/category support.
            </Text>
            <Text style={styles.modalExplanation}>
              To maintain high discovery precision across ECOSPHERE, catalog listings are matched
              to canonical, verified taxonomies. Custom merchant category submissions are reviewed
              by platform governance.
            </Text>

            <View style={styles.modalInputWrap}>
              <TextInput
                style={styles.modalInput}
                placeholder="Suggest a new category name..."
                placeholderTextColor="#64748B"
                value={customInput}
                onChangeText={setCustomInput}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setCustomInput('');
                  setShowAddCustomModal(false);
                }}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>Understood</Text>
              </TouchableOpacity>
            </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#17231B',
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 13,
    color: '#68756B',
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#17231B',
    fontSize: 14,
  },
  clearBtn: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F9F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  addCategoryBtnText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  chipCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chipLabel: {
    color: '#17231B',
    fontSize: 13,
    fontWeight: '500',
  },
  chipCount: {
    color: '#68756B',
    fontSize: 11,
    marginLeft: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 200,
  },
  loadingText: {
    color: '#68756B',
    fontSize: 14,
    marginTop: 12,
  },
  emptyTitle: {
    color: '#17231B',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#68756B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#16A34A',
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0C1B2E',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    color: '#2FD6FF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  modalExplanation: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  modalInputWrap: {
    backgroundColor: '#07111F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalInput: {
    color: '#F8FAFC',
    fontSize: 13,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#2FD6FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCloseText: {
    color: '#2FD6FF',
    fontSize: 14,
    fontWeight: '600',
  },
});
