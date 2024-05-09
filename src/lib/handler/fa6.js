const fs = require('fs-extra'),
	util = require('util'),
	log = require('./../logger'),
	readFile = util.promisify(fs.readFile),
	loadash = require('lodash'),
	parseXml = util.promisify(require('xml2js').parseString);

async function load(cfg, item) {
	let iconList = await loadIcons(cfg, item);
	return iconList;
}

async function loadIcons(cfg, item) {
	log.debug("Loading fa6 id's");
	let result = [];
	let content = await readFile(item.path + '/metadata/icons.json');

	let iconMetaJson = JSON.parse(content);
	for (let key in iconMetaJson) {
		let iconInfo = iconMetaJson[key];
		let svgStylesKeys = Object.keys(iconInfo.svg);
		let svgFirstStyle = svgStylesKeys[0];

		if (svgFirstStyle != 'solid' && svgFirstStyle != 'brands') {
			log.debug(svgFirstStyle);
		}

		let parsedXml = await parseXml(iconInfo.svg[svgFirstStyle].raw);
		let path = parsedXml.svg.path[0].$;

		let iconConfig = {
			id: key.split('-').join('_'),
			type: item.type,
			prefix: item.prefix,
			unicodeDec: iconInfo.unicode,
			path: path.d,
			offset: 0,
			height: iconInfo.svg[svgFirstStyle].height,
			advWidth: iconInfo.svg[svgFirstStyle].width
		};
		result.push(iconConfig);
	}
	return result;
}

function getSvgCode(cfg, item) {
	log.debug('Getting svg code for ' + item.type + '-' + item.id);

	let params = {
		color: cfg.color || 'black',
		path: item.path,
		width: item.advWidth,
		height: item.height,
		shiftX: item.advWidth / 20 + 2,
		shiftY: item.height / 20,
	};

	return (
		`<svg width="${params.height}" height="${params.height}"` +
		` viewBox="0 0 ${params.height} ${params.height}" preserveAspectRatio="xMinYMid slice">\n` +
		`\t<svg width="${params.height}" height="${params.height}"` +
		` viewBox="0 0 ${params.width} ${params.height}">\n` +
		`\t\t<g transform="scale(0.95) scale(0.95)` +
		` translate(${params.shiftX} ${params.shiftY})">\n` +
		`\t\t\t<path d="${params.path}" fill="${params.color}" />\n` +
		`\t\t</g>\n` +
		`\t</svg>\n` +
		`</svg>`
	);
}

module.exports = {
	load: load,
	getSvgCode: getSvgCode
};
