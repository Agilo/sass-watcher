import fs from 'fs';
import Watcher from '../lib/watcher.js';

describe('Watcher', function () {
  // expect tests to be slow, due to nature of the CLI (invoking sub-processes)
  this.slow(500);
  this.timeout(5000);

  before(function () {
    if (!fs.existsSync('test/build/')) {
      fs.mkdirSync('test/build/');
    }
  });

  it("emits 'init' event on init", function (done) {
    const watcher = new Watcher('test/resources/simple.scss');
    watcher.run();
    watcher.once('init', done);
  });

  it("emits 'update' event on the input file change", function (done) {
    this.slow(1500);
    this.timeout(6000);

    const inputPath = 'test/build/simple.scss';
    const inputContents = fs.readFileSync('test/resources/simple.scss');

    // Copy-paste input file to avoid original file modification
    fs.writeFileSync(inputPath, inputContents);

    const watcher = new Watcher(inputPath);
    watcher.run();

    // We need to wait, otherwise - FS 'update' event is triggered immediately
    // (probably because we copy-paste the input file).
    setTimeout(function () {
      watcher.once('update', done);
      fs.writeFileSync(
        inputPath,
        inputContents.toString().replace('red', 'orange'),
      );
    }, 1000);
  });

  it("emits 'update' event on SCSS dependency file change", function (done) {
    this.slow(1500);
    this.timeout(6000);

    const inputPath = 'test/build/complex.scss';
    const dependencyPath = 'test/build/complex-dep.scss';
    const dependencyContents = fs.readFileSync(
      'test/resources/complex-dep.scss',
    );

    // Copy-paste input files to avoid original files modification
    fs.writeFileSync(inputPath, fs.readFileSync('test/resources/complex.scss'));
    fs.writeFileSync(dependencyPath, dependencyContents);

    const watcher = new Watcher(inputPath);
    watcher.run();

    // We need to wait, otherwise - FS 'update' event is triggered immediately
    // (probably because we copy-paste the input files).
    setTimeout(function () {
      watcher.once('update', done);
      fs.writeFileSync(
        dependencyPath,
        dependencyContents.toString().replace('red', 'orange'),
      );
    }, 1000);
  });
});
