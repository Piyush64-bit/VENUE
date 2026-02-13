const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');
const os = require('os');

const hostname = os.hostname();

const logDir = 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? (process.env.LOG_LEVEL || 'debug') : (process.env.LOG_LEVEL || 'info');
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

const redact = winston.format((info) => {
    const sensitiveFields = ['password', 'token', 'authorization', 'cookie'];
    if (info.metadata) {
        sensitiveFields.forEach(field => {
            if (info.metadata[field]) info.metadata[field] = '***REDACTED***';
        });
    }
    // Also check the info object itself for top-level metadata
    sensitiveFields.forEach(field => {
        if (info[field]) info[field] = '***REDACTED***';
    });
    return info;
});

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.errors({ stack: true }),
    redact(), // Apply redaction
    process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize({ all: true }),
            winston.format.printf(
                (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
            )
        )
);

const transports = [
    new winston.transports.Console(),
    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, `error-${hostname}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error',
    }),
    new winston.transports.DailyRotateFile({
        filename: path.join(logDir, `combined-${hostname}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
    }),
];

const logger = winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
});

module.exports = logger;
