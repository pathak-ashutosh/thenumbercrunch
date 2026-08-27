import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const source = fs.readFileSync(path.join(root, "static/admin/editor.js"), "utf8");
const components = [];
const widgets = [];
const window = {
  CMS: {
    registerEditorComponent(component) { components.push(component); },
    registerPreviewStyle() {},
    registerWidget(name) { widgets.push(name); },
  },
  createClass(definition) { return definition; },
  h() { return {}; },
};

vm.runInNewContext(source, { window });

assert.deepEqual(widgets, ["crunch-json"]);
assert.equal(components.length, 6);
assert.deepEqual(
  components.map((component) => component.id),
  ["chart", "function-lab", "stepper", "system-map", "model-race", "caucus-atlas"]
);

const posts = fs.readdirSync(path.join(root, "content/posts")).filter((name) => name.endsWith(".md"));
const markdown = posts.map((name) => fs.readFileSync(path.join(root, "content/posts", name), "utf8")).join("\n\n");

for (const component of components) {
  const discovery = component.id === "caucus-atlas"
    ? new RegExp(`\\{\\{<\\s*${component.id}\\b[\\s\\S]*?>\\}\\}`)
    : new RegExp(`\\{\\{<\\s*${component.id}\\b[\\s\\S]*?>\\}\\}[\\s\\S]*?\\{\\{<\\s*\\/${component.id}\\s*>\\}\\}`);
  const sourceBlock = markdown.match(discovery);
  assert.ok(sourceBlock, `existing ${component.id} block exists`);
  const match = sourceBlock[0].match(component.pattern);
  assert.ok(match, `existing ${component.id} block is recognized`);
  const data = component.fromBlock(match);
  const serialized = component.toBlock(data);
  const roundTrip = serialized.match(component.pattern);
  assert.ok(roundTrip, `${component.id} survives serialization`);
  const reparsed = component.fromBlock(roundTrip);
  assert.equal(reparsed.title, data.title, `${component.id} title survives round trip`);
  if (data.configuration) {
    assert.deepEqual(JSON.parse(reparsed.configuration), JSON.parse(data.configuration));
  }
}

console.log(`Validated ${components.length} editor blocks across ${posts.length} posts.`);
