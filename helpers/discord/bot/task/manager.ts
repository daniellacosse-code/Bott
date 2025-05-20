import { TaskThrottler } from "./throttler.ts";

type Task = (signal: AbortSignal) => Promise<void>;

type TaskChannelName = string;

type TaskChannel = {
  name: TaskChannelName;
  current?: {
    nonce?: number;
    task: Task;
    taskController: AbortController;
    taskType: string;
  };
  next?: {
    task: Task;
    taskType: string;
  };
  remainingSwaps: number;
  config: {
    maximumSequentialSwaps: number;
  };
};

type TaskChannelMap = Map<TaskChannelName, TaskChannel>;

export class TaskManager {
  taskTypeThrottler: TaskThrottler;
  map: TaskChannelMap = new Map();
  private isFlushing = false;

  constructor(throttler: TaskThrottler) {
    this.taskTypeThrottler = throttler;
  }

  push(name: TaskChannelName, task: Task, taskType = "TODO") {
    if (!this.map.has(name)) {
      throw new Error("Channel not found");
    }

    this.map.get(name)!.next = { task, taskType };

    this.flushTasks();
  }

  add(channel: TaskChannel) {
    this.map.set(channel.name, channel);

    this.flushTasks();
  }

  private async flushTasks() {
    if (this.isFlushing) {
      return;
    }

    this.isFlushing = true;

    for (const channel of this.map.values()) {
      if (!channel.next) {
        continue;
      }

      // populate/override the current task
      if (!channel.current || channel.remainingSwaps > 0) {
        const previous = channel.current;

        channel.current = {
          nonce: this.getNonce(),
          taskController: new AbortController(),
          ...channel.next,
        };
        channel.next = undefined;

        if (previous && channel.remainingSwaps > 0) {
          previous.taskController?.abort();
          channel.remainingSwaps--;
        }
      }

      // continue if we can't run this task
      if (
        !(channel.current &&
            this.taskTypeThrottler.canRun(channel.current.taskType) ||
          channel.remainingSwaps < 0)
      ) {
        continue;
      }

      // start the current task
      try {
        await channel.current!.task(channel.current!.taskController.signal);
      } catch (error) {
        // do nothing
      } finally {
        this.taskTypeThrottler?.recordRun(channel.current!.taskType);

        channel.current = undefined;
        channel.remainingSwaps = channel.config.maximumSequentialSwaps;

        this.flushTasks();
      }
    }

    this.isFlushing = false;
  }

  private getNonce() {
    return Math.floor(Math.random() * 1000000000);
  }
}
