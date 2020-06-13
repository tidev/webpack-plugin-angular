const htmlparser = require('htmlparser2');
const { getOptions } = require('loader-utils');
const { registerTitaniumElements, TitaniumElementRegistry } = require('titanium-vdom');

const { camelize, capitalize, hyphenate } = require('./utils');

const elementRegistry = TitaniumElementRegistry.getInstance();
elementRegistry.defaultViewMetadata = {
	detached: false
};
registerTitaniumElements(elementRegistry);

module.exports = function (content) {
	const { diagnostics } = getOptions(this);

	const parser = new htmlparser.Parser(
		{
			onopentag(tag) {
				const possibleTagNames = [ hyphenate(tag), capitalize(camelize(tag)) ];
				for (const tagName of possibleTagNames) {
					if (elementRegistry.hasElement(tagName)) {
						const metadata = elementRegistry.getViewMetadata(tagName);
						const typeName = metadata.typeName;
						const lastDotIndex = metadata.typeName.lastIndexOf('.');
						const createFunctionSymbolName = typeName.slice(0, lastDotIndex + 1) + 'create' + typeName.slice(lastDotIndex + 1);
						diagnostics.recordApiUsage(this.resourcePath, createFunctionSymbolName);
					}
				}
			}
		},
		{ lowerCaseTags: true }
	);
	parser.write(content);
	parser.end();

	const json = JSON.stringify(content)
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');

	return `export default ${json}`;
};
