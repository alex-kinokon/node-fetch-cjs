#!/usr/bin/env node
const { execSync } = require("child_process")
const fs = require("fs-extra")
const { rollup } = require("rollup")
const { resolve } = require("path")
const { builtinModules } = require("module")
const { nodeResolve } = require("@rollup/plugin-node-resolve")
const pkg = require("node-fetch/package.json")

async function main() {
  const NODE_FETCH = "node_modules/node-fetch"

  delete pkg.dependencies["fetch-blob"]

  const bundle = await rollup({
    input: `${NODE_FETCH}/src/index.js`,
    external: Object.keys(pkg.dependencies).concat(builtinModules),
    plugins: [nodeResolve()],
  })

  await bundle.write({
    dir: "lib",
    format: "cjs",
    exports: "named",
    sourcemap: true,
  })

  pkg.main = "index.js"
  pkg.name = "node-fetch-commonjs"
  pkg.repository.url = execSync("git config --get remote.origin.url").toString().trim()
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
  await fs.copy(`${NODE_FETCH}/@types/index.d.ts`, "lib/index.d.ts")
  await fs.writeJSON("lib/package.json", pkg, { spaces: 2 })
}

main().catch(err => {
  throw err
})
