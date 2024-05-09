const fs = require('fs-extra'),
	log = require('./logger'),
	{ promisify } = require('util'),
	{ resolve } = require('path'),
	readdir = promisify(fs.readdir),
	stat = promisify(fs.stat);



async function getFiles(dir) {
	const subdirs = await readdir(dir);
	const files = await Promise.all(
		subdirs.map(async (subdir) => {
			const res = resolve(dir, subdir);
			return (await stat(res)).isDirectory() ? getFiles(res) : res;
		})
	);
	return files.reduce((a, f) => a.concat(f), []);
}

module.exports = {
	getFiles: getFiles,
};
