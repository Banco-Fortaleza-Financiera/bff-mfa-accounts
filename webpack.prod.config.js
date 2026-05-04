const { share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
const path = require('path');
const webpack = require('webpack');

const moduleFederationConfig = withModuleFederationPlugin({
  name: 'bffMfaAccounts',
  filename: 'remoteEntry.js',
  exposes: {
    './AccountsModule': './src/app/accounts/accounts.module.ts',
    './AccountsListComponent': './src/app/accounts/accounts-list/accounts-list.component.ts'
  },
  shared: share({
    '@angular/core': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/common': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/compiler': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/router': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    '@angular/forms': { singleton: true, strictVersion: false, requiredVersion: 'auto' },
    'rxjs': { singleton: true, strictVersion: false, requiredVersion: 'auto' }
  }),
  extraOptions: {
    exposeModuleId: 'bffMfaAccounts'
  }
});

const environmentFiles = {
  local: 'environment.local.ts',
  dev: 'environment.dev.ts',
  test: 'environment.test.ts',
  production: 'environment.prod.ts',
  prod: 'environment.prod.ts'
};

module.exports = (env = {}) => {
  const configuration = env.configuration || 'production';
  const environmentFile = environmentFiles[configuration] || environmentFiles.production;
  const environmentPath = path.resolve(__dirname, 'src/environments', environmentFile);

  return {
    ...moduleFederationConfig,
    entry: {
      main: './src/remote-bootstrap.ts'
    },
    output: {
      ...(moduleFederationConfig.output || {}),
      path: path.resolve(__dirname, 'dist/bff-mfa-accounts/browser'),
      publicPath: 'auto'
    },
    resolve: {
      ...moduleFederationConfig.resolve,
      extensions: ['.ts', '.js', '.mjs']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.app.json',
                transpileOnly: true
              }
            },
            {
              loader: path.resolve(__dirname, 'loaders/angular-resource-inline-loader.js')
            }
          ],
          exclude: /node_modules/
        }
      ]
    },
    plugins: [
      ...(moduleFederationConfig.plugins || []),
      new webpack.NormalModuleReplacementPlugin(
        /environments\/environment$/,
        environmentPath
      )
    ]
  };
};
