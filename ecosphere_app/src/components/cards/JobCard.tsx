import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { MapPin, Briefcase, DollarSign, ArrowRight } from 'lucide-react-native';
import { Job } from '../../types';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';

interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  return (
    <GlassCard style={styles.card}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(job)}>
        <View style={styles.header}>
          <Image source={{ uri: job.employerLogo }} style={styles.logo} />
          <View style={styles.titleArea}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.title}
            </Text>
            <Text style={styles.employerName}>{job.employerName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoTag}>
            <MapPin size={13} color={Theme.colors.primary} />
            <Text style={styles.infoText}>{job.location}</Text>
          </View>
          <View style={styles.infoTag}>
            <Briefcase size={13} color={Theme.colors.purple} />
            <Text style={styles.infoText}>{job.jobType}</Text>
          </View>
        </View>

        <View style={styles.salaryRow}>
          <View style={styles.salaryTag}>
            <DollarSign size={14} color={Theme.colors.success} />
            <Text style={styles.salaryText}>{job.salary}</Text>
          </View>

          <View style={styles.applyBtn}>
            <Text style={styles.applyText}>Apply Now</Text>
            <ArrowRight size={14} color={Theme.colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  titleArea: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  employerName: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  salaryTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
});
