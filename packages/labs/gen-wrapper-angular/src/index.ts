/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */

import {
  Package,
  PackageJson,
  ModuleWithLitElementDeclarations,
} from '@lit-labs/analyzer';
import {FileTree} from '@lit-labs/gen-utils/lib/file-utils.js';
import {packageJsonTemplate} from './lib/package-json-template.js';
import {wrapperModuleTemplate} from './lib/wrapper-module-template.js';
import * as path from 'path';

/**
 * Our command for the Lit CLI.
 *
 * See ../../cli/src/lib/generate/generate.ts
 */
export const getCommand = () => {
  return {
    name: 'angular',
    description: 'Generate Angular wrapper components from Lit elements',
    kind: 'resolved',
    async generate(options: {package: Package}): Promise<FileTree> {
      return await generateAngularWrapper(options.package);
    },
  };
};

export const generateAngularWrapper = async (
  pkg: Package
): Promise<FileTree> => {
  const litModules = pkg.getLitElementModules();
  if (litModules.length > 0) {
    const packageName = pkg.packageJson.name;
    if (packageName === undefined) {
      throw new Error(
        `Package must have a package name. Error in ${
          pkg.rootDir + '/package.json'
        }`
      );
    }
    // TODO(justinfagnani): make configurable
    const angularPackageName = `${packageName}-ng`;
    // TODO(justinfagnani): put inside an Angular workspace
    const angularPackageFolder = `${path.basename(pkg.rootDir)}-ng`;
    return {
      [angularPackageFolder]: {
        '.gitignore': gitIgnoreTemplate(litModules),
        'package.json': packageJsonTemplate(
          angularPackageName,
          pkg.packageJson,
          litModules
        ),
        ...wrapperFiles(pkg.packageJson, litModules),
      },
    };
  } else {
    throw new Error('No Lit components were found in this package.');
  }
};

const wrapperFiles = (
  packageJson: PackageJson,
  litModules: ModuleWithLitElementDeclarations[]
) => {
  const wrapperFiles: FileTree = {};
  for (const {module, declarations} of litModules) {
    const {sourcePath, jsPath} = module;
    wrapperFiles[sourcePath] = wrapperModuleTemplate(
      packageJson,
      jsPath,
      declarations
    );
  }
  return wrapperFiles;
};

const gitIgnoreTemplate = (litModules: ModuleWithLitElementDeclarations[]) => {
  return litModules
    .map(({module}) => module.sourcePath.replace(/\\/g, '/'))
    .join('\n');
};
