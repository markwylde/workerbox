declare type WorkerBoxOptions = {
  appendVersion?: boolean;
};
declare type Scope = object;
declare function createWorkerBox(scriptUrl: any, options: WorkerBoxOptions): Promise<{
  run: (code: string, scope?: Scope) => Promise<any>;
  destroy: () => any;
}>
export default createWorkerBox;
