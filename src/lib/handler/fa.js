const fs = require('fs-extra'),
	util = require('util'),
	log = require('./../logger'),
	readFile = util.promisify(fs.readFile),
	loadash = require('lodash'),
	parseXml = util.promisify(require('xml2js').parseString),
	extend = require('extend');

async function load(cfg, item) {
	let iconList = await loadIcons(cfg, item);
	let icons = await loadFontData(cfg, item, iconList);
	return icons;
}

async function loadIcons(cfg, item) {
	log.debug("Loading fa id's");
	let content = await readFile(item.path + '/less/variables.less');
	let lines = content.toString();

	let match,
		result = [];

	const regex = /@fa-var-([\w-]+):\s*"\\([0-9a-f]+)";/g;
	while ((match = regex.exec(lines))) {
		result.push({
			id: match[1],
			unicodeHex: match[2],
			unicodeDec: parseInt(match[2], 16)
		});
	}
	return result;
}

async function loadFontData(cfg, item, iconList) {
	log.debug('Loading fa font-data');
	let content = await readFile(item.path + '/fonts/fontawesome-webfont.svg');
	content = content.toString('utf-8');

	let parsedXml = await parseXml(content),
		glyph = parsedXml.svg.defs[0].font[0].glyph,
		svghorz = parsedXml.svg.defs[0].font[0].$['horiz-adv-x'],
		offset = parsedXml.svg.defs[0].font[0]['font-face'][0].$['descent'],
		size = parsedXml.svg.defs[0].font[0]['font-face'][0].$['units-per-em'];

	let fontData = glyph
		.filter(data => {
			if (!data.$.unicode) {
				return false;
			}
			return true;
		})
		.map(data => {
			return {
				data: data.$,
				unicodeDec: data.$.unicode.charCodeAt(0)
			};
		});

	let indexFontData = await loadash.keyBy(fontData, 'unicodeDec');

	let icons = iconList.map(icon => {
		let iconConfig = {
			id: icon.id.split('-').join('_'),
			type: item.type,
			prefix: item.prefix,
			unicodeHex: icon.unicodeHex,
			unicodeDec: icon.unicodeDec,
			data: indexFontData[icon.unicodeDec].data
		};
		iconConfig.advWidth = parseInt(iconConfig.data['horiz-adv-x'] || svghorz);
		iconConfig.offset = parseInt(offset);
		iconConfig.size = parseInt(size);
		return iconConfig;
	});

	return icons;
}

function getSvgCode(cfg, item) {
	log.debug('Getting svg code for ' + item.type + '-' + item.id);

	let params = {
		color: cfg.color || 'black',
		path: item.data.d,
		width: item.advWidth,
		height: item.size,
		shiftX: item.advWidth / 10 / 2,
		shiftY: -item.size - item.offset - item.size / 10 / 2
	};

	return (
		`<svg width="${params.height}" height="${params.height}"` +
		` viewBox="0 0 ${params.height} ${params.height}" preserveAspectRatio="xMinYMid slice">\n` +
		`\t<svg width="${params.height}" height="${params.height}"` +
		` viewBox="0 0 ${params.width} ${params.height}">\n` +
		`\t\t<g transform="scale(1 -1) scale(0.9)` +
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
