# Interactive posts

Add these front-matter flags to any post using a Crunchpad block:

```yaml
interactive: true
math: true # only when the post uses $KaTeX$ notation
```

Preview drafts with:

```sh
hugo server -D
```

The full working examples live in `content/posts/interactive-playground.md`.

## Chart

```go-html-template
{{</* chart title="Training loss" description="Toggle a run or inspect a point." tone="blue" */>}}
{
  "type": "line",
  "labels": ["0", "10", "20"],
  "xLabel": "Step",
  "yLabel": "Loss",
  "decimals": 2,
  "series": [
    {"name": "Baseline", "color": "blue", "values": [1, 0.7, 0.4]},
    {"name": "Experiment", "color": "orange", "values": [1, 0.5, 0.2]}
  ]
}
{{</* /chart */>}}
```

- `type`: `line`, `bar`, or `scatter`. Scatter values are `[x, y]` pairs.
- Optional: `xDomain`, `yDomain`, `format`, `currency`, `decimals`, `valuePrefix`, `valueSuffix`.
- Optional `refLines`: `[{"value": 0.99, "label": "target", "color": "orange"}]` draws dashed
  annotation lines. They are not legend series—use them for targets, baselines, and thresholds.
- Colors: `blue`, `orange`, `teal`, `violet`, or any CSS color.
- Readers can toggle series and hover points/bars.

## Function lab

```go-html-template
{{</* function-lab title="Shape a quadratic" tone="orange" */>}}
{
  "formula": "y = ax² + bx + c",
  "expression": "a*x^2 + b*x + c",
  "xDomain": [-5, 5],
  "yDomain": [-12, 16],
  "parameters": [
    {"name": "a", "label": "Curvature", "min": -2, "max": 2, "step": 0.1, "value": 1}
  ]
}
{{</* /function-lab */>}}
```

Expressions support numbers, variables, `+ - * / ^`, parentheses, `pi`, `e`, and `sin`, `cos`, `tan`, `exp`, `log`, `sqrt`, `abs`, `sigmoid`.

Optional `points`: `[[x, y], ...]` draws fixed data dots and a live mean-squared-error readout,
turning the lab into a fit-by-hand exercise. `lossLabel` renames the readout; `lossDecimals`
controls its precision.

## Proof or code stepper

Proof:

```go-html-template
{{</* stepper title="Prove the claim" tone="violet" */>}}
{
  "mode": "proof",
  "statement": "Claim: ...",
  "steps": [
    {"title": "Start", "math": "$n = 2k + 1$", "explanation": "Why this step is valid."}
  ]
}
{{</* /stepper */>}}
```

Program trace:

```go-html-template
{{</* stepper title="Trace the loop" tone="teal" */>}}
{
  "mode": "code",
  "language": "Python",
  "code": ["for item in values:", "    total += item"],
  "steps": [
    {"line": 1, "title": "Read an item", "explanation": "The loop advances.", "state": {"item": 4}}
  ]
}
{{</* /stepper */>}}
```

`line` is one line number or an array of line numbers. `state` accepts any key/value pairs.

## System map

For part-of-a-whole and composition claims (a Venn/containment idea), not quantities:

```go-html-template
{{</* system-map title="Find the ML on this map" tone="orange" */>}}
{
  "blocks": [
    {"name": "Data Collection", "share": "the raw material", "note": "What this block does.", "cols": 4, "rows": 2},
    {"name": "ML Code", "share": "≈ 5-10%", "note": "The focus block.", "cols": 2, "rows": 1, "focus": true}
  ]
}
{{</* /system-map */>}}
```

- Blocks lay out on a 12-column grid; `cols`/`rows` are spans. Make each visual row sum to 12.
- `focus: true` tints the block with the tone color and selects it on load.
- `share` is the kicker shown in the detail panel; `note` is the explanation.
- Blocks are server-rendered, so the map still shows without JavaScript.

## Visual options

Every shortcode accepts:

- `title`: visible heading.
- `description`: one-line instruction.
- `caption`: source, caveat, or note.
- `tone`: `blue`, `orange`, `teal`, or `violet`.

Keep one interactive focused on one idea. Prefer a short deterministic code trace over executing arbitrary reader input.
