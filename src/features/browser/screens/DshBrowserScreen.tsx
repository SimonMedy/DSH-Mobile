import React, {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler, Linking, Platform, Text, View} from 'react-native';
import {ChevronLeft, RefreshCcw, ServerCog, WifiOff} from 'lucide-react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WebView, type WebViewNavigation} from 'react-native-webview';
import {useAppState} from '../../../app/AppStateProvider';
import {useAppTheme} from '../../../app/ThemeProvider';
import {AppButton} from '../../../shared/components/AppButton';
import {IconButton} from '../../../shared/components/IconButton';
import {Screen} from '../../../shared/components/Screen';
import type {RootStackParamList} from '../../../navigation/types';
import {APP_VERSION} from '../../../config/appConfig';
import {
  canOpenExternally,
  decideNavigation,
  decidePopupNavigation,
} from '../navigationPolicy';

export function DshBrowserScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'Browser'>) {
  const {colors} = useAppTheme();
  const {servers, markConnected, markOffline} = useAppState();
  const server = servers.find(item => item.id === route.params.serverId);
  const webRef = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [browserUri, setBrowserUri] = useState(server?.url ?? 'about:blank');

  const goBack = useCallback(() => {
    if (canGoBack) {
      webRef.current?.goBack();
    } else {
      navigation.goBack();
    }
  }, [canGoBack, navigation]);

  useEffect(() => {
    if (server?.url) {
      setBrowserUri(server.url);
    }
  }, [server?.url]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        goBack();
        return true;
      },
    );
    return () => subscription.remove();
  }, [goBack]);

  if (!server) {
    return (
      <Screen>
        <View
          className="flex-1 items-center justify-center px-6"
          style={{backgroundColor: colors.background}}>
          <Text style={{color: colors.text, fontSize: 18, fontWeight: '800'}}>
            Server no longer exists
          </Text>
          <View className="mt-5 w-full">
            <AppButton
              label="Back to servers"
              onPress={() => navigation.popToTop()}
            />
          </View>
        </View>
      </Screen>
    );
  }

  const openExternal = async (url: string) => {
    if (!canOpenExternally(url)) return;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Could not open external URL', error);
    }
  };

  const retry = () => {
    setLoadError(undefined);
    setLoading(true);
    setCanGoBack(false);
    setReloadKey(key => key + 1);
  };

  return (
    <Screen>
      <View
        className="flex-row items-center px-3 pb-2 pt-2"
        style={{borderBottomWidth: 1, borderBottomColor: colors.border}}>
        <IconButton label="Back" onPress={goBack}>
          <ChevronLeft size={23} color={colors.text} />
        </IconButton>
        <View className="ml-1 min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <View
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: loadError
                  ? colors.danger
                  : loading
                    ? colors.warning
                    : colors.positive,
              }}
            />
            <Text
              numberOfLines={1}
              style={{color: colors.text, fontSize: 14.5, fontWeight: '700'}}>
              {server.name}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{color: colors.textTertiary, fontSize: 10.5}}>
            {server.url}
          </Text>
        </View>
        <IconButton
          label="Reload"
          onPress={() => (loadError ? retry() : webRef.current?.reload())}>
          <RefreshCcw size={19} color={colors.textSecondary} />
        </IconButton>
        <IconButton
          label="Edit server"
          onPress={() =>
            navigation.navigate('ServerEditor', {serverId: server.id})
          }>
          <ServerCog size={19} color={colors.textSecondary} />
        </IconButton>
      </View>

      {loadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="mb-5 h-16 w-16 items-center justify-center rounded-2xl"
            style={{backgroundColor: colors.dangerSoft}}>
            <WifiOff size={30} color={colors.danger} />
          </View>
          <Text style={{color: colors.text, fontSize: 20, fontWeight: '800'}}>
            Couldn’t reach {server.name}
          </Text>
          <Text
            className="mt-2 text-center"
            style={{color: colors.textSecondary, fontSize: 14, lineHeight: 21}}>
            {loadError}
          </Text>
          <View className="mt-7 w-full max-w-sm gap-3">
            <AppButton label="Retry" onPress={retry} />
            <AppButton
              label="Edit server"
              tone="secondary"
              onPress={() =>
                navigation.navigate('ServerEditor', {serverId: server.id})
              }
            />
            <AppButton
              label="Back to servers"
              tone="ghost"
              onPress={() => navigation.popToTop()}
            />
          </View>
        </View>
      ) : (
        <WebView
          key={reloadKey}
          ref={webRef}
          source={{uri: browserUri}}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          cacheEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          javaScriptCanOpenWindowsAutomatically={false}
          setSupportMultipleWindows
          geolocationEnabled={false}
          mixedContentMode="never"
          fraudulentWebsiteWarningEnabled
          allowsLinkPreview={false}
          webviewDebuggingEnabled={__DEV__}
          applicationNameForUserAgent={`DSHMobile/${APP_VERSION}`}
          allowsBackForwardNavigationGestures
          onShouldStartLoadWithRequest={(request: {url: string}) => {
            const decision = decideNavigation(server.url, request.url);
            if (decision === 'allow') return true;
            if (decision === 'external') void openExternal(request.url);
            return false;
          }}
          onOpenWindow={(event: {nativeEvent: {targetUrl?: string}}) => {
            const targetUrl = event.nativeEvent.targetUrl ?? '';
            const decision = decidePopupNavigation(server.url, targetUrl);
            if (decision === 'allow') {
              setBrowserUri(targetUrl);
            } else if (decision === 'external') {
              void openExternal(targetUrl);
            }
          }}
          onNavigationStateChange={(state: WebViewNavigation) =>
            setCanGoBack(state.canGoBack)
          }
          onFileDownload={(event: {nativeEvent: {downloadUrl: string}}) => {
            if (Platform.OS === 'ios')
              void openExternal(event.nativeEvent.downloadUrl);
          }}
          onContentProcessDidTerminate={retry}
          onRenderProcessGone={retry}
          onLoadStart={() => {
            setLoading(true);
            setLoadError(undefined);
          }}
          onLoad={() => {
            setLoading(false);
            markConnected(server.id);
          }}
          onError={(event: {nativeEvent: {description?: string}}) => {
            setLoading(false);
            markOffline(server.id);
            setLoadError(
              event.nativeEvent.description ||
                'Check the server address and your network connection.',
            );
          }}
        />
      )}
    </Screen>
  );
}
