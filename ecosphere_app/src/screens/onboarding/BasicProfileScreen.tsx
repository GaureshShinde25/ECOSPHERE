import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { User, Mail, Phone, Briefcase, FileText, GraduationCap, Camera } from 'lucide-react-native';
import { OnboardingContainer } from '../../components/onboarding/OnboardingContainer';
import { profileService, UserProfile } from '../../services/profileService';
import { authService } from '../../services/authService';
import { Theme } from '../../theme';

export interface BasicProfileData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  occupation: string;
  bio: string;
  education: string;
}

interface BasicProfileScreenProps {
  initialData?: Partial<BasicProfileData>;
  onBack: () => void;
  onNext: (data: BasicProfileData) => void;
}

export const BasicProfileScreen: React.FC<BasicProfileScreenProps> = ({
  initialData,
  onBack,
  onNext,
}) => {
  const [firstName, setFirstName] = useState<string>(initialData?.firstName || '');
  const [lastName, setLastName] = useState<string>(initialData?.lastName || '');
  const [email, setEmail] = useState<string>(initialData?.email || '');
  const [mobile, setMobile] = useState<string>(initialData?.mobile || '');
  const [occupation, setOccupation] = useState<string>(initialData?.occupation || '');
  const [bio, setBio] = useState<string>(initialData?.bio || '');
  const [education, setEducation] = useState<string>(initialData?.education || '');

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});

  useEffect(() => {
    // Pre-populate with existing server profile or auth session
    const loadExistingProfile = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          if (!email && currentUser.email) setEmail(currentUser.email);
          if (!mobile && currentUser.phone) setMobile(currentUser.phone);
          if (!firstName && currentUser.name) {
            const parts = currentUser.name.trim().split(' ');
            setFirstName(parts[0] || '');
            if (parts.length > 1) setLastName(parts.slice(1).join(' '));
          }
        }

        const profile: UserProfile = await profileService.getProfile();
        if (profile) {
          if (profile.firstName && !initialData?.firstName) setFirstName(profile.firstName);
          if (profile.lastName && !initialData?.lastName) setLastName(profile.lastName);
          if (profile.email && !initialData?.email) setEmail(profile.email);
          if (profile.phone && !initialData?.mobile) setMobile(profile.phone);
          if (profile.occupation && !initialData?.occupation) setOccupation(profile.occupation);
          if (profile.bio && !initialData?.bio) setBio(profile.bio);
          if (profile.education && !initialData?.education) setEducation(profile.education);
        }
      } catch (err) {
        // Fallback to initialData or auth session if profile call fails
        if (__DEV__) {
          console.log('[BasicProfileScreen] Profile fetch error, using session fallback');
        }
      }
    };

    loadExistingProfile();
  }, []);

  const validate = (): boolean => {
    const newErrors: { firstName?: string; lastName?: string } = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;

    setLoading(true);
    const profilePayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      bio: bio.trim(),
      occupation: occupation.trim(),
      education: education.trim(),
    };

    try {
      // Real backend persistence via PUT /api/profile
      await profileService.updateProfile(profilePayload);
    } catch (err) {
      if (__DEV__) {
        console.warn('[BasicProfileScreen] Profile save warning:', err);
      }
      // If network fails, still allow user to continue without blocking onboarding flow
    } finally {
      setLoading(false);
      onNext({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        occupation: occupation.trim(),
        bio: bio.trim(),
        education: education.trim(),
      });
    }
  };

  const initials = `${firstName.charAt(0) || 'E'}${lastName.charAt(0) || 'C'}`.toUpperCase();

  return (
    <OnboardingContainer
      step={1}
      totalSteps={5}
      title="Let's build your ECOSPHERE profile"
      subtitle="Tell us a little about yourself so we can personalize your experience."
      onBack={onBack}
      onPrimaryAction={handleContinue}
      primaryActionLabel="CONTINUE"
      primaryActionLoading={loading}
    >
      {/* Avatar Presentation */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarGlowRing}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.avatarHint}>
          {firstName.trim() ? `${firstName.trim()} ${lastName.trim()}`.trim() : 'Your Profile Identity'}
        </Text>
      </View>

      {/* Form Fields */}
      <View style={styles.formContainer}>
        {/* Name Fields Row */}
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>
              FIRST NAME <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                errors.firstName ? styles.inputWrapperError : null,
              ]}
            >
              <User size={18} color={errors.firstName ? '#EF4444' : '#25E68A'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={(val) => {
                  setFirstName(val);
                  if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                placeholder="First name"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>
            {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
          </View>

          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>
              LAST NAME <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                errors.lastName ? styles.inputWrapperError : null,
              ]}
            >
              <User size={18} color={errors.lastName ? '#EF4444' : '#25E68A'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={(val) => {
                  setLastName(val);
                  if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                placeholder="Last name"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                returnKeyType="next"
                autoCapitalize="words"
              />
            </View>
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
          </View>
        </View>

        {/* Confirmed Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
          <View style={[styles.inputWrapper, styles.readOnlyInput]}>
            <Mail size={18} color="#2FD6FF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.readOnlyText]}
              value={email}
              editable={false}
              placeholder="user@ecosphere.com"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>CONFIRMED</Text>
            </View>
          </View>
        </View>

        {/* Confirmed Phone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
          <View style={[styles.inputWrapper, styles.readOnlyInput]}>
            <Phone size={18} color="#2FD6FF" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.readOnlyText]}
              value={mobile ? (mobile.startsWith('+91') ? mobile : `+91 ${mobile}`) : '+91 9876543210'}
              editable={false}
              placeholder="+91 98765 43210"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>CONFIRMED</Text>
            </View>
          </View>
        </View>

        {/* Occupation */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>OCCUPATION / TITLE</Text>
          <View style={styles.inputWrapper}>
            <Briefcase size={18} color="#8FA0B5" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="e.g. Electrician, Software Engineer, Merchant"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              maxLength={100}
            />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>BIO / SHORT SUMMARY</Text>
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>
          <View style={[styles.inputWrapper, styles.multilineWrapper]}>
            <FileText size={18} color="#8FA0B5" style={[styles.inputIcon, { marginTop: 4 }]} />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell your local community what you do or what you're looking for..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Education (Optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>EDUCATION (OPTIONAL)</Text>
          <View style={styles.inputWrapper}>
            <GraduationCap size={18} color="#8FA0B5" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={education}
              onChangeText={setEducation}
              placeholder="e.g. B.Tech / Diploma / Vocational Certification"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              maxLength={100}
            />
          </View>
        </View>
      </View>
    </OnboardingContainer>
  );
};

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarGlowRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    borderWidth: 1.5,
    borderColor: '#25E68A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    backgroundColor: '#0B1320',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#25E68A',
    fontFamily: Theme.typography.fontFamily,
    letterSpacing: 1,
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  formContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  fieldGroup: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA0B5',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  requiredStar: {
    color: '#EF4444',
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: Theme.typography.fontFamily,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 32, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
  },
  readOnlyInput: {
    backgroundColor: 'rgba(11, 19, 32, 0.45)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  readOnlyText: {
    color: '#8FA0B5',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
    paddingVertical: 0,
  },
  multilineWrapper: {
    height: 84,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  multilineInput: {
    height: '100%',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.25)',
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#25E68A',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
});
