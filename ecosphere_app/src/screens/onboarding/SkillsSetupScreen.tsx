import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search, Check, Wrench, Briefcase, Plus, X } from 'lucide-react-native';
import { OnboardingContainer } from '../../components/onboarding/OnboardingContainer';
import { skillIntelligenceService, CanonicalSkill } from '../../services/skillIntelligenceService';
import { Theme } from '../../theme';

// Master canonical skills matching backend SQL database taxonomy
const FALLBACK_CANONICAL_SKILLS: CanonicalSkill[] = [
  { skillId: 1, skillName: 'Communication', category: 'Business', isActive: true },
  { skillId: 2, skillName: 'Leadership', category: 'Business', isActive: true },
  { skillId: 3, skillName: 'Marketing', category: 'Business', isActive: true },
  { skillId: 4, skillName: 'Sales', category: 'Business', isActive: true },
  { skillId: 5, skillName: 'Accounting', category: 'Finance', isActive: true },
  { skillId: 6, skillName: 'Customer Service', category: 'Business', isActive: true },
  { skillId: 7, skillName: 'Graphic Design', category: 'Creative', isActive: true },
  { skillId: 8, skillName: 'UI/UX Design', category: 'Creative', isActive: true },
  { skillId: 9, skillName: 'Photography', category: 'Creative', isActive: true },
  { skillId: 10, skillName: 'Video Editing', category: 'Creative', isActive: true },
  { skillId: 11, skillName: 'Web Development', category: 'Technology', isActive: true },
  { skillId: 12, skillName: 'Mobile Development', category: 'Technology', isActive: true },
  { skillId: 13, skillName: 'Software Development', category: 'Technology', isActive: true },
  { skillId: 14, skillName: 'Data Analysis', category: 'Technology', isActive: true },
  { skillId: 15, skillName: 'Digital Marketing', category: 'Technology', isActive: true },
  { skillId: 16, skillName: 'Teaching', category: 'Education', isActive: true },
  { skillId: 17, skillName: 'Driving', category: 'Services', isActive: true },
  { skillId: 18, skillName: 'Electrical Work', category: 'Services', isActive: true },
  { skillId: 19, skillName: 'Plumbing', category: 'Services', isActive: true },
  { skillId: 20, skillName: 'Carpentry', category: 'Services', isActive: true },
  { skillId: 21, skillName: 'Cooking', category: 'Hospitality', isActive: true },
  { skillId: 22, skillName: 'Hair Styling', category: 'Beauty', isActive: true },
  { skillId: 23, skillName: 'Tailoring', category: 'Fashion', isActive: true },
  { skillId: 24, skillName: 'Machine Operation', category: 'Manufacturing', isActive: true },
];

export const WORK_PREFERENCE_OPTIONS = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Freelance',
  'Gig Work',
  'On-Demand Work',
];

interface SkillsSetupScreenProps {
  city?: string;
  initialSkills?: number[];
  initialWorkPreferences?: string[];
  onBack: () => void;
  onNext: (data: { skills: number[]; skillNames: string[]; workPreferences: string[] }) => void;
}

