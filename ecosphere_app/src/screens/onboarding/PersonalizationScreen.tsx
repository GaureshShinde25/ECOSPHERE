import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  Briefcase,
  Wrench,
  ShoppingBag,
  TrendingUp,
  Store,
  Users,
  GraduationCap,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { OnboardingContainer } from '../../components/onboarding/OnboardingContainer';
import { UserRole } from '../../types';
import { Theme } from '../../theme';

interface PersonalizationScreenProps {
  role?: UserRole;
  initialInterests?: string[];
  onBack: () => void;
  onNext: (interests: string[]) => void;
}

export interface InterestOption {
  id: string;
  label: string;
  desc: string;
  icon: any;
  roleHint?: 'customer' | 'seller' | 'all';
}

export const ECONOMIC_INTERESTS: InterestOption[] = [
  {
    id: 'Jobs',
    label: 'Find Jobs & Gigs',
    desc: 'Local hiring, shifts, contract & on-demand work',
    icon: Briefcase,
    roleHint: 'all',
  },
  {
    id: 'Services',
    label: 'Services & Trades',
    desc: 'Electricians, plumbers, tech repair & home specialists',
    icon: Wrench,
    roleHint: 'customer',
  },
  {
    id: 'Shopping',
    label: 'Hyper-Local Shopping',
    desc: 'Neighborhood products, deals & fast local delivery',
    icon: ShoppingBag,
    roleHint: 'customer',
  },
  {
    id: 'Business',
    label: 'Grow My Business',
    desc: 'Online storefront, inventory, local reach & customer base',
    icon: Store,
    roleHint: 'seller',
  },
  {
    id: 'OfferServices',
    label: 'Offer My Services',
    desc: 'Accept bookings, showcase expertise & build clientele',
    icon: Users,
    roleHint: 'all',
  },
  {
    id: 'Opportunities',
    label: 'AI Economic Alerts',
    desc: 'Real-time market gaps, supply shortages & high-demand signals',
    icon: TrendingUp,
    roleHint: 'all',
  },
  {
    id: 'Learning',
    label: 'Skill Learning & Training',
    desc: 'Canonical skills, certifications & career advancement',
    icon: GraduationCap,
    roleHint: 'all',
  },
  {
    id: 'Community',
    label: 'Community Network',
    desc: 'Local events, discussions & collaborative ecosystem hubs',
    icon: Sparkles,
    roleHint: 'all',
  },
];

export const PersonalizationScreen: React.FC<PersonalizationScreenProps> = ({
  role = 'customer',
  initialInterests,
  onBack,
  onNext,
}) => {
  // Determine role-smart defaults
  const getDefaultInterests = (): string[] => {
    if (initialInterests && initialInterests.length > 0) {
      return initialInterests;
    }
    if (role === 'seller') {
      return ['Business', 'Opportunities', 'OfferServices'];
    }
    return ['Services', 'Jobs', 'Shopping'];
  };

  const [selectedInterests, setSelectedInterests] = useState<string[]>(getDefaultInterests());

  const toggleInterest = (id: string) => {
    if (selectedInterests.includes(id)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((item) => item !== id));
      }
    } else {
      setSelectedInterests([...selectedInterests, id]);
    }
  };

  const handleContinue = () => {
    onNext(selectedInterests);
  };

  return (
    <OnboardingContainer
      step={3}
      totalSteps={5}
      title="What do you want from ECOSPHERE?"
      subtitle="Personalize your local economic stream and AI recommendations."
      onBack={onBack}
      onPrimaryAction={handleContinue}
      primaryActionLabel="CONTINUE"
      primaryActionDisabled={selectedInterests.length === 0}
    >
      {/* Role Context Tag */}
      <View style={styles.roleContextBanner}>
        <Sparkles size={14} color="#25E68A" />
        <Text style={styles.roleContextText}>
          Personalizing for <Text style={styles.roleName}>{role.toUpperCase()}</Text> mode. Choose one or more goals.
        </Text>
      </View>

      {/* Selectable Cards Grid */}
      <View style={styles.cardsContainer}>
        {ECONOMIC_INTERESTS.map((item) => {
          const isSelected = selectedInterests.includes(item.id);
          const IconComponent = item.icon;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => toggleInterest(item.id)}
              style={[
                styles.card,
                isSelected && styles.cardSelected,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={item.label}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    isSelected ? styles.iconBoxSelected : styles.iconBoxUnselected,
                  ]}
                >
                  <IconComponent
                    size={22}
                    color={isSelected ? '#25E68A' : '#8FA0B5'}
                  />
                </View>

                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && <Check size={14} color="#040814" strokeWidth={3} />}
                </View>
              </View>

              <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                {item.label}
              </Text>
              <Text style={styles.cardDesc}>{item.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingContainer>
  );
};

const styles = StyleSheet.create({
  roleContextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  roleContextText: {
    fontSize: 12,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
    flex: 1,
  },
  roleName: {
    color: '#25E68A',
    fontWeight: '800',
  },
  cardsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(11, 19, 32, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
  },
  cardSelected: {
    borderColor: '#25E68A',
    backgroundColor: 'rgba(37, 230, 138, 0.06)',
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#25E68A',
    borderColor: '#25E68A',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: '#25E68A',
  },
  cardDesc: {
    fontSize: 13,
    color: '#8FA0B5',
    lineHeight: 18,
    fontFamily: Theme.typography.fontFamily,
  },
});
