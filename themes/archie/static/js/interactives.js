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
    const refLines = (config.refLines || [])
      .map((line) => ({ ...line, value: Number(line.value) }))
      .filter((line) => Number.isFinite(line.value));
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
      const yDomain = paddedExtent(yValues.concat(refLines.map((line) => line.value)), config.yDomain);
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
      const chartType = config.type || "line";
      const groupCount = Math.max(1, ...visible.map((item) => item.points.length));
      const groupWidth = plotWidth / groupCount;
      if (chartType === "bar") {
        // Bars sit in group slots, so labels must center under each group.
        const step = Math.ceil(groupCount / (width < 460 ? 4 : 8));
        context.textAlign = "center";
        for (let group = 0; group < groupCount; group += step) {
          context.fillText(String(labels[group] ?? group + 1), padding.left + (group + 0.5) * groupWidth, height - padding.bottom + 18);
        }
      } else {
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

      if (chartType === "bar") {
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

      refLines.forEach((line, index) => {
        const y = yScale(line.value);
        const color = line.color ? seriesColor(root, line.color, index) : colors.muted;
        context.save();
        context.strokeStyle = color;
        context.lineWidth = 1.5;
        context.setLineDash([6, 4]);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();
        context.restore();
        if (line.label) {
          context.fillStyle = color;
          context.textAlign = "right";
          context.fillText(line.label, width - padding.right, y - 9);
        }
      });

      const min = Math.min(...yValues);
      const max = Math.max(...yValues);
      const refText = refLines.length
        ? ` ${refLines.map((line) => `${line.label || "Reference line"} at ${formatNumber(line.value, config)}`).join(". ")}.`
        : "";
      summary.textContent = `${visible.length} visible series. Values range from ${formatNumber(min, config)} to ${formatNumber(max, config)}.${refText}`;
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

    const points = (config.points || [])
      .map((point) => ({ x: Number(point[0]), y: Number(point[1]) }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
    let lossValue = null;
    if (points.length) {
      const lossReadout = document.createElement("div");
      lossReadout.className = "crunch-function__loss";
      const lossLabel = document.createElement("span");
      lossLabel.textContent = config.lossLabel || "Mean squared error against the data";
      lossValue = document.createElement("strong");
      lossReadout.append(lossLabel, lossValue);
      controls.after(lossReadout);
    }

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
      const yDomain = paddedExtent(samples.map((point) => point.y).concat(points.map((point) => point.y)), config.yDomain);
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

      let lossText = "";
      if (points.length) {
        context.fillStyle = colors.palette[2];
        points.forEach((point) => {
          if (point.x < xDomain[0] || point.x > xDomain[1]) return;
          context.beginPath();
          context.arc(xScale(point.x), yScale(point.y), 4.5, 0, Math.PI * 2);
          context.fill();
        });
        const errors = points
          .map((point) => {
            let predicted = NaN;
            try { predicted = evaluate({ ...scope, x: point.x }); } catch (_) { predicted = NaN; }
            return Number.isFinite(predicted) ? (predicted - point.y) ** 2 : null;
          })
          .filter((error) => error != null);
        const mse = errors.length ? errors.reduce((sum, error) => sum + error, 0) / errors.length : NaN;
        lossValue.textContent = formatNumber(mse, { decimals: config.lossDecimals ?? 2 });
        lossText = ` The mean squared error against ${points.length} data points is ${formatNumber(mse, { decimals: 2 })}.`;
      }

      const parameters = Object.entries(scope).map(([name, value]) => `${name} is ${formatNumber(value, { decimals: 2 })}`).join(", ");
      summary.textContent = `${formula.textContent}. ${parameters}. The visible y range is ${formatNumber(yDomain[0], { decimals: 2 })} to ${formatNumber(yDomain[1], { decimals: 2 })}.${lossText}`;
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

  function ordinal(value) {
    const mod100 = value % 100;
    const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[value % 10] || "th");
    return `${value}${suffix}`;
  }

  function titleCaseName(value) {
    return String(value || "")
      .toLocaleLowerCase()
      .replace(/(^|[\s'.-])([a-z])/g, (_, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
      .replace(/\bMc([a-z])/g, (_, letter) => `Mc${letter.toUpperCase()}`);
  }

  function hexToRgb(value) {
    const match = String(value).trim().match(/^#([\da-f]{6})$/i);
    if (!match) return null;
    const number = Number.parseInt(match[1], 16);
    return { r: number >> 16, g: (number >> 8) & 255, b: number & 255 };
  }

  function mixColors(start, end, amount) {
    const a = hexToRgb(start);
    const b = hexToRgb(end);
    if (!a || !b) return amount < 0.5 ? start : end;
    const mix = (key) => Math.round(a[key] + (b[key] - a[key]) * Math.max(0, Math.min(1, amount)));
    return `rgb(${mix("r")}, ${mix("g")}, ${mix("b")})`;
  }

  function initCaucusAtlas(root) {
    const canvas = select(root, "[data-atlas-canvas]");
    const tooltip = select(root, "[data-atlas-tooltip]");
    const detail = select(root, "[data-atlas-detail]");
    const slider = select(root, "[data-atlas-slider]");
    const play = select(root, "[data-atlas-play]");
    const search = select(root, "[data-atlas-search]");
    const legend = select(root, "[data-atlas-legend]");
    const reset = select(root, "[data-atlas-reset]");
    const congressReadout = select(root, "[data-atlas-congress]");
    const countReadout = select(root, "[data-atlas-count]");
    const summary = select(root, "[data-atlas-summary]");
    const modeButtons = Array.from(root.querySelectorAll("[data-atlas-mode]"));
    let data;
    let points = [];
    let hitTargets = [];
    let congressIndex = 0;
    let mode = "party";
    let selected = null;
    let timer = null;
    let dragging = null;
    let zoom = 1;
    let pan = { x: 0, y: 0 };
    let size = { width: 0, height: 0 };
    const bounds = { minX: -0.66, maxX: 1.13, minY: -0.85, maxY: 1.13 };

    function atlasColors() {
      const styles = getComputedStyle(root);
      return {
        dem: styles.getPropertyValue("--caucus-dem").trim() || "#2f6bff",
        rep: styles.getPropertyValue("--caucus-rep").trim() || "#ef5b5b",
        other: styles.getPropertyValue("--caucus-other").trim() || "#9a78ff",
        low: styles.getPropertyValue("--caucus-low").trim() || "#68d4c1",
        high: styles.getPropertyValue("--caucus-high").trim() || "#ffb24a",
        neutral: styles.getPropertyValue("--caucus-neutral").trim() || "#a5acb4",
        grid: styles.getPropertyValue("--border").trim(),
        foreground: styles.getPropertyValue("--fg").trim(),
        muted: styles.getPropertyValue("--fg-muted").trim(),
        surface: styles.getPropertyValue("--surface").trim()
      };
    }

    function colorFor(point, colors, maxima) {
      if (mode === "party") return point.p === "D" ? colors.dem : point.p === "R" ? colors.rep : colors.other;
      if (mode === "caucuses") return mixColors(colors.low, colors.high, point.c / Math.max(1, maxima.caucuses));
      if (mode === "bridge") return mixColors(colors.neutral, colors.other, Math.sqrt((point.b || 0) / Math.max(0.000001, maxima.bridge)));
      if (point.i == null) return colors.neutral;
      const ideology = Math.max(-1, Math.min(1, point.i));
      return ideology < 0
        ? mixColors(colors.dem, colors.neutral, ideology + 1)
        : mixColors(colors.neutral, colors.rep, ideology);
    }

    function project(point) {
      const padding = 24;
      const plotWidth = Math.max(1, size.width - padding * 2);
      const plotHeight = Math.max(1, size.height - padding * 2);
      const normalizedX = (point.x - bounds.minX) / (bounds.maxX - bounds.minX) - 0.5;
      const normalizedY = (point.y - bounds.minY) / (bounds.maxY - bounds.minY) - 0.5;
      return {
        x: size.width / 2 + normalizedX * plotWidth * zoom + pan.x,
        y: size.height / 2 - normalizedY * plotHeight * zoom + pan.y
      };
    }

    function matching(point) {
      const query = search.value.trim().toLocaleLowerCase();
      if (!query) return true;
      return point.n.toLocaleLowerCase().includes(query) || point.s.toLocaleLowerCase() === query;
    }

    function updateLegend(colors, maxima) {
      legend.replaceChildren();
      if (mode === "party") {
        [[colors.dem, "Dem"], [colors.rep, "Rep"], [colors.other, "Other"]].forEach(([color, label]) => {
          const item = appendTextElement(legend, "span", "caucus-atlas__legend-item", label);
          item.style.setProperty("--legend-color", color);
        });
        return;
      }
      const low = mode === "ideology" ? "Liberal" : "Low";
      const high = mode === "ideology" ? "Conservative" : "High";
      const ramp = document.createElement("span");
      ramp.className = `caucus-atlas__ramp caucus-atlas__ramp--${mode}`;
      ramp.style.setProperty("--ramp-low", mode === "ideology" ? colors.dem : colors.low);
      ramp.style.setProperty("--ramp-high", mode === "ideology" ? colors.rep : (mode === "bridge" ? colors.other : colors.high));
      appendTextElement(legend, "span", "", low);
      legend.append(ramp);
      appendTextElement(legend, "span", "", high);
      if (mode === "ideology" && !points.some((point) => point.i != null)) {
        appendTextElement(legend, "em", "", "No DW-NOMINATE in this Congress");
      }
      if (mode === "caucuses") ramp.title = `Range: 0–${maxima.caucuses} caucuses`;
    }

    function densityForCurrent() {
      return data.density.find((item) => item.g === data.congresses[congressIndex]);
    }

    function renderDefaultDetail() {
      const density = densityForCurrent();
      detail.replaceChildren();
      appendTextElement(detail, "span", "caucus-atlas__detail-kicker", `${ordinal(density.g)} Congress snapshot`);
      appendTextElement(detail, "h4", "", "Same neighborhood, similar caucus portfolios.");
      appendTextElement(detail, "p", "", "Party is visible, but it is not the only structure. Recolor the map or inspect a member.");
      const list = document.createElement("dl");
      [[density.caucuses, "active caucuses"], [density.median, "median memberships"], [density.members, "members with rosters"]].forEach(([value, label]) => {
        const item = document.createElement("div");
        appendTextElement(item, "dt", "", String(value));
        appendTextElement(item, "dd", "", label);
        list.append(item);
      });
      detail.append(list);
    }

    function renderMemberDetail(point) {
      detail.replaceChildren();
      appendTextElement(detail, "span", "caucus-atlas__detail-kicker", `${point.p} · ${point.s} · ${ordinal(point.g)} Congress`);
      appendTextElement(detail, "h4", "", titleCaseName(point.n));
      appendTextElement(detail, "p", "", "Position comes from the full caucus portfolio, not the party label.");
      const list = document.createElement("dl");
      const stats = [
        [point.c, "caucus memberships"],
        [point.q == null ? "—" : `${Math.round(point.q * 100)}%`, "cross-party neighbors"],
        [point.i == null ? "—" : point.i.toFixed(2), "DW-NOMINATE"]
      ];
      stats.forEach(([value, label]) => {
        const item = document.createElement("div");
        appendTextElement(item, "dt", "", String(value));
        appendTextElement(item, "dd", "", label);
        list.append(item);
      });
      detail.append(list);
    }

    function draw() {
      const canvasState = canvasContext(canvas);
      const { context, width, height } = canvasState;
      size = { width, height };
      const colors = atlasColors();
      const congress = data.congresses[congressIndex];
      points = data.points.filter((point) => point.g === congress && point.c > 0);
      const maxima = {
        caucuses: Math.max(1, ...points.map((point) => point.c)),
        bridge: Math.max(0.000001, ...points.map((point) => point.b || 0))
      };
      hitTargets = [];

      context.save();
      context.globalAlpha = 0.42;
      context.strokeStyle = colors.grid;
      context.lineWidth = 1;
      for (let index = 1; index < 4; index += 1) {
        const x = (width * index) / 4;
        const y = (height * index) / 4;
        context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
        context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
      }
      context.restore();

      const hasQuery = Boolean(search.value.trim());
      const sorted = [...points].sort((a, b) => Number(matching(a)) - Number(matching(b)));
      sorted.forEach((point) => {
        const position = project(point);
        const isMatch = matching(point);
        const isSelected = selected && selected.id === point.id;
        if (position.x < -20 || position.x > width + 20 || position.y < -20 || position.y > height + 20) return;
        context.globalAlpha = hasQuery && !isMatch ? 0.08 : (point.i == null && mode === "ideology" ? 0.28 : 0.78);
        context.fillStyle = colorFor(point, colors, maxima);
        context.beginPath();
        context.arc(position.x, position.y, isSelected ? 7 : isMatch && hasQuery ? 5 : 2.8, 0, Math.PI * 2);
        context.fill();
        if (isSelected || (isMatch && hasQuery)) {
          context.globalAlpha = 0.9;
          context.strokeStyle = colors.foreground;
          context.lineWidth = isSelected ? 2 : 1;
          context.stroke();
        }
        hitTargets.push({ point, x: position.x, y: position.y });
      });
      context.globalAlpha = 1;

      congressReadout.textContent = ordinal(congress);
      countReadout.textContent = `${points.length} members · ${mode === "party" ? "party" : mode}`;
      summary.textContent = `${points.length} members in the ${ordinal(congress)} Congress, positioned by similarity of caucus portfolios and colored by ${mode}.`;
      updateLegend(colors, maxima);
      reset.hidden = zoom === 1 && pan.x === 0 && pan.y === 0;
    }

    function nearest(event) {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return hitTargets.reduce((best, target) => {
        const distance = Math.hypot(target.x - x, target.y - y);
        return distance < 12 && (!best || distance < best.distance) ? { ...target, distance } : best;
      }, null);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
      play.textContent = "Play";
      play.setAttribute("aria-label", "Play congress timeline");
    }

    function setCongress(index) {
      congressIndex = Math.max(0, Math.min(data.congresses.length - 1, index));
      slider.value = String(congressIndex);
      selected = null;
      tooltip.hidden = true;
      renderDefaultDetail();
      draw();
    }

    fetch(root.dataset.source)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        data = payload;
        slider.max = String(data.congresses.length - 1);
        congressIndex = data.congresses.length - 1;
        setCongress(congressIndex);

        slider.addEventListener("input", () => { stop(); setCongress(Number(slider.value)); });
        play.addEventListener("click", () => {
          if (timer) { stop(); return; }
          if (congressIndex === data.congresses.length - 1) setCongress(0);
          play.textContent = "Pause";
          play.setAttribute("aria-label", "Pause congress timeline");
          timer = window.setInterval(() => {
            if (congressIndex >= data.congresses.length - 1) { stop(); return; }
            setCongress(congressIndex + 1);
          }, 900);
        });
        modeButtons.forEach((button) => button.addEventListener("click", () => {
          mode = button.dataset.atlasMode;
          modeButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
          draw();
        }));
        search.addEventListener("input", () => { selected = null; renderDefaultDetail(); draw(); });
        search.addEventListener("keydown", (event) => {
          if (event.key !== "Enter") return;
          const match = points.find(matching);
          if (match) { selected = match; renderMemberDetail(match); draw(); }
        });
        canvas.addEventListener("pointermove", (event) => {
          if (dragging) {
            pan.x = dragging.panX + event.clientX - dragging.x;
            pan.y = dragging.panY + event.clientY - dragging.y;
            draw();
            return;
          }
          const target = nearest(event);
          if (!target) { tooltip.hidden = true; canvas.style.cursor = "grab"; return; }
          canvas.style.cursor = "pointer";
          tooltip.replaceChildren();
          appendTextElement(tooltip, "strong", "", titleCaseName(target.point.n));
          appendTextElement(tooltip, "span", "", `${target.point.p} · ${target.point.s} · ${target.point.c} caucuses`);
          const rect = canvas.getBoundingClientRect();
          tooltip.style.left = `${Math.max(80, Math.min(rect.width - 80, target.x))}px`;
          tooltip.style.top = `${Math.max(48, target.y)}px`;
          tooltip.hidden = false;
        });
        canvas.addEventListener("pointerleave", () => { if (!dragging) tooltip.hidden = true; });
        canvas.addEventListener("click", (event) => {
          if (dragging?.moved) return;
          const target = nearest(event);
          if (!target) return;
          selected = target.point;
          renderMemberDetail(target.point);
          draw();
        });
        canvas.addEventListener("pointerdown", (event) => {
          canvas.setPointerCapture(event.pointerId);
          dragging = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y, moved: false };
          canvas.style.cursor = "grabbing";
        });
        canvas.addEventListener("pointerup", (event) => {
          if (dragging) dragging.moved = Math.hypot(event.clientX - dragging.x, event.clientY - dragging.y) > 4;
          window.setTimeout(() => { dragging = null; canvas.style.cursor = "grab"; }, 0);
        });
        canvas.addEventListener("wheel", (event) => {
          event.preventDefault();
          const rect = canvas.getBoundingClientRect();
          const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          const oldZoom = zoom;
          zoom = Math.max(0.8, Math.min(5, zoom * (event.deltaY < 0 ? 1.16 : 0.86)));
          const ratio = zoom / oldZoom;
          pan.x = pointer.x - size.width / 2 - (pointer.x - size.width / 2 - pan.x) * ratio;
          pan.y = pointer.y - size.height / 2 - (pointer.y - size.height / 2 - pan.y) * ratio;
          draw();
        }, { passive: false });
        reset.addEventListener("click", () => { zoom = 1; pan = { x: 0, y: 0 }; draw(); });
        new ResizeObserver(draw).observe(canvas);
        observeTheme(draw);
      })
      .catch((error) => {
        showError(root, "The caucus atlas data could not be loaded.");
        console.error("Caucus atlas:", error);
      });
  }

  function initModelRace(root) {
    const config = readConfig(root);
    if (!config || !Array.isArray(config.models)) return;
    const chart = select(root, "[data-model-chart]");
    const note = select(root, "[data-model-note]");
    const history = select(root, "[data-model-history]");
    const metricButtons = Array.from(root.querySelectorAll("[data-model-metric]"));
    let metric = "ap";

    function render() {
      const models = config.models
        .filter((model) => history.checked || !model.history)
        .filter((model) => Number.isFinite(model[metric]))
        .sort((a, b) => b[metric] - a[metric]);
      const maximum = Math.max(...models.map((model) => model[metric]), 0.001);
      chart.replaceChildren();
      models.forEach((model, index) => {
        const row = document.createElement("div");
        row.className = `model-race__row${index === 0 ? " is-best" : ""}`;
        appendTextElement(row, "span", "model-race__rank", String(index + 1).padStart(2, "0"));
        appendTextElement(row, "span", "model-race__name", model.name);
        const track = document.createElement("span");
        track.className = "model-race__track";
        const bar = document.createElement("span");
        bar.className = "model-race__bar";
        bar.style.width = `${(model[metric] / maximum) * 100}%`;
        track.append(bar);
        row.append(track);
        appendTextElement(row, "strong", "model-race__value", Number(model[metric]).toFixed(3));
        chart.append(row);
      });

      const best = models[0];
      note.replaceChildren();
      appendTextElement(note, "span", "caucus-atlas__detail-kicker", config.metrics?.[metric]?.label || metric);
      appendTextElement(note, "h4", "", best.name);
      appendTextElement(note, "p", "", config.metrics?.[metric]?.explanation || "Higher is better.");
      const verdict = history.checked
        ? (config.metrics?.[metric]?.historyVerdict || "History changes the ranking.")
        : "With memory removed, the strongest available snapshot model rises to the top.";
      appendTextElement(note, "strong", "model-race__verdict", verdict);
    }

    metricButtons.forEach((button) => button.addEventListener("click", () => {
      metric = button.dataset.modelMetric;
      metricButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      render();
    }));
    history.addEventListener("change", render);
    render();
  }

  function initSystemMap(root) {
    const blocks = Array.from(root.querySelectorAll("[data-system-block]"));
    const detail = select(root, "[data-system-detail]");
    if (!blocks.length || !detail) return;

    function show(block) {
      blocks.forEach((item) => item.setAttribute("aria-pressed", String(item === block)));
      detail.replaceChildren();
      appendTextElement(detail, "span", "crunch-system__kicker", block.dataset.share || "Component");
      appendTextElement(detail, "h4", "", block.dataset.name);
      appendTextElement(detail, "p", "", block.dataset.note);
    }

    blocks.forEach((block) => {
      block.removeAttribute("title");
      block.addEventListener("click", () => show(block));
    });
    show(blocks.find((block) => block.hasAttribute("data-system-initial")) || blocks[0]);
  }

  function initialize() {
    document.querySelectorAll("[data-crunch-chart]").forEach(initChart);
    document.querySelectorAll("[data-crunch-function]").forEach(initFunction);
    document.querySelectorAll("[data-crunch-stepper]").forEach(initStepper);
    document.querySelectorAll("[data-caucus-atlas]").forEach(initCaucusAtlas);
    document.querySelectorAll("[data-model-race]").forEach(initModelRace);
    document.querySelectorAll("[data-crunch-system]").forEach(initSystemMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
