import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import {
  ArrowLeft,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  MapPin,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import {
  skillIntelligenceService,
  SkillDetailResponse,
} from '../services/skillIntelligenceService';

interface SkillDetailsScreenProps {
  skillId: number;
  city?: string;
  onBack: () => void;
  onNavigateToJob?: (jobId: string) => void;
}

export const SkillDetailsScreen: React.FC<SkillDetailsScreenProps> = ({
  skillId,
  city = 'Kolkata',
  onBack,
  onNavigateToJob,
}) => {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<SkillDetailResponse | null>(null);

  useEffect(() => {
    loadDetail();
  }, [skillId, city]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await skillIntelligenceService.getSkillDetail(skillId, city);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load skill details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#07111F" />
        <ActivityIndicator size="large" color={Theme.colors.primaryBlue || '#2FD6FF'} />
        <Text style={styles.loadingText}>Retrieving Grounded Skill Intelligence...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={20} color="#F8FAFC" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Skill Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Skill Data Unavailable</Text>
          <Text style={styles.errorSubtitle}>Unable to load telemetry for Skill #{skillId}.</Text>
          <TouchableOpacity onPress={onBack} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isDeficit = detail.marketStatus === 'DEFICIT';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#07111F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{detail.skill.skillName}</Text>
          <Text style={styles.headerSub}>{detail.skill.category} • {detail.city}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <GlassCard style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{detail.skill.category.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, isDeficit ? styles.statusDeficit : styles.statusBalanced]}>
              <Zap size={12} color={isDeficit ? '#EF4444' : '#25E68A'} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: isDeficit ? '#EF4444' : '#25E68A' }]}>
                {detail.marketStatus}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{detail.skill.skillName}</Text>

          {/* Key Metrics Row */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{detail.demandCount}</Text>
              <Text style={styles.metricLbl}>Demand Velocity</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricVal}>{detail.vacancyCount}</Text>
              <Text style={styles.metricLbl}>Open Vacancies</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: isDeficit ? '#EF4444' : '#2FD6FF' }]}>
                {detail.demandSupplyRatio}x
              </Text>
              <Text style={styles.metricLbl}>Gap Ratio</Text>
            </View>
          </View>
        </GlassCard>

        {/* Opportunity Score Card */}
        <GlassCard style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>EMPLOYMENT OPPORTUNITY SCORE</Text>
              <View style={styles.scoreNumberRow}>
                <Text style={styles.scoreVal}>{detail.employmentOpportunityScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
            </View>
            <View style={styles.growthBadge}>
              <TrendingUp size={14} color="#25E68A" />
              <Text style={styles.growthText}>+{detail.wowGrowthPercent}% WoW</Text>
            </View>
          </View>

          <View style={styles.scoreBarTrack}>
            <View
              style={[
                styles.scoreBarFill,
                { width: `${Math.min(100, detail.employmentOpportunityScore)}%` },
              ]}
            />
          </View>

          <Text style={styles.scoreNote}>
            Calculated deterministically from {detail.vacancyCount} active vacancies, local talent supply deficit ({detail.demandSupplyRatio}x), and weekly momentum.
          </Text>
        </GlassCard>

        {/* Salary Benchmarks */}
        <Text style={styles.sectionTitle}>Compensation Range</Text>
        <GlassCard style={styles.salaryCard}>
          <View style={styles.salaryRow}>
            <View style={styles.salaryCol}>
              <Text style={styles.salarySub}>Min Base</Text>
              <Text style={styles.salaryVal}>₹{(detail.salaryRange.min / 100000).toFixed(1)}L</Text>
            </View>
            <View style={styles.salaryColCenter}>
              <Text style={styles.salarySub}>Market Median</Text>
              <Text style={[styles.salaryVal, { color: '#2FD6FF' }]}>
                ₹{(detail.salaryRange.avg / 100000).toFixed(1)}L
              </Text>
            </View>
            <View style={styles.salaryCol}>
              <Text style={styles.salarySub}>Top Band</Text>
              <Text style={styles.salaryVal}>₹{(detail.salaryRange.max / 100000).toFixed(1)}L</Text>
            </View>
          </View>
        </GlassCard>

        {/* Grounded Evidence Trail */}
        <Text style={styles.sectionTitle}>Grounding Evidence</Text>
        <GlassCard style={styles.evidenceCard}>
          {detail.evidence.map((ev, idx) => (
            <View key={idx} style={[styles.evidenceRow, idx > 0 && styles.evidenceBorder]}>
              <View style={styles.evBadgeCol}>
                <View
                  style={[
                    styles.evClassificationBadge,
                    ev.type === 'OBSERVED'
                      ? styles.badgeObserved
                      : ev.type === 'CALCULATED'
                      ? styles.badgeCalculated
                      : styles.badgeInferred,
                  ]}
                >
                  <Text style={styles.evClassificationText}>{ev.type}</Text>
                </View>
              </View>
              <View style={styles.evTextCol}>
                <Text style={styles.evLabel}>{ev.label}</Text>
                <Text style={styles.evValue}>{String(ev.value)}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Active Open Jobs */}
        {detail.activeJobs && detail.activeJobs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Active Open Positions ({detail.activeJobs.length})</Text>
            {detail.activeJobs.map((job, idx) => (
              <GlassCard key={idx} style={styles.jobItemCard}>
                <View style={styles.jobItemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.jobItemTitle}>{job.jobTitle}</Text>
                    <Text style={styles.jobItemEmp}>{job.businessName}</Text>
                  </View>
                  <View style={styles.vacanciesPill}>
                    <Text style={styles.vacanciesText}>{job.vacancies} open</Text>
                  </View>
                </View>

                <View style={styles.jobMetaRow}>
                  <View style={styles.jobMetaItem}>
                    <Briefcase size={12} color="#94A3B8" />
                    <Text style={styles.jobMetaText}>{job.jobType}</Text>
                  </View>
                  <View style={styles.jobMetaItem}>
                    <MapPin size={12} color="#94A3B8" />
                    <Text style={styles.jobMetaText}>{job.workMode}</Text>
                  </View>
                </View>

                {onNavigateToJob && (
                  <TouchableOpacity
                    style={styles.viewJobBtn}
                    onPress={() => onNavigateToJob(job.jobId)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewJobBtnText}>View Position Details</Text>
                    <ChevronRight size={14} color="#2FD6FF" />
                  </TouchableOpacity>
                )}
              </GlassCard>
            ))}
          </>
        )}

        {/* Limitations & Safeguards */}
        <View style={styles.safeguardBox}>
          <ShieldCheck size={16} color="#94A3B8" style={{ marginTop: 2, marginRight: 8 }} />
          <Text style={styles.safeguardText}>
            Marketplace intelligence is derived from verified platform activity in {detail.city}. This report does not guarantee employment or predict future commercial earnings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94A3B8',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.2)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDeficit: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBalanced: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metricLbl: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  scoreCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  scoreVal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#25E68A',
  },
  scoreMax: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 4,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25E68A',
    marginLeft: 4,
  },
  scoreBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#25E68A',
    borderRadius: 3,
  },
  scoreNote: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 8,
    marginBottom: 10,
  },
  salaryCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  salaryColCenter: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  salarySub: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  salaryVal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  evidenceCard: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 16,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  evidenceBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  evBadgeCol: {
    width: 90,
  },
  evClassificationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeObserved: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
  },
  badgeCalculated: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
  },
  badgeInferred: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  evClassificationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  evTextCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evLabel: {
    fontSize: 13,
    color: '#94A3B8',
  },
  evValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  jobItemCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  jobItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  jobItemEmp: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  vacanciesPill: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vacanciesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2FD6FF',
  },
  jobMetaRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  jobMetaText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 4,
  },
  viewJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  viewJobBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2FD6FF',
    marginRight: 4,
  },
  safeguardBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  safeguardText: {
    flex: 1,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: '#2FD6FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#07111F',
    fontWeight: '700',
    fontSize: 14,
  },
});
