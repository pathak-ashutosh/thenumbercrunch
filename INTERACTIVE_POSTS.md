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

## Visual options

Every shortcode accepts:

- `title`: visible heading.
- `description`: one-line instruction.
- `caption`: source, caveat, or note.
- `tone`: `blue`, `orange`, `teal`, or `violet`.

Keep one interactive focused on one idea. Prefer a short deterministic code trace over executing arbitrary reader input.
