const path = require('path');
const grapher = require('sass-graph');
const chokidar = require('chokidar');
const Emitter = require('events').EventEmitter;
const difference = require('lodash.difference');

class Watcher extends Emitter {
  static defaultExtensions = ['scss', 'sass', 'css'];

  /**
   * @type string[]
   */
  inputPaths;

  includePaths = [];
  rootDir = process.cwd();
  verbosity = 0;
  includeExtensions = Watcher.defaultExtensions;
  watchedFiles = [];
  rootDirWatcher;
  inputPathWatcher;

  constructor(inputPath, options) {
    super();

    options = options || {};
    this.inputPaths = typeof inputPath === 'string'
      ? [path.resolve(inputPath)]
      : inputPath.map(inputPath => path.resolve(inputPath));
    this.includePaths = options.includePaths
      ? options.includePaths.map(function (includePath) {
          return path.resolve(includePath);
        })
      : [];
    this.rootDir = options.rootDir
      ? path.resolve(options.rootDir)
      : process.cwd();
    this.verbosity = options.verbosity || 0;
    this.includeExtensions =
      options.includeExtensions || Watcher.defaultExtensions;

    if (this.verbosity >= 1) {
      console.warn('Start watching "%s"...', this.inputPaths.join(', '));
    }

    process.nextTick(this.emit.bind(this, 'init'));
  }

  run = () => {
    this.initRootDirWatcher();
    this.initInputPathWatcher();
  };

  initRootDirWatcher = () => {
    this.rootDirWatcher = chokidar.watch(this.rootDir, {
      // Ignore unsupported file extensions
      ignored: new RegExp(
        '(\\.(?!(' + this.includeExtensions.join('|') + '))\\w+$|^\\w+$)',
      ),
    });

    ['add', 'addDir', 'unlink', 'unlinkDir'].forEach((eventName) => {
      this.rootDirWatcher.on(eventName, (path) => {
        const info = this.updateInputPathWatcher();

        if (info[0].length > 0 || info[1].length > 0) {
          if (this.verbosity >= 2) {
            switch (eventName) {
              case 'add':
                console.warn('New file "%s" is added', path);
                break;
              case 'addDir':
                console.warn('New directory "%s" is added', path);
                break;
              case 'unlink':
                console.warn('File "%s" is removed', path);
                break;
              case 'unlinkDir':
                console.warn('Directory "%s" is removed', path);
                break;
            }
          }

          this.emit('update');
        }
      });
    });
  };

  initInputPathWatcher = () => {
    this.watchedFiles = this.getIncludedFiles();
    this.inputPathWatcher = chokidar.watch(this.watchedFiles);

    if (this.verbosity >= 2) {
      console.warn('Initially watched files: %s', this.watchedFiles.join(', '));
    }

    this.inputPathWatcher.on('change', (filePath) => {
      this.updateInputPathWatcher();

      if (this.verbosity >= 2) {
        console.warn('File "%s" is modified', filePath);
      }

      this.emit('update');
    });
  };

  getIncludedFiles = () => {
    return this.inputPaths.flatMap((inputPath) => {
      const newWatchedFilesGraph = grapher.parseFile(inputPath, {
        loadPaths: this.includePaths,
        extensions: this.includeExtensions,
      });
      return Object.keys(newWatchedFilesGraph.index);
    });
  };

  updateInputPathWatcher = () => {
    const newWatchedFiles = this.getIncludedFiles();
    const startWatchingFiles = difference(newWatchedFiles, this.watchedFiles);
    const stopWatchingFiles = difference(this.watchedFiles, newWatchedFiles);
    this.watchedFiles = newWatchedFiles;

    if (this.verbosity >= 3 && startWatchingFiles.length) {
      console.warn('Start watching files: %s', startWatchingFiles.join(', '));
    }

    if (this.verbosity >= 3 && stopWatchingFiles.length) {
      console.warn('Stop watching files: %s', stopWatchingFiles.join(', '));
    }

    if (
      this.verbosity >= 3 &&
      startWatchingFiles.length + stopWatchingFiles.length
    ) {
      console.warn('Currently watched files: %s', newWatchedFiles.join(', '));
    }

    this.inputPathWatcher.add(startWatchingFiles);
    this.inputPathWatcher.unwatch(stopWatchingFiles);

    return [startWatchingFiles, stopWatchingFiles];
  };
}

module.exports = Watcher;