export const SkillsSetupScreen: React.FC<SkillsSetupScreenProps> = ({
  city = 'Kolkata',
  initialSkills = [11, 13],
  initialWorkPreferences = ['Full-Time', 'Freelance'],
  onBack,
  onNext,
}) => {
  const [allSkills, setAllSkills] = useState<CanonicalSkill[]>(FALLBACK_CANONICAL_SKILLS);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(initialSkills);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(initialWorkPreferences);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Attempt to fetch canonical skills with live demand metrics from backend
    const loadSkills = async () => {
      setLoading(true);
      try {
        const liveDemand = await skillIntelligenceService.getSkills(city);
        if (liveDemand && liveDemand.length > 0) {
          const mapped: CanonicalSkill[] = liveDemand.map((s) => ({
            skillId: s.skillId,
            skillName: s.skillName,
            category: s.category,
            isActive: true,
          }));
          setAllSkills(mapped);
        }
      } catch (err) {
        if (__DEV__) {
          console.log('[SkillsSetupScreen] Using canonical skills fallback');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [city]);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(allSkills.map((s) => s.category).filter(Boolean)))];

  const filteredSkills = allSkills.filter((s) => {
    const matchesSearch = s.skillName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSkill = (skillId: number) => {
    if (selectedSkillIds.includes(skillId)) {
      setSelectedSkillIds(selectedSkillIds.filter((id) => id !== skillId));
    } else {
      setSelectedSkillIds([...selectedSkillIds, skillId]);
    }
  };

  const togglePreference = (pref: string) => {
    if (selectedPreferences.includes(pref)) {
      if (selectedPreferences.length > 1) {
        setSelectedPreferences(selectedPreferences.filter((p) => p !== pref));
      }
    } else {
      setSelectedPreferences([...selectedPreferences, pref]);
    }
  };

  const handleContinue = () => {
    const selectedNames = allSkills
      .filter((s) => selectedSkillIds.includes(s.skillId))
      .map((s) => s.skillName);

    onNext({
      skills: selectedSkillIds,
      skillNames: selectedNames,
      workPreferences: selectedPreferences,
    });
  };

  return (
    <OnboardingContainer
      step={4}
      totalSteps={5}
      title="What can you do?"
      subtitle="Select your skills and work preferences to unlock relevant local opportunities."
      onBack={onBack}
      onPrimaryAction={handleContinue}
      primaryActionLabel="CONTINUE"
      primaryActionDisabled={selectedSkillIds.length === 0}
    >
      {/* Selected Skills Summary Pills */}
      {selectedSkillIds.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.sectionHeader}>
            SELECTED SKILLS ({selectedSkillIds.length})
          </Text>
          <View style={styles.selectedPillsContainer}>
            {selectedSkillIds.map((id) => {
              const skill = allSkills.find((s) => s.skillId === id);
              if (!skill) return null;
              return (
                <TouchableOpacity
                  key={id}
                  activeOpacity={0.7}
                  onPress={() => toggleSkill(id)}
                  style={styles.selectedPill}
                >
                  <Text style={styles.selectedPillText}>{skill.skillName}</Text>
                  <X size={14} color="#25E68A" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#8FA0B5" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search skills (e.g. Electrician, React, Marketing)..."
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Pills Slider */}
      <View style={styles.categoryScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.7}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Skills Chips Grid */}
      <View style={styles.skillsGrid}>
        {loading ? (
          <ActivityIndicator size="small" color="#25E68A" style={{ marginVertical: 20 }} />
        ) : (
          filteredSkills.map((skill) => {
            const isSelected = selectedSkillIds.includes(skill.skillId);

            return (
              <TouchableOpacity
                key={skill.skillId}
                activeOpacity={0.75}
                onPress={() => toggleSkill(skill.skillId)}
                style={[
                  styles.skillChip,
                  isSelected && styles.skillChipSelected,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <Text
                  style={[
                    styles.skillChipText,
                    isSelected && styles.skillChipTextSelected,
                  ]}
                >
                  {skill.skillName}
                </Text>
                {isSelected ? (
                  <Check size={14} color="#040814" strokeWidth={3} />
                ) : (
                  <Plus size={14} color="rgba(255,255,255,0.4)" />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Work Preferences Section */}
      <View style={styles.workPreferencesSection}>
        <View style={styles.workPrefHeaderRow}>
          <Briefcase size={16} color="#2FD6FF" />
          <Text style={styles.sectionHeader}>WHAT KIND OF WORK INTERESTS YOU?</Text>
        </View>
        <Text style={styles.workPrefSubtitle}>
          Select engagement models you are open to exploring.
        </Text>

        <View style={styles.prefGrid}>
          {WORK_PREFERENCE_OPTIONS.map((pref) => {
            const isSelected = selectedPreferences.includes(pref);

            return (
              <TouchableOpacity
                key={pref}
                activeOpacity={0.8}
                onPress={() => togglePreference(pref)}
                style={[
                  styles.prefCard,
                  isSelected && styles.prefCardSelected,
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <Text style={[styles.prefText, isSelected && styles.prefTextSelected]}>
                  {pref}
                </Text>
                <View
                  style={[
                    styles.prefCheckCircle,
                    isSelected && styles.prefCheckCircleSelected,
                  ]}
                >
                  {isSelected && <Check size={12} color="#040814" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </OnboardingContainer>
  );
};

const styles = StyleSheet.create({
  selectedSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(37, 230, 138, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.2)',
    borderRadius: 14,
    padding: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA0B5',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  selectedPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    borderWidth: 1,
    borderColor: '#25E68A',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  selectedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#25E68A',
    fontFamily: Theme.typography.fontFamily,
  },
  searchSection: {
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 32, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
    paddingVertical: 0,
  },
  categoryScrollWrapper: {
    marginBottom: 14,
  },
  categoryScrollContent: {
    gap: 8,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    borderColor: '#25E68A',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
  },
  categoryPillTextActive: {
    color: '#25E68A',
    fontWeight: '700',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 32, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  skillChipSelected: {
    backgroundColor: '#25E68A',
    borderColor: '#25E68A',
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  skillChipTextSelected: {
    color: '#040814',
    fontWeight: '800',
  },
  workPreferencesSection: {
    backgroundColor: 'rgba(11, 19, 32, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  workPrefHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workPrefSubtitle: {
    fontSize: 12,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 14,
  },
  prefGrid: {
    gap: 8,
  },
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  prefCardSelected: {
    borderColor: '#2FD6FF',
    backgroundColor: 'rgba(47, 214, 255, 0.08)',
  },
  prefText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  prefTextSelected: {
    color: '#2FD6FF',
    fontWeight: '700',
  },
  prefCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefCheckCircleSelected: {
    backgroundColor: '#2FD6FF',
    borderColor: '#2FD6FF',
  },
});
