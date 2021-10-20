/**
 * @authot tupadr3
 */
const log = require('./logger'),
	fs = require('fs-extra'),
	git = require('isomorphic-git'),
	http = require('isomorphic-git/http/node'),
	PNG = require('pngjs').PNG;

function def() {
	const fontDefs = [
		{
			prefix: 'FA5',
			name: 'font-awesome-5',
			type: 'fa5',
			repo: 'https://github.com/FortAwesome/Font-Awesome.git',
			branch: '5.15.3',
		},
		{
			prefix: 'FA',
			name: 'font-awesome',
			type: 'fa',
			repo: 'https://github.com/FortAwesome/Font-Awesome.git',
			branch: 'fa-4',
		},
		{
			prefix: 'DEV',
			name: 'devicons',
			type: 'dev',
			repo: 'https://github.com/vorillaz/devicons.git',
			branch: 'master',
		},
		{
			prefix: 'GOV',
			name: 'govicons',
			type: 'gov',
			repo: 'https://github.com/540co/govicons.git',
			branch: '1.5.1',
		},
		{
			prefix: 'WEATHER',
			name: 'weather',
			type: 'weather',
			repo: 'https://github.com/erikflowers/weather-icons.git',
			branch: 'master',
		},
		{
			prefix: 'MATERIAL',
			name: 'material',
			type: 'material',
			repo: 'https://github.com/google/material-design-icons.git',
			branch: '3.0.2',
		},
		{
			prefix: 'DEV2',
			name: 'devicons2',
			type: 'dev2',
			repo: 'https://github.com/devicons/devicon.git',
			branch: 'v2.12.0',
		},
	];
	return fontDefs;
}

async function load(cfg) {
	// Prep the folder structue
	let buildFolder = cfg.dirs.build;
	await fs.ensureDirSync(buildFolder);

	let work = [];
	for (let item of cfg.fonts) {
		try {
			item.path = await repo(cfg, item);
		} catch (err) {
			throw err;
		}

		let buildSetFolder = buildFolder + '/' + item.type;
		await fs.ensureDirSync(buildSetFolder);
		await fs.ensureDirSync(cfg.dirs.generated);

		if (cfg.svg) {
			await fs.ensureDirSync(buildSetFolder + '/svg');
		}
		if (cfg.puml) {
			await fs.ensureDirSync(buildSetFolder + '/puml');
		}
		if (cfg.png) {
			await fs.ensureDirSync(buildSetFolder + '/png');
			for (let index in cfg.sizes) {
				await fs.ensureDirSync(buildSetFolder + '/png/' + cfg.sizes[index]);
			}
		}

		const fontHandler = require('./handler/' + item.type);
		let fontData = await fontHandler.load(cfg, item);

		if (cfg.icons.length > 0) {
			log.debug(`Filtering selection to ${cfg.icons}`);
			fontData = fontData.filter((item) => {
				if (cfg.icons.includes(`${item.type}-${item.id}`)) {
					return true;
				}
				return false;
			});
		}
		work = work.concat(fontData);
	}

	if (cfg.limit > 0) {
		log.debug(`Trimming selection from ${work.length} to ${cfg.limit}`);
		work = work.slice(0, cfg.limit);
	}

	return work;
}

async function repo(cfg, item) {
	log.info('Loading repo ' + item.repo + ' into ' + cfg.dirs.fonts);

	const repoDir = cfg.dirs.fonts + '/' + item.type,
		repoGitDir = cfg.dirs.fonts + '/' + item.type + '/.git';

	try {
		await fs.ensureDirSync(repoDir);

		// check if it already exists
		log.debug(`checking dir ${repoGitDir} for repo`);
		const repoExists = fs.existsSync(repoGitDir);

		if (!repoExists) {
			await git.clone({
				fs,
				http,
				dir: repoDir,
				url: item.repo,
				singleBranch: true,
				ref: item.branch,
				depth: 10,
			});
		}

		log.debug(`checkout ${item.repo} branch:${item.branch} completed to dir ${repoDir}`);
	} catch (err) {
		log.error('repo error', err);
		throw err;
	}
	return repoDir;
}

async function generate(cfg, item) {
	if (cfg.svg) {
		try {
			await generateSvg(cfg, item);
		} catch (error) {
			log.error(error);
		}
	}

	if (cfg.png) {
		for (let index in cfg.sizes) {
			try {
				await generatePng(cfg, item, cfg.sizes[index]);
			} catch (error) {
				log.error(error);
			}
		}
	}
	if (cfg.puml) {
		try {
			await generatePuml(cfg, item);
		} catch (error) {
			log.error(error);
		}
	}
}

function generateSvg(cfg, item) {
	log.debug('Generating svg for ' + item.type + '-' + item.id);

	return new Promise((resolve) => {
		var svgCode = getSvgCode(cfg, item);
		var filename = cfg.dirs.build + '/' + item.type + '/svg/' + item.id + '.svg';
		log.debug('Wrting svg for ' + item.type + '-' + item.id + ' to ' + filename);
		fs.writeFileSync(filename, svgCode);
		resolve(filename);
	});
}

