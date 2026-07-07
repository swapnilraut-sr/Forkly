module.exports = {
  preset: 'react-native',
  // The personalization plugin ships untranspiled ESM under its `react-native`
  // entry (src/index.tsx). Allow Jest (Babel) to transform it too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@salesforce-personalization/react-native-personalization)/)',
  ],
  // The plugin's native TurboModules aren't available in the JS test env;
  // mock the public package surface so component smoke tests can render.
  setupFiles: ['<rootDir>/jest.setup.js'],
  // @react-navigation resolves to its untranspiled `src/`, which imports PNG
  // assets directly. Stub image assets so the full app tree can render.
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/jest.assetMock.js',
  },
};
