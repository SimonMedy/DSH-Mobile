import React, {useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  CheckCircle2,
  ChevronLeft,
  ShieldAlert,
  Trash2,
  Wifi,
} from 'lucide-react-native';
import {usePreventRemove} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useAppState} from '../../../app/AppStateProvider';
import {useAppTheme} from '../../../app/ThemeProvider';
import {AppButton} from '../../../shared/components/AppButton';
import {IconButton} from '../../../shared/components/IconButton';
import {Screen} from '../../../shared/components/Screen';
import {SectionCard} from '../../../shared/components/SectionCard';
import {SegmentedControl} from '../../../shared/components/SegmentedControl';
import {TextField} from '../../../shared/components/TextField';
import type {RootStackParamList} from '../../../navigation/types';
import {checkServerConnection} from '../connection';
import {
  buildServerUrl,
  classifyEndpointSecurity,
  splitServerUrl,
} from '../serverUrl';
import type {EditableEndpoint} from '../types';

export function ServerEditorScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'ServerEditor'>) {
  const {colors} = useAppTheme();
  const {servers, upsertServer, deleteServer} = useAppState();
  const existing = route.params.serverId
    ? servers.find(server => server.id === route.params.serverId)
    : undefined;
  const initial = existing
    ? splitServerUrl(existing.url)
    : {scheme: 'https' as const, host: '', port: '', path: ''};
  const [name, setName] = useState(existing?.name ?? '');
  const [endpoint, setEndpoint] = useState<EditableEndpoint>(initial);
  const [isDefault, setIsDefault] = useState(
    existing?.isDefault ?? servers.length === 0,
  );
  const [error, setError] = useState<string>();
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string>();
  const [testTone, setTestTone] = useState<'positive' | 'negative' | 'neutral'>(
    'neutral',
  );
  const [allowExit, setAllowExit] = useState(false);

  const preview = useMemo(() => {
    try {
      return buildServerUrl(endpoint);
    } catch {
      return undefined;
    }
  }, [endpoint]);
  const security = preview ? classifyEndpointSecurity(preview) : undefined;
  const initialUrl = existing?.url ?? '';
  const isDirty = useMemo(() => {
    if (allowExit) return false;
    if (!existing) {
      return Boolean(
        name.trim() ||
        endpoint.host.trim() ||
        endpoint.port.trim() ||
        endpoint.path.trim(),
      );
    }
    return (
      name !== existing.name ||
      preview !== initialUrl ||
      isDefault !== existing.isDefault
    );
  }, [
    allowExit,
    endpoint.host,
    endpoint.path,
    endpoint.port,
    existing,
    initialUrl,
    isDefault,
    name,
    preview,
  ]);

  usePreventRemove(isDirty, ({data}) => {
    Alert.alert(
      'Discard changes?',
      'Your unsaved server changes will be lost.',
      [
        {text: 'Keep editing', style: 'cancel'},
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setAllowExit(true);
            setTimeout(() => navigation.dispatch(data.action), 0);
          },
        },
      ],
    );
  });

  const commitSave = (url: string, cleanName: string) => {
    setAllowExit(true);
    upsertServer({name: cleanName, url, isDefault}, existing?.id);
    setTimeout(() => navigation.goBack(), 0);
  };

  const save = () => {
    try {
      const url = buildServerUrl(endpoint);
      const cleanName = name.trim();
      if (!cleanName) throw new Error('Give this server a name.');
      setError(undefined);

      if (classifyEndpointSecurity(url).kind === 'public-http') {
        Alert.alert(
          'Save unencrypted remote server?',
          'This address uses public HTTP. Traffic can be read or modified in transit. HTTPS or a trusted private network is strongly recommended.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Save anyway',
              style: 'destructive',
              onPress: () => commitSave(url, cleanName),
            },
          ],
        );
        return;
      }

      commitSave(url, cleanName);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Check the server details.',
      );
    }
  };

  const test = async () => {
    try {
      const url = buildServerUrl(endpoint);
      setTesting(true);
      setError(undefined);
      setTestMessage(undefined);
      const result = await checkServerConnection(url);
      setTestTone(
        result.skipped ? 'neutral' : result.reachable ? 'positive' : 'negative',
      );
      setTestMessage(
        result.reachable
          ? `Reachable${result.httpStatus ? ` · HTTP ${result.httpStatus}` : ''} · ${result.latencyMs} ms`
          : (result.error ?? 'Server could not be reached.'),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Check the server details.',
      );
    } finally {
      setTesting(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert(
      'Delete server?',
      `${existing.name} will only be removed from this device.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAllowExit(true);
            deleteServer(existing.id);
            setTimeout(() => navigation.popToTop(), 0);
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View className="flex-row items-center px-4 pb-2 pt-1">
        <IconButton label="Back" onPress={() => navigation.goBack()}>
          <ChevronLeft size={23} color={colors.text} />
        </IconButton>
        <Text
          className="ml-2 flex-1"
          style={{color: colors.text, fontSize: 18, fontWeight: '800'}}>
          {existing ? 'Edit server' : 'Add server'}
        </Text>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 48,
          }}>
          <View className="gap-6">
            <View className="gap-2">
              <Text
                style={{
                  color: colors.text,
                  fontSize: 27,
                  fontWeight: '800',
                  letterSpacing: -0.6,
                }}>
                Connect a Harness
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14.5,
                  lineHeight: 21,
                }}>
                Use a reachable DSH Web address. Tailscale or another trusted
                private network is recommended for remote access.
              </Text>
            </View>

            <SectionCard>
              <View className="gap-5">
                <TextField
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Home server"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                <View className="gap-2">
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 14,
                      fontWeight: '600',
                    }}>
                    Protocol
                  </Text>
                  <SegmentedControl
                    value={endpoint.scheme}
                    options={
                      [
                        {value: 'https', label: 'HTTPS'},
                        {value: 'http', label: 'HTTP'},
                      ] as const
                    }
                    onChange={scheme =>
                      setEndpoint(current => ({...current, scheme}))
                    }
                  />
                </View>
                <TextField
                  label="Host or IP"
                  value={endpoint.host}
                  onChangeText={host =>
                    setEndpoint(current => ({...current, host}))
                  }
                  placeholder="dsh.example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextField
                      label="Port"
                      value={endpoint.port}
                      onChangeText={port =>
                        setEndpoint(current => ({...current, port}))
                      }
                      placeholder={endpoint.scheme === 'https' ? '443' : '3080'}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View className="flex-[1.4]">
                    <TextField
                      label="Path (optional)"
                      value={endpoint.path}
                      onChangeText={path =>
                        setEndpoint(current => ({...current, path}))
                      }
                      placeholder="dsh"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              </View>
            </SectionCard>

            {preview ? (
              <View
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: colors.backgroundSubtle,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                <Text
                  style={{
                    color: colors.textTertiary,
                    fontSize: 11.5,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                  }}>
                  Address preview
                </Text>
                <Text
                  selectable
                  className="mt-1"
                  style={{color: colors.text, fontSize: 13.5}}>
                  {preview}
                </Text>
                {security ? (
                  <View className="mt-3 flex-row items-start gap-2">
                    {security.tone === 'danger' ||
                    security.tone === 'warning' ? (
                      <ShieldAlert
                        size={17}
                        color={
                          security.tone === 'danger'
                            ? colors.danger
                            : colors.warning
                        }
                      />
                    ) : (
                      <CheckCircle2
                        size={17}
                        color={
                          security.tone === 'positive'
                            ? colors.positive
                            : colors.textSecondary
                        }
                      />
                    )}
                    <Text
                      style={{
                        flex: 1,
                        color:
                          security.tone === 'danger'
                            ? colors.danger
                            : colors.textSecondary,
                        fontSize: 12.5,
                        lineHeight: 18,
                      }}>
                      {security.label}
                      {security.kind === 'private-http'
                        ? ' — only use this over a trusted private network such as Tailscale.'
                        : security.kind === 'public-http'
                          ? ' — use HTTPS or a trusted private network before saving this endpoint.'
                          : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {error ? (
              <Text style={{color: colors.danger, fontSize: 13.5}}>
                {error}
              </Text>
            ) : null}
            {testMessage ? (
              <Text
                style={{
                  color:
                    testTone === 'positive'
                      ? colors.positive
                      : testTone === 'negative'
                        ? colors.danger
                        : colors.textSecondary,
                  fontSize: 13.5,
                  fontWeight: '600',
                }}>
                {testMessage}
              </Text>
            ) : null}

            <SectionCard>
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 15,
                      fontWeight: '700',
                    }}>
                    Default server
                  </Text>
                  <Text
                    className="mt-1"
                    style={{
                      color: colors.textSecondary,
                      fontSize: 12.5,
                      lineHeight: 18,
                    }}>
                    {existing?.isDefault
                      ? 'This is the current default. Choose another server as default to change it.'
                      : !existing && servers.length === 0
                        ? 'Your first server becomes the default automatically.'
                        : 'Use this server when “Open default server” is enabled in Settings.'}
                  </Text>
                </View>
                <Switch
                  value={isDefault}
                  onValueChange={setIsDefault}
                  disabled={
                    existing?.isDefault === true ||
                    (!existing && servers.length === 0)
                  }
                  accessibilityHint={
                    existing?.isDefault
                      ? 'Choose another server as default to change this setting.'
                      : !existing && servers.length === 0
                        ? 'The first server is always the default.'
                        : undefined
                  }
                  trackColor={{
                    false: colors.surfacePressed,
                    true: colors.brand,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </SectionCard>

            <View style={{gap: 12, marginTop: 8}}>
              <AppButton
                label="Test connection"
                tone="secondary"
                loading={testing}
                onPress={test}
                icon={<Wifi size={18} color={colors.text} />}
              />
              <AppButton
                label={existing ? 'Save changes' : 'Add server'}
                onPress={save}
              />
              {existing ? (
                <AppButton
                  label="Delete server"
                  tone="ghost"
                  onPress={confirmDelete}
                  icon={<Trash2 size={17} color={colors.danger} />}
                />
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
