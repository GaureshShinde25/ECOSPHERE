import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { ArrowLeft, MapPin, Briefcase, DollarSign, Calendar, CheckCircle2, Clock, Send, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Job, JobApplication } from '../types';
import { GlassCard } from '../components/cards/GlassCard';
import { Modal } from '../components/common/Modal';
import { jobService } from '../services/jobService';
import { favoriteService } from '../services/favoriteService';
import { OpportunityImage } from '../components/ui/OpportunityImage';
import { Theme } from '../theme';

interface JobDetailsScreenProps {
  job: Job;
  onBack: () => void;
}

export const JobDetailsScreen: React.FC<JobDetailsScreenProps> = ({ job, onBack }) => {
  const [currentJob, setCurrentJob] = useState<Job>(
    job || {
      id: 'job_1',
      businessId: 'biz_1',
      employerName: 'ECOSPHERE Enterprise',
      employerLogo:
        'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=120&q=80',
      title: 'Open Opportunity',
      category: 'Workforce',
      description: 'Role details loading...',
      salary: 'Competitive Compensation',
      location: 'Local Region',
      jobType: 'Full-time',
      postedDate: 'Recently',
      skills: ['General'],
      applicantsCount: 0,
      status: 'active',
    }
  );
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [currentApplication, setCurrentApplication] = useState<JobApplication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  React.useEffect(() => {
    if (job?.id) {
      favoriteService.isFavorite('job', String(job.id)).then(setIsFavorite);
      if (!job.title || !job.description) {
        jobService.getJobById(String(job.id)).then((fetched) => {
          if (fetched) setCurrentJob(fetched);
        });
      } else {
        setCurrentJob(job);
      }
    }
  }, [job]);

  const handleToggleFavorite = async () => {
    if (!currentJob?.id) return;
    const nextState = await favoriteService.toggleFavorite('job', String(currentJob.id), isFavorite);
    setIsFavorite(nextState);
  };

  const handleApplySubmit = async () => {
    setIsSubmitting(true);
    try {
      const app = await jobService.applyForJob(currentJob.id, coverNote);
      setCurrentApplication(app);
      setApplyModalVisible(false);
      Alert.alert('Application Submitted', `Your application for ${currentJob.title} has been submitted successfully.`);
    } catch (err: any) {
      Alert.alert('Application Status', err.message || 'Failed to submit job application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusStepIndex = (status?: string) => {
    switch (status) {
      case 'Applied': return 0;
      case 'Under Review': return 1;
      case 'Interview': return 2;
      case 'Selected': return 3;
      case 'Rejected': return 3;
      default: return -1;
    }
  };

  const steps = ['Applied', 'Under Review', 'Interview', 'Selected'];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.backBtn} activeOpacity={0.7}>
            <Heart size={20} color={isFavorite ? '#EF4444' : '#FFFFFF'} fill={isFavorite ? '#EF4444' : 'transparent'} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Employer Card */}
          <GlassCard style={styles.employerCard}>
            <View style={styles.employerRow}>
              <OpportunityImage
                uri={currentJob.employerLogo}
                category={currentJob.category}
                id={String(currentJob.id)}
                size={48}
                borderRadius={12}
              />
              <View style={styles.employerInfo}>
                <Text style={styles.jobTitle}>{currentJob.title}</Text>
                <Text style={styles.employerName}>{currentJob.employerName}</Text>
              </View>
            </View>

            <View style={styles.gridInfo}>
              <View style={styles.gridItem}>
                <MapPin size={14} color={Theme.colors.primary} />
                <Text style={styles.gridText}>{currentJob.location}</Text>
              </View>
              <View style={styles.gridItem}>
                <Briefcase size={14} color={Theme.colors.purple} />
                <Text style={styles.gridText}>{currentJob.jobType} ({currentJob.workMode || 'On-site'})</Text>
              </View>
              <View style={styles.gridItem}>
                <DollarSign size={14} color={Theme.colors.success} />
                <View>
                  <Text style={styles.gridText}>{currentJob.salary}</Text>
                  {currentJob.annualSalaryDisplay ? (
                    <Text style={{ fontSize: 10, color: Theme.colors.secondaryText }}>
                      {currentJob.annualSalaryDisplay}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.gridItem}>
                <Calendar size={14} color={Theme.colors.orange} />
                <Text style={styles.gridText}>{currentJob.postedDate || 'Recently'}</Text>
              </View>
            </View>
          </GlassCard>

          {/* Application Tracker if Applied */}
          {currentApplication && (
            <GlassCard style={styles.trackerCard}>
              <Text style={styles.trackerHeader}>APPLICATION STATUS TRACKER</Text>

              <View style={styles.timelineRow}>
                {steps.map((stepName, idx) => {
                  const activeIdx = getStatusStepIndex(currentApplication.status);
                  const isDone = idx <= activeIdx;

                  return (
                    <View key={stepName} style={styles.timelineStep}>
                      <View
                        style={[
                          styles.timelineCircle,
                          isDone && { backgroundColor: Theme.colors.success, borderColor: Theme.colors.success },
                        ]}
                      >
                        {isDone ? (
                          <CheckCircle2 size={12} color="#07111F" />
                        ) : (
                          <Text style={styles.stepNum}>{idx + 1}</Text>
                        )}
                      </View>
                      <Text style={[styles.stepLabel, isDone && styles.stepLabelDone]}>
                        {stepName}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          )}

          {/* Description & Requirements */}
          <Text style={styles.sectionTitle}>Job Description</Text>
          <GlassCard style={styles.descCard}>
            <Text style={styles.descText}>{currentJob.description}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 16, marginBottom: 8 }]}>Required Skills</Text>
            <View style={styles.skillsRow}>
              {(currentJob.skills || [currentJob.category || 'General']).map((skill, i) => (
                <View key={i} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Apply CTA */}
          {!currentApplication && (
            <TouchableOpacity
              onPress={() => setApplyModalVisible(true)}
              activeOpacity={0.85}
              style={styles.applyButton}
            >
              <LinearGradient
                colors={['#25E68A', '#2FD6FF', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyGradient}
              >
                <Text style={styles.applyButtonText}>Apply Now</Text>
                <Send size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Apply Modal */}
        <Modal
          visible={applyModalVisible}
          title="Apply for Position"
          onClose={() => setApplyModalVisible(false)}
        >
          <Text style={styles.modalSub}>
            Submit your application for <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{currentJob.title}</Text> at {currentJob.employerName}.
          </Text>

          <Text style={styles.inputLabel}>Cover Note (Optional)</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Introduce yourself and explain why you're a great fit..."
            placeholderTextColor={Theme.colors.secondaryText}
            value={coverNote}
            onChangeText={setCoverNote}
          />

          <TouchableOpacity
            onPress={handleApplySubmit}
            activeOpacity={0.85}
            disabled={isSubmitting}
            style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={['#25E68A', '#2FD6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>
                {isSubmitting ? 'Submitting Application...' : 'Confirm Application'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  employerCard: {
    padding: 16,
    marginBottom: 16,
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 16,
  },
  employerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  employerName: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  gridInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '46%',
  },
  gridText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  trackerCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: 'rgba(37, 230, 138, 0.25)',
  },
  trackerHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.success,
    letterSpacing: 1,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNum: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily,
  },
  stepLabelDone: {
    color: Theme.colors.success,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 10,
  },
  descCard: {
    padding: 16,
    marginBottom: 24,
  },
  descText: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    lineHeight: 22,
    fontFamily: Theme.typography.fontFamily,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.2)',
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  applyButton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  applyGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  modalSub: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Theme.typography.fontFamily,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#07111F',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
});
