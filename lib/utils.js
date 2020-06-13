const camelizeRE = /-(\w)/g;
function camelize(str) {
	return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const hyphenateRE = /\B([A-Z])/g;
function hyphenate(str) {
	return str.replace(hyphenateRE, '-$1').toLowerCase();
}

module.exports = {
	camelize,
	capitalize,
	hyphenate
};
