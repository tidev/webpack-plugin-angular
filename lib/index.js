/* eslint indent: ["error", "tab", { "MemberExpression": "off" }] */

const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const { ContextReplacementPlugin, DefinePlugin } = require('webpack');
const { TitaniumAngularCompilerPlugin } = require('webpack-titanium-angular');

module.exports = (api, options) => {
	api.watch([ 'tsconfig.json' ]);

	api.chainWebpack(config => {
		const { build } = options;
		const isProduction = build.deployType === 'production';
		const enableAot = isProduction;

		config.resolveLoader.modules.add(path.join(__dirname, 'node_modules'));

		// entry -------------------------------------------------------------------

		config.entry('main')
			.clear()
			.add('./src/main.ts');

		// resolve -----------------------------------------------------------------

		config.resolve
			.alias
				.set('@', api.resolve('src'))
				.end()
			.extensions
				.prepend('.ts')
				.prepend('.tsx');

		config.resolveLoader
			.alias
				.set('html-loader', path.join(__dirname, 'loader.js'));

		// module rules ------------------------------------------------------------

		config.module.strictExportPresence(true);

		config.module
			.rule('html')
				.test(/\.html$|\.xml$/)
				.use('html-loader')
					.loader('html-loader')
					.options({
						diagnostics: api.context.diagnostics
					});

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

		const fileReplacements = []
		if (isProduction) {
			fileReplacements.push({
				replace: 'src/environments/environment.ts',
				with: 'src/environments/environment.prod.ts'
			})
		}
		const hostReplacementPaths = {}
		for (const replacement of fileReplacements) {
			hostReplacementPaths[replacement.replace] = replacement.with;
		}
		config.plugin('titanium-angular-compiler')
			.use(TitaniumAngularCompilerPlugin, [
				{
					tsConfigPath: api.resolve('tsconfig.json'),
					basePath: api.resolve('src'),
					entryModule: api.resolve('src', 'app', 'app.module#AppModule'),
					skipCodeGeneration: !enableAot,
					hostReplacementPaths
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

		const platformExclude = {
			android: 'ios',
			ios: 'android'
		};
		config.plugin('copy-assets')
			.use(CopyWebpackPlugin, [
				[
					{ from: 'src/assets' },
				],
				{
					ignore: [
						`${platformExclude[build.platform]}/**/*`,
						'.gitkeep',
						'**/.DS_Store',
						'**/Thumbs.db'
					]
				}
			]);
	}, { after: 'built-in:config/app' });
};
