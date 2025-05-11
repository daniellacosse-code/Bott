export class TaskThrottler {
  throttleWindowMs: number;
  maxTaskCount: number;
  taskRecord: Record<string, Date[]>;

  constructor(
    throttleWindowMs: number,
    maxActionCount: number,
    actionRecord?: Record<string, Date[]>,
  ) {
    this.throttleWindowMs = throttleWindowMs;
    this.maxTaskCount = maxActionCount;
    this.taskRecord = actionRecord ?? {};
  }

  canRunTask(actionId: string): boolean {
    const nowMs = Date.now().valueOf();
    const timestamps = this.taskRecord[actionId];

    if (!timestamps) {
      return true;
    }

    this.taskRecord[actionId] = timestamps.filter((timestamp) =>
      (timestamp.valueOf() + this.throttleWindowMs) > nowMs
    );

    return this.taskRecord[actionId].length < this.maxTaskCount;
  }

  tryTask(actionName: string): boolean {
    if (!this.canRunTask(actionName)) {
      return false;
    }

    if (!this.taskRecord[actionName]) {
      this.taskRecord[actionName] = [new Date()];
    } else {
      this.taskRecord[actionName].push(new Date());
    }

    return true;
  }
}
