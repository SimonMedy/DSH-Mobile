#!/usr/bin/env python3
"""Android black-box pairing -> main WebView cookie continuity test.

Uses only a local fake launch token. Do not capture private real-world URLs,
cookies or credentials in the test artifacts.
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


def adb(*args, timeout=30):
    return subprocess.run(
        ['adb', *args], check=True, capture_output=True, timeout=timeout,
    ).stdout


def screenshot(name):
    try:
        (ARTIFACTS / f'{name}.png').write_bytes(
            adb('exec-out', 'screencap', '-p'),
        )
    except (OSError, subprocess.SubprocessError):
        print('Could not capture Android screenshot')


def nodes():
    """Ignore incomplete UIAutomator dumps while Android is starting.

    Android can exit successfully while producing an empty dump or an error
    message instead of XML, particularly just after installation or launch.
    Such a transient result must not fail the entire test before its timeout.
    Never save raw UI XML: it could contain user-entered form values.
    """
    try:
        adb('shell', 'uiautomator', 'dump', '/sdcard/e2e-window.xml', timeout=30)
        document = adb(
            'exec-out', 'cat', '/sdcard/e2e-window.xml', timeout=15,
        ).decode('utf-8', errors='replace')
        start = document.find('<hierarchy')
        if start < 0:
            return []
        root = ET.fromstring(document[start:])
        return list(root.iter('node'))
    except (ET.ParseError, UnicodeError, OSError, subprocess.SubprocessError):
        return []


def match(node, value):
    text = (
        node.attrib.get('text', '')
        + ' '
        + node.attrib.get('content-desc', '')
    ).lower()
    return value.lower() in text


def wait_for(value, timeout=80):
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
    bounds = re.fullmatch(
        r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]',
        node.attrib.get('bounds', ''),
    )
    if not bounds:
        raise AssertionError('UI element lacks screen coordinates')
    x1, y1, x2, y2 = map(int, bounds.groups())
    adb('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))


def status():
    url = 'http://127.0.0.1:3080/__fixture/status'
    with urllib.request.urlopen(url, timeout=5) as response:
        return json.load(response)


def main():
    # Fake credential used only on the loopback fixture.
    launch_url = 'http://127.0.0.1:3080/?token=fixture-only-test-token'
    adb('reverse', 'tcp:3080', 'tcp:3080')
    adb('reverse', 'tcp:8081', 'tcp:8081')
    adb('shell', 'am', 'force-stop', 'dev.dshmobile')
    adb('shell', 'pm', 'clear', 'dev.dshmobile')
    adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP')
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
        assert state['tokenExchanges'] == 1, 'Expected one launch token exchange'
        assert state['cookieLoads'] >= 2, 'Pairing WebView did not reload using its cookie'
        tap('Save server')
        tap('My Harness')
        wait_for('HARNESS_AUTHENTICATED_FIXTURE', timeout=100)
        state = status()
        assert state['cookieLoads'] >= 3, 'Main WebView did not reuse the cookie'
        assert state['denied'] == 0, 'Unexpected unauthenticated request'
        screenshot('pairing-authenticated')
        print('PASS: token exchange and authenticated cookie reused by main WebView')
    except Exception:
        screenshot('pairing-failed')
        raise


if __name__ == '__main__':
    main()
