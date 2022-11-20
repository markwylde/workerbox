declare type WorkerBoxOptions = {
  appendVersion: boolean;
  randomiseSubdomain: boolean;
};
declare type Scope = object;
declare type WorkerBoxFn = (code: string, scope?: Scope) => Promise<any>;
declare type WorkerBoxMethods = {
  destroy: () => void;
};
declare type WorkerBox = WorkerBoxFn & WorkerBoxMethods;
declare function createWorkerBox(
  scriptUrl: string,
  options?: WorkerBoxOptions
): Promise<WorkerBox>;

export default createWorkerBox;
