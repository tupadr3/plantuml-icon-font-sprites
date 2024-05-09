const fs = require('fs-extra'),
	util = require('util'),
	log = require('./../logger'),
	readFile = util.promisify(fs.readFile),
	lodash = require('lodash'),
	parseXml = util.promisify(require('xml2js').parseString);

async function load(cfg, item) {
	return await loadFontData(cfg, item, await loadIcons(cfg, item));
}

async function loadIcons(cfg, item) {
	log.debug("Loading devicons2 id's");

	let content = await readFile(item.path + '/devicon-base.css');
	let lines = content.toString();

	let match,
		result = [];

	const regex = /.devicon-([\w-]*):before\s?{\s*content:\s?"\\([\w|\d]*)";\s*}/;
	while ((match = regex.exec(lines))) {
		log.verbose('DEV2 - found ' + match[1]);
		result.push({
			id: match[1].replace('-plain', ''),
			unicodeHex: match[2],
			unicodeDec: parseInt(match[2], 16)
		});
		lines = lines.replace(match[0], '');
	}
	return result;
}

async function loadFontData(cfg, item, iconList) {
	log.debug('Loading devicons2 font-data');

	let content = await readFile(item.path + '/fonts/devicon.svg');
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

	let indexFontData = await lodash.keyBy(fontData, 'unicodeDec');

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
