declare type WorkerBoxOptions = {
  appendVersion?: boolean;
};

declare type Scope = object;

export type WorkerBox = {
  run: (code: string, scope?: Scope) => Promise<any>;
  destroy: () => void;
};

declare function createWorkerBox(
  scriptUrl?: string,
  options?: WorkerBoxOptions
): Promise<WorkerBox>;

export default createWorkerBox;
