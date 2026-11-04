import React from 'react';
import {TextInput} from 'react-native';
import TestRenderer, {act} from 'react-test-renderer';
import {ServerSetupScreen} from '../src/features/servers/screens/ServerSetupScreen';

const mockUpsertServer = jest.fn();
const mockGoBack = jest.fn();
const mockPopToTop = jest.fn();

jest.mock('../src/app/AppStateProvider', () => ({
  useAppState: () => ({servers: [], upsertServer: mockUpsertServer}),
}));
jest.mock('../src/app/ThemeProvider', () => ({
  useAppTheme: () => ({
    colors: {
      text: '#ffffff',
      textSecondary: '#aaaaaa',
      textTertiary: '#888888',
      border: '#777777',
      positive: '#00ff00',
      danger: '#ff0000',
    },
  }),
}));
jest.mock('../src/shared/components/AppButton', () => ({
  AppButton: 'MockButton',
}));
jest.mock('../src/shared/components/Screen', () => ({
  Screen: 'MockScreen',
}));
jest.mock('../src/features/servers/screens/ServerEditorScreen', () => ({
  ServerEditorScreen: 'MockServerEditor',
}));
jest.mock('react-native-webview', () => ({
  WebView: 'MockWebView',
}));

describe('DSH launch-link onboarding', () => {
  let tree: TestRenderer.ReactTestRenderer;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function findMocks(type: string) {
    return tree.root.findAll(node => node.type === type);
  }

  function findMock(type: string) {
    return tree.root.find(node => node.type === type);
  }

  function render(serverId?: string) {
    const props = {
      navigation: {goBack: mockGoBack, popToTop: mockPopToTop},
      route: {
        name: 'ServerEditor',
        key: 'server-setup',
        params: serverId ? {serverId} : {},
      },
    } as unknown as React.ComponentProps<typeof ServerSetupScreen>;
    act(() => {
      tree = TestRenderer.create(<ServerSetupScreen {...props} />);
    });
    return tree;
  }

  function press(label: string) {
    const buttons = findMocks('MockButton');
    const button = buttons.find(item => item.props.label === label);
    expect(button).toBeDefined();
    act(() => button?.props.onPress());
  }

  function fillLaunchLink(value: string) {
    const fields = tree.root.findAllByType(TextInput);
    const field = fields.find(
      item => item.props.accessibilityLabel === 'Private DSH Web launch link',
    );
    expect(field).toBeDefined();
    act(() => field?.props.onChangeText(value));
  }

  function startPairing(value: string) {
    press('Pair using a DSH Web link');
    fillLaunchLink(value);
    press('Connect securely');
  }

  it('keeps existing saved profiles on the original editing path', () => {
    render('existing-profile');
    expect(findMocks('MockServerEditor')).toHaveLength(1);
    expect(findMocks('MockWebView')).toHaveLength(0);
  });

  it('never saves a token or accepts a cross-origin redirect', () => {
    render();
    startPairing('https://dsh.example/?token=private-value');

    const webView = findMock('MockWebView');
    expect(webView.props.source.uri).toBe(
      'https://dsh.example/?token=private-value',
    );
    const allowed = webView.props.onShouldStartLoadWithRequest({
      url: 'https://untrusted.example/',
    });
    expect(allowed).toBe(false);
    expect(mockUpsertServer).not.toHaveBeenCalled();

    act(() => {
      webView.props.onLoadEnd({nativeEvent: {url: 'https://dsh.example/'}});
    });
    expect(findMock('MockWebView').props.source.uri).toBe(
      'https://dsh.example/',
    );
    expect(mockUpsertServer).not.toHaveBeenCalled();

    act(() => {
      findMock('MockWebView').props.onLoadEnd({
        nativeEvent: {url: 'https://dsh.example/'},
      });
    });
    expect(mockUpsertServer).not.toHaveBeenCalled();

    press('Save server');
    expect(mockUpsertServer).toHaveBeenCalledWith({
      name: 'My Harness',
      url: 'https://dsh.example',
      isDefault: true,
    });
    expect(mockPopToTop).toHaveBeenCalledTimes(1);
  });

  it('does not save after a failed clean-root verification', () => {
    render();
    startPairing('https://dsh.example/?token=temporary-value');
    act(() => {
      findMock('MockWebView').props.onLoadEnd({
        nativeEvent: {url: 'https://dsh.example/'},
      });
    });
    act(() => {
      findMock('MockWebView').props.onHttpError({
        nativeEvent: {statusCode: 401},
      });
    });
    const webViews = findMocks('MockWebView');
    const buttons = findMocks('MockButton');
    const canSave = buttons.some(item => item.props.label === 'Save server');
    expect(webViews).toHaveLength(0);
    expect(canSave).toBe(false);
    expect(mockUpsertServer).not.toHaveBeenCalled();
  });

  it('rejects cleartext token links to public hosts', () => {
    render();
    startPairing('http://public.example/?token=secret');
    expect(findMocks('MockWebView')).toHaveLength(0);
    expect(mockUpsertServer).not.toHaveBeenCalled();
  });
});
