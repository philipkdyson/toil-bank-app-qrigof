
import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function NotFoundScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const themeColors = isDark ? colors.dark : colors.light;

    return (
        <>
            <Stack.Screen options={{ title: 'Oops!' }} />
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                <IconSymbol
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="warning"
                    size={64}
                    color={themeColors.warning}
                />
                <Text style={[styles.title, { color: themeColors.text }]}>
                    This screen doesn&apos;t exist.
                </Text>
                <Link href="/(tabs)/(home)/" style={styles.link}>
                    <Text style={[styles.linkText, { color: themeColors.primary }]}>
                        Go to home screen
                    </Text>
                </Link>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    link: {
        marginTop: 15,
        paddingVertical: 15,
    },
    linkText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
