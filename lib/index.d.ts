declare type WorkerBoxOptions = {
  appendVersion: boolean;
  randomiseSubdomain: boolean;
};
declare type Scope = object;
declare type WorkerBoxFn = (code: string, scope?: Scope) => Promise<any>;
declare type WorkerBoxMethods = {
  destroy: () => void;
};
export declare type WorkerBox = WorkerBoxFn & WorkerBoxMethods;
export declare function createWorkerBox(
  scriptUrl: string,
  options?: WorkerBoxOptions
): Promise<WorkerBox>;

export default createWorkerBox;
