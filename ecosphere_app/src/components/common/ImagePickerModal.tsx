import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  UploadCloud,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  X,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';
import { Modal } from './Modal';
import { uploadService } from '../../services/uploadService';
import { Theme } from '../../theme';

export interface ImagePickerModalProps {
  visible: boolean;
  title?: string;
  type?: 'product' | 'logo' | 'cover' | 'general';
  initialImageUrl?: string;
  onSelectImage: (imageUrl: string) => void;
  onClose: () => void;
}

// Curated verified catalog photographs for 1-tap selection
const PRESET_GALLERY = [
  // Grocery & Essentials
  {
    name: 'Raw Rice',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Wheat Flour',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Amul Milk',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Biscuits',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Maggi Noodles',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Fresh Bread',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Farm Eggs',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cooking Oil',
    category: 'Grocery',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  },
  // Mobile & Accessories
  {
    name: '5G Smartphone',
    category: 'Mobile',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Fast Charger',
    category: 'Mobile',
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Type-C Cable',
    category: 'Mobile',
    url: 'https://images.unsplash.com/photo-1608755728617-aefab37d45f6?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Power Bank',
    category: 'Mobile',
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Earbuds',
    category: 'Mobile',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  },
  // Electronics
  {
    name: 'Laptop',
    category: 'Electronics',
    url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Smart TV',
    category: 'Electronics',
    url: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Soundbar Speaker',
    category: 'Electronics',
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Security Camera',
    category: 'Electronics',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  },
  // Shop Logos & Covers
  {
    name: 'Modern Grocery Logo',
    category: 'Shop',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Mobile Hub Logo',
    category: 'Shop',
    url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Store Front Cover',
    category: 'Shop',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
  },
];

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  title = 'Select Image',
  type = 'product',
  initialImageUrl = '',
  onSelectImage,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('presets');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string>(initialImageUrl || '');
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [previewErrorMsg, setPreviewErrorMsg] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [galleryFilter, setGalleryFilter] = useState<string>('All');
  const [hasPreviewError, setHasPreviewError] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const prevVisibleRef = useRef<boolean>(false);

  const notifyAlert = (title: string, message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(title ? `${title}\n${message}` : message);
    } else {
      Alert.alert(title, message);
    }
  };

  const cleanupObjectUrl = () => {
    if (objectUrlRef.current) {
      if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = null;
    }
  };

  // Sync initial URL strictly when modal transitions from closed to open
  // This prevents window blur/focus or parent re-renders from wiping user selection
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setSelectedFile(null);
      setSelectedUrl(initialImageUrl || '');
      setPreviewUrl(initialImageUrl || null);
      setHasPreviewError(false);
      setPreviewErrorMsg('');
      setUrlError('');
    } else if (!visible && prevVisibleRef.current) {
      cleanupObjectUrl();
      setSelectedFile(null);
      setPreviewErrorMsg('');
      setUrlError('');
    }
    prevVisibleRef.current = visible;
  }, [visible, initialImageUrl]);

  useEffect(() => {
    return () => {
      cleanupObjectUrl();
    };
  }, []);

  const handleClose = () => {
    cleanupObjectUrl();
    setSelectedFile(null);
    setPreviewErrorMsg('');
    setUrlError('');
    onClose();
  };

  // Handle Web file selection (Section 2, 3, 4, 16, 17, 18)
  const handleWebFileSelect = (event: any) => {
    setPreviewErrorMsg('');
    const file: File | undefined = event.target?.files?.[0];

    // Reset input immediately so selecting the same file again triggers onChange (Section 16)
    if (event.target) {
      try {
        event.target.value = '';
      } catch {
        // safe fallback
      }
    }
    if (fileInputRef.current) {
      try {
        fileInputRef.current.value = '';
      } catch {
        // safe fallback
      }
    }

    if (!file) return;

    // Validate size and format (Section 17)
    const validation = uploadService.validateImageFile({
      size: file.size,
      type: file.type,
      name: file.name,
    });

    if (!validation.valid) {
      const errorMsg = validation.error || 'Please select a JPG, PNG, or WEBP image.';
      setPreviewErrorMsg(errorMsg);
      notifyAlert('Invalid Image', errorMsg);
      return;
    }

    try {
      const objUrl = URL.createObjectURL(file);
      cleanupObjectUrl();
      objectUrlRef.current = objUrl;

      // Dedicated state for selected browser File (Section 3)
      setSelectedFile(file);
      // Dedicated preview state (Section 4)
      setPreviewUrl(objUrl);
      setSelectedUrl(objUrl);
      setHasPreviewError(false);
      setPreviewErrorMsg('');

      // Development logging (Section 18)
      if (__DEV__) {
        console.log('Selected image:');
        console.log('name =', file.name);
        console.log('type =', file.type);
        console.log('size =', file.size);
        console.log('previewUrl =', objUrl);
      }
    } catch {
      const errorMsg = 'Unable to preview this image. Try another image.';
      setPreviewErrorMsg(errorMsg);
      notifyAlert('Preview Failed', errorMsg);
    }
  };

  const handleApplyPreset = (url: string) => {
    cleanupObjectUrl();
    setSelectedFile(null);
    setSelectedUrl(url);
    setPreviewUrl(url);
    setHasPreviewError(false);
    setPreviewErrorMsg('');
  };

  const handleApplyCustomUrl = () => {
    setUrlError('');
    setPreviewErrorMsg('');
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      const msg = 'Please enter a valid image URL.';
      setUrlError(msg);
      notifyAlert('Image URL Required', msg);
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      const msg = 'Image URL must begin with http:// or https://';
      setUrlError(msg);
      notifyAlert('Invalid URL', msg);
      return;
    }

    // Check if it's a webpage URL (e.g. .html, .htm, .php, etc.)
    const cleanPath = trimmed.split('?')[0].split('#')[0].toLowerCase();
    if (
      cleanPath.endsWith('.html') ||
      cleanPath.endsWith('.htm') ||
      cleanPath.endsWith('.php') ||
      cleanPath.endsWith('.asp') ||
      cleanPath.endsWith('.aspx')
    ) {
      const msg = 'This is a webpage URL, not a direct image URL.';
      setUrlError(msg);
      notifyAlert('Invalid URL', msg);
      return;
    }

    cleanupObjectUrl();
    setSelectedFile(null);
    setSelectedUrl(trimmed);
    setPreviewUrl(trimmed);
    setHasPreviewError(false);
    setPreviewErrorMsg('');
  };

  const handleConfirm = async () => {
    if (!selectedUrl && !selectedFile) {
      notifyAlert('Image Required', 'Please select or upload an image before proceeding.');
      return;
    }
    if (hasPreviewError) {
      notifyAlert('Invalid Image', 'The selected image could not be loaded. Please choose another valid image.');
      return;
    }

    // If local file was selected, upload via multipart FormData (Sections 3, 4, 7, 9, 10)
    if (selectedFile) {
      setUploading(true);
      try {
        if (__DEV__) {
          console.log('Upload:');
          console.log('filename =', selectedFile.name);
          console.log('mimetype =', selectedFile.type);
          console.log('size =', selectedFile.size);
        }

        const result = await uploadService.uploadImageFile(selectedFile, type);
        cleanupObjectUrl();
        setSelectedFile(null);
        onSelectImage(result.url);
        onClose();
      } catch (err: any) {
        notifyAlert('Upload Failed', err?.message || 'Unable to upload image. Try again.');
      } finally {
        setUploading(false);
      }
      return;
    }

    cleanupObjectUrl();
    if (selectedUrl) {
      onSelectImage(selectedUrl.trim());
    }
    onClose();
  };

  const filteredPresets = PRESET_GALLERY.filter((p) => {
    if (galleryFilter === 'All') return true;
    return p.category.toLowerCase() === galleryFilter.toLowerCase();
  });

  return (
    <Modal visible={visible} title={title} onClose={handleClose}>
      <View style={styles.container}>
        {/* Navigation Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'presets' && styles.tabBtnActive]}
            onPress={() => setActiveTab('presets')}
            activeOpacity={0.8}
          >
            <Sparkles size={15} color={activeTab === 'presets' ? Theme.colors.primary : Theme.colors.secondaryText} />
            <Text style={[styles.tabBtnText, activeTab === 'presets' && styles.tabBtnTextActive]}>
              Verified Photos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'upload' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upload')}
            activeOpacity={0.8}
          >
            <UploadCloud size={15} color={activeTab === 'upload' ? Theme.colors.primary : Theme.colors.secondaryText} />
            <Text style={[styles.tabBtnText, activeTab === 'upload' && styles.tabBtnTextActive]}>
              Upload File
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'url' && styles.tabBtnActive]}
            onPress={() => setActiveTab('url')}
            activeOpacity={0.8}
          >
            <LinkIcon size={15} color={activeTab === 'url' ? Theme.colors.primary : Theme.colors.secondaryText} />
            <Text style={[styles.tabBtnText, activeTab === 'url' && styles.tabBtnTextActive]}>
              Direct Image URL
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Presets Catalog */}
        {activeTab === 'presets' && (
          <View style={styles.tabContent}>
            {/* Category Filter Pills */}
            <View style={styles.filterPillsRow}>
              {['All', 'Grocery', 'Mobile', 'Electronics', 'Shop'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, galleryFilter === cat && styles.filterPillActive]}
                  onPress={() => setGalleryFilter(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterPillText, galleryFilter === cat && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.presetsGridScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.presetsGrid}>
                {filteredPresets.map((preset, index) => {
                  const isSelected = selectedUrl === preset.url;
                  return (
                    <TouchableOpacity
                      key={`${preset.name}-${index}`}
                      style={[styles.presetCard, isSelected && styles.presetCardSelected]}
                      onPress={() => handleApplyPreset(preset.url)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: preset.url }} style={styles.presetImage} resizeMode="cover" />
                      <View style={styles.presetNameOverlay}>
                        <Text style={styles.presetNameText} numberOfLines={1}>
                          {preset.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedCheckBadge}>
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Tab 2: Upload File */}
        {activeTab === 'upload' && (
          <View style={styles.tabContent}>
            <View style={styles.uploadBox}>
              <UploadCloud size={40} color={Theme.colors.primary} />
              <Text style={styles.uploadPromptTitle}>Choose image from device</Text>
              <Text style={styles.uploadPromptSub}>Supports JPEG, PNG, WEBP (Max 5MB)</Text>

              {Platform.OS === 'web' && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleWebFileSelect}
                />
              )}

              <TouchableOpacity
                style={styles.fileSelectFakeBtn}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  } else {
                    Alert.alert('Upload', 'Please select from the Verified Photos catalog or enter an image URL on this platform.');
                  }
                }}
                disabled={uploading}
                activeOpacity={0.8}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <ImageIcon size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.fileSelectFakeBtnText}>Browse & Upload Image</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tab 3: Custom Web URL */}
        {activeTab === 'url' && (
          <View style={styles.tabContent}>
            <Text style={styles.urlLabel}>Direct Image URL</Text>
            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                value={customUrlInput}
                onChangeText={setCustomUrlInput}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={Theme.colors.secondaryText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.urlApplyBtn}
                onPress={handleApplyCustomUrl}
                activeOpacity={0.8}
              >
                <Text style={styles.urlApplyBtnText}>Load</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.urlHelpText}>
              Paste a direct HTTPS link to a JPEG, PNG, or WEBP image.
            </Text>
            {urlError ? (
              <Text style={styles.urlErrorText}>{urlError}</Text>
            ) : null}
          </View>
        )}

        {/* Selected Image Preview Area (Section 6 & 7) */}
        {previewUrl ? (
          <View style={styles.previewSection}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.previewLabel}>Image Preview</Text>
              <TouchableOpacity
                style={styles.changeImageTextBtn}
                onPress={() => {
                  if (activeTab === 'upload' && Platform.OS === 'web') {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                      fileInputRef.current.click();
                    }
                  } else {
                    cleanupObjectUrl();
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setSelectedUrl('');
                    setPreviewErrorMsg('');
                  }
                }}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color={Theme.colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.changeImageText}>Change Image</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewBox}>
              {Platform.OS === 'web' ? (
                <img
                  src={previewUrl}
                  alt="Selected image preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 12,
                    display: 'block',
                  }}
                  onError={() => {
                    setHasPreviewError(true);
                    setPreviewErrorMsg('Unable to preview this image. Try another image.');
                  }}
                  onLoad={() => {
                    setHasPreviewError(false);
                    setPreviewErrorMsg('');
                  }}
                />
              ) : (
                <Image
                  source={{ uri: previewUrl }}
                  style={styles.previewImage}
                  resizeMode="cover"
                  onError={() => {
                    setHasPreviewError(true);
                    setPreviewErrorMsg('Unable to preview this image. Try another image.');
                  }}
                  onLoad={() => {
                    setHasPreviewError(false);
                    setPreviewErrorMsg('');
                  }}
                />
              )}
              {hasPreviewError && (
                <View style={styles.previewErrorOverlay}>
                  <X size={20} color="#EF4444" />
                  <Text style={styles.previewErrorText}>
                    {previewErrorMsg || 'Unable to preview this image. Try another image.'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : previewErrorMsg ? (
          <View style={[styles.emptyPreviewBox, styles.errorPreviewBox]}>
            <AlertCircle size={22} color="#EF4444" style={{ marginBottom: 4 }} />
            <Text style={styles.previewErrorBoxText}>{previewErrorMsg}</Text>
          </View>
        ) : (
          <View style={styles.emptyPreviewBox}>
            <ImageIcon size={28} color={Theme.colors.secondaryText} />
            <Text style={styles.emptyPreviewText}>No image selected yet</Text>
          </View>
        )}

        {/* Modal Action Buttons (Section 9 & 10) */}
        <View style={styles.modalActionsRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.75}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.applyBtn,
              (!selectedUrl && !selectedFile || hasPreviewError || uploading) && styles.applyBtnDisabled,
            ]}
            onPress={handleConfirm}
            disabled={(!selectedUrl && !selectedFile) || hasPreviewError || uploading}
            activeOpacity={0.85}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
            ) : (
              <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.applyBtnText}>
              {uploading ? 'Uploading...' : 'Use This Image'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#0F1A2C',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  tabBtnTextActive: {
    color: Theme.colors.primary,
  },
  tabContent: {
    marginBottom: 12,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#131F33',
  },
  filterPillActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterPillText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetsGridScroll: {
    maxHeight: 180,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  presetCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#0B1320',
  },
  presetCardSelected: {
    borderColor: Theme.colors.primary,
  },
  presetImage: {
    width: '100%',
    height: '100%',
  },
  presetNameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(5, 10, 20, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  presetNameText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  uploadPromptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  uploadPromptSub: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: 14,
  },
  fileInputWrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
  },
  fileSelectFakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  fileSelectFakeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  urlLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.secondaryText,
    marginBottom: 6,
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#0F1A2C',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  urlApplyBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlApplyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  urlHelpText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 6,
  },
  previewSection: {
    marginTop: 8,
    marginBottom: 14,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  changeImageTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeImageText: {
    fontSize: 11,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  previewBox: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0B1320',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewErrorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(11, 19, 32, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  previewErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyPreviewBox: {
    height: 70,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyPreviewText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 4,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  urlErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  errorPreviewBox: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  previewErrorBoxText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
