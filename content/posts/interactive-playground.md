---
title: "The Crunchpad: Interactive Post Examples"
date: 2026-07-09T12:00:00-04:00
draft: true
hidden: true
interactive: true
math: true
author: "ashutosh"
categories: ["Meta"]
tags: ["interactive", "data visualization", "explainer"]
description: "A private authoring playground for The Number Crunch interactive post components."
---

This draft is a private authoring playground. Publish it, copy a block into another post, or keep it as a component reference.

## Let readers interrogate the data

The chart supports line, bar, and scatter views. Readers can isolate a series and inspect individual values.

{{< chart
  title="Why learning rate changes the journey"
  description="Toggle a run, then hover over any point to compare training loss."
  caption="Illustrative values, created for this component demo."
  tone="blue"
>}}
{
  "type": "line",
  "labels": ["0", "10", "20", "30", "40", "50"],
  "xLabel": "Training step",
  "yLabel": "Loss",
  "decimals": 2,
  "series": [
    {"name": "Learning rate 0.01", "color": "blue", "values": [1.0, 0.68, 0.47, 0.34, 0.27, 0.23]},
    {"name": "Learning rate 0.10", "color": "orange", "values": [1.0, 0.42, 0.25, 0.19, 0.17, 0.16]},
    {"name": "Learning rate 0.80", "color": "teal", "values": [1.0, 0.73, 0.91, 0.62, 0.88, 0.70]}
  ]
}
{{< /chart >}}

## Turn a formula into a thing readers can touch

The function lab accepts a safe expression and any number of sliders. This example makes the role of each quadratic coefficient visible.

{{< function-lab
  title="Shape a quadratic"
  description="Move a, b, and c. Watch curvature, horizontal position, and vertical position change."
  caption="Expressions support +, −, ×, ÷, powers, parentheses, sin, cos, tan, exp, log, sqrt, abs, and sigmoid."
  tone="orange"
>}}
{
  "formula": "y = ax² + bx + c",
  "expression": "a*x^2 + b*x + c",
  "xDomain": [-5, 5],
  "yDomain": [-12, 16],
  "parameters": [
    {"name": "a", "label": "Curvature · a", "min": -2, "max": 2, "step": 0.1, "value": 1, "decimals": 1},
    {"name": "b", "label": "Tilt · b", "min": -5, "max": 5, "step": 0.1, "value": 0, "decimals": 1},
    {"name": "c", "label": "Height · c", "min": -8, "max": 8, "step": 0.1, "value": 0, "decimals": 1}
  ]
}
{{< /function-lab >}}

## Reveal a proof one decision at a time

Use proof mode when the reasoning matters more than the final equation.

{{< stepper
  title="Why the square of an odd number is odd"
  description="Advance through the argument without skipping the substitution that does the real work."
  tone="violet"
>}}
{
  "mode": "proof",
  "statement": "Claim: if n is odd, then n² is odd.",
  "steps": [
    {"title": "Define odd", "math": "$n = 2k + 1$", "explanation": "Every odd integer is one more than an even integer, for some integer k."},
    {"title": "Square the definition", "math": "$n^2 = (2k + 1)^2$", "explanation": "Substitute the definition into the expression we want to understand."},
    {"title": "Expand", "math": "$n^2 = 4k^2 + 4k + 1$", "explanation": "The first two terms share a factor of two."},
    {"title": "Recover the odd form", "math": "$n^2 = 2(2k^2 + 2k) + 1$", "explanation": "This is two times an integer, plus one. Therefore n² is odd.", "symbol": "∎"}
  ]
}
{{< /stepper >}}

## Put readers inside the program

Code trace mode pairs the currently executing line with the program state. The code is explanatory only; it never executes reader input.

{{< stepper
  title="Watch binary search discard half the list"
  description="Each step highlights the line being evaluated and exposes the changing pointers."
  caption="A deterministic trace is safer and easier to explain than running arbitrary code in the browser."
  tone="teal"
>}}
{
  "mode": "code",
  "language": "Python",
  "code": [
    "values = [2, 5, 8, 12, 16, 23, 38]",
    "target = 16",
    "low, high = 0, len(values) - 1",
    "while low <= high:",
    "    mid = (low + high) // 2",
    "    if values[mid] == target:",
    "        return mid",
    "    if values[mid] < target:",
    "        low = mid + 1",
    "    else:",
    "        high = mid - 1"
  ],
  "steps": [
    {"line": [1, 2, 3], "title": "Set the search space", "explanation": "The target may be anywhere from index 0 through 6.", "state": {"low": 0, "high": 6, "target": 16}},
    {"line": 5, "title": "Inspect the middle", "explanation": "The midpoint is 3, whose value is 12.", "state": {"low": 0, "mid": 3, "high": 6, "values[mid]": 12}},
    {"line": [8, 9], "title": "Discard the lower half", "explanation": "Twelve is smaller than sixteen, so indices 0 through 3 cannot contain the target.", "state": {"low": 4, "high": 6, "remaining": "[16, 23, 38]"}},
    {"line": 5, "title": "Inspect the new middle", "explanation": "The midpoint of indices 4 through 6 is 5, whose value is 23.", "state": {"low": 4, "mid": 5, "high": 6, "values[mid]": 23}},
    {"line": [10, 11], "title": "Discard the upper half", "explanation": "Twenty-three is too large. Only index 4 remains.", "state": {"low": 4, "high": 4, "remaining": "[16]"}},
    {"line": [5, 6, 7], "title": "Return the match", "explanation": "The value at index 4 equals the target.", "state": {"mid": 4, "values[mid]": 16, "result": 4}}
  ]
}
{{< /stepper >}}
