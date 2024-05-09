const Bluebird = require('bluebird'),
	cliOptions = require('./cliOptions.js'),
	cliUsage = require('command-line-usage'),
	fs = require('fs-extra'),
	path = require('path'),
	ProgressBar = require('progress'),
	utils = require('./utils')
	packageJson = require('./../../package.json'),
	version = "v" + packageJson.version;

// config
const cfg = require('./config');
const log = require('./logger');

if (cfg.devel) {
	cfg.limit = cfg.limit == 0 ? 5 : cfg.limit;
	cfg.verbose = true;
}

if (cfg.verbose) {
	log.level = 'debug';
} else {
	log.level = 'warn';
}

if (cfg.help) {
	const usage = cliUsage([
		{
			header: 'Options',
			optionList: cliOptions,
		},
	]);

	process.stdout.write(usage);
} else {
	printInfo();
	generate();
}

async function generate() {
	const fonts = require('./fonts');
	let work = [],
		icons = [];

	if (cfg.github) {
		cfg.png = true;
		cfg.puml = true;
		cfg.colors = ['black'];
		cfg.sizes = [48];
	}

	if (cfg.devel) {
		cfg.examples = true;
		cfg.png = true;
		cfg.puml = true;
		cfg.svg = true;
		cfg.limit = 25;
		cfg.sizes = [128];
		cfg.icons = [
			'fa6-database',
			'fa6-docker',
			'fa6-qrcode',
			'fa6-gitlab',
			'fa5-user_alt',
			'fa5-gitlab',
			'fa5-server',
			'fa5-database',
			'fa-gears',
			'fa-fire',
			'fa-clock_o',
			'fa-lock',
			'fa-cloud',
			'fa-server',
			'dev-nginx',
			'dev-mysql',
			'dev-redis',
			'dev-docker',
			'dev-linux',
			'dev2-html5',
			'dev2-docker',
			'gov-ambulance',
			'weather-night_alt_thunderstorm',
			'material-3d_rotation',
		];
	}

	try {
		icons = await fonts.load(cfg);
	} catch (err) {
		throw err;
	}

	log.debug(`Starting work for ${icons.length} icons`);

	let progressBar = new ProgressBar('working [:bar] :percent :etas :info', {
		complete: '=',
		incomplete: ' ',
		width: 50,
		total: icons.length,
	});

	work.push(
		Bluebird.map(
			icons,
			(item) => {
				if (cfg.progress) {
					progressBar.tick({
						info: item.type + '-' + item.id,
					});
				}
				return fonts.generate(cfg, item);
			},
			{
				concurrency: cfg.concurrency,
			}
		)
	);

	await Promise.all(work);

	if (cfg.release) {

		// for rls always build the index and examples
		cfg.examples = true;
		cfg.index = true;

		// copy icons to rls dir
		for (let item of cfg.fonts) {
			log.debug('Copying ' + item.name);

			let releasePath = cfg.dirs.icons + '/' + item.name,
				pngPath = cfg.dirs.build + '/' + item.type + '/png/' + cfg.sizes[0],
				pumlPath = cfg.dirs.build + '/' + item.type + '/puml';

			await fs.ensureDirSync(releasePath);
			await fs.emptyDirSync(releasePath);

			let pngFiles = await utils.getFiles(pngPath);
			pngFiles = pngFiles
				.map((file) => {
					return {
						file: path.parse(file).name + path.parse(file).ext,
						name: path.parse(file).name,
						ext: path.parse(file).ext,
						path: file,
					};
				})
				.sort(function (a, b) {
					return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
				});

			log.debug('Found ' + item.name + ' ' + pngFiles.length);

			let pumlFiles = await utils.getFiles(pumlPath);
			pumlFiles = pumlFiles
				.map((file) => {
					return {
						file: path.parse(file).name + path.parse(file).ext,
						name: path.parse(file).name,
						ext: path.parse(file).ext,
						path: file,
					};
				})
				.sort(function (a, b) {
					return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
				});

			for (let file of pumlFiles) {
				await fs.copyFileSync(file.path, releasePath + '/' + file.file);
			}
		}
	}

	if (cfg.index) {

		// copy index.html & index.md
		let indexHtmlSrcPath = './src/assets/docs/index.html',
			indexHtmlPath = cfg.dirs.icons + '/index.html';

		let indexHtmlContent = await fs.readFileSync(indexHtmlSrcPath);

		fs.writeFileSync(indexHtmlPath, indexHtmlContent);

		// copy icons to project
		for (let item of cfg.fonts) {
			log.debug('Copying ' + item.name);

			let releasePath = cfg.dirs.icons + '/' + item.name,
				pngPath = cfg.dirs.build + '/' + item.type + '/png/' + cfg.sizes[0],
				pumlPath = cfg.dirs.build + '/' + item.type + '/puml';

			await fs.ensureDirSync(releasePath);

			let files = await utils.getFiles(pngPath);
			files = files
				.map((file) => {
					return {
						file: path.parse(file).name + path.parse(file).ext,
						name: path.parse(file).name,
						ext: path.parse(file).ext,
						path: file,
					};
				})
				.sort(function (a, b) {
					return a.name > b.name ? 1 : b.name > a.name ? -1 : 0;
				});

			log.debug('Found ' + item.name + ' ' + files.length);

			// Generate markdown file
			let indexMdFileName = releasePath + '/index.md';
			let indexMdContent = `# ${item.name}\n\n\n`;
			indexMdContent += `### Overview\n`;
			indexMdContent += `| Name  | Macro  | Image | Url |\n`;
			indexMdContent += `|-------|--------|-------|-----|\n`;

			for (let file of files) {
				await fs.copyFileSync(file.path, releasePath + '/' + file.file);

				indexMdContent += `| ${file.name}`;
				indexMdContent += ` | ${item.type.toUpperCase()}_${file.name.toUpperCase()}`;
				indexMdContent += ` | ![image-${file.name}](${file.name}.png)`;
				indexMdContent += ` | ${file.name}.puml`;
				indexMdContent += ` |\n`;
			}

			fs.writeFileSync(indexMdFileName, indexMdContent);


			// Generate index html file
			indexHtmlContent = `\n<h1>${item.name}</h1>\n`;
			indexHtmlContent += "\n<main class=\"cards\">\n";

			for (let file of files) {

				const data = await fs.readFileSync(file.path);
    			const base64 = data.toString('base64');

				indexHtmlContent += `\n` +
					`<article class="card">` +
					`<img src="data:image/png;base64,${base64}" alt="Embedded Image" />` +
					`<div class="text">` +
					`<h2>${file.name}</h2>` +
					`<pre>\n` +
					`@startuml\n` +
					`!$ICONURL = "https://raw.githubusercontent.com/tupadr3/plantuml-icon-font-sprites/${version}/icons"\n` +
					`!include $ICONURL/common.puml\n` +
					`!include $ICONURL/${item.name}/${file.name}.puml\n` +
					`${item.type.toUpperCase()}_${file.name.toUpperCase()}(d1)\n` +
					`@enduml` +
					`</pre>` +
					`</div>` +
					`</article>` +
					`\n`;
			}

			indexHtmlContent += "\n</main>\n";
			indexHtmlContent += "<hr/>\n";

			fs.appendFileSync(indexHtmlPath, indexHtmlContent);
		}
	}

	if (cfg.examples) {
		// Render examples
		let examplesPath = cfg.dirs.project + '/examples';
		let exampleFiles = await utils.getFiles(examplesPath);
		exampleFiles = exampleFiles.filter((file) => path.parse(file).ext === '.puml');

		for (let file of exampleFiles) {
			await renderPuml(file);
		}
	}

	log.debug('Done');
}

