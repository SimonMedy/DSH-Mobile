#!/usr/bin/env python3
"""Android emulator black-box check of pairing -> main WebView cookie continuity.

Requires a running debug React Native app, Metro, a local fixture, and adb reverse
for ports 3080 and 8081. This deliberately never prints a launch token.
"""

import json
import os
import pathlib
import re
import subprocess
import time
import urllib.request
import xml.etree.ElementTree as ET

ARTIFACTS = pathlib.Path('e2e-artifacts')
ARTIFACTS.mkdir(exist_ok=True)


def adb(*args, timeout=30):
    return subprocess.run(['adb', *args], check=True, capture_output=True,
                          timeout=timeout).stdout


def screenshot(name):
    try:
        (ARTIFACTS / f'{name}.png').write_bytes(adb('exec-out', 'screencap', '-p'))
    except Exception as exc:
        print(f'Screenshot unavailable: {type(exc).__name__}')


def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/e2e-window.xml', timeout=45)
    document = adb('exec-out', 'cat', '/sdcard/e2e-window.xml').decode('utf-8')
    root = ET.fromstring(document)
    return list(root.iter('node'))


def match(node, value):
    text = (node.attrib.get('text', '') + ' ' +
            node.attrib.get('content-desc', '')).lower()
    return value.lower() in text


def wait_for(value, timeout=65):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        for node in nodes():
            if match(node, value):
                return node
        time.sleep(2)
    screenshot('missing-' + re.sub('[^a-z0-9]+', '-', value.lower()))
    raise AssertionError(f'Expected accessible UI element absent: {value}')


def tap(value):
    node = wait_for(value)
    bounds = re.fullmatch(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',
                          node.attrib.get('bounds', ''))
    if not bounds:
        raise AssertionError('UI element lacks bounds')
    x1, y1, x2, y2 = map(int, bounds.groups())
    adb('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))


def status():
    with urllib.request.urlopen('http://127.0.0.1:3080/__fixture/status', timeout=5) as response:
        return json.load(response)


def main():
    # Test-only fake credential. Never upload real launch URLs or cookie stores.
    launch_url = 'http://127.0.0.1:3080/?token=fixture-only-test-token'
    adb('reverse', 'tcp:3080', 'tcp:3080')
    adb('reverse', 'tcp:8081', 'tcp:8081')
    adb('shell', 'am', 'force-stop', 'dev.dshmobile')
    adb('shell', 'pm', 'clear', 'dev.dshmobile')
    adb('shell', 'am', 'start', '-n', 'dev.dshmobile/.MainActivity')
    try:
        tap('Add server')
        tap('Pair using a DSH Web link')
        tap('Private DSH Web launch link')
        adb('shell', 'input', 'text', launch_url)
        adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        tap('Connect securely')
        wait_for('Save server', timeout=100)
        state = status()
        assert state['tokenExchanges'] == 1, 'Expected exactly one token exchange'
        assert state['cookieLoads'] >= 2, 'Temporary WebView did not load authenticated page twice'
        tap('Save server')
        tap('My Harness')
        wait_for('HARNESS_AUTHENTICATED_FIXTURE', timeout=100)
        state = status()
        assert state['cookieLoads'] >= 3, 'Main WebView did not reuse the browser auth cookie'
        assert state['denied'] == 0, 'Unexpected unauthenticated root request'
        screenshot('pairing-authenticated')
        print('PASS: token exchange, repeated cookie load, main WebView cookie reuse')
    except Exception:
        screenshot('pairing-failed')
        raise


if __name__ == '__main__':
    main()
