const os = require('os');

let cpuCount = os.cpus().length;

if (cpuCount > 2) {
	cpuCount = Number((cpuCount / 2).toFixed(0));
	if (cpuCount > 6) {
		cpuCount--;
		cpuCount--;
	}
}

let binRsvgDft = os.platform() === 'linux' ? 'rsvg-convert' : 'src/assets/bin/rsvg-convert.exe';

module.exports = [
	{
		name: 'limit',
		type: Number,
		alias: 'l',
		defaultValue: 0,
	},
	{
		name: 'concurrency',
		type: Number,
		alias: 'c',
		defaultValue: cpuCount,
	},
	{
		name: 'progress',
		type: Boolean,
		alias: 'p',
		defaultValue: true,
	},
	{
		name: 'verbose',
		type: Boolean,
		alias: 'v',
		defaultValue: false,
	},
	{
		name: 'formats',
		type: String,
		multiple: true,
		defaultValue: ['png', 'svg', 'puml'],
		typeLabel: '{underline format} ...',
	},
	{
		name: 'release',
		type: Boolean,
		defaultValue: false,
	},
	{
		name: 'colors',
		type: String,
		multiple: true,
		defaultValue: ['black'],
		typeLabel: '{underline color} ...',
	},
	{
		name: 'sizes',
		type: Number,
		multiple: true,
		defaultValue: [48],
		typeLabel: '{underline size} ...',
	},
	{
		name: 'icons',
		type: String,
		multiple: true,
		defaultValue: [],
		typeLabel: '{underline icon} ...',
	},
	{
		name: 'fonts',
		type: String,
		multiple: true,
		defaultValue: [],
		typeLabel: '{underline font} ...',
	},
	{
		name: 'binPlantuml',
		type: String,
		defaultValue: 'src/assets/bin/plantuml.jar',
		description: 'The path to the PlantUML executable (.jar) to use',
	},
	{
		name: 'binRsvg',
		type: String,
		defaultValue: binRsvgDft,
		description: 'The path to the rsvg-convert executable to use',
	},
	{
		name: 'build',
		type: String,
		defaultValue: 'build',
	},
	{
		name: 'temp',
		type: String,
		defaultValue: '.tmp',
	},
	{
		name: 'devel',
		type: Boolean,
		defaultValue: false,
	},
	{
		name: 'help',
		alias: 'h',
		type: Boolean,
		description: 'Display this usage guide.',
		defaultValue: false,
	},
];
