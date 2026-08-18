import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, FlatList, RefreshControl, Text, View} from 'react-native';
import {Plus, Settings2} from 'lucide-react-native';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppTheme} from '../../../app/ThemeProvider';
import {useAppState} from '../../../app/AppStateProvider';
import {BrandMark} from '../../../shared/components/BrandMark';
import {AppButton} from '../../../shared/components/AppButton';
import {IconButton} from '../../../shared/components/IconButton';
import {Screen} from '../../../shared/components/Screen';
import {DeepSeekWhaleIcon} from '../../../shared/components/DeepSeekWhaleIcon';
import type {RootStackParamList} from '../../../navigation/types';
import {ServerCard} from '../components/ServerCard';

export function ServerListScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Servers'>) {
  const {colors, isDark} = useAppTheme();
  const {servers, testConnection, hydrationError, resetLocalData} =
    useAppState();
  const [refreshing, setRefreshing] = useState(false);
  const autoCheckedServerIds = useRef(new Set<string>());

  useEffect(() => {
    const pending = servers.filter(
      server =>
        server.status === 'unknown' &&
        !autoCheckedServerIds.current.has(server.id),
    );
    if (pending.length === 0) return;

    for (const server of pending) autoCheckedServerIds.current.add(server.id);
    void Promise.allSettled(pending.map(server => testConnection(server.id)));
  }, [servers, testConnection]);

  const refresh = useCallback(async () => {
    if (servers.length === 0) return;
    setRefreshing(true);
    try {
      await Promise.all(servers.map(server => testConnection(server.id)));
    } finally {
      setRefreshing(false);
    }
  }, [servers, testConnection]);

  return (
    <Screen>
      <View className="flex-row items-center px-5 pb-3 pt-2">
        <View className="flex-1 flex-row items-center gap-3">
          <BrandMark />
          <View>
            <View className="flex-row items-center gap-2">
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '800',
                  letterSpacing: -0.3,
                }}>
                DSH Mobile
              </Text>
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: colors.brandSoft,
                  borderWidth: 1,
                  borderColor: isDark
                    ? 'rgba(103, 153, 254, 0.3)'
                    : 'rgba(77, 107, 254, 0.2)',
                }}>
                <Text
                  style={{
                    color: colors.brand,
                    fontSize: 9.5,
                    fontWeight: '700',
                    letterSpacing: 0.6,
                  }}>
                  CLIENT
                </Text>
              </View>
            </View>
            <Text style={{color: colors.textTertiary, fontSize: 12}}>
              Dive deep, wherever you are
            </Text>
          </View>
        </View>
        <IconButton
          label="Settings"
          onPress={() => navigation.navigate('Settings')}>
          <Settings2 size={20} color={colors.textSecondary} />
        </IconButton>
      </View>

      <FlatList
        data={servers}
        keyExtractor={server => server.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.brand}
            colors={[colors.brand]}
          />
        }
        ListHeaderComponent={
          <View className="gap-2 pb-5 pt-6">
            <Text
              style={{
                color: colors.text,
                fontSize: 29,
                lineHeight: 34,
                fontWeight: '800',
                letterSpacing: -0.8,
              }}>
              Your Harnesses
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14.5,
                lineHeight: 21,
              }}>
              Connect to DeepSeek Harness instances you operate. Pull to refresh
              connection status.
            </Text>
            {hydrationError ? (
              <View
                className="mt-3 gap-3 rounded-xl px-4 py-3"
                style={{
                  backgroundColor: colors.dangerSoft,
                  borderWidth: 1,
                  borderColor: colors.danger,
                }}>
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: 12.5,
                    lineHeight: 18,
                  }}>
                  {hydrationError} Changes will not be written until local
                  storage is healthy.
                </Text>
                <View className="self-start">
                  <AppButton
                    compact
                    tone="danger"
                    label="Reset local data"
                    onPress={() =>
                      Alert.alert(
                        'Reset local DSH Mobile data?',
                        'This removes saved server profiles and app preferences from this device. It does not change your Harness servers.',
                        [
                          {text: 'Cancel', style: 'cancel'},
                          {
                            text: 'Reset',
                            style: 'destructive',
                            onPress: () => {
                              void resetLocalData().catch(error =>
                                console.error(
                                  'Failed to reset local DSH Mobile data',
                                  error,
                                ),
                              );
                            },
                          },
                        ],
                      )
                    }
                  />
                </View>
              </View>
            ) : null}
          </View>
        }
        renderItem={({item}) => (
          <View className="mb-3">
            <ServerCard
              server={item}
              onOpen={() => navigation.navigate('Browser', {serverId: item.id})}
              onEdit={() =>
                navigation.navigate('ServerEditor', {serverId: item.id})
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6 py-16">
            {isDark ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: 420,
                  height: 420,
                  alignItems: 'center',
                  justifyContent: 'center',
                  top: 0,
                }}>
                <Svg width={420} height={420}>
                  <Defs>
                    <RadialGradient
                      id="whaleGlow"
                      cx="50%"
                      cy="50%"
                      rx="50%"
                      ry="50%">
                      <Stop
                        offset="0%"
                        stopColor="#3A65C2"
                        stopOpacity="0.32"
                      />
                      <Stop
                        offset="40%"
                        stopColor="#4D6BFE"
                        stopOpacity="0.12"
                      />
                      <Stop
                        offset="75%"
                        stopColor="#3A65C2"
                        stopOpacity="0.04"
                      />
                      <Stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
                    </RadialGradient>
                  </Defs>
                  <Rect width={420} height={420} fill="url(#whaleGlow)" />
                </Svg>
              </View>
            ) : null}

            <View
              className="mb-5 h-20 w-20 items-center justify-center rounded-3xl"
              style={{
                backgroundColor: colors.brandSoft,
                borderWidth: 1,
                borderColor: isDark
                  ? 'rgba(103, 153, 254, 0.25)'
                  : 'rgba(77, 107, 254, 0.15)',
              }}>
              <DeepSeekWhaleIcon size={46} color={colors.brand} />
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 21,
                fontWeight: '800',
                letterSpacing: -0.4,
              }}>
              Add your first server
            </Text>
            <Text
              className="mt-2 text-center"
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                lineHeight: 21,
              }}>
              DSH Mobile stays thin: your Harness keeps running remotely while
              this app provides a dedicated mobile client.
            </Text>
            <View style={{marginTop: 26, width: '100%', maxWidth: 280}}>
              <AppButton
                label="Add server"
                onPress={() => navigation.navigate('ServerEditor', {})}
                icon={<Plus size={18} color={isDark ? '#0A0A0A' : '#FFFFFF'} />}
              />
            </View>
          </View>
        }
      />

      {servers.length > 0 ? (
        <View className="absolute bottom-6 left-6 right-6">
          <AppButton
            label="Add server"
            onPress={() => navigation.navigate('ServerEditor', {})}
            icon={<Plus size={18} color={isDark ? '#0A0A0A' : '#FFFFFF'} />}
          />
        </View>
      ) : null}
    </Screen>
  );
}
