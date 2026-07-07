/**
 * App-level personalization bootstrap.
 *
 * On mount this:
 *   1. Sets the native SDK log level (PersonalizationModule.setLogging).
 *   2. Emits a SystemEvent for app launch.
 *   3. Reads back current consent + profile id so the UI reflects native state.
 *   4. Registers a deep-link listener that forwards any `…?sfp-preview=…` URL
 *      (forkly:// or personalizationdemo://) to
 *      PersonalizationModule.handlePreviewUrl (preview mode).
 *
 * It exposes a little shared session state (profile id, consent) plus refreshers
 * so the Account screen and others stay in sync after mutations.
 */

import * as React from 'react';
import { Linking } from 'react-native';
import {
  getProfileId,
  handlePreviewUrl,
  isConsentOptIn,
  setLogging,
  trackSystem,
} from '../personalization/sdk';

type SessionState = {
  ready: boolean;
  profileId: string | null;
  consentOptIn: boolean | null; // null = unknown/not yet set
  refreshProfileId: () => Promise<void>;
  refreshConsent: () => Promise<void>;
};

const PersonalizationContext = React.createContext<SessionState | null>(null);

export function PersonalizationProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [consentOptIn, setConsentOptIn] = React.useState<boolean | null>(null);

  const refreshProfileId = React.useCallback(async () => {
    const id = await getProfileId();
    setProfileId(id);
  }, []);

  const refreshConsent = React.useCallback(async () => {
    const optedIn = await isConsentOptIn();
    setConsentOptIn(optedIn);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await setLogging('DEBUG');
        await trackSystem('forkly_app_launched', { platform: 'react-native', app: 'Forkly' });
        await refreshProfileId();
        await refreshConsent();
      } catch (e) {
        console.warn('[Forkly] bootstrap error', e);
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    })();

    // Forward preview deep links to the SDK (cold start + warm).
    const onUrl = (url: string | null) => {
      if (url && url.includes('sfp-preview')) {
        handlePreviewUrl(url).catch(e => console.warn('[Forkly] preview url', e));
      }
    };
    Linking.getInitialURL().then(onUrl);
    const sub = Linking.addEventListener('url', ({ url }) => onUrl(url));

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [refreshProfileId, refreshConsent]);

  const value = React.useMemo<SessionState>(
    () => ({ ready, profileId, consentOptIn, refreshProfileId, refreshConsent }),
    [ready, profileId, consentOptIn, refreshProfileId, refreshConsent],
  );

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = React.useContext(PersonalizationContext);
  if (!ctx) {
    throw new Error('useSession must be used within a PersonalizationProvider');
  }
  return ctx;
}
