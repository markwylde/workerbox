declare type WorkerBoxOptions = {
  scriptUrl?: string,
  appendVersion?: boolean;
};

declare type Scope = object;

export type WorkerBox = {
  run: (code: string, scope?: Scope) => Promise<any>;
  destroy: () => void;
};

declare function createWorkerBox(options?: WorkerBoxOptions): Promise<WorkerBox>;

export default createWorkerBox;
