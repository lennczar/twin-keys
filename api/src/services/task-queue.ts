import { EventEmitter } from "events";
import pRetry from "p-retry";
import { Task, TaskType } from "../types/tasks";

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
				console.log(`✓ Task completed: ${task.type}`);
			} catch (error) {
				console.error(`✗ Task failed after retries: ${task.type}`, error);
			}
		}

		this.processing = false;
	}

	private async executeWithRetry(task: Task): Promise<void> {
		return pRetry(
			async () => {
				this.emit(`process:${task.type}`, task);
			},
			{
				retries: 5,
				minTimeout: 3000,
				maxTimeout: 60000,
				factor: 2,
				onFailedAttempt: (error) => {
					console.warn(
						`Task ${task.type} attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
					);

					if (this.isNonRetryableError(error)) {
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
