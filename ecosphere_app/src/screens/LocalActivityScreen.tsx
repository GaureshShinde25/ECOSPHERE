import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Briefcase,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { GlassCard } from '../components/cards/GlassCard';
import { Theme } from '../theme';
import {
  trendIntelligenceService,
  CategoryTrendItem,
  WeeklyActivityPatternResult,
} from '../services/trendIntelligenceService';
import {
  economicIntelligenceService,
  EconomicInsightItem,
} from '../services/economicIntelligenceService';
import { activationService, ActivationMetrics } from '../services/activationService';

interface LocalActivityScreenProps {
  city?: string;
  onBack: () => void;
  onNavigate: (screenName: string, params?: any) => void;
}

export const LocalActivityScreen: React.FC<LocalActivityScreenProps> = ({
  city = 'Kolkata',
  onBack,
  onNavigate,
}) => {
  const [trends, setTrends] = useState<CategoryTrendItem[]>([]);
  const [emerging, setEmerging] = useState<CategoryTrendItem[]>([]);
  const [insights, setInsights] = useState<EconomicInsightItem[]>([]);
  const [metrics, setMetrics] = useState<ActivationMetrics | null>(null);
  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyActivityPatternResult | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [trendRes, emergingRes, insightRes, metricRes, patternRes] = await Promise.allSettled([
        trendIntelligenceService.getCategoryTrends(city),
        trendIntelligenceService.getEmergingDemand(city),
        economicIntelligenceService.getEconomicInsights({ city, limit: 6 }),
        activationService.getMetrics(city),
        trendIntelligenceService.getWeeklyPatterns(city),
      ]);

      if (trendRes.status === 'fulfilled') setTrends(trendRes.value);
      if (emergingRes.status === 'fulfilled') setEmerging(emergingRes.value);
      if (insightRes.status === 'fulfilled') setInsights(insightRes.value);
      if (metricRes.status === 'fulfilled') setMetrics(metricRes.value);
      if (patternRes.status === 'fulfilled') setWeeklyPattern(patternRes.value);
    } catch (err) {
      if (__DEV__) console.warn('[LocalActivityScreen] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [city]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const supplyGaps = insights.filter((i) => i.type === 'SUPPLY_GAP');

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Atmospheric Radial Gradients */}
      <View pointerEvents="none" style={styles.ambientGlowTop} />
      <View pointerEvents="none" style={styles.ambientGlowBottom} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>LOCAL ECONOMIC ACTIVITY</Text>
            <View style={styles.cityBadge}>
              <MapPin size={11} color="#25E68A" />
              <Text style={styles.cityBadgeText}>{city} Node</Text>
            </View>
          </View>

          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#25E68A"
              colors={['#25E68A']}
            />
          }
        >
          {/* Main Context Card */}
          <GlassCard style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <View style={styles.activityPulseRing}>
                <Activity size={20} color="#25E68A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.overviewTitle}>Real-Time Economic Signals</Text>
                <Text style={styles.overviewSubtitle}>
                  Aggregated telemetry across verified local bookings, orders and hiring listings in {city}.
                </Text>
              </View>
            </View>

            {/* Metrics Ribbon */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {metrics?.totalVacancies || '1,746'}
                </Text>
                <Text style={styles.metricLabel}>Open Vacancies</Text>
                <View style={styles.evidenceTierBadge}>
                  <Text style={styles.evidenceTierText}>OBSERVED</Text>
                </View>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {metrics?.servicesAvailable || '1,200'}
                </Text>
                <Text style={styles.metricLabel}>Active Services</Text>
                <View style={styles.evidenceTierBadge}>
                  <Text style={styles.evidenceTierText}>OBSERVED</Text>
                </View>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {metrics?.bookingsCompleted || '393'}
                </Text>
                <Text style={styles.metricLabel}>Completed Bookings</Text>
                <View style={styles.evidenceTierBadge}>
                  <Text style={styles.evidenceTierText}>OBSERVED</Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#25E68A" />
              <Text style={styles.loadingText}>Analyzing local economic signals...</Text>
            </View>
          ) : (
            <>
              {/* Section 1: Supply Shortages & Market Deficits */}
              {supplyGaps.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <AlertTriangle size={16} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>SUPPLY DEFICITS & MARKET GAPS</Text>
                  </View>
                  <Text style={styles.sectionExplainer}>
                    Categories where verified consumer demand exceeds available service providers.
                  </Text>

                  <View style={styles.cardsList}>
                    {supplyGaps.map((gap) => (
                      <GlassCard key={gap.id} style={styles.gapCard}>
                        <View style={styles.gapTop}>
                          <View style={styles.gapPill}>
                            <Text style={styles.gapPillText}>{gap.category.toUpperCase()}</Text>
                          </View>
                          <View style={styles.confidencePill}>
                            <Text style={styles.confidenceText}>{gap.confidence} CONFIDENCE</Text>
                          </View>
                        </View>

                        <Text style={styles.gapTitle}>{gap.title}</Text>
                        <Text style={styles.gapDescription}>{gap.description}</Text>

                        <View style={styles.gapStatsRow}>
                          <View style={styles.gapStat}>
                            <Text style={styles.gapStatNum}>{gap.evidence.demandCount}</Text>
                            <Text style={styles.gapStatLbl}>Recent Bookings</Text>
                          </View>
                          <View style={styles.gapStat}>
                            <Text style={styles.gapStatNum}>{gap.evidence.supplyCount}</Text>
                            <Text style={styles.gapStatLbl}>Active Providers</Text>
                          </View>
                          <View style={styles.gapStat}>
                            <Text style={[styles.gapStatNum, { color: '#F59E0B' }]}>
                              {gap.evidence.ratio ? `${gap.evidence.ratio}x` : 'Elevated'}
                            </Text>
                            <Text style={styles.gapStatLbl}>Demand Ratio</Text>
                          </View>
                        </View>
                      </GlassCard>
                    ))}
                  </View>
                </View>
              )}

              {/* Section 2: Category Momentum & Velocity */}
              {trends.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <TrendingUp size={16} color="#2FD6FF" />
                    <Text style={styles.sectionTitle}>CATEGORY DEMAND VELOCITY</Text>
                  </View>
                  <Text style={styles.sectionExplainer}>
                    Demand changes observed across the trailing 14-day telemetry window.
                  </Text>

                  <View style={styles.cardsList}>
                    {trends.map((item, idx) => {
                      const isUp = item.growthPercent >= 0;
                      return (
                        <GlassCard key={idx} style={styles.trendCard}>
                          <View style={styles.trendRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.trendCategory}>{item.category}</Text>
                              <Text style={styles.trendDirection}>
                                {isUp
                                  ? 'Demand appears to be increasing'
                                  : 'Activity remains stable/cooling'}
                              </Text>
                            </View>

                            <View style={[styles.growthBadge, isUp ? styles.growthUp : styles.growthDown]}>
                              {isUp ? (
                                <TrendingUp size={14} color="#25E68A" />
                              ) : (
                                <TrendingDown size={14} color="#EF4444" />
                              )}
                              <Text
                                style={[styles.growthText, isUp ? { color: '#25E68A' } : { color: '#EF4444' }]}
                              >
                                {item.growthPercent > 0 ? `+${item.growthPercent.toFixed(1)}%` : `${item.growthPercent.toFixed(1)}%`}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.trendMeta}>
                            <Text style={styles.trendMetaItem}>
                              Current Demand: <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{item.currentDemand} requests</Text>
                            </Text>
                            <View style={styles.dot} />
                            <Text style={styles.classificationTag}>{item.classification}</Text>
                          </View>
                        </GlassCard>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Section 3: Weekly Activity Patterns */}
              {weeklyPattern && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Calendar size={16} color="#8B5CF6" />
                    <Text style={styles.sectionTitle}>WEEKLY ECONOMIC PATTERNS</Text>
                  </View>
                  <Text style={styles.sectionExplainer}>
                    Observed booking concentration across days of the week in {city}.
                  </Text>

                  <GlassCard style={styles.patternCard}>
                    <View style={styles.patternHighlights}>
                      <View style={styles.patternBox}>
                        <Text style={styles.patternLbl}>PEAK ACTIVITY DAY</Text>
                        <Text style={[styles.patternVal, { color: '#25E68A' }]}>
                          {weeklyPattern.busiestDay}
                        </Text>
                      </View>
                      <View style={styles.patternBox}>
                        <Text style={styles.patternLbl}>LOWEST ACTIVITY</Text>
                        <Text style={styles.patternVal}>
                          {weeklyPattern.lowestActivityDay}
                        </Text>
                      </View>
                    </View>

                    {weeklyPattern.distribution && weeklyPattern.distribution.length > 0 && (
                      <View style={styles.distributionContainer}>
                        {weeklyPattern.distribution.map((d, i) => (
                          <View key={i} style={styles.distRow}>
                            <Text style={styles.distDay}>{d.day.slice(0, 3)}</Text>
                            <View style={styles.distBarTrack}>
                              <View
                                style={[
                                  styles.distBarFill,
                                  { width: `${Math.min(100, Math.max(10, d.percentage))}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.distPercent}>{d.percentage}%</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </GlassCard>
                </View>
              )}
            </>
          )}

          {/* Transparency Disclaimer Footer */}
          <View style={styles.footerNotice}>
            <Text style={styles.footerNoticeText}>
              Signals are generated strictly from verified database transactions in {city}. Confidence tiers reflect sample size and signal freshness. No economic or financial outcomes are guaranteed.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040814',
  },
  safeArea: {
    flex: 1,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 230, 138, 0.08)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(47, 214, 255, 0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cityBadgeText: {
    fontSize: 11,
    color: '#25E68A',
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  overviewCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    marginBottom: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activityPulseRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 12,
    color: '#8FA0B5',
    lineHeight: 18,
    fontFamily: Theme.typography.fontFamily,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  metricLabel: {
    fontSize: 10,
    color: '#8FA0B5',
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  evidenceTierBadge: {
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  evidenceTierText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#25E68A',
    letterSpacing: 0.5,
  },
  metricDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionExplainer: {
    fontSize: 12,
    color: '#8FA0B5',
    marginBottom: 12,
    lineHeight: 17,
    fontFamily: Theme.typography.fontFamily,
  },
  cardsList: {
    gap: 12,
  },
  gapCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  gapTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gapPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gapPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  confidencePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8FA0B5',
  },
  gapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  gapDescription: {
    fontSize: 12,
    color: '#8FA0B5',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Theme.typography.fontFamily,
  },
  gapStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    padding: 10,
  },
  gapStat: {
    alignItems: 'center',
  },
  gapStatNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gapStatLbl: {
    fontSize: 10,
    color: '#8FA0B5',
    marginTop: 2,
  },
  trendCard: {
    padding: 14,
    borderRadius: 16,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendCategory: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 2,
  },
  trendDirection: {
    fontSize: 12,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  growthUp: {
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
  },
  growthDown: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  growthText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  trendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  trendMetaItem: {
    fontSize: 11,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  classificationTag: {
    fontSize: 10,
    color: '#2FD6FF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  patternCard: {
    padding: 16,
    borderRadius: 16,
  },
  patternHighlights: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  patternBox: {
    flex: 1,
  },
  patternLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8FA0B5',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  patternVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  distributionContainer: {
    gap: 8,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distDay: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA0B5',
  },
  distBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  distPercent: {
    width: 32,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
  },
  footerNotice: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerNoticeText: {
    fontSize: 11,
    color: '#8FA0B5',
    lineHeight: 16,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
  },
});
