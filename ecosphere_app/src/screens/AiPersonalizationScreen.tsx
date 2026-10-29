import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Sparkles, ArrowRight, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../theme';

interface AiPersonalizationScreenProps {
  onComplete: (preferences: string[]) => void;
}

export default function AiPersonalizationScreen({ onComplete }: AiPersonalizationScreenProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Jobs',
    'Business',
    'Services',
  ]);

  const categories = [
    { id: 'Jobs', label: 'Jobs & Employment', desc: 'Find local hiring opportunities' },
    { id: 'Business', label: 'Business Growth', desc: 'Sellers, products & revenue' },
    { id: 'Services', label: 'Services & Trades', desc: 'Electricians, plumbers, repair' },
    { id: 'Shopping', label: 'Local Shopping', desc: 'Discover nearby products' },
    { id: 'Investment', label: 'Local Investment', desc: 'Economic assets & leasing' },
    { id: 'Community', label: 'Community Feed', desc: 'Events & local discussions' },
    { id: 'Learning', label: 'Skill Learning', desc: 'Courses & certifications' },
    { id: 'Opportunities', label: 'AI Opportunities', desc: 'High growth node alerts' },
  ];

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter((item) => item !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleFinish = () => {
    onComplete(selectedCategories);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <View style={styles.aiBadge}>
              <Sparkles size={14} color={Theme.colors.primary} />
              <Text style={styles.aiBadgeText}>AI Intelligence Engine</Text>
            </View>

            <Text style={styles.title}>What do you care about?</Text>
            <Text style={styles.subtitle}>
              Select your primary economic interests so ECOSPHERE AI can curate your personalized dashboard.
            </Text>
          </View>

          <View style={styles.grid}>
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);

              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.8}
                  onPress={() => toggleCategory(cat.id)}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.catTitle, isSelected && styles.catTitleSelected]}>
                      {cat.label}
                    </Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Check size={12} color="#07111F" strokeWidth={3} />}
                    </View>
                  </View>
                  <Text style={styles.catDesc}>{cat.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleFinish}
            activeOpacity={0.85}
            style={styles.personalizeBtn}
          >
            <LinearGradient
              colors={['#25E68A', '#2FD6FF', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            >
              <Text style={styles.personalizeText}>Personalize My ECOSPHERE</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

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
    paddingVertical: 24,
  },
  topHeader: {
    marginBottom: 24,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  grid: {
    gap: 12,
    marginBottom: 28,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 24, 40, 0.65)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(47, 214, 255, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  catTitleSelected: {
    color: Theme.colors.primary,
  },
  catDesc: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  personalizeBtn: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  personalizeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
});
