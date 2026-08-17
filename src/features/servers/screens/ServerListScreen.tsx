import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, FlatList, RefreshControl, Text, View} from 'react-native';
import {Plus, Settings2, ShieldCheck} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppTheme} from '../../../app/ThemeProvider';
import {useAppState} from '../../../app/AppStateProvider';
import {BrandMark} from '../../../shared/components/BrandMark';
import {AppButton} from '../../../shared/components/AppButton';
import {IconButton} from '../../../shared/components/IconButton';
import {Screen} from '../../../shared/components/Screen';
import type {RootStackParamList} from '../../../navigation/types';
import {ServerCard} from '../components/ServerCard';

export function ServerListScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'Servers'>) {
  const {colors} = useAppTheme();
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
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '800',
                letterSpacing: -0.3,
              }}>
              DSH Mobile
            </Text>
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
            <View
              className="mb-5 h-16 w-16 items-center justify-center rounded-2xl"
              style={{backgroundColor: colors.brandSoft}}>
              <ShieldCheck size={30} color={colors.brand} />
            </View>
            <Text style={{color: colors.text, fontSize: 20, fontWeight: '800'}}>
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
            <View className="mt-6 w-full max-w-sm">
              <AppButton
                label="Add server"
                onPress={() => navigation.navigate('ServerEditor', {})}
                icon={<Plus size={18} color="#FFFFFF" />}
              />
            </View>
          </View>
        }
      />

      {servers.length > 0 ? (
        <View className="absolute bottom-5 left-5 right-5">
          <AppButton
            label="Add server"
            onPress={() => navigation.navigate('ServerEditor', {})}
            icon={<Plus size={18} color="#FFFFFF" />}
          />
        </View>
      ) : null}
    </Screen>
  );
}
