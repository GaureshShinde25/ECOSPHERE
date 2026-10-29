import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
  Award,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Bookmark,
  Share2,
  Briefcase,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/cards/GlassCard';
import { Theme } from '../theme';
import { PersonalizedRecommendationItem } from '../services/recommendationService';
import { favoriteService } from '../services/favoriteService';

interface RecommendationDetailScreenProps {
  recommendation?: PersonalizedRecommendationItem;
  onBack: () => void;
  onNavigate: (screenName: string, params?: any) => void;
}

export const RecommendationDetailScreen: React.FC<RecommendationDetailScreenProps> = ({
  recommendation,
  onBack,
  onNavigate,
}) => {
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Fallback if accessed without direct prop
  const rec = recommendation;
  const opp = rec?.opportunity;
  const title = opp?.title || 'Personalized Local Economic Recommendation';
  const score = rec?.recommendationScore || 95;
  const matchQuality = rec?.matchQuality || 'Strong Match';
  const type = opp?.type || 'SERVICE';
  const city = opp?.location?.city || 'Kolkata';
  const reasons = rec?.reasons || [
    'Matches high active economic velocity in your area.',
    'Verified local provider status in Kolkata ecosystem.',
  ];
  const feedback = rec?.feedbackEvidence;

  const handleSaveToggle = async () => {
    if (!opp) return;
    setSaving(true);
    try {
      if (isSaved) {
        setIsSaved(false);
        Alert.alert('Saved Items', 'Recommendation removed from your favorites.');
      } else {
        const entityType = type === 'JOB' ? 'job' : 'service';
        await favoriteService.addFavorite(entityType, String(opp.id || '1'));
        setIsSaved(true);
        Alert.alert('Saved Items', 'Recommendation added to your favorites.');
      }
    } catch {
      setIsSaved(!isSaved);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title,
        message: `ECOSPHERE Recommendation: "${title}" in ${city} has a match score of ${score}/100. Explore on ECOSPHERE!`,
      });
    } catch (e) {
      console.error('Error sharing recommendation:', e);
    }
  };

  const handleAction = () => {
    if (opp?.actionScreen) {
      onNavigate(opp.actionScreen, opp.actionParams);
    } else if (type === 'JOB') {
      onNavigate('JobDetailsScreen', { job: { id: opp?.id || '1', title } });
    } else if (type === 'SERVICE') {
      onNavigate('BookingService', { service: { id: opp?.id || '1', title, price: 1499 } });
    } else if (type === 'BUSINESS') {
      onNavigate('BusinessProfileScreen', { business: { id: opp?.id || '1', name: title } });
    } else {
      onNavigate('Explore');
    }
  };

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

          <View style={styles.headerBadge}>
            <Sparkles size={13} color="#25E68A" />
            <Text style={styles.headerBadgeText}>AI RECOMMENDATION</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleSaveToggle}
              activeOpacity={0.7}
              style={styles.iconButton}
              disabled={saving}
            >
              <Bookmark
                size={18}
                color={isSaved ? '#25E68A' : '#8FA0B5'}
                fill={isSaved ? '#25E68A' : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.7}
              style={styles.iconButton}
            >
              <Share2 size={18} color="#8FA0B5" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Hero Card */}
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{type.toUpperCase()}</Text>
              </View>

              <View style={styles.scorePill}>
                <Award size={13} color="#25E68A" />
                <Text style={styles.scorePillText}>SCORE {score}/100</Text>
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            {opp?.description ? (
              <Text style={styles.description}>{opp.description}</Text>
            ) : null}

            <View style={styles.locationRow}>
              <MapPin size={14} color="#2FD6FF" />
              <Text style={styles.locationText}>{city} Node</Text>
              <View style={styles.dot} />
              <View style={styles.matchPill}>
                <Text style={styles.matchPillText}>{matchQuality.toUpperCase()}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Section: Why This Is Recommended */}
          <View style={styles.sectionHeader}>
            <Sparkles size={16} color="#25E68A" />
            <Text style={styles.sectionTitle}>WHY ECOSPHERE RECOMMENDS THIS</Text>
          </View>

          <GlassCard style={styles.reasonsCard}>
            {reasons.map((reason, idx) => (
              <View key={idx} style={styles.reasonRow}>
                <View style={styles.reasonCheck}>
                  <CheckCircle2 size={16} color="#25E68A" />
                </View>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </GlassCard>

          {/* Section: Observed Outcome Evidence */}
          {feedback && (
            <>
              <View style={styles.sectionHeader}>
                <ShieldCheck size={16} color="#2FD6FF" />
                <Text style={styles.sectionTitle}>OBSERVED TRANSACTION EVIDENCE</Text>
              </View>

              <GlassCard style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <Text style={styles.feedbackMetric}>
                    {feedback.metricName.toUpperCase()}: {feedback.observedOutcome}
                  </Text>
                  <View style={styles.obsBadge}>
                    <Text style={styles.obsBadgeText}>{feedback.evidenceType}</Text>
                  </View>
                </View>

                <Text style={styles.feedbackReason}>{feedback.reason}</Text>

                <View style={styles.feedbackMetaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>SAMPLE SIZE</Text>
                    <Text style={styles.metaValue}>{feedback.sampleSize} events</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>CONFIDENCE</Text>
                    <Text style={[styles.metaValue, { color: '#25E68A' }]}>
                      {feedback.confidence}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>GEO SCOPE</Text>
                    <Text style={styles.metaValue}>{feedback.geographicScope}</Text>
                  </View>
                </View>
              </GlassCard>
            </>
          )}

          {/* Section: Intelligence Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Info size={14} color="#8FA0B5" style={{ marginTop: 2 }} />
            <Text style={styles.disclaimerText}>
              Recommendations are personalized using your profile context and empirical local market activity. No financial or employment outcomes are guaranteed.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleAction}
            activeOpacity={0.88}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Act on this recommendation"
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>ACT ON THIS RECOMMENDATION</Text>
              <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.4} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#25E68A',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typePill: {
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2FD6FF',
    letterSpacing: 0.5,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  scorePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#25E68A',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 8,
    lineHeight: 28,
  },
  description: {
    fontSize: 13,
    color: '#8FA0B5',
    lineHeight: 19,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  matchPill: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#25E68A',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8FA0B5',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  reasonsCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  reasonCheck: {
    marginTop: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 19,
    fontFamily: Theme.typography.fontFamily,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.2)',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackMetric: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2FD6FF',
    fontFamily: Theme.typography.fontFamily,
    flex: 1,
  },
  obsBadge: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  obsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2FD6FF',
    letterSpacing: 0.5,
  },
  feedbackReason: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  feedbackMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  metaItem: {
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8FA0B5',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#8FA0B5',
    lineHeight: 16,
    fontFamily: Theme.typography.fontFamily,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: 'rgba(4, 8, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
});
