import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { MapPin, Briefcase, ArrowRight, DollarSign } from 'lucide-react-native';
import { OpportunityImage } from './OpportunityImage';
import { Theme } from '../../theme';
import { Job } from '../../types';

interface JobCardProps {
  job: Partial<Omit<Job, 'jobType'>> & { id: string; title: string; employerName?: string; salary?: string; jobType?: string };
  onPress: (job: any) => void;
  style?: StyleProp<ViewStyle>;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onPress, style }) => {
  const employer = job.employerName || 'Local Employer';
  const location = job.location || 'Local Area';
  const jobType = job.jobType || 'Full-time';
  const salary = job.salary || 'Competitive Pay';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(job)}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <OpportunityImage
          uri={job.employerLogo}
          category={job.category}
          id={job.id}
          size={44}
          borderRadius={12}
        />

        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={1}>
            {job.title}
          </Text>
          <Text style={styles.employer} numberOfLines={1}>
            {employer}
          </Text>
        </View>

        <View style={styles.jobTypeBadge}>
          <Text style={styles.jobTypeText}>{jobType}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.infoCol}>
          <View style={styles.locationRow}>
            <MapPin size={12} color="#94A3B8" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <Text style={styles.salaryText}>{salary}</Text>
        </View>

        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View</Text>
          <ArrowRight size={13} color={Theme.colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
    marginBottom: 12,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleArea: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17231B',
    fontFamily: Theme.typography.headingFont,
  },
  employer: {
    fontSize: 12,
    color: '#68756B',
    marginTop: 2,
    fontFamily: Theme.typography.bodyFont,
  },
  jobTypeBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  jobTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
  },
  infoCol: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.emerald,
    fontFamily: Theme.typography.bodyFont,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.emerald,
    fontFamily: Theme.typography.bodyFont,
  },
});
