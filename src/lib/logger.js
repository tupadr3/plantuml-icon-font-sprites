/**
 *  Based on https://gist.github.com/spmason/1670196
 */

const winston = require('winston');
const { combine, timestamp, printf, colorize, align } = winston.format;

const logger = winston.createLogger({
	level: 'debug',
	format: combine(
		colorize({ all: true }),
		timestamp({
			format: 'YYYY-MM-DD HH:mm:ss.SSS',
		}),
		printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
	),
	transports: [new winston.transports.Console()],
});

module.exports = logger;
