#!/usr/bin/env node
const { execSync } = require("child_process")
const fs = require("fs-extra")
const { rollup } = require("rollup")
const { builtinModules } = require("module")
const alias = require("@rollup/plugin-alias")
const { nodeResolve } = require("@rollup/plugin-node-resolve")
const pkg = require("node-fetch/package.json")

async function main() {
  await fs.remove("lib")

  const NODE_FETCH = "node_modules/node-fetch"

  delete pkg.dependencies["fetch-blob"]
  delete pkg.dependencies["data-uri-to-buffer"]

  const bundle = await rollup({
    input: `${NODE_FETCH}/src/index.js`,
    external: Object.keys(pkg.dependencies)
      .concat(builtinModules)
      .concat("node-domexception"),
    plugins: [
      alias({
        entries: [
          {
            find: /^node:(.+)$/,
            replacement: "$1",
          },
        ],
      }),
      nodeResolve(),
    ],
  })

  await bundle.write({
    dir: "lib",
    format: "cjs",
    exports: "named",
    sourcemap: true,
    banner: `/* eslint-disable */`,
    footer: `/* eslint-enable */`,
  })

  pkg.main = "index.js"
  pkg.name = "node-fetch-commonjs"
  pkg.version = "3.3.1"
  pkg.type = "commonjs"
  pkg.repository.url = execSync("git config --get remote.origin.url").toString().trim()
  pkg.dependencies["web-streams-polyfill"] = "^3.1.1"
  delete pkg.homepage
  delete pkg.files
  delete pkg.scripts
  delete pkg.type
  delete pkg.types
  delete pkg.devDependencies
  delete pkg.bugs
  delete pkg.tsd
  delete pkg.xo
  delete pkg.runkitExampleFilename

  await fs.copy(`${NODE_FETCH}/LICENSE.md`, "lib/LICENSE.md")
  await fs.copy("README.md", "lib/README.md")
  await fs.copy(`${NODE_FETCH}/@types/index.d.ts`, "lib/index.d.ts")
  await fs.writeJSON("lib/package.json", pkg, { spaces: 2 })

  const source = await fs.readFile("lib/index.js", "utf-8")
  await fs.writeFile(
    "lib/index.js",
    source.replace(/('use strict';)/, "exports = module.exports = fetch;\n$1")
  )
}

main().catch(err => {
  throw err
})