function getSvgCode(cfg, item) {
	const fontHandler = require('./handler/' + item.type);
	let svgCode = fontHandler.getSvgCode(cfg, item);
	return svgCode;
}

function generatePng(cfg, item, size, path) {
	return new Promise(function (resolve, reject) {
		let destPath = path;
		if (!destPath) {
			destPath = cfg.dirs.build + '/' + item.type + '/png/' + size + '/' + item.id + '.png';
		}

		log.debug('Generating png for ' + item.type + '-' + item.id);

		let cliparams = ['-a', '-w', size, '-h', size, '-f', 'png', '-o', destPath],
			error;
		log.debug(cfg.binRsvg, cliparams.join(' '));
		let rsvgConvert = require('child_process').spawn(cfg.binRsvg, cliparams);
		rsvgConvert.stderr.on('data', (data) => {
			error += data.toString();
		});
		rsvgConvert.once('close', function (code) {
			if (code > 0) {
				return reject(error);
			}
			resolve(destPath);
		});
		rsvgConvert.stdin.end(getSvgCode(cfg, item));
	});
}

function generatePuml(cfg, item) {
	return new Promise(async function (resolve, reject) {
		log.debug('Generating plantuml for ' + item.type + '-' + item.id);

		let pngInterFileName = cfg.dirs.generated + '/' + item.type + '-png-48-' + item.id + '.png';
		let pngFileName = await generatePng(cfg, item, 48, pngInterFileName);

		// now we need to modify the png a little bit
		fs.createReadStream(pngFileName)
			.pipe(
				new PNG({
					colorType: 2,
				})
			)
			.on('error', function (err) {
				log.error(err);
			})
			.on('parsed', async function () {
				log.debug('Modifing for puml generation for icon ' + item.type + '-' + item.id);

				for (var y = 0; y < this.height; y++) {
					for (var x = 0; x < this.width; x++) {
						var idx = (this.width * y + x) << 2;
						// invert color
						if (this.data[idx] > 0) {
							this.data[idx] = 0;
							this.data[idx + 1] = 0;
							this.data[idx + 2] = 0;
						}
					}
				}

				// i don't know if we have to wait
				this.pack().pipe(fs.createWriteStream(pngInterFileName));

				let pumlCode;
				try {
					pumlCode = await getPumlCode(cfg, item, pngInterFileName);
				} catch (error) {
					reject(error);
					return;
				}

				var filename = cfg.dirs.build + '/' + item.type + '/puml/' + item.id + '.puml';
				await fs.writeFileSync(filename, pumlCode);
				resolve(filename);
			});
	});
}

function getPumlCode(cfg, item, pngPath) {
	return new Promise(function (resolve, reject) {
		var plantumlJar,
			result = '',
			error = '';

		var template =
			'@startuml' +
			'\n' +
			'{sprite}' +
			'\n' +
			'!define {set}_{entity}(_alias) ENTITY(rectangle,black,{id},_alias,{set} {entity})' +
			'\n' +
			'!define {set}_{entity}(_alias, _label) ENTITY(rectangle,black,{id},_label, _alias,{set} {entity})' +
			'\n' +
			'!define {set}_{entity}(_alias, _label, _shape) ENTITY(_shape,black,{id},_label, _alias,{set} {entity})' +
			'\n' +
			'!define {set}_{entity}(_alias, _label, _shape, _color) ENTITY(_shape,_color,{id},_label, _alias,{set} {entity})' +
			'\n' +
			'skinparam folderBackgroundColor<<{set} {entity}>> White' +
			'\n' +
			'@enduml';

		var plantumlParams = [
			'-Djava.awt.headless=true',
			'-jar',
			cfg.binPlantuml,
			'-encodesprite',
			'16',
			pngPath,
		];

		log.debug('java ' + plantumlParams.join(' '));

		plantumlJar = require('child_process').spawn('java', plantumlParams);
		plantumlJar.stdout.on('data', (data) => {
			result += data.toString();
		});
		plantumlJar.stderr.on('data', (data) => {
			error += data.toString();
		});
		plantumlJar.once('close', function (code) {
			if (code > 0) {
				reject(error);
				return;
			}

			var out = template.substr(0);

			var params = {
				sprite: result.replace('$' + item.type, '$' + item.id.replace(/-/g, '_')),
				set: item.prefix.toUpperCase(),
				entity: item.id.replace(/-/g, '_').toUpperCase(),
				id: item.id.replace(/-/g, '_'),
			};

			Object.keys(params).forEach(function (key) {
				out = out.replace(new RegExp('{' + key + '}', 'g'), params[key]);
			});
			resolve(out);
		});
	});
}

module.exports = {
	def: def,
	load: load,
	generate: generate,
};
