import { EventEmitter } from "events";
import pRetry from "p-retry";
import { Task, TaskType } from "../types/tasks";
import { createLogger } from "../utils/logger";

const logger = createLogger("TASK_QUEUE");

class TaskQueue extends EventEmitter {
	private processing = false;
	private queue: Task[] = [];

	constructor() {
		super();
		this.on("task", (task: Task) => {
			this.enqueue(task);
		});
	}

	private enqueue(task: Task) {
		this.queue.push(task);
		if (!this.processing) {
			this.processQueue();
		}
	}

	private async processQueue() {
		if (this.processing || this.queue.length === 0) {
			return;
		}

		this.processing = true;

		while (this.queue.length > 0) {
			const task = this.queue.shift();
			if (!task) continue;

			try {
				await this.executeWithRetry(task);
			} catch (error) {
				logger.error({ error, taskType: task.type }, "Task failed after retries");
			}
		}

		this.processing = false;
	}

	private async executeWithRetry(task: Task): Promise<void> {
		logger.debug({ taskType: task.type }, "Executing task");
		
		return pRetry(
			async () => {
				// Create a promise that waits for the handler to complete
				return new Promise<void>((resolve, reject) => {
					const timeout = setTimeout(() => {
						reject(new Error(`Task ${task.type} timed out after 60 seconds`));
					}, 60000);

					// Emit and wait for handler to signal completion
					const handler = (error?: Error) => {
						clearTimeout(timeout);
						if (error) {
							reject(error);
						} else {
							resolve();
						}
					};

					// Emit with callback
					this.emit(`process:${task.type}`, task, handler);
				});
			},
			{
				retries: 8,
				minTimeout: 5000,    // Start at 5s instead of 3s
				maxTimeout: 120000,  // Up to 2 minutes
				factor: 3,           // More aggressive exponential backoff (3x instead of 2x)
				onFailedAttempt: (errorContext) => {
					const error = errorContext as any; // p-retry types include the actual error properties
					const errorName = error.name || error.constructor?.name || "Unknown";
					const errorMsg = error.message || "(no message)";
					
					// Check if this is a rate limit or connection error that needs extra backoff
					const isRateLimitError = errorMsg.includes("429") || errorMsg.includes("Too Many Requests");
					const isConnectionError = errorMsg.includes("P1017") || errorMsg.includes("closed the connection");
					
					if (isRateLimitError || isConnectionError) {
						logger.warn(
							{
								taskType: task.type,
								attemptNumber: error.attemptNumber,
								retriesLeft: error.retriesLeft,
								errorType: isRateLimitError ? "RATE_LIMIT" : "CONNECTION_CLOSED",
								errorMsg,
							},
							"Rate limit or connection error detected - will retry with backoff"
						);
					} else {
						logger.warn(
							{
								taskType: task.type,
								attemptNumber: error.attemptNumber,
								retriesLeft: error.retriesLeft,
								errorName,
								errorMsg,
							},
							"Task attempt failed, retrying"
						);
					}

					if (this.isNonRetryableError(error)) {
						logger.error({ taskType: task.type, errorName, errorMsg }, "Task marked as non-retryable, aborting");
						throw error;
					}
				},
			}
		);
	}

	private isNonRetryableError(error: any): boolean {
		const message = error.message?.toLowerCase() || "";
		return (
			message.includes("invalid signature") ||
			message.includes("insufficient funds") ||
			message.includes("invalid account")
		);
	}

	public emit(event: string | symbol, ...args: any[]): boolean {
		return super.emit(event, ...args);
	}

	public on(event: string | symbol, listener: (...args: any[]) => void): this {
		return super.on(event, listener);
	}

	public dispatchTask(task: Task) {
		this.emit("task", task);
	}
}

export const taskQueue = new TaskQueue();
