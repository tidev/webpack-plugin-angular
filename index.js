/* eslint indent: ["error", "tab", { "MemberExpression": "off" }] */

const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { ContextReplacementPlugin, DefinePlugin } = require('webpack');
const { TitaniumAngularCompilerPlugin } = require('webpack-titanium-angular');

module.exports = (api, options) => {
	api.chainWebpack(config => {
		const { build } = options;
		const isProduction = build.deployType === 'production';
		// AoT is currently broken, see https://jira.appcelerator.org/browse/FRAME-6
		const enableAot =  false; // isProduction
		const tsConfigFile = enableAot ? 'tsconfig.aot.json' : 'tsconfig.json';

		config.resolveLoader.modules.add(path.join(__dirname, 'node_modules'));

		// entry -------------------------------------------------------------------

		config.entry('main')
			.clear()
			.add(isProduction ? './src/main.aot.ts' : './src/main.ts');

		// resolve -----------------------------------------------------------------

		config.resolve
			.alias
				.set('@', api.resolve('src'))
				.end()
			.extensions
				.prepend('.ts')
				.prepend('.tsx');

		// module rules ------------------------------------------------------------

		config.module
			.rule('html')
				.test(/\.html$|\.xml$/)
				.use('raw-loader')
					.loader('raw-loader');

		config.module
			.rule('angular')
				.test(/(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/)
				.use('ngtools')
					.loader('@ngtools/webpack');

		// Mark files inside `@angular/core` as using SystemJS style dynamic imports.
		// Removing this will cause deprecation warnings to appear.
		config.module
			.rule('angular-core-systemjs')
				.test(/[/\\]@angular[/\\]core[/\\].+\.js$/)
				.parser({ system: true });

		// plugins -----------------------------------------------------------------

		config.plugin('titanium-angular-compiler')
			.use(TitaniumAngularCompilerPlugin, [
				{
					tsConfigPath: api.resolve(tsConfigFile),
					basePath: api.resolve('src'),
					entryModule: api.resolve('src', 'app', 'app.module#AppModule'),
					skipCodeGeneration: !enableAot
				}
			]);

		config.plugin('angular-defines')
			.use(DefinePlugin, [
				{
					'process.env.TARGET_PLATFORM': JSON.stringify(build.platform)
				}
			]);

		// Always replace the context for the System.import in angular/core to prevent warnings.
		// https://github.com/angular/angular/issues/11580
		// With VE the correct context is added in @ngtools/webpack, but Ivy doesn't need it at all.
		config.plugin('angular-core-critical-deps')
			.use(ContextReplacementPlugin, [ /@angular(\\|\/)core(\\|\/)/ ]);

		config.plugin('copy-assets')
			.use(CopyWebpackPlugin, [
				[
					{ from: 'src/assets', to: 'assets' },
				],
				{ ignore: [ '.gitkeep', '**/.DS_Store', '**/Thumbs.db' ] }
			]);
	}, { after: 'built-in:config/app' });
};
