# @agilo/sass-watcher

[![Test](https://github.com/agilo/sass-watcher/actions/workflows/test.yml/badge.svg)](https://github.com/agilo/sass-watcher/actions/workflows/test.yml)

SCSS watcher with post-processing.

## Why?

`sass` has `--watch` option but it doesn't allow post-processing of the compiled CSS.

The only way is to "watch" the generated CSS file with another watcher. **It's not convenient**.

`@agilo/sass-watcher` provides simple way to do SCSS watching with post-processing.

## Install

```sh
npm install @agilo/sass-watcher
```

## Usage: JS

Example: `sass` → `autoprefixer`.

```js
// watch-it.js

import fs from 'fs';
import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import Watcher from '@agilo/sass-watcher';

// Input variables
const inputFile = process.argv[2];
const outputFile = process.argv[3];
const supportedBrowsers = process.argv[4];

// Options
const watcherOptions = {
  verbosity: 1,
}

// Renderer
function render() {
  console.warn('Rendering "' + inputFile + '" file...');

  sass.render({file: inputFile}, function(err, result) {
    if (err) {
      console.error('Error: ' + err.message);
      return;
    }

    const processor = postcss([
      autoprefixer({
        browsers: supportedBrowsers.split(/,\s*/g)
      })
    ]);

    console.warn('Processing with Autoprefixer for browsers: ' + supportedBrowsers);

    processor.process(result.css.toString()).then(
      function(result) {
        console.warn('Outputting to "' + outputFile + '" file...');
        fs.writeFile(outputFile, result.css);
      },
      function(err) {
        console.error('Error: ' + err.message);
      }
    );
  });
}

// Start watching
const watcher = new Watcher(inputFile, watcherOptions);
watcher.on('init', render);
watcher.on('update', render);
watcher.run();
```

Run your custom script:

```sh
node watch-it.js src/input.scss dist/output.css "ie >= 9, > 1%"
```


Available options are a subset of the CLI options:

* `includePaths`
* `rootDir`
* `verbosity`
* `includeExtensions`

## Collaboration

Feel free to create a ticket or a pull-request ;)
