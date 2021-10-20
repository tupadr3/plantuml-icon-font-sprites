/**
 * @authot tupadr3
 */
const cliArgs = require('command-line-args'),
	cliOptions = require('./cliOptions.js'),
	path = require('path');

function initConfig() {
	const cfg = cliArgs(cliOptions);
	const fontsDef = require('./fonts').def();
	let fonts = cfg.fonts;
	cfg.fonts = [];

	// validate fonts
	if (fonts.length > 0) {
		fonts.forEach((item) => {
			const found = fontsDef.find(function (element) {
				return element.type === item;
			});
			if (found) {
				cfg.fonts.push(found);
			} else {
				throw new Error('Font ' + item + ' not found');
			}
		});
	} else {
		cfg.fonts = fontsDef;
	}

	cfg.png = false;
	cfg.puml = false;
	cfg.svg = false;

	if (cfg.formats) {
		cfg.formats.forEach((item) => {
			if (item === 'png') {
				cfg.png = true;
			}
			if (item === 'puml') {
				cfg.puml = true;
			}
			if (item === 'svg') {
				cfg.svg = true;
			}
		});
	}

	// setup dirs
	cfg.dirs = {};
	cfg.dirs.temp = path.resolve(cfg.temp);
	cfg.dirs.project = path.resolve('./');
	cfg.dirs.generated = path.resolve(cfg.temp + '/generated');
	cfg.dirs.build = path.resolve(cfg.temp + '/' + cfg.build);
	cfg.dirs.fonts = path.resolve(cfg.temp + '/fonts');
	return cfg;
}

module.exports = initConfig();
