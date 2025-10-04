import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
};

const PURPLE = '#8A2BE2';

function TagChipBase({ label, selected = false, onPress, style, testID }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`tag ${label}${selected ? ' selected' : ''}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSel : styles.chipNorm,
        pressed && styles.chipPressed,
        style,
      ]}
      testID={testID}
    >
      <Text style={selected ? styles.txtSel : styles.txtNorm}>#{label}</Text>
    </Pressable>
  );
}

export default memo(TagChipBase);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  chipNorm: { backgroundColor: '#E8E8EE' },
  chipSel: { backgroundColor: PURPLE },
  chipPressed: { opacity: 0.85 },
  txtNorm: { color: '#333', fontWeight: '600' },
  txtSel: { color: '#fff', fontWeight: '700' },
});
