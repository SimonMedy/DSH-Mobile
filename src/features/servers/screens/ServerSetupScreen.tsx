import React, {useState} from 'react';
import {Text, TextInput, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WebView} from 'react-native-webview';
import {useAppState} from '../../../app/AppStateProvider';
import {useAppTheme} from '../../../app/ThemeProvider';
import type {RootStackParamList} from '../../../navigation/types';
import {AppButton} from '../../../shared/components/AppButton';
import {Screen} from '../../../shared/components/Screen';
import {decideNavigation} from '../../browser/navigationPolicy';
import {parseHarnessLaunchLink} from '../launchLink';
import {normalizeServerUrl} from '../serverUrl';
import {ServerEditorScreen} from './ServerEditorScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'ServerEditor'>;
type SetupMode = 'choice' | 'manual' | 'pair';

/** Existing profiles keep their original editor and saved configuration. */
export function ServerSetupScreen(props: Props) {
  const [mode, setMode] = useState<SetupMode>('choice');
  const {colors} = useAppTheme();

  if (props.route.params.serverId || mode === 'manual') {
    return <ServerEditorScreen {...props} />;
  }
  if (mode === 'pair') {
    return (
      <PairLinkScreen
        onBack={() => setMode('choice')}
        navigation={props.navigation}
      />
    );
  }
  return (
    <Screen>
      <View className="flex-1 justify-center gap-5 px-6">
        <Text style={{color: colors.text, fontSize: 25, fontWeight: '800'}}>
          Connect to Harness
        </Text>
        <Text
          style={{color: colors.textSecondary, fontSize: 14, lineHeight: 21}}>
          For recent DSH Web versions, use the private launch link printed by
          your server. Older installations can still be added manually.
        </Text>
        <AppButton
          label="Pair using a DSH Web link"
          onPress={() => setMode('pair')}
        />
        <AppButton
          label="Add server manually"
          tone="secondary"
          onPress={() => setMode('manual')}
        />
        <AppButton
          label="Cancel"
          tone="ghost"
          onPress={() => props.navigation.goBack()}
        />
      </View>
    </Screen>
  );
}

interface PairingSession {
  serverUrl: string;
  launchUrl: string;
}

function PairLinkScreen({
  onBack,
  navigation,
}: {
  onBack: () => void;
  navigation: Props['navigation'];
}) {
  const {colors} = useAppTheme();
  const {servers, upsertServer} = useAppState();
  const [name, setName] = useState('My Harness');
  const [input, setInput] = useState('');
  const [session, setSession] = useState<PairingSession>();
  const [readyUrl, setReadyUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const inputStyle = {
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  };

  const start = () => {
    try {
      const parsed = parseHarnessLaunchLink(input);
      setInput('');
      setError(undefined);
      setReadyUrl(undefined);
      setSession(parsed);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Invalid launch link.',
      );
    }
  };

  const save = () => {
    if (!readyUrl) return;
    if (!servers.some(server => server.url === readyUrl)) {
      upsertServer({
        name: name.trim() || 'My Harness',
        url: readyUrl,
        isDefault: servers.length === 0,
      });
    }
    navigation.popToTop();
  };

  const handleComplete = (currentUrl: string) => {
    if (!session) return;
    try {
      const url = new URL(currentUrl);
      if (url.search || url.hash) return;
      if (normalizeServerUrl(currentUrl) !== session.serverUrl) return;
      setReadyUrl(session.serverUrl);
      setSession(undefined);
    } catch {
      // about:blank is not a successful pairing response.
    }
  };

  return (
    <Screen>
      <View className="flex-1 gap-4 px-6 py-6">
        <Text style={{color: colors.text, fontSize: 24, fontWeight: '800'}}>
          Pair your DSH Web session
        </Text>
        <Text
          style={{color: colors.textSecondary, fontSize: 13.5, lineHeight: 20}}>
          Copy the full private URL printed when you start DSH Web. Keep it
          secret. DSH Mobile stores only the server address, never the token.
        </Text>
        {!session && !readyUrl ? (
          <>
            <TextInput
              accessibilityLabel="Private DSH Web launch link"
              value={input}
              onChangeText={setInput}
              placeholder="https://server.example/?token=..."
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={inputStyle}
            />
            <AppButton label="Connect securely" onPress={start} />
          </>
        ) : null}
        {session ? (
          <>
            <Text style={{color: colors.textSecondary}}>
              Opening the temporary link securely…
            </Text>
            <View style={{flex: 1, overflow: 'hidden', borderRadius: 12}}>
              <WebView
                source={{uri: session.launchUrl}}
                originWhitelist={['*']}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                thirdPartyCookiesEnabled={false}
                allowFileAccess={false}
                allowFileAccessFromFileURLs={false}
                allowUniversalAccessFromFileURLs={false}
                mixedContentMode="never"
                geolocationEnabled={false}
                javaScriptCanOpenWindowsAutomatically={false}
                webviewDebuggingEnabled={__DEV__}
                onShouldStartLoadWithRequest={request =>
                  decideNavigation(session.serverUrl, request.url) === 'allow'
                }
                onLoadEnd={event => handleComplete(event.nativeEvent.url)}
                onHttpError={event => {
                  const status = event.nativeEvent.statusCode;
                  if (status === 401 || status === 403) {
                    setError(
                      status === 401
                        ? 'The launch link is invalid or expired. Generate a new one on your server.'
                        : 'Harness rejected the server hostname or origin. Check its trusted-host configuration.',
                    );
                    setSession(undefined);
                  }
                }}
                onError={() => {
                  setError(
                    'Could not open the server. Check HTTPS, the hostname and your network.',
                  );
                  setSession(undefined);
                }}
              />
            </View>
          </>
        ) : null}
        {readyUrl ? (
          <>
            <Text style={{color: colors.positive, fontWeight: '700'}}>
              The server returned its clean launch page. Save this server to
              continue.
            </Text>
            <TextInput
              accessibilityLabel="Server name"
              value={name}
              onChangeText={setName}
              placeholder="My Harness"
              placeholderTextColor={colors.textTertiary}
              style={inputStyle}
            />
            <AppButton label="Save server" onPress={save} />
          </>
        ) : null}
        {error ? <Text style={{color: colors.danger}}>{error}</Text> : null}
        <AppButton
          label={session ? 'Cancel pairing' : 'Back'}
          tone="ghost"
          onPress={() => {
            setSession(undefined);
            setReadyUrl(undefined);
            setInput('');
            onBack();
          }}
        />
      </View>
    </Screen>
  );
}
