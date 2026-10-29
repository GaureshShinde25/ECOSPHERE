import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Briefcase,
  Plus,
  Users,
  MapPin,
  DollarSign,
  CheckCircle2,
  Edit3,
  Building2,
  Globe,
  Search,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Job, JobApplication, EmploymentType, WorkMode, SalaryPeriod } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { jobService } from '../../services/jobService';
import { Theme } from '../../theme';

const POPULAR_INDIAN_CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Nashik', state: 'Maharashtra' },
  { city: 'Nagpur', state: 'Maharashtra' },
  { city: 'Chiplun', state: 'Maharashtra' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Gurugram', state: 'Haryana' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Kochi', state: 'Kerala' },
];

const EMPLOYMENT_TYPES: { id: EmploymentType; label: string }[] = [
  { id: 'Full-time', label: 'Full-time' },
  { id: 'Part-time', label: 'Part-time' },
  { id: 'Contract', label: 'Contract' },
  { id: 'Temporary', label: 'Temporary' },
  { id: 'Internship', label: 'Internship' },
  { id: 'Apprenticeship', label: 'Apprenticeship' },
  { id: 'Freelance', label: 'Freelance' },
  { id: 'Gig Work', label: 'Gig Work' },
  { id: 'Small Tasks', label: 'Small Tasks' },
  { id: 'On-Demand Work', label: 'On-Demand Work' },
];

const WORK_MODES: { id: WorkMode; label: string }[] = [
  { id: 'On-site', label: 'On-site' },
  { id: 'Remote', label: 'Remote' },
  { id: 'Hybrid', label: 'Hybrid' },
];

const SALARY_PERIODS: { id: SalaryPeriod; label: string; unitLabel: string }[] = [
  { id: 'MONTHLY', label: 'Per month', unitLabel: '/month' },
  { id: 'YEARLY', label: 'Per year', unitLabel: '/year' },
  { id: 'HOURLY', label: 'Per hour', unitLabel: '/hour' },
  { id: 'DAILY', label: 'Per day', unitLabel: '/day' },
  { id: 'PROJECT', label: 'Per project/task', unitLabel: '/project' },
  { id: 'UNPAID', label: 'Unpaid', unitLabel: '' },
];

function formatIndianRupees(num: number): string {
  if (isNaN(num) || num < 0) return '₹0';
  return '₹' + Math.round(num).toLocaleString('en-IN');
}

