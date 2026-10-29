import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal as RNModal,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Check, RotateCcw, Filter, MapPin, DollarSign, Briefcase, Star, ShieldCheck } from 'lucide-react-native';
import { Theme } from '../../theme';
import { GlassCard } from '../cards/GlassCard';

export type DiscoveryEntityType = 'all' | 'business' | 'service' | 'product' | 'job' | 'opportunity';

export interface DiscoveryFilterState {
  city?: string;
  category?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  priceBucket?: 'under_500' | '500_1500' | 'above_1500';
  isAvailable?: boolean;
  jobType?: string;
  workMode?: string;
  opportunityType?: string;
}

interface DiscoveryFilterModalProps {
  visible: boolean;
  onClose: () => void;
  entityType: DiscoveryEntityType;
  activeFilters: DiscoveryFilterState;
  onApply: (filters: DiscoveryFilterState) => void;
  availableCategories?: string[];
}

const CITIES = [
  'All Cities',
  'Chiplun',
  'Pune',
  'Mumbai',
  'Nashik',
  'Nagpur',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Delhi',
  'Gurugram',
  'Noida',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
];

const WORK_TYPES = [
  'All Types',
  'Full-time',
  'Part-time',
  'Contract',
  'Temporary',
  'Internship',
  'Apprenticeship',
  'Freelance',
  'Gig Work',
  'Small Tasks',
  'On-Demand Work',
];

const WORK_MODES = ['All Modes', 'On-site', 'Remote', 'Hybrid'];

const PRICE_BUCKETS = [
  { id: 'under_500', label: 'Under ₹500' },
  { id: '500_1500', label: '₹500 – ₹1,500' },
  { id: 'above_1500', label: '₹1,500+' },
];

const RATINGS = [
  { value: 0, label: 'Any Rating' },
  { value: 4.0, label: '4.0+ Stars' },
  { value: 4.5, label: '4.5+ Stars' },
];

const OPP_TYPES = ['All Opportunities', 'JOB', 'SERVICE', 'BUSINESS', 'DEMAND', 'SKILL'];

