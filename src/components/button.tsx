import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors, Gradients, Radius } from '@/constants/colors';

type Props = {
  title: string;
  onPress?: () => void;
  icon?: string;
  variant?: 'primary' | 'ghost' | 'danger';
  colors?: readonly [string, string];
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function tap() {
  if (Platform.OS !== 'web') {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }
}

export function Button({ title, onPress, icon, variant = 'primary', colors, loading, disabled, style }: Props) {
  const handle = () => {
    tap();
    onPress?.();
  };

  const isPrimary = variant === 'primary';
  const labelColor = isPrimary ? Colors.text : variant === 'danger' ? Colors.danger : Colors.text;

  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <>
          {icon ? <Text style={[styles.icon, { color: labelColor }]}>{icon}</Text> : null}
          <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        { opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}>
      {isPrimary ? (
        <LinearGradient
          colors={colors ?? Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.shadow]}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.base, variant === 'ghost' ? styles.ghost : styles.dangerBg]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  shadow: {
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ghost: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  dangerBg: { backgroundColor: Colors.dangerSoft, borderWidth: 1, borderColor: Colors.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 18 },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
});
