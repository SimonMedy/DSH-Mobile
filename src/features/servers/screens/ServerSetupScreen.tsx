import React, {useRef, useState} from 'react';
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
import {
  cleanHarnessRoot,
  decidePairingLoad,
  type PairingPhase,
} from '../pairingFlow';
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
  const [phase, setPhase] = useState<PairingPhase>('exchange');
  const failed = useRef(false);
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
      failed.current = false;
      setPhase('exchange');
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

  const failPairing = (message: string) => {
    failed.current = true;
    setSession(undefined);
    setReadyUrl(undefined);
    setInput('');
    setError(message);
  };

  const handleComplete = (currentUrl: string) => {
    if (!session || failed.current) return;
    const decision = decidePairingLoad(
      phase,
      session.serverUrl,
      currentUrl,
    );
    if (decision === 'verify') {
      // Drop the bearer token from React state as soon as the clean redirect
      // arrives. The same WebView makes another request using its session cookie.
      setPhase('verify');
      setSession({
        serverUrl: session.serverUrl,
        launchUrl: cleanHarnessRoot(session.serverUrl),
      });
    } else if (decision === 'ready') {
      // A clean 2nd load is a necessary smoke test, not proof that every
      // authenticated upstream API works. Native E2E remains a release gate.
      setReadyUrl(session.serverUrl);
      setSession(undefined);
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
              {phase === 'exchange'
                ? 'Opening the temporary link securely…'
                : 'Checking the browser session…'}
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
                    failPairing(
                      status === 401
                        ? 'The launch link is invalid or expired. Generate a new one on your server.'
                        : 'Harness rejected the server hostname or origin. Check its trusted-host configuration.',
                    );
                  } else if (status >= 400) {
                    failPairing('Harness returned an HTTP error. Check the server and retry.');
                  }
                }}
                onError={() => {
                  failPairing(
                    'Could not open the server. Check HTTPS, the hostname and your network.',
                  );
                }}
              />
            </View>
          </>
        ) : null}
        {readyUrl ? (
          <>
            <Text style={{color: colors.positive, fontWeight: '700'}}>
              The server loaded its clean page again. Save the address, then
              verify your models and settings in the main browser.
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
            failed.current = true;
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