export const SellerJobsScreen: React.FC = () => {
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [applicationsList, setApplicationsList] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants'>('jobs');
  const [createJobModal, setCreateJobModal] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  // Form error state
  const [formError, setFormError] = useState<string>('');

  // Editing job state (null for creation)
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Job form states
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState<EmploymentType>('Full-time');
  const [workMode, setWorkMode] = useState<WorkMode>('On-site');

  // Location form states
  const [citySearch, setCitySearch] = useState('');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [area, setArea] = useState('');
  const [isPanIndiaRemote, setIsPanIndiaRemote] = useState(false);

  // Salary form states
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>('MONTHLY');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  const fetchData = async () => {
    try {
      const [myJobsData, appData] = await Promise.all([
        jobService.getMyJobs().catch(() => []),
        jobService.getSellerApplications().catch(() => []),
      ]);
      setJobsList(myJobsData || []);
      setApplicationsList(appData || []);
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setJobTitle('');
    setDescription('');
    setJobType('Full-time');
    setWorkMode('On-site');
    setCity('Pune');
    setState('Maharashtra');
    setArea('');
    setIsPanIndiaRemote(false);
    setCitySearch('');
    setSalaryPeriod('MONTHLY');
    setSalaryMin('25000');
    setSalaryMax('40000');
    setFormError('');
    setCreateJobModal(true);
  };

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setJobTitle(job.title || '');
    setDescription(job.description || '');
    setJobType((job.jobType as EmploymentType) || 'Full-time');
    setWorkMode((job.workMode as WorkMode) || 'On-site');
    setCity(job.city || 'Pune');
    setState(job.state || 'Maharashtra');
    setArea(job.area || '');
    setIsPanIndiaRemote(job.location?.includes('Pan-India') || false);
    setCitySearch(job.city || '');
    setSalaryPeriod((job.salaryPeriod as SalaryPeriod) || 'MONTHLY');
    setSalaryMin(job.salaryMin !== undefined && job.salaryMin !== null ? String(job.salaryMin) : '');
    setSalaryMax(job.salaryMax !== undefined && job.salaryMax !== null ? String(job.salaryMax) : '');
    setFormError('');
    setCreateJobModal(true);
  };

  // Filter city suggestions based on search
  const filteredCitySuggestions = POPULAR_INDIAN_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Live calculation preview
  const getSalaryPreview = () => {
    if (salaryPeriod === 'UNPAID') {
      return { primary: 'Unpaid Position', annual: undefined };
    }

    const minNum = parseFloat(salaryMin.replace(/[^0-9.]/g, ''));
    const maxNum = parseFloat(salaryMax.replace(/[^0-9.]/g, ''));

    const minValid = !isNaN(minNum) && minNum >= 0;
    const maxValid = !isNaN(maxNum) && maxNum >= 0;

    if (!minValid && !maxValid) {
      return { primary: 'Enter min / max salary', annual: undefined };
    }

    const unit =
      salaryPeriod === 'MONTHLY'
        ? '/month'
        : salaryPeriod === 'YEARLY'
        ? '/year'
        : salaryPeriod === 'HOURLY'
        ? '/hour'
        : salaryPeriod === 'DAILY'
        ? '/day'
        : '/project';

    let rangeStr = '';
    if (minValid && maxValid && minNum !== maxNum) {
      rangeStr = `${formatIndianRupees(minNum)}–${formatIndianRupees(maxNum)}`;
    } else if (minValid) {
      rangeStr = formatIndianRupees(minNum);
    } else if (maxValid) {
      rangeStr = formatIndianRupees(maxNum);
    }

    const primary = `${rangeStr}${unit}`;

    let annual: string | undefined = undefined;
    if (salaryPeriod === 'MONTHLY') {
      const annMin = minValid ? minNum * 12 : undefined;
      const annMax = maxValid ? maxNum * 12 : undefined;
      let annStr = '';
      if (annMin !== undefined && annMax !== undefined && annMin !== annMax) {
        annStr = `${formatIndianRupees(annMin)}–${formatIndianRupees(annMax)}`;
      } else if (annMin !== undefined) {
        annStr = formatIndianRupees(annMin);
      } else if (annMax !== undefined) {
        annStr = formatIndianRupees(annMax);
      }
      annual = `Estimated annual equivalent: ${annStr}/year`;
    }

    return { primary, annual };
  };

  const salaryPreview = getSalaryPreview();

  const handleSaveJob = async () => {
    setFormError('');

    if (!jobTitle.trim()) {
      setFormError('Job Title is required.');
      return;
    }

    // Location validation
    if (workMode !== 'Remote' && !city.trim()) {
      setFormError('Please select or enter a city for on-site or hybrid positions.');
      return;
    }

    // Salary validation
    let minVal: number | undefined = undefined;
    let maxVal: number | undefined = undefined;

    if (salaryPeriod !== 'UNPAID') {
      const pMin = parseFloat(salaryMin.replace(/[^0-9.]/g, ''));
      const pMax = parseFloat(salaryMax.replace(/[^0-9.]/g, ''));

      if (isNaN(pMin) && isNaN(pMax)) {
        setFormError('Please enter a minimum or maximum salary offer.');
        return;
      }
      if (!isNaN(pMin) && pMin < 0) {
        setFormError('Minimum salary cannot be negative.');
        return;
      }
      if (!isNaN(pMax) && pMax < 0) {
        setFormError('Maximum salary cannot be negative.');
        return;
      }
      if (!isNaN(pMin) && !isNaN(pMax) && pMin > pMax) {
        setFormError('Minimum salary cannot exceed maximum salary.');
        return;
      }

      minVal = !isNaN(pMin) ? pMin : pMax;
      maxVal = !isNaN(pMax) ? pMax : pMin;
    } else {
      minVal = 0;
      maxVal = 0;
    }

    setSavingJob(true);

    try {
      const locationText =
        workMode === 'Remote' && isPanIndiaRemote
          ? 'Pan-India (Remote)'
          : [area.trim(), city.trim(), state.trim()].filter(Boolean).join(', ') || 'Pune, Maharashtra';

      const payload: any = {
        title: jobTitle.trim(),
        description: description.trim(),
        jobType,
        workMode,
        city: workMode === 'Remote' && isPanIndiaRemote ? 'Pan-India' : city.trim(),
        state: state.trim(),
        area: area.trim(),
        locationText,
        location: locationText,
        salaryMin: minVal,
        salaryMax: maxVal,
        salaryPeriod,
      };

      if (editingJob) {
        const updated = await jobService.updateJob(editingJob.id, payload);
        setJobsList((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
        Alert.alert('Job Updated', `Listing for "${updated.title}" updated successfully.`);
      } else {
        const created = await jobService.createJob(payload);
        setJobsList((prev) => [created, ...prev]);
        Alert.alert('Job Published', `Listing for "${created.title}" is now active.`);
      }

      setCreateJobModal(false);
      setEditingJob(null);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save job opening. Please try again.');
    } finally {
      setSavingJob(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Theme.colors.primary} />
          }
        >
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>Job & Hiring Management</Text>
            <Text style={styles.pageSub}>Publish opportunities and manage candidates across India</Text>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'jobs' && styles.tabBtnActive]}
              onPress={() => setActiveTab('jobs')}
            >
              <Briefcase size={16} color={activeTab === 'jobs' ? Theme.colors.primary : Theme.colors.secondaryText} />
              <Text style={[styles.tabText, activeTab === 'jobs' && styles.tabTextActive]}>
                Jobs ({jobsList.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'applicants' && styles.tabBtnActive]}
              onPress={() => setActiveTab('applicants')}
            >
              <Users size={16} color={activeTab === 'applicants' ? Theme.colors.primary : Theme.colors.secondaryText} />
              <Text style={[styles.tabText, activeTab === 'applicants' && styles.tabTextActive]}>
                Applicants ({applicationsList.length})
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={handleOpenCreateModal}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createGradient}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.createText}>Publish New Job Opening</Text>
            </LinearGradient>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Fetching hiring records...</Text>
            </View>
          ) : activeTab === 'jobs' ? (
            jobsList.length === 0 ? (
              <EmptyState
                icon={<Briefcase size={42} color={Theme.colors.secondaryText} />}
                title="No jobs posted yet"
                description="List gig opportunities, contract roles, or full-time positions for local workers."
                actionLabel="Publish First Job"
                onAction={handleOpenCreateModal}
              />
            ) : (
              <View style={styles.listContainer}>
                {jobsList.map((job) => (
                  <GlassCard key={job.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <TouchableOpacity
                        style={styles.editIconBtn}
                        onPress={() => handleOpenEditModal(job)}
                        activeOpacity={0.8}
                      >
                        <Edit3 size={14} color={Theme.colors.primary} />
                        <Text style={styles.editIconText}>Edit</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.pillsRow}>
                      <View style={styles.pillBadge}>
                        <MapPin size={11} color={Theme.colors.primary} />
                        <Text style={styles.pillBadgeText}>{job.location}</Text>
                      </View>
                      <View style={styles.pillBadge}>
                        <Briefcase size={11} color={Theme.colors.purple} />
                        <Text style={styles.pillBadgeText}>{job.jobType}</Text>
                      </View>
                      <View style={styles.pillBadge}>
                        <Building2 size={11} color={Theme.colors.orange} />
                        <Text style={styles.pillBadgeText}>{job.workMode || 'On-site'}</Text>
                      </View>
                    </View>

                    <Text style={styles.salaryText}>{job.salary}</Text>
                    {job.annualSalaryDisplay ? (
                      <Text style={styles.annualSalaryText}>{job.annualSalaryDisplay}</Text>
                    ) : null}

                    <View style={styles.cardFooter}>
                      <Text style={styles.applicantsCount}>{job.applicantsCount || 0} Applicants</Text>
                      <Text style={styles.postedDate}>{job.postedDate || 'Active'}</Text>
                    </View>
                  </GlassCard>
                ))}
              </View>
            )
          ) : applicationsList.length === 0 ? (
            <EmptyState
              icon={<Users size={42} color={Theme.colors.secondaryText} />}
              title="No candidates yet"
              description="Applications submitted by local jobseekers will appear here."
              actionLabel="Refresh Applications"
              onAction={handleRefresh}
            />
          ) : (
            <View style={styles.listContainer}>
              {applicationsList.map((app) => (
                <GlassCard key={app.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.applicantName}>{app.applicantName}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{app.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.jobAppliedFor}>Position: {app.jobTitle}</Text>
                  <Text style={styles.jobMeta}>📧 {app.applicantEmail} • 📞 {app.applicantPhone}</Text>
                  {app.coverNote ? <Text style={styles.coverNote}>"{app.coverNote}"</Text> : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.postedDate}>Applied on {app.appliedDate}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Modal for Creating / Editing Job */}
        <Modal
          visible={createJobModal}
          title={editingJob ? 'Edit Job Listing' : 'Publish New Job Listing'}
          onClose={() => !savingJob && setCreateJobModal(false)}
        >
          <ScrollView showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
            {formError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorBoxText}>{formError}</Text>
              </View>
            ) : null}

            {/* Job Title */}
            <Text style={styles.label}>Job Title *</Text>
            <TextInput
              style={styles.input}
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="e.g. Full Stack Developer, Store Manager, Solar Technician"
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* Employment Type */}
            <Text style={styles.label}>Employment Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {EMPLOYMENT_TYPES.map((t) => {
                const isSelected = jobType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setJobType(t.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <Check size={12} color="#040814" style={{ marginRight: 4 }} />}
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Work Mode */}
            <Text style={styles.label}>Work Mode *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {WORK_MODES.map((m) => {
                const isSelected = workMode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.chip, { flex: 1, justifyContent: 'center' }, isSelected && styles.chipActive]}
                    onPress={() => setWorkMode(m.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <Check size={12} color="#040814" style={{ marginRight: 4 }} />}
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Location Section */}
            <Text style={styles.sectionHeaderTitle}>WORK LOCATION</Text>

            {workMode === 'Remote' && (
              <TouchableOpacity
                style={[styles.checkboxRow, isPanIndiaRemote && styles.checkboxRowActive]}
                onPress={() => setIsPanIndiaRemote((prev) => !prev)}
                activeOpacity={0.8}
              >
                <Globe size={16} color={isPanIndiaRemote ? Theme.colors.primary : Theme.colors.secondaryText} />
                <Text style={[styles.checkboxText, isPanIndiaRemote && styles.checkboxTextActive]}>
                  Pan-India Remote (Available across all India)
                </Text>
              </TouchableOpacity>
            )}

            {(!isPanIndiaRemote || workMode !== 'Remote') && (
              <>
                <Text style={styles.label}>Search & Select City *</Text>
                <View style={styles.searchBoxInputRow}>
                  <Search size={16} color={Theme.colors.secondaryText} style={{ marginLeft: 10, marginRight: 6 }} />
                  <TextInput
                    style={styles.searchInputField}
                    value={citySearch}
                    onChangeText={(val) => {
                      setCitySearch(val);
                      setCity(val);
                    }}
                    placeholder="Type or select city (e.g. Pune, Nashik, Mumbai)..."
                    placeholderTextColor={Theme.colors.secondaryText}
                  />
                </View>

                {/* City Suggestions */}
                <Text style={styles.subLabel}>Popular Indian Hubs:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {filteredCitySuggestions.map((c) => {
                    const isSel = city.toLowerCase() === c.city.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={c.city}
                        style={[styles.chip, isSel && styles.chipActive]}
                        onPress={() => {
                          setCity(c.city);
                          setState(c.state);
                          setCitySearch(c.city);
                        }}
                        activeOpacity={0.8}
                      >
                        {isSel && <Check size={12} color="#040814" style={{ marginRight: 4 }} />}
                        <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{c.city}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.formInlineRow}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                      style={styles.input}
                      value={state}
                      onChangeText={setState}
                      placeholder="e.g. Maharashtra"
                      placeholderTextColor={Theme.colors.secondaryText}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 6 }}>
                    <Text style={styles.label}>Locality / Area (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={area}
                      onChangeText={setArea}
                      placeholder="e.g. Hinjewadi Phase 1"
                      placeholderTextColor={Theme.colors.secondaryText}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Salary Structure Section */}
            <Text style={styles.sectionHeaderTitle}>COMPENSATION & SALARY</Text>

            <Text style={styles.label}>Salary Period *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {SALARY_PERIODS.map((sp) => {
                const isSelected = salaryPeriod === sp.id;
                return (
                  <TouchableOpacity
                    key={sp.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSalaryPeriod(sp.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && <Check size={12} color="#040814" style={{ marginRight: 4 }} />}
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{sp.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {salaryPeriod !== 'UNPAID' && (
              <View style={styles.formInlineRow}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Text style={styles.label}>Min Salary (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={salaryMin}
                    onChangeText={setSalaryMin}
                    placeholder="e.g. 25000"
                    placeholderTextColor={Theme.colors.secondaryText}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.label}>Max Salary (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={salaryMax}
                    onChangeText={setSalaryMax}
                    placeholder="e.g. 40000"
                    placeholderTextColor={Theme.colors.secondaryText}
                  />
                </View>
              </View>
            )}

            {/* Real-time Salary Preview Card */}
            <View style={styles.salaryPreviewCard}>
              <Text style={styles.previewCardTitle}>SALARY DISPLAY PREVIEW</Text>
              <Text style={styles.previewPrimaryText}>{salaryPreview.primary}</Text>
              {salaryPreview.annual ? (
                <Text style={styles.previewAnnualText}>{salaryPreview.annual}</Text>
              ) : null}
            </View>

            {/* Job Description */}
            <Text style={styles.label}>Job Description</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="Key responsibilities, qualifications, work timing..."
              placeholderTextColor={Theme.colors.secondaryText}
            />

            {/* Save Submit Button */}
            <TouchableOpacity
              onPress={handleSaveJob}
              style={styles.saveBtn}
              disabled={savingJob}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                {savingJob ? (
                  <ActivityIndicator size="small" color="#040814" />
                ) : (
                  <Text style={styles.saveText}>
                    {editingJob ? 'Save Changes' : 'Publish Job Opening'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  topHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  pageSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 24, 40, 0.65)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  tabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  createBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  createGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createText: {
    color: '#07111F',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    fontFamily: Theme.typography.fontFamily,
  },
  editIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  editIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pillBadgeText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  jobAppliedFor: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginVertical: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  jobMeta: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  salaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.success,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  annualSalaryText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  coverNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Theme.colors.secondaryText,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  applicantsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  postedDate: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginTop: 14,
    marginBottom: 10,
    fontFamily: Theme.typography.fontFamily,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  subLabel: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 12,
  },
  formInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  chipTextActive: {
    color: '#040814',
    fontWeight: '800',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  checkboxRowActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  checkboxText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  checkboxTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBoxInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  searchInputField: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 10,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    fontSize: 13,
  },
  salaryPreviewCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  previewCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.success,
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  previewPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  previewAnnualText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    fontFamily: Theme.typography.fontFamily,
  },
  saveBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  saveGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    color: '#07111F',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
});