function renderPuml(path) {
	return new Promise(function (resolve, reject) {
		var plantumlJar,
			error = '';

		var plantumlParams = ['-Djava.awt.headless=true', '-jar', cfg.binPlantuml, path];

		log.debug('java ' + plantumlParams.join(' '));

		plantumlJar = require('child_process').spawn('java', plantumlParams);
		plantumlJar.stderr.on('data', (data) => {
			error += data.toString();
		});
		plantumlJar.once('close', function (code) {
			if (code > 0) {
				reject(error);
				return;
			}
			resolve();
		});
	});
}

function printInfo() {
	// info
	let msg = '\nSettings:\n';
	if (cfg.icons.length > 0) {
		msg += 'icons: ';
		cfg.icons.forEach((element) => (msg += ' ' + element));
	} else {
		msg += 'fonts: ';
		cfg.fonts.forEach((element) => (msg += ' ' + element.name));
	}

	msg += '\nformats:';
	msg += cfg.puml ? ' puml' : '';
	msg += cfg.png ? ' png' : '';
	msg += cfg.svg ? ' svg' : '';

	msg += cfg.limit > 0 ? ' \nlimit: ' + cfg.limit : '';

	msg += '\ncolors: ';
	cfg.colors.forEach((element) => (msg += ' ' + element));

	msg += '\nsizes: ';
	cfg.sizes.forEach((element) => (msg += ' ' + element));

	log.debug(msg);
}
