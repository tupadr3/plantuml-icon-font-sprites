/**
 *  Based on https://gist.github.com/spmason/1670196
 */
const util = require('util'),
	winston = require('winston'),
	logger = new winston.Logger(),
	env = (process.env.NODE_ENV || '').toLowerCase(),
	dateFormat = require('dateformat');

// Override the built-in console methods with winston hooks
switch (env) {
	case 'production':
		logger.add(winston.transports.File, {
			filename: __dirname + '/application.log',
			handleExceptions: true,
			exitOnError: false
		});
		break;
	case 'test':
		// Don't set up the logger overrides
		return;
	default:
		logger.add(winston.transports.Console, {
			colorize: true,
			timestamp: function() {
				return dateFormat(new Date(), 'HH:MM:ss');
			}
		});
		break;
}

function formatArgs(args) {
	return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}
console.log = function() {
	logger.debug.apply(logger, formatArgs(arguments));
};
console.info = function() {
	logger.info.apply(logger, formatArgs(arguments));
};
console.warn = function() {
	logger.warn.apply(logger, formatArgs(arguments));
};
console.error = function() {
	logger.error.apply(logger, formatArgs(arguments));
};
console.debug = function() {
	logger.debug.apply(logger, formatArgs(arguments));
};
console.progress = function() {
	logger.debug.apply(logger, formatArgs(arguments));
};

module.exports = logger;
