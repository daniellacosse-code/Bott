import { BinaryHeap as Heap } from "jsr:@std/data-structures"; 

type JobId = number;
type CancellableTask = (signal: AbortSignal) => Promise<void>;
type Comparison = -1 | 0 | 1;

interface Job {
  id: JobId;
  task: CancellableTask;
  remainingSwaps: number;
  abortController: AbortController;
}

const DEFAULT_INITIAL_SWAPS = 6;
const minJobSwapComparator = (a: Job, b: Job): Comparison => {
  if (a.remainingSwaps > b.remainingSwaps) return -1;
  if (a.remainingSwaps < b.remainingSwaps) return 1;

  return 0;
};

export class JobQueue {
  private backlogMap = new Map<JobId, Job>();
  private priorityHeap = new Heap<Job>(minJobSwapComparator);
  private runningJob?: Job;

  /**
   * Adds a new job or replaces an existing one based on its ID.
   * The new job inherits the decremented remainingSwaps from the old one if replaced.
   * @returns True if the job was added/replaced, false if ignored (allowedSwaps <= 0).
   */
  add(id: JobId, task: CancellableTask): boolean {
    const job: Job = {
      id,
      task,
      remainingSwaps: DEFAULT_INITIAL_SWAPS,
      abortController: new AbortController(),
    };
  
    // If this is a running job, abort it and replace it with the new one
    if (job.id === this.runningJob?.id && this.runningJob.remainingSwaps > 0) {
      this.runningJob.abortController.abort();

      job.remainingSwaps = this.runningJob.remainingSwaps - 1;

      this.backlogMap.set(job.id, job);
      this.try(job.id);

      return true;
    }

    const existingJob = this.backlogMap.get(id);

    if (existingJob && existingJob.remainingSwaps <= 0) {
      // Drop job if there's no valid slot
      if (existingJob.remainingSwaps <= 0) {
        return false;
      }
      
      // If this is a replacement job, decrement allowedSwaps
      job.remainingSwaps = existingJob.remainingSwaps - 1;
    }

    // add job to the data structure
    this.backlogMap.set(job.id, job);
    this.priorityHeap.push(job);

    this.tryNext();

    return true;
  }

  /**
   * Attempts to run a specific job by its ID if no job is currently running.
   * If the job is outdated (no longer in backlog), it's skipped.
   */
  private async try(id: JobId) {
    if (!this.backlogMap.has(id)) {
      this.runningJob = undefined; // Skip this outdated job instance
      return;
    }

    this.runningJob = this.backlogMap.get(id);
    this.backlogMap.delete(id);
       
    try {
      await this.runningJob?.task(this.runningJob?.abortController.signal);
    } catch (_) {
      // do nothing
    } finally {
      this.runningJob = undefined;
      this.tryNext();
    }
  }

  /**
   * Finds and runs the job with the lowest allowedSwaps from the heap
   * if no job is currently running, skipping outdated entries.
   */
  private async tryNext() {
    if (this.runningJob) {
      return;
    }

    while (this.priorityHeap.length > 0) {
      const potentialJob = this.priorityHeap.pop();
      if (!potentialJob) {
        continue;
      }

      await this.try(potentialJob.id);
    }
  }
}
