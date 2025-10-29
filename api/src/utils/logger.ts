import pino from "pino";

const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "yyyy-mm-dd HH:MM:ss",
			ignore: "pid,hostname,component",
			messageFormat: "[{component}] {msg}",
		},
	},
});

export function createLogger(component: string) {
	return logger.child({ component });
}

