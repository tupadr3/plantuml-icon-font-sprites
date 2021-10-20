const fs = require('fs-extra'),
	git = require('isomorphic-git'),
	http = require('isomorphic-git/http/node'),
	log = require('./logger'),
	{ promisify } = require('util'),
	{ resolve } = require('path'),
	readdir = promisify(fs.readdir),
	stat = promisify(fs.stat);

async function repo(repo, branch, target) {
	log.debug('Loading Repo ' + repo + ' into ' + target);

	try {
		await fs.ensureDirSync(target);

		// check if it already exists
		log.debug(`checking dir ${target}/.git for repo`);
		const repoExists = fs.existsSync(target + '/.git');

		if (!repoExists) {
			await git.clone({
				fs,
				http,
				dir: target,
				url: repo,
				singleBranch: true,
				ref: branch,
				depth: 10,
			});
		}

		log.info(`checkout ${repo} branch:${branch} completed to dir ${target}`);
	} catch (err) {
		log.error('repo error', err);
		throw err;
	}
	return target;
}

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
	repo: repo,
	getFiles: getFiles,
};