export const DiscoveryFilterModal: React.FC<DiscoveryFilterModalProps> = ({
  visible,
  onClose,
  entityType,
  activeFilters,
  onApply,
  availableCategories = [],
}) => {
  const [draft, setDraft] = useState<DiscoveryFilterState>({ ...activeFilters });

  useEffect(() => {
    setDraft({ ...activeFilters });
  }, [activeFilters, visible]);

  const countActiveFilters = (): number => {
    let count = 0;
    if (draft.city && draft.city !== 'All Cities') count++;
    if (draft.category && draft.category !== 'All') count++;
    if (draft.minRating && draft.minRating > 0) count++;
    if (draft.verifiedOnly) count++;
    if (draft.priceBucket) count++;
    if (draft.isAvailable) count++;
    if (draft.jobType && draft.jobType !== 'All Types') count++;
    if (draft.workMode && draft.workMode !== 'All Modes') count++;
    if (draft.opportunityType && draft.opportunityType !== 'All Opportunities') count++;
    return count;
  };

  const handleReset = () => {
    setDraft({});
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const showBusinessFilters = entityType === 'all' || entityType === 'business';
  const showServiceFilters = entityType === 'all' || entityType === 'service';
  const showProductFilters = entityType === 'all' || entityType === 'product';
  const showJobFilters = entityType === 'all' || entityType === 'job';
  const showOpportunityFilters = entityType === 'all' || entityType === 'opportunity';

  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.filterIconBox}>
              <Filter size={16} color={Theme.colors.primary} />
            </View>
            <Text style={styles.title}>Filter Discovery</Text>
            {countActiveFilters() > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{countActiveFilters()}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleReset}
              style={styles.resetBtn}
              activeOpacity={0.7}
              accessibilityLabel="Clear all filters"
            >
              <RotateCcw size={13} color={Theme.colors.secondaryText} />
              <Text style={styles.resetBtnText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Close filter panel"
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section: City / Location */}
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <MapPin size={14} color={Theme.colors.primary} />
              <Text style={styles.sectionTitle}>City / Region</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {CITIES.map((c) => {
                const isSelected = (!draft.city && c === 'All Cities') || draft.city === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setDraft((prev) => ({ ...prev, city: c === 'All Cities' ? undefined : c }))}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Section: Categories */}
          {availableCategories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !draft.category && styles.chipActive]}
                  onPress={() => setDraft((prev) => ({ ...prev, category: undefined }))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, !draft.category && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {availableCategories.map((cat) => {
                  const isSelected = draft.category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setDraft((prev) => ({ ...prev, category: isSelected ? undefined : cat }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Section: Ratings (for Business & Services) */}
          {(showBusinessFilters || showServiceFilters) && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <Star size={14} color={Theme.colors.orange} />
                <Text style={styles.sectionTitle}>Minimum Rating</Text>
              </View>
              <View style={styles.chipWrap}>
                {RATINGS.map((r) => {
                  const isSelected = (!draft.minRating && r.value === 0) || draft.minRating === r.value;
                  return (
                    <TouchableOpacity
                      key={r.label}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setDraft((prev) => ({ ...prev, minRating: r.value === 0 ? undefined : r.value }))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{r.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section: Verification (Business) */}
          {showBusinessFilters && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.toggleRow, draft.verifiedOnly && styles.toggleRowActive]}
                onPress={() => setDraft((prev) => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                activeOpacity={0.8}
              >
                <View style={styles.toggleLeft}>
                  <ShieldCheck size={16} color={draft.verifiedOnly ? Theme.colors.success : Theme.colors.secondaryText} />
                  <View>
                    <Text style={styles.toggleTitle}>Verified Businesses Only</Text>
                    <Text style={styles.toggleSubtext}>Show verified ECOSPHERE enterprises</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, draft.verifiedOnly && styles.checkboxActive]}>
                  {draft.verifiedOnly && <Check size={14} color="#07111F" />}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Section: Price Range (Services & Products) */}
          {(showServiceFilters || showProductFilters) && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <DollarSign size={14} color={Theme.colors.success} />
                <Text style={styles.sectionTitle}>Price Tier</Text>
              </View>
              <View style={styles.chipWrap}>
                {PRICE_BUCKETS.map((pb) => {
                  const isSelected = draft.priceBucket === pb.id;
                  return (
                    <TouchableOpacity
                      key={pb.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() =>
                        setDraft((prev) => ({
                          ...prev,
                          priceBucket: isSelected ? undefined : (pb.id as any),
                        }))
                      }
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{pb.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Section: Job Work Type & Work Mode */}
          {showJobFilters && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionLabelRow}>
                  <Briefcase size={14} color={Theme.colors.purple} />
                  <Text style={styles.sectionTitle}>Work Type</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {WORK_TYPES.map((wt) => {
                    const isSelected = (!draft.jobType && wt === 'All Types') || draft.jobType === wt;
                    return (
                      <TouchableOpacity
                        key={wt}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setDraft((prev) => ({ ...prev, jobType: wt === 'All Types' ? undefined : wt }))}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{wt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Work Mode</Text>
                <View style={styles.chipWrap}>
                  {WORK_MODES.map((wm) => {
                    const isSelected = (!draft.workMode && wm === 'All Modes') || draft.workMode === wm;
                    return (
                      <TouchableOpacity
                        key={wm}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setDraft((prev) => ({ ...prev, workMode: wm === 'All Modes' ? undefined : wm }))}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{wm}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* Section: Opportunities Filter */}
          {showOpportunityFilters && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opportunity Dimension</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {OPP_TYPES.map((ot) => {
                  const isSelected = (!draft.opportunityType && ot === 'All Opportunities') || draft.opportunityType === ot;
                  return (
                    <TouchableOpacity
                      key={ot}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() =>
                        setDraft((prev) => ({
                          ...prev,
                          opportunityType: ot === 'All Opportunities' ? undefined : ot,
                        }))
                      }
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{ot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Section: Availability Toggle */}
          {(showServiceFilters || showProductFilters) && (
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.toggleRow, draft.isAvailable && styles.toggleRowActive]}
                onPress={() => setDraft((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))}
                activeOpacity={0.8}
              >
                <View style={styles.toggleLeft}>
                  <Text style={styles.toggleTitle}>Available / In-Stock Only</Text>
                  <Text style={styles.toggleSubtext}>Exclude unavailable listings</Text>
                </View>
                <View style={[styles.checkbox, draft.isAvailable && styles.checkboxActive]}>
                  {draft.isAvailable && <Check size={14} color="#07111F" />}
                </View>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
            activeOpacity={0.85}
            accessibilityLabel="Apply filters"
          >
            <Text style={styles.applyButtonText}>
              Apply Filters {countActiveFilters() > 0 ? `(${countActiveFilters()})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(7, 17, 31, 0.65)',
  },
  modalContent: {
    maxHeight: '85%',
    backgroundColor: '#07111F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.2)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  countBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#07111F',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  resetBtnText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 8,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 24, 40, 0.7)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 52,
  },
  toggleRowActive: {
    borderColor: 'rgba(37, 230, 138, 0.3)',
    backgroundColor: 'rgba(37, 230, 138, 0.06)',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  toggleSubtext: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#07111F',
  },
  applyButton: {
    backgroundColor: Theme.colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#07111F',
    fontFamily: Theme.typography.fontFamily,
  },
});
