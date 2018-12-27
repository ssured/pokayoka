module.exports = function(wallaby) {
  return {
    files: [
      'jest.setup.js',
      'src/**/*.js',
      '!src/**/*.test.js',
      'src/**/*.ts',
      '!src/**/*.test.ts',
      'src/**/*.tsx',
      '!src/**/*.test.tsx',
      'server/**/*.js',
      '!server/**/*.test.js',
      'server/**/*.ts',
      '!server/**/*.test.ts',
      '!server/**/*.testnc.ts', // no coverage
      'server/**/*.tsx',
      '!server/**/*.test.tsx',
    ],

    tests: [
      'src/**/*.test.js',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'server/**/*.test.js',
      'server/**/*.test.ts',
      {
        pattern: 'server/**/*.testnc.ts',
        instrument: false,
        load: true,
        ignore: false,
      },
      'server/**/*.test.tsx',
    ],

    env: {
      type: 'node',
      runner: 'node',
    },

    testFramework: 'jest',

    hints: {
      ignoreCoverage: /ignore coverage/,
    },
    //   compilers: {
    //     '**/*.js': wallaby.compilers.babel()
    //   }
  };
};
