/* eslint-env jest */
/**
 * Jest setup for Forkly.
 *
 * The personalization plugin's native TurboModules aren't present in the JS
 * test environment, so we mock the public package surface. This lets component
 * smoke tests render the app without a native binary. Behavior fidelity isn't
 * the goal here — these mocks just satisfy imports and resolve promises.
 */

jest.mock('@salesforce-personalization/react-native-personalization', () => {
  const noop = () => null;
  const asyncVoid = () => Promise.resolve();

  const makeComponent = name => ({
    name,
    validateAndCreateComponentModel: json => JSON.parse(json),
    compose: () => null,
  });

  return {
    // Components
    ContentZone: noop,
    MockContentZone: noop,
    // Controller hook
    useContentZoneController: () => ({
      refresh: asyncVoid,
      _bind: () => {},
      _unbind: () => {},
    }),
    // OOTB component factories
    Banner: () => makeComponent('Salesforce_Banner'),
    Recommendations: () => makeComponent('Salesforce_Recommendations'),
    // Engagement helpers
    getPayloadForAction: () => undefined,
    getPayloadForItemAndAction: () => undefined,
    trackEngagement: () => {},
    // SDK module
    PersonalizationModule: {
      setProfileId: asyncVoid,
      getProfileId: () => Promise.resolve(null),
      setAttribute: asyncVoid,
      setAttributes: asyncVoid,
      getAttributes: () => Promise.resolve({}),
      clearAttribute: asyncVoid,
      clearAllAttributes: asyncVoid,
      setPartyIdentificationName: asyncVoid,
      setPartyIdentificationNumber: asyncVoid,
      setPartyIdentificationType: asyncVoid,
      getPartyIdentificationName: () => Promise.resolve(null),
      getPartyIdentificationNumber: () => Promise.resolve(null),
      getPartyIdentificationType: () => Promise.resolve(null),
      track: asyncVoid,
      handlePreviewUrl: asyncVoid,
      isPreview: () => Promise.resolve(false),
      setConsent: asyncVoid,
      isConsentOptIn: () => Promise.resolve(false),
      setLogging: asyncVoid,
    },
  };
});
