/* eslint indent: ["error", "tab", { "MemberExpression": "off" }] */

const path = require('path');
const { DefinePlugin } = require('webpack');
const { TitaniumAngularCompilerPlugin } = require('webpack-titanium-angular');

module.exports = (api, options) => {
	api.chainWebpack(config => {
		const { build } = options;
		const isProduction = build.deployType === 'production';
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
				.merge([ '.ts' ]);

		// module rules ------------------------------------------------------------

		config.module
			.rule('html')
				.test(/\.html$|\.xml$/)
				.use('html-loader')
					.loader('html-loader');

		config.module
			.rule('angular')
				.test(/(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/)
				.use('ngtools')
					.loader('@ngtools/webpack');

		config.module
			.rule('angular-core')
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
	}, { after: 'built-in:config/app' });
};
