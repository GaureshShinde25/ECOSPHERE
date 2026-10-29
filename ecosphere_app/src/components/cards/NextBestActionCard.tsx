import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Briefcase,
  Calendar,
  Zap,
  UserCheck,
  Send,
  Building2,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Award,
} from 'lucide-react-native';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';
import { GroundedAction } from '../../services/activationService';

interface NextBestActionCardProps {
  action: GroundedAction;
  onPressAction: (action: GroundedAction) => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  action,
  onPressAction,
}) => {
  const getActionIcon = () => {
    switch (action.actionType) {
      case 'APPLY_JOB':
        return <Send size={16} color="#25E68A" />;
      case 'BOOK_SERVICE':
        return <Calendar size={16} color="#2FD6FF" />;
      case 'CREATE_JOB':
      case 'VIEW_JOB':
        return <Briefcase size={16} color="#8B5CF6" />;
      case 'VIEW_SKILL':
        return <Zap size={16} color="#F59E0B" />;
      case 'COMPLETE_PROFILE':
        return <UserCheck size={16} color="#EC4899" />;
      case 'VIEW_BUSINESS':
      case 'MESSAGE_BUSINESS':
        return <Building2 size={16} color="#3B82F6" />;
      default:
        return <Sparkles size={16} color="#2FD6FF" />;
    }
  };

  const getUrgencyBadge = () => {
    switch (action.urgency) {
      case 'HIGH':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', label: 'PRIORITY' };
      case 'MEDIUM':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', label: 'RECOMMENDED' };
      default:
        return { bg: 'rgba(47, 214, 255, 0.15)', text: '#2FD6FF', label: 'EXPLORE' };
    }
  };

  const urgency = getUrgencyBadge();

  return (
    <GlassCard style={styles.card}>
      {/* Header Row: Action Type & Urgency */}
      <View style={styles.headerRow}>
        <View style={styles.typeTag}>
          {getActionIcon()}
          <Text style={styles.typeText}>{action.actionType.replace('_', ' ')}</Text>
        </View>

        <View style={[styles.urgencyPill, { backgroundColor: urgency.bg }]}>
          <Text style={[styles.urgencyText, { color: urgency.text }]}>{urgency.label}</Text>
        </View>
      </View>

      {/* Action Title & Description */}
      <Text style={styles.title}>{action.title}</Text>
      <Text style={styles.description}>{action.description}</Text>

      {/* Grounded Evidence Chips */}
      {action.evidence && action.evidence.length > 0 && (
        <View style={styles.evidenceRow}>
          {action.evidence.map((ev, i) => (
            <View key={i} style={styles.evidenceChip}>
              <Text style={styles.evidenceType}>{ev.type}</Text>
              <Text style={styles.evidenceText}>
                {ev.label}: <Text style={styles.evidenceValue}>{ev.value}</Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Rationale Quote */}
      {action.reason ? (
        <View style={styles.reasonRow}>
          <Text style={styles.reasonText}>💡 {action.reason}</Text>
        </View>
      ) : null}

      {/* Primary Action Button (Min 44px touch target) */}
      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.85}
        onPress={() => onPressAction(action)}
      >
        <LinearGradient
          colors={['#25E68A', '#2FD6FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.actionGradient}
        >
          <Text style={styles.btnText}>{action.label}</Text>
          <ChevronRight size={18} color="#07111F" />
        </LinearGradient>
      </TouchableOpacity>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Theme.spacing.md,
    borderRadius: 24,
    marginBottom: Theme.spacing.md,
    backgroundColor: 'rgba(13, 24, 40, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  urgencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 10,
    fontFamily: Theme.typography.fontFamily,
  },
  evidenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  evidenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  evidenceType: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2FD6FF',
  },
  evidenceText: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  evidenceValue: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reasonRow: {
    backgroundColor: 'rgba(47, 214, 255, 0.06)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  actionBtn: {
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#07111F',
    letterSpacing: 0.3,
  },
});
