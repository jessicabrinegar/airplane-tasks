// This file includes a shim that will execute your task code.
import airplane from "airplane";
import { parseHTML } from "linkedom";

// Add a browser globals so that if the task is defined in the same file as a view that contains or imports frontend specific code,
// the parser doesn't fail in a node environment.
const { document, Node, navigator, window } = parseHTML(
  `<!DOCTYPE html><body></div></body>`
);
globalThis.document = document;
globalThis.Node = Node;
globalThis.navigator = navigator;
globalThis.self = window;

async function main() {
  if (process.argv.length !== 5) {
    console.log(
      `airplane_output_set:error ${JSON.stringify(
        `Expected to receive entrypoint, entrypointFunc, and params (via {{ "{{JSON}}" }}). Task CLI arguments may be misconfigured.`
      )}`
    );
    process.exit(1);
  }

  const entrypoint = process.argv[2];
  const entrypointFunc = process.argv[3] || "default";
  const params = process.argv[4];

  const task = require(entrypoint)[entrypointFunc];

  try {
    let ret;
    if ("__airplane" in task) {
      ret = await task.__airplane.baseFunc(JSON.parse(params));
    } else {
      ret = await task(JSON.parse(params));
    }
    if (ret !== undefined) {
      airplane.setOutput(ret);
    }
  } catch (err) {
    console.error(err);
    // Print the error's message directly when possible. Otherwise, it includes the
    // error's name (e.g. "RunTerminationError: ...").
    const message = err instanceof Error ? err.message : String(err);
    console.log(`airplane_output_set:error ${JSON.stringify(message)}`);
    process.exit(1);
  }
}

main();
