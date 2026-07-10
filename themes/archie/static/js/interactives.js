(() => {
  "use strict";

  const select = (root, selector) => root.querySelector(selector);

  function readConfig(root) {
    const source = select(root, "[data-crunch-config]");
    try {
      const parsed = JSON.parse(source.textContent.trim());
      return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch (error) {
      showError(root, "This interactive has invalid JSON.");
      console.error("The Number Crunch interactive config:", error);
      return null;
    }
  }

  function showError(root, message) {
    const error = document.createElement("p");
    error.className = "crunch-noscript";
    error.textContent = message;
    root.append(error);
  }

  function canvasContext(canvas) {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(280, rect.width);
    const height = Math.max(240, rect.height);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    return { context, width, height };
  }

  function theme(root) {
    const styles = getComputedStyle(root);
    return {
      foreground: styles.getPropertyValue("--fg").trim(),
      muted: styles.getPropertyValue("--fg-muted").trim(),
      border: styles.getPropertyValue("--border").trim(),
      surface: styles.getPropertyValue("--surface").trim(),
      tone: styles.getPropertyValue("--crunch-tone").trim(),
      palette: ["--crunch-blue", "--crunch-orange", "--crunch-teal", "--crunch-violet"].map(
        (name) => styles.getPropertyValue(name).trim()
      )
    };
  }

  function seriesColor(root, value, index) {
    const colors = theme(root);
    const named = {
      blue: colors.palette[0],
      orange: colors.palette[1],
      teal: colors.palette[2],
      violet: colors.palette[3]
    };
    return named[value] || value || colors.palette[index % colors.palette.length];
  }

  function formatNumber(value, config = {}) {
    if (!Number.isFinite(value)) return "—";
    const digits = config.decimals ?? (Math.abs(value) < 10 && value % 1 ? 2 : 0);
    let formatted;
    if (config.format === "percent") {
      formatted = `${(value * (config.percentScale === 100 ? 100 : 1)).toFixed(digits)}%`;
    } else if (config.format === "currency") {
      formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: config.currency || "USD",
        maximumFractionDigits: digits
      }).format(value);
    } else {
      formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
    }
    return `${config.valuePrefix || ""}${formatted}${config.valueSuffix || ""}`;
  }

  function paddedExtent(values, forced) {
    if (Array.isArray(forced) && forced.length === 2) return forced.map(Number);
    let minimum = Math.min(...values);
    let maximum = Math.max(...values);
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return [0, 1];
    if (minimum === maximum) {
      const padding = Math.abs(minimum || 1) * 0.2;
      return [minimum - padding, maximum + padding];
    }
    const padding = (maximum - minimum) * 0.1;
    return [Math.min(0, minimum - padding), maximum + padding];
  }

  function observeTheme(draw) {
    const observer = new MutationObserver(draw);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return observer;
  }

  function initChart(root) {
    const config = readConfig(root);
    if (!config || !Array.isArray(config.series) || !config.series.length) return;

    const canvas = select(root, "[data-chart-canvas]");
    const legend = select(root, "[data-chart-legend]");
    const tooltip = select(root, "[data-chart-tooltip]");
    const summary = select(root, "[data-chart-summary]");
    const active = config.series.map(() => true);
    let hitTargets = [];

    config.series.forEach((series, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "crunch-legend-button";
      button.setAttribute("aria-pressed", "true");
      const swatch = document.createElement("span");
      swatch.className = "crunch-legend-swatch";
      swatch.style.setProperty("--series-color", seriesColor(root, series.color, index));
      const label = document.createElement("span");
      label.textContent = series.name || `Series ${index + 1}`;
      button.append(swatch, label);
      button.addEventListener("click", () => {
        if (active[index] && active.filter(Boolean).length === 1) return;
        active[index] = !active[index];
        button.setAttribute("aria-pressed", String(active[index]));
        draw();
      });
      legend.append(button);
    });

    function pointsFor(series) {
      if (config.type === "scatter") {
        return (series.values || series.data || []).map((point) => ({ x: Number(point[0]), y: Number(point[1]) }));
      }
      return (series.values || series.data || []).map((value, index) => ({ x: index, y: Number(value) }));
    }

    function draw() {
      const { context, width, height } = canvasContext(canvas);
      const colors = theme(root);
      const visible = config.series.map((series, index) => ({ series, index, points: pointsFor(series) })).filter((item) => active[item.index]);
      const allPoints = visible.flatMap((item) => item.points).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
      if (!allPoints.length) return;

      const padding = { top: 16, right: 18, bottom: 48, left: width < 460 ? 42 : 56 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const xValues = allPoints.map((point) => point.x);
      const yValues = allPoints.map((point) => point.y);
      const xDomain = config.type === "scatter"
        ? paddedExtent(xValues, config.xDomain)
        : [0, Math.max(1, ...(visible.map((item) => item.points.length - 1)))];
      const yDomain = paddedExtent(yValues, config.yDomain);
      const xScale = (value) => padding.left + ((value - xDomain[0]) / (xDomain[1] - xDomain[0] || 1)) * plotWidth;
      const yScale = (value) => padding.top + plotHeight - ((value - yDomain[0]) / (yDomain[1] - yDomain[0] || 1)) * plotHeight;
      hitTargets = [];

      context.font = "11px 'IBM Plex Mono', monospace";
      context.textBaseline = "middle";
      context.strokeStyle = colors.border;
      context.fillStyle = colors.muted;
      context.lineWidth = 1;

      for (let tick = 0; tick <= 4; tick += 1) {
        const value = yDomain[0] + ((yDomain[1] - yDomain[0]) * tick) / 4;
        const y = yScale(value);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();
        context.textAlign = "right";
        context.fillText(formatNumber(value, config), padding.left - 8, y);
      }

      const labels = config.labels || [];
      const xTicks = Math.min(width < 460 ? 4 : 6, Math.max(2, labels.length || 6));
      for (let tick = 0; tick < xTicks; tick += 1) {
        const ratio = xTicks === 1 ? 0 : tick / (xTicks - 1);
        const value = xDomain[0] + (xDomain[1] - xDomain[0]) * ratio;
        const x = xScale(value);
        const labelIndex = Math.round(value);
        const label = config.type === "scatter" ? formatNumber(value, { decimals: 1 }) : (labels[labelIndex] ?? labelIndex);
        context.textAlign = tick === 0 ? "left" : tick === xTicks - 1 ? "right" : "center";
        context.fillText(String(label), x, height - padding.bottom + 18);
      }

      if (config.xLabel) {
        context.textAlign = "center";
        context.fillText(config.xLabel, padding.left + plotWidth / 2, height - 9);
      }
      if (config.yLabel && width >= 460) {
        context.save();
        context.translate(11, padding.top + plotHeight / 2);
        context.rotate(-Math.PI / 2);
        context.textAlign = "center";
        context.fillText(config.yLabel, 0, 0);
        context.restore();
      }

      const chartType = config.type || "line";
      if (chartType === "bar") {
        const groupCount = Math.max(1, ...visible.map((item) => item.points.length));
        const groupWidth = plotWidth / groupCount;
        const barWidth = Math.max(3, Math.min(38, (groupWidth * 0.72) / visible.length));
        const zeroY = yScale(Math.max(yDomain[0], Math.min(0, yDomain[1])));
        visible.forEach((item, visibleIndex) => {
          const color = seriesColor(root, item.series.color, item.index);
          context.fillStyle = color;
          item.points.forEach((point, pointIndex) => {
            const x = padding.left + pointIndex * groupWidth + groupWidth / 2 - (visible.length * barWidth) / 2 + visibleIndex * barWidth;
            const y = yScale(point.y);
            const top = Math.min(y, zeroY);
            const barHeight = Math.max(1, Math.abs(zeroY - y));
            context.fillRect(x + 1, top, Math.max(1, barWidth - 2), barHeight);
            hitTargets.push({ x: x + barWidth / 2, y: top, width: barWidth, height: barHeight, point, pointIndex, item });
          });
        });
      } else {
        visible.forEach((item) => {
          const color = seriesColor(root, item.series.color, item.index);
          context.strokeStyle = color;
          context.fillStyle = color;
          context.lineWidth = 2.5;
          if (chartType === "line") {
            context.beginPath();
            item.points.forEach((point, pointIndex) => {
              const x = xScale(point.x);
              const y = yScale(point.y);
              if (pointIndex === 0) context.moveTo(x, y);
              else context.lineTo(x, y);
            });
            context.stroke();
          }
          item.points.forEach((point, pointIndex) => {
            const x = xScale(point.x);
            const y = yScale(point.y);
            context.beginPath();
            context.arc(x, y, chartType === "scatter" ? 4.5 : 3, 0, Math.PI * 2);
            context.fill();
            hitTargets.push({ x, y, width: 12, height: 12, point, pointIndex, item });
          });
        });
      }

      const min = Math.min(...yValues);
      const max = Math.max(...yValues);
      summary.textContent = `${visible.length} visible series. Values range from ${formatNumber(min, config)} to ${formatNumber(max, config)}.`;
    }

    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nearest = hitTargets.reduce((best, target) => {
        const distance = Math.hypot(target.x - x, target.y - y);
        return !best || distance < best.distance ? { target, distance } : best;
      }, null);
      if (!nearest || nearest.distance > 22) {
        tooltip.hidden = true;
        return;
      }
      const { target } = nearest;
      const label = config.type === "scatter"
        ? `x: ${formatNumber(target.point.x, { decimals: 2 })}`
        : (config.labels?.[target.pointIndex] ?? `Point ${target.pointIndex + 1}`);
      tooltip.replaceChildren();
      const name = document.createElement("strong");
      name.textContent = target.item.series.name || `Series ${target.item.index + 1}`;
      const value = document.createElement("span");
      value.textContent = `${label} · ${formatNumber(target.point.y, config)}`;
      tooltip.append(name, value);
      tooltip.style.left = `${Math.max(70, Math.min(rect.width - 70, target.x))}px`;
      tooltip.style.top = `${Math.max(46, target.y)}px`;
      tooltip.hidden = false;
    });
    canvas.addEventListener("pointerleave", () => { tooltip.hidden = true; });

    new ResizeObserver(draw).observe(canvas);
    observeTheme(() => {
      legend.querySelectorAll(".crunch-legend-swatch").forEach((swatch, index) => {
        swatch.style.setProperty("--series-color", seriesColor(root, config.series[index].color, index));
      });
      draw();
    });
    draw();
  }

  function compileExpression(expression) {
    const tokens = [];
    let cursor = 0;
    while (cursor < expression.length) {
      const rest = expression.slice(cursor);
      const space = rest.match(/^\s+/);
      if (space) { cursor += space[0].length; continue; }
      const number = rest.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
      if (number) { tokens.push({ type: "number", value: Number(number[0]) }); cursor += number[0].length; continue; }
      const identifier = rest.match(/^[A-Za-z_]\w*/);
      if (identifier) { tokens.push({ type: "identifier", value: identifier[0] }); cursor += identifier[0].length; continue; }
      if ("+-*/^(),".includes(rest[0])) { tokens.push({ type: rest[0], value: rest[0] }); cursor += 1; continue; }
      throw new Error(`Unexpected character: ${rest[0]}`);
    }

    let position = 0;
    const peek = (type) => tokens[position]?.type === type;
    const take = (type) => {
      if (!peek(type)) throw new Error(`Expected ${type}`);
      return tokens[position++];
    };
    const functions = {
      sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp,
      log: Math.log, sqrt: Math.sqrt, abs: Math.abs,
      sigmoid: (value) => 1 / (1 + Math.exp(-value))
    };

    function primary() {
      if (peek("number")) {
        const value = take("number").value;
        return () => value;
      }
      if (peek("identifier")) {
        const name = take("identifier").value;
        if (peek("(")) {
          take("(");
          const argument = addSubtract();
          take(")");
          if (!functions[name]) throw new Error(`Unknown function: ${name}`);
          return (scope) => functions[name](argument(scope));
        }
        if (name === "pi") return () => Math.PI;
        if (name === "e") return () => Math.E;
        return (scope) => {
          if (!(name in scope)) throw new Error(`Unknown variable: ${name}`);
          return Number(scope[name]);
        };
      }
      if (peek("(")) {
        take("(");
        const value = addSubtract();
        take(")");
        return value;
      }
      throw new Error("Expected a number, variable, or parenthesis");
    }

    function power() {
      const left = primary();
      if (!peek("^")) return left;
      take("^");
      const right = unary();
      return (scope) => left(scope) ** right(scope);
    }

    function unary() {
      if (peek("+")) { take("+"); return unary(); }
      if (peek("-")) { take("-"); const value = unary(); return (scope) => -value(scope); }
      return power();
    }

    function multiplyDivide() {
      let left = unary();
      while (peek("*") || peek("/")) {
        const operator = tokens[position++].type;
        const previous = left;
        const right = unary();
        left = operator === "*" ? (scope) => previous(scope) * right(scope) : (scope) => previous(scope) / right(scope);
      }
      return left;
    }

    function addSubtract() {
      let left = multiplyDivide();
      while (peek("+") || peek("-")) {
        const operator = tokens[position++].type;
        const previous = left;
        const right = multiplyDivide();
        left = operator === "+" ? (scope) => previous(scope) + right(scope) : (scope) => previous(scope) - right(scope);
      }
      return left;
    }

    const evaluate = addSubtract();
    if (position !== tokens.length) throw new Error("Unexpected token at end of expression");
    return evaluate;
  }

  function initFunction(root) {
    const config = readConfig(root);
    if (!config || !config.expression) return;
    const canvas = select(root, "[data-function-canvas]");
    const controls = select(root, "[data-function-controls]");
    const formula = select(root, "[data-function-formula]");
    const summary = select(root, "[data-function-summary]");
    const scope = {};
    let evaluate;

    try {
      evaluate = compileExpression(config.expression);
    } catch (error) {
      showError(root, `Expression error: ${error.message}`);
      return;
    }

    formula.textContent = config.formula || `y = ${config.expression}`;
    (config.parameters || []).forEach((parameter, index) => {
      const name = parameter.name || parameter.key;
      scope[name] = Number(parameter.value ?? parameter.min ?? 0);
      const field = document.createElement("div");
      field.className = "crunch-range-field";
      const labelRow = document.createElement("div");
      labelRow.className = "crunch-range-label";
      const labelText = document.createElement("label");
      labelText.textContent = parameter.label || name;
      const value = document.createElement("output");
      value.className = "crunch-range-value";
      value.textContent = formatNumber(scope[name], { decimals: parameter.decimals ?? 2 });
      const input = document.createElement("input");
      input.id = `crunch-range-${index}-${Math.random().toString(36).slice(2, 8)}`;
      input.className = "crunch-range";
      input.type = "range";
      input.min = parameter.min;
      input.max = parameter.max;
      input.step = parameter.step ?? 0.1;
      input.value = scope[name];
      labelText.htmlFor = input.id;
      value.htmlFor = input.id;
      input.addEventListener("input", () => {
        scope[name] = Number(input.value);
        value.textContent = formatNumber(scope[name], { decimals: parameter.decimals ?? 2 });
        draw();
      });
      labelRow.append(labelText, value);
      field.append(labelRow, input);
      controls.append(field);
    });

    function draw() {
      const { context, width, height } = canvasContext(canvas);
      const colors = theme(root);
      const xDomain = (config.xDomain || [-5, 5]).map(Number);
      const samples = [];
      for (let index = 0; index <= 220; index += 1) {
        const x = xDomain[0] + ((xDomain[1] - xDomain[0]) * index) / 220;
        let y = NaN;
        try { y = evaluate({ ...scope, x }); } catch (_) { y = NaN; }
        if (Number.isFinite(y)) samples.push({ x, y });
      }
      if (!samples.length) return;
      const yDomain = paddedExtent(samples.map((point) => point.y), config.yDomain);
      const padding = { top: 16, right: 18, bottom: 42, left: width < 460 ? 42 : 54 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const xScale = (value) => padding.left + ((value - xDomain[0]) / (xDomain[1] - xDomain[0])) * plotWidth;
      const yScale = (value) => padding.top + plotHeight - ((value - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotHeight;

      context.font = "11px 'IBM Plex Mono', monospace";
      context.textBaseline = "middle";
      context.strokeStyle = colors.border;
      context.fillStyle = colors.muted;
      context.lineWidth = 1;
      for (let tick = 0; tick <= 4; tick += 1) {
        const yValue = yDomain[0] + ((yDomain[1] - yDomain[0]) * tick) / 4;
        const y = yScale(yValue);
        context.beginPath(); context.moveTo(padding.left, y); context.lineTo(width - padding.right, y); context.stroke();
        context.textAlign = "right";
        context.fillText(formatNumber(yValue, { decimals: 1 }), padding.left - 7, y);
      }
      for (let tick = 0; tick <= 4; tick += 1) {
        const xValue = xDomain[0] + ((xDomain[1] - xDomain[0]) * tick) / 4;
        const x = xScale(xValue);
        context.textAlign = tick === 0 ? "left" : tick === 4 ? "right" : "center";
        context.fillText(formatNumber(xValue, { decimals: 1 }), x, height - 21);
      }
      if (xDomain[0] <= 0 && xDomain[1] >= 0) {
        context.strokeStyle = colors.muted;
        context.beginPath(); context.moveTo(xScale(0), padding.top); context.lineTo(xScale(0), padding.top + plotHeight); context.stroke();
      }
      if (yDomain[0] <= 0 && yDomain[1] >= 0) {
        context.strokeStyle = colors.muted;
        context.beginPath(); context.moveTo(padding.left, yScale(0)); context.lineTo(width - padding.right, yScale(0)); context.stroke();
      }
      context.strokeStyle = colors.tone;
      context.lineWidth = 2.75;
      context.beginPath();
      samples.forEach((point, index) => {
        const x = xScale(point.x);
        const y = yScale(point.y);
        if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
      });
      context.stroke();

      const parameters = Object.entries(scope).map(([name, value]) => `${name} is ${formatNumber(value, { decimals: 2 })}`).join(", ");
      summary.textContent = `${formula.textContent}. ${parameters}. The visible y range is ${formatNumber(yDomain[0], { decimals: 2 })} to ${formatNumber(yDomain[1], { decimals: 2 })}.`;
    }

    new ResizeObserver(draw).observe(canvas);
    observeTheme(draw);
    draw();
  }

  function appendTextElement(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text || "";
    parent.append(element);
    return element;
  }

  function initStepper(root) {
    const config = readConfig(root);
    if (!config || !Array.isArray(config.steps) || !config.steps.length) return;
    const workspace = select(root, "[data-stepper-workspace]");
    const progress = select(root, "[data-stepper-progress]");
    const previous = select(root, "[data-stepper-previous]");
    const next = select(root, "[data-stepper-next]");
    const count = select(root, "[data-stepper-count]");
    const kind = select(root, "[data-stepper-kind]");
    const segments = config.steps.map(() => {
      const segment = document.createElement("span");
      segment.className = "crunch-progress-segment";
      progress.append(segment);
      return segment;
    });
    let current = 0;

    function renderCode(step) {
      kind.textContent = `Crunchpad / ${config.language || "code"} trace`;
      const grid = document.createElement("div");
      grid.className = "crunch-stepper__grid";
      const pre = document.createElement("pre");
      pre.className = "crunch-code";
      const code = document.createElement("code");
      const activeLines = Array.isArray(step.line) ? step.line : [step.line];
      (config.code || []).forEach((line, index) => {
        const codeLine = appendTextElement(code, "span", "crunch-code-line", line || " ");
        if (activeLines.includes(index + 1)) codeLine.classList.add("is-active");
      });
      pre.append(code);
      const card = document.createElement("section");
      card.className = "crunch-step-card";
      appendTextElement(card, "span", "crunch-step-number", `Step ${current + 1}`);
      appendTextElement(card, "h4", "", step.title);
      appendTextElement(card, "p", "", step.explanation);
      if (step.state && Object.keys(step.state).length) {
        const state = document.createElement("dl");
        state.className = "crunch-state";
        Object.entries(step.state).forEach(([name, value]) => {
          appendTextElement(state, "dt", "", name);
          appendTextElement(state, "dd", "", String(value));
        });
        card.append(state);
      }
      grid.append(pre, card);
      workspace.append(grid);
    }

    function renderProof(step) {
      kind.textContent = "Crunchpad / proof builder";
      if (config.statement) appendTextElement(workspace, "div", "crunch-proof-statement", config.statement);
      const proof = document.createElement("div");
      proof.className = "crunch-proof-step";
      appendTextElement(proof, "div", "crunch-proof-symbol", step.symbol || "⇒");
      const content = document.createElement("div");
      appendTextElement(content, "span", "crunch-step-number", `Step ${current + 1}`);
      appendTextElement(content, "h4", "", step.title);
      if (step.math) appendTextElement(content, "div", "crunch-proof-math", step.math);
      appendTextElement(content, "p", "", step.explanation);
      proof.append(content);
      workspace.append(proof);
      if (window.renderMathInElement) {
        window.renderMathInElement(workspace, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }] });
      }
    }

    function render() {
      const step = config.steps[current];
      workspace.replaceChildren();
      if (config.mode === "proof") renderProof(step); else renderCode(step);
      segments.forEach((segment, index) => segment.classList.toggle("is-complete", index <= current));
      previous.disabled = current === 0;
      next.disabled = current === config.steps.length - 1;
      count.textContent = `Step ${current + 1} of ${config.steps.length}`;
    }

    previous.addEventListener("click", () => { if (current > 0) { current -= 1; render(); } });
    next.addEventListener("click", () => { if (current < config.steps.length - 1) { current += 1; render(); } });
    render();
  }

  function initialize() {
    document.querySelectorAll("[data-crunch-chart]").forEach(initChart);
    document.querySelectorAll("[data-crunch-function]").forEach(initFunction);
    document.querySelectorAll("[data-crunch-stepper]").forEach(initStepper);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
