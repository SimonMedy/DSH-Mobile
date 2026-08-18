import React from 'react';
import {Alert, Linking, Pressable, ScrollView, Text, View} from 'react-native';
import {
  ChevronLeft,
  Code2,
  ExternalLink,
  Globe,
  LockKeyhole,
  Palette,
  Trash2,
} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppState} from '../../../app/AppStateProvider';
import {useAppTheme} from '../../../app/ThemeProvider';
import {
  APP_GITHUB_URL,
  APP_NAME,
  APP_VERSION,
  DSH_GITHUB_URL,
  DSH_WEBSITE_URL,
} from '../../../config/appConfig';
import {BrandMark} from '../../../shared/components/BrandMark';
import {IconButton} from '../../../shared/components/IconButton';
import {Screen} from '../../../shared/components/Screen';
import {SectionCard} from '../../../shared/components/SectionCard';
import {SegmentedControl} from '../../../shared/components/SegmentedControl';
import type {RootStackParamList} from '../../../navigation/types';

export function SettingsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Settings'>) {
  const {colors} = useAppTheme();
  const {snapshot, setTheme, setLaunch, resetLocalData} = useAppState();
  const open = (url: string) =>
    void Linking.openURL(url).catch(error =>
      console.warn('Could not open URL', error),
    );

  return (
    <Screen>
      <View className="flex-row items-center px-4 pb-2 pt-1">
        <IconButton label="Back" onPress={() => navigation.goBack()}>
          <ChevronLeft size={23} color={colors.text} />
        </IconButton>
        <Text
          className="ml-2 flex-1"
          style={{color: colors.text, fontSize: 18, fontWeight: '800'}}>
          Settings
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 44,
        }}>
        <View className="gap-7">
          <View className="gap-2">
            <Text
              style={{
                color: colors.text,
                fontSize: 27,
                fontWeight: '800',
                letterSpacing: -0.6,
              }}>
              Make it yours
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14.5,
                lineHeight: 21,
              }}>
              Only mobile-client preferences live here. Harness settings stay
              inside the official DSH interface.
            </Text>
          </View>

          <SectionCard title="Appearance">
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Palette size={20} color={colors.brand} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14.5,
                    fontWeight: '700',
                  }}>
                  Theme
                </Text>
              </View>
              <SegmentedControl
                value={snapshot.preferences.theme}
                options={
                  [
                    {value: 'system', label: 'System'},
                    {value: 'light', label: 'Light'},
                    {value: 'dark', label: 'Dark'},
                  ] as const
                }
                onChange={setTheme}
              />
            </View>
          </SectionCard>

          <SectionCard title="Launch behavior">
            <SegmentedControl
              value={snapshot.preferences.launch}
              options={
                [
                  {value: 'servers', label: 'Server list'},
                  {value: 'default', label: 'Default server'},
                ] as const
              }
              onChange={setLaunch}
            />
          </SectionCard>

          <SectionCard title="Security">
            <View className="flex-row items-start gap-3">
              <LockKeyhole size={20} color={colors.brand} />
              <Text
                style={{
                  flex: 1,
                  color: colors.textSecondary,
                  fontSize: 13.5,
                  lineHeight: 20,
                }}>
                Server profiles are stored locally and contain no credentials.
                DSH Mobile never disables TLS validation and does not inject a
                JavaScript bridge into Harness pages.
              </Text>
            </View>
          </SectionCard>

          <SectionCard title="Local data">
            <View className="gap-3">
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 13.5,
                  lineHeight: 20,
                }}>
                Remove all saved server profiles and DSH Mobile preferences from
                this device. Harness data on your servers is never touched.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Reset DSH Mobile local data"
                onPress={() => {
                  Alert.alert(
                    'Reset local data?',
                    'All saved servers and mobile preferences will be removed from this device. Your Harness servers are not changed.',
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: () => {
                          void resetLocalData()
                            .then(() => navigation.popToTop())
                            .catch(error => {
                              console.error(
                                'Could not reset local data',
                                error,
                              );
                              Alert.alert(
                                'Reset failed',
                                'DSH Mobile could not clear its local data. Please try again.',
                              );
                            });
                        },
                      },
                    ],
                  );
                }}
                className="flex-row items-center gap-2 self-start py-1">
                <Trash2 size={16} color={colors.danger} />
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: 14,
                    fontWeight: '700',
                  }}>
                  Reset local data
                </Text>
              </Pressable>
            </View>
          </SectionCard>

          <SectionCard title="About">
            <View className="gap-4">
              <View className="flex-row items-center gap-3">
                <BrandMark size={36} />
                <View>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 15,
                      fontWeight: '700',
                    }}>
                    {APP_NAME}
                  </Text>
                  <Text style={{color: colors.textTertiary, fontSize: 12.5}}>
                    Version {APP_VERSION} · Unofficial community client
                  </Text>
                </View>
              </View>
              <LinkRow
                label="DeepSeek Harness"
                icon={Globe}
                onPress={() => open(DSH_WEBSITE_URL)}
              />
              <LinkRow
                label="Official Harness GitHub"
                icon={Code2}
                onPress={() => open(DSH_GITHUB_URL)}
              />
              <LinkRow
                label="DSH Mobile on GitHub"
                icon={Code2}
                onPress={() => open(APP_GITHUB_URL)}
              />
            </View>
          </SectionCard>
        </View>
      </ScrollView>
    </Screen>
  );
}

function LinkRow({
  label,
  onPress,
  icon: IconComponent,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentType<{size?: number; color?: string}>;
}) {
  const {colors} = useAppTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      className="flex-row items-center gap-2 py-1">
      {IconComponent ? <IconComponent size={14} color={colors.brand} /> : null}
      <Text style={{color: colors.brand, fontSize: 14, fontWeight: '600'}}>
        {label}
      </Text>
      <ExternalLink size={14} color={colors.brand} />
    </Pressable>
  );
}
