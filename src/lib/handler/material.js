const fs = require('fs-extra'),
	util = require('util'),
	log = require('./../logger'),
	readFile = util.promisify(fs.readFile),
	parseXml = util.promisify(require('xml2js').parseString);

async function load(cfg, item) {
	let icons = await loadFontData(cfg, item);
	return icons;
}

async function loadFontData(cfg, item) {
	log.debug(`Loading ${item.type} font-data`);

	let filesList = [item.path + '/iconfont/MaterialIcons-Regular.svg'];

	let fontData = [];
	for (let key in filesList) {
		let item = filesList[key];
		let content = await readFile(item);
		content = content.toString('utf-8');

		let parsedXml = await parseXml(content),
			glyph = parsedXml.svg.defs[0].font[0].glyph,
			svghorz = parsedXml.svg.defs[0].font[0].$['horiz-adv-x'],
			offset = parsedXml.svg.defs[0].font[0]['font-face'][0].$['descent'],
			size = parsedXml.svg.defs[0].font[0]['font-face'][0].$['units-per-em'];

		let fontDataItem = glyph
			.filter(data => {
				if (!data.$.unicode) {
					return false;
				}
				if (!data.$.d) {
					return false;
				}
				if (data.$.d === 'M0 0z') {
					return false;
				}
				return true;
			})
			.map(data => {
				return {
					data: data.$,
					unicodeDec: data.$.unicode.charCodeAt(0),
					svghorz: svghorz,
					offset: offset,
					size: size
				};
			});


		fontData = fontData.concat(fontDataItem);
	}

	let icons = fontData.map(icon => {
		let iconData = icon.data;

		let iconConfig = {
			id: icon.data['glyph-name'].split('-').join('_'),
			type: item.type,
			prefix: item.prefix,
			unicodeHex: icon.unicodeHex,
			unicodeDec: icon.unicodeDec,
			data: iconData,
			offset: parseInt(icon.offset),
			size: parseInt(icon.size),
			advWidth: parseInt(iconData['horiz-adv-x'] || icon.svghorz)
		};

		log.verbose('MATERIAL - found ' + iconConfig.id);
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
		shiftX: 0,
		shiftY: -item.size - item.offset
	};

	return (
		`<svg width="${params.height}" height="${params.height}"` +
		` viewBox="0 0 ${params.height} ${params.height}" preserveAspectRatio="xMinYMid slice">\n` +
		`\t<svg width="${params.height}" height="${params.height}"` +
		` viewBox="0 0 ${params.width} ${params.height}">\n` +
		`\t\t<g transform="scale(1 -1) translate(${params.shiftX} ${params.shiftY})">\n` +
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
