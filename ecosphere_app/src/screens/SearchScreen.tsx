import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  X,
  Clock,
  TrendingUp,
  Tag,
  ArrowRight,
  Building2,
  Briefcase,
  Cpu,
  ShoppingBag,
  Sparkles,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { GlassCard } from '../components/cards/GlassCard';
import { searchService, SearchSuggestion, SearchTag } from '../services/searchService';

interface SearchScreenProps {
  initialQuery?: string;
  initialType?: 'all' | 'business' | 'service' | 'product' | 'job';
  city?: string;
  onBack: () => void;
  onSelectSearch: (query: string, type: 'all' | 'business' | 'service' | 'product' | 'job') => void;
}

const SCOPES: Array<{ id: 'all' | 'business' | 'service' | 'product' | 'job'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'business', label: 'Businesses' },
  { id: 'service', label: 'Services' },
  { id: 'product', label: 'Products' },
  { id: 'job', label: 'Jobs' },
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialQuery = '',
  initialType = 'all',
  city,
  onBack,
  onSelectSearch,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<'all' | 'business' | 'service' | 'product' | 'job'>(initialType);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [trendingTags, setTrendingTags] = useState<SearchTag[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Electrical Repair',
    'Full-Stack Developer',
    'Tech Startups',
    'Home Renovation',
  ]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  const debounceTimer = useRef<any>(null);
  const lastQueryRef = useRef<string>('');

  // Load trending search tags on mount
  useEffect(() => {
    searchService.getSearchTags().then((tags) => {
      if (tags && tags.length > 0) {
        setTrendingTags(tags);
      }
    });
  }, []);

  // Debounced autocomplete suggestions
  const fetchSuggestions = useCallback((text: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const trimmed = text.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    setIsSuggesting(true);
    debounceTimer.current = setTimeout(async () => {
      lastQueryRef.current = trimmed;
      const res = await searchService.getSuggestions(trimmed);
      // Guard against stale response
      if (lastQueryRef.current === trimmed) {
        setSuggestions(res || []);
        setIsSuggesting(false);
      }
    }, 280);
  }, []);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    fetchSuggestions(text);
  };

  const handleClearQuery = () => {
    setQuery('');
    setSuggestions([]);
  };

  const handleSubmit = (targetQuery?: string) => {
    const finalQuery = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!finalQuery) return;

    // Add to recent searches (deduplicated, max 6)
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== finalQuery.toLowerCase());
      return [finalQuery, ...filtered].slice(0, 6);
    });

    Keyboard.dismiss();
    onSelectSearch(finalQuery, selectedType);
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
  };

  const getEntityIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'business':
        return <Building2 size={14} color={Theme.colors.purple} />;
      case 'service':
        return <Cpu size={14} color={Theme.colors.success} />;
      case 'product':
        return <ShoppingBag size={14} color={Theme.colors.orange} />;
      case 'job':
        return <Briefcase size={14} color={Theme.colors.primary} />;
      default:
        return <Search size={14} color={Theme.colors.primary} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Search size={18} color={Theme.colors.primary} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search anything in ECOSPHERE..."
              placeholderTextColor={Theme.colors.secondaryText}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => handleSubmit()}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClearQuery}
                style={styles.clearBtn}
                activeOpacity={0.7}
                accessibilityLabel="Clear search text"
              >
                <X size={16} color={Theme.colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Scope Tabs */}
        <View style={styles.scopeContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scopeScroll}
          >
            {SCOPES.map((scope) => {
              const isSelected = selectedType === scope.id;
              return (
                <TouchableOpacity
                  key={scope.id}
                  style={[styles.scopeChip, isSelected && styles.scopeChipActive]}
                  onPress={() => setSelectedType(scope.id)}
                  activeOpacity={0.75}
                  accessibilityLabel={`Filter by ${scope.label}`}
                >
                  <Text style={[styles.scopeChipText, isSelected && styles.scopeChipTextActive]}>
                    {scope.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Autocomplete Suggestions (Live) */}
          {suggestions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Sparkles size={14} color={Theme.colors.primary} />
                <Text style={styles.sectionTitle}>Suggestions</Text>
                {isSuggesting && <ActivityIndicator size="small" color={Theme.colors.primary} />}
              </View>

              <GlassCard style={styles.suggestionsCard}>
                {suggestions.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={[
                      styles.suggestionRow,
                      idx < suggestions.length - 1 && styles.suggestionDivider,
                    ]}
                    onPress={() => handleSubmit(item.text)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.suggestionLeft}>
                      {getEntityIcon(item.entityType || item.type)}
                      <Text style={styles.suggestionText}>{item.text}</Text>
                    </View>
                    <View style={styles.suggestionRight}>
                      {item.type && item.type !== 'query' && (
                        <Text style={styles.suggestionBadge}>
                          {item.type.toUpperCase()}
                        </Text>
                      )}
                      <ArrowRight size={14} color={Theme.colors.secondaryText} />
                    </View>
                  </TouchableOpacity>
                ))}
              </GlassCard>
            </View>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color={Theme.colors.secondaryText} />
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                </View>
                <TouchableOpacity onPress={handleClearRecents} activeOpacity={0.7}>
                  <Text style={styles.clearRecentsText}>Clear</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recentWrap}>
                {recentSearches.map((term) => (
                  <TouchableOpacity
                    key={term}
                    style={styles.recentChip}
                    onPress={() => {
                      setQuery(term);
                      handleSubmit(term);
                    }}
                    activeOpacity={0.75}
                  >
                    <Clock size={12} color={Theme.colors.secondaryText} />
                    <Text style={styles.recentChipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Popular / Trending Searches */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <TrendingUp size={14} color={Theme.colors.success} />
              <Text style={styles.sectionTitle}>Trending on ECOSPHERE</Text>
            </View>

            <View style={styles.tagsGrid}>
              {(trendingTags.length > 0
                ? trendingTags
                : [
                    { id: '1', tagName: 'Electrician', tagType: 'service' },
                    { id: '2', tagName: 'App Developer', tagType: 'job' },
                    { id: '3', tagName: 'Solar Maintenance', tagType: 'service' },
                    { id: '4', tagName: 'Hardware Supply', tagType: 'business' },
                    { id: '5', tagName: 'Logistics Manager', tagType: 'job' },
                    { id: '6', tagName: 'Smart Home Devices', tagType: 'product' },
                  ]
              ).map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.tagPill}
                  onPress={() => {
                    setQuery(tag.tagName);
                    handleSubmit(tag.tagName);
                  }}
                  activeOpacity={0.75}
                >
                  <Tag size={12} color={Theme.colors.primary} />
                  <Text style={styles.tagPillText}>{tag.tagName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: 'rgba(13, 24, 40, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.3)',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Theme.typography.fontFamily,
  },
  clearBtn: {
    padding: 6,
  },
  scopeContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 8,
  },
  scopeScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  scopeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 24, 40, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeChipActive: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    borderColor: Theme.colors.primary,
  },
  scopeChipText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  scopeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  clearRecentsText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  suggestionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  suggestionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  suggestionText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  suggestionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.primary,
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 24, 40, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    minHeight: 40,
  },
  recentChipText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontFamily: Theme.typography.fontFamily,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.18)',
    minHeight: 44,
  },
  tagPillText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
});
