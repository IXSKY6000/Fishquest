#!/usr/bin/env python3
"""Build the embedded Android app; keep all SDK/Gradle state in the project."""
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import urllib.parse

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.cache/android'
env=os.environ.copy()
jdk=Path(env.get('JAVA_HOME',str(CACHE/'jdk')))
sdk=Path(env.get('ANDROID_HOME',str(CACHE/'sdk')))
if not (jdk/'bin/javac').exists() or not (sdk/'platforms/android-36/android.jar').exists():
    raise SystemExit('JDK 21 complet et SDK Android 36 requis. Voir docs/ANDROID.md. Aucune installation système automatique.')
env.update(JAVA_HOME=str(jdk),ANDROID_HOME=str(sdk),ANDROID_SDK_ROOT=str(sdk),ANDROID_USER_HOME=str(CACHE/'user'),GRADLE_USER_HOME=str(CACHE/'gradle'))
for name in ['user','home','gradle']:(CACHE/name).mkdir(parents=True,exist_ok=True)
opts=[f'-Duser.home={CACHE}/home']
trust=Path('/etc/ssl/certs/java/cacerts')
if trust.exists():opts.append(f'-Djavax.net.ssl.trustStore={trust}')
proxy=urllib.parse.urlsplit(env.get('HTTPS_PROXY',env.get('https_proxy','')))
if proxy.hostname:
    if proxy.username or proxy.password:raise SystemExit('Proxy authentifié : configurer Java sans enregistrer de mot de passe dans le dépôt.')
    opts += [f'-Dhttps.proxyHost={proxy.hostname}',f'-Dhttps.proxyPort={proxy.port or 80}',f'-Dhttp.proxyHost={proxy.hostname}',f'-Dhttp.proxyPort={proxy.port or 80}','-Dhttp.nonProxyHosts=localhost|127.*']
env['GRADLE_OPTS']=' '.join(opts)
(ROOT/'android/local.properties').write_text(f'sdk.dir={sdk}\n')
def run(args,cwd=ROOT):subprocess.run(args,cwd=cwd,env=env,check=True)
run(['npm','run','build'])
run([str(ROOT/'node_modules/.bin/cap'),'sync','android'])
run(['./gradlew','--no-daemon','--max-workers=3',':app:assembleDebug',':app:lintDebug'],ROOT/'android')
artifact=ROOT/'artifacts/FishQuest-0.2.0-debug.apk';artifact.parent.mkdir(exist_ok=True)
shutil.copy2(ROOT/'android/app/build/outputs/apk/debug/app-debug.apk',artifact)
run([str(sdk/'build-tools/36.0.0/apksigner'),'verify','--verbose',str(artifact)])
digest=hashlib.sha256(artifact.read_bytes()).hexdigest()
artifact.with_suffix('.apk.sha256').write_text(f'{digest}  {artifact.name}\n')
print(f'APK signé et vérifié : {artifact}\nSHA-256 : {digest}')
