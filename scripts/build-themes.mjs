import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import { watch } from 'fs';

import sass from 'sass';
import chalk from 'chalk';

const thisFilename = fileURLToPath(import.meta.url);
const thisDirname = dirname(thisFilename);

const sourcePath = resolve(thisDirname, '../src');
const outputPath = resolve(thisDirname, '../dist');

const watchFiles = process.argv[2] == '--watch';

const watchDependencies = new Map();

let hasErrors = false;

async function findSourceFiles(path = sourcePath) {
  const fileEntries = await fs.readdir(path, { withFileTypes: true });

  let files = [];

  for (const fileEntry of fileEntries) {
    const filename = resolve(path, fileEntry.name);

    if (fileEntry.isDirectory()) {
      files = [...files, ...await findSourceFiles(filename)];
    } else if (fileEntry.isFile() && /^[^_].*\.s[ac]ss$/.test(fileEntry.name)) {
      files.push(filename);
    }
  }

  return files;
}

async function compileFiles(filenames) {
  const production = process.env.MODE == 'production';

  for (const filename of filenames) {
    const baseName = filename.replace(`${sourcePath}/`, '');
    console.log(chalk.blue(`compiling ${baseName}`));

    try {
      const result = await sass.compileAsync(filename, {
        style: production ? 'compressed' : 'expanded',
        sourceMap: !production,
      });

      watchDependencies.set(filename, result.loadedUrls.map(url => url.pathname));

      const outFilename = resolve(outputPath, baseName.replace(/\.s[ac]ss$/, '.css'));
      console.log(chalk.green(`writing ${outFilename}`));

      await fs.mkdir(dirname(outFilename), { recursive: true });

      await fs.writeFile(outFilename, result.css);

      const loadedUrls = new Set();

      const regExp = /\burl\("(.*?)"\)/gi;

      while (true) {
        const match = regExp.exec(result.css);

        if (match) {
          const url = match[1];

          if (!/^[a-z]+:/.test(url)) {
            loadedUrls.add(url);
          }
        } else {
          break;
        }
      }

      for (const url of loadedUrls.values()) {
        console.log(chalk.gray(`copying ${url}`));

        await fs.copyFile(resolve(dirname(filename), url), resolve(dirname(outFilename), url));
      }
    } catch (error) {
      console.error(error);
      hasErrors = true;
    }

    console.log('');
  }
}

async function main() {
  const filenames = await findSourceFiles();
  await compileFiles(filenames);

  if (watchFiles) {
    console.log('watching for file changes...');

    const changedFilenames = new Set();
    let timeout;

    const compileChangedFiles = () => {
      if (!timeout) {
        timeout = setTimeout(() => {
          compileFiles([...changedFilenames.values()]);
          changedFilenames.clear();
          timeout = undefined;
        }, 200);
      }
    };

    for (const filename of filenames) {
      watch(filename, eventType => {
        if (eventType == 'change') {
          changedFilenames.add(filename);
          compileChangedFiles();
        }
      });

      if (watchDependencies.has(filename)) {
        for (const depFilename of watchDependencies.get(filename)) {
          watch(depFilename, eventType => {
            if (eventType == 'change') {
              changedFilenames.add(filename);
              compileChangedFiles();
            }
          });
        }
      }
    }
  } else if (hasErrors) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
