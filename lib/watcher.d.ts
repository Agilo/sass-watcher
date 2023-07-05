import { EventEmitter as Emitter } from 'events';

declare class Watcher extends Emitter {
  constructor(
    inputPath: string | string[],
    options?: {
      includePaths?: string[];
      rootDir?: string;
      verbosity?: number;
      includeExtensions?: string[];
    },
  );

  public run(): void;
  public initRootDirWatcher(): void;
  public initInputPathWatcher(): void;
  public getIncludedFiles(): string[];
  public updateInputPathWatcher(): [string[], string[]];
}

export default Watcher;
