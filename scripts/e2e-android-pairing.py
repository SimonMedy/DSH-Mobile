#!/usr/bin/env python3
"""Android pairing/cookie E2E, using an isolated loopback test credential only.

No user URLs, session cookies, UI XML or arbitrary device logs are recorded.
"""

import json
import pathlib
import re
import subprocess
import time
import urllib.request
import xml.etree.ElementTree as ET

ARTIFACTS = pathlib.Path('e2e-artifacts')
ARTIFACTS.mkdir(exist_ok=True)
STAGE = 'initialize'


def advance(name):
    global STAGE
    STAGE = name
    print(f'E2E stage: {name}', flush=True)


def adb(*args, timeout=35):
    return subprocess.run(
        ['adb', *args], check=True, capture_output=True, timeout=timeout,
    ).stdout


def screenshot(name):
    try:
        (ARTIFACTS / f'{name}.png').write_bytes(
            adb('exec-out', 'screencap', '-p'),
        )
    except (OSError, subprocess.SubprocessError):
        print('Screenshot could not be captured', flush=True)


def nodes():
    # UIAutomator can return incomplete XML immediately after Android launches.
    # Do not persist raw accessibility XML (it can contain form values).
    try:
        adb('shell', 'uiautomator', 'dump', '/sdcard/e2e-window.xml', timeout=35)
        data = adb(
            'exec-out', 'cat', '/sdcard/e2e-window.xml', timeout=15,
        ).decode('utf-8', errors='replace')
        beginning = data.find('<hierarchy')
        if beginning < 0:
            return []
        root = ET.fromstring(data[beginning:])
        return list(root.iter('node'))
    except (ET.ParseError, UnicodeError, OSError, subprocess.SubprocessError):
        return []


def has_label(node, target):
    label = (
        node.attrib.get('text', '') + ' ' +
        node.attrib.get('content-desc', '')
    )
    return target.casefold() in label.casefold()


def wait_for(label, timeout=90):
    started = time.monotonic()
    latest_count = 0
    while time.monotonic() - started < timeout:
        available = nodes()
        latest_count = len(available)
        for node in available:
            if has_label(node, label):
                return node
        time.sleep(2)
    screenshot('missing-' + re.sub('[^a-z0-9]+', '-', label.lower()))
    print(f'Expected accessible UI absent: {label}; last node count: {latest_count}', flush=True)
    raise AssertionError(f'UI step failed: {label}')


def tap(label):
    node = wait_for(label)
    bounds = re.fullmatch(
        r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',
        node.attrib.get('bounds', ''),
    )
    if not bounds:
        raise AssertionError(f'No tappable bounds: {label}')
    x1, y1, x2, y2 = map(int, bounds.groups())
    adb('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))


def fixture_stats():
    url = 'http://127.0.0.1:3080/__fixture/status'
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


def main():
    # Do not send any real launch token to this fixture or GitHub Actions.
    launch_url = 'http://127.0.0.1:3080/?token=fixture-only-test-token'
    advance('configure adb reverse and fresh app')
    adb('reverse', 'tcp:3080', 'tcp:3080')
    adb('reverse', 'tcp:8081', 'tcp:8081')
    adb('shell', 'am', 'force-stop', 'dev.dshmobile')
    adb('shell', 'pm', 'clear', 'dev.dshmobile')
    adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP')
    adb('shell', 'am', 'start', '-n', 'dev.dshmobile/.MainActivity')

    try:
        advance('open add-server onboarding')
        tap('Add server')
        advance('select private Web launch link')
        tap('Pair using a DSH Web link')
        advance('enter test-only link')
        tap('Private DSH Web launch link')
        adb('shell', 'input', 'text', launch_url)
        adb('shell', 'input', 'keyevent', 'KEYCODE_BACK')
        advance('exchange launch token')
        tap('Connect securely')
        advance('wait for cookie-verification redirect')
        wait_for('Save server', timeout=100)
        state = fixture_stats()
        assert state['tokenExchanges'] == 1, 'Expected one token exchange'
        assert state['cookieLoads'] >= 2, 'Temporary WebView cookie verification failed'
        advance('save non-secret server profile')
        tap('Save server')
        advance('open saved server in main WebView')
        tap('My Harness')
        advance('verify cookie in main WebView')
        wait_for('HARNESS_AUTHENTICATED_FIXTURE', timeout=100)
        state = fixture_stats()
        assert state['cookieLoads'] >= 3, 'Main WebView failed to reuse cookie'
        assert state['denied'] == 0, 'Unexpected unauthenticated request'
        screenshot('pairing-authenticated')
        print('PASS: authorized cookie shared across both WebViews', flush=True)
    except Exception as exc:
        screenshot('pairing-failed')
        print(f'FAIL at stage: {STAGE}; type: {type(exc).__name__}', flush=True)
        try:
            counts = fixture_stats()
            print(
                'Fixture counts: exchange={tokenExchanges}, cookie={cookieLoads}, denied={denied}'.format(**counts),
                flush=True,
            )
        except (OSError, ValueError):
            print('Fixture counters unavailable', flush=True)
        raise


if __name__ == '__main__':
    main()
