(function registerCrunchpadEditor(window) {
  "use strict";

  const CMS = window.CMS;
  const createClass = window.createClass;
  const h = window.h;
  if (!CMS || !createClass || !h) return;

  const tones = ["blue", "orange", "teal", "violet"];

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function decodeAttribute(value) {
    return String(value || "").replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }

  function encodeAttribute(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  }

  function parseAttributes(source) {
    const attributes = {};
    const pattern = /([A-Za-z][\w-]*)\s*=\s*"((?:\\.|[^"\\])*)"/g;
    let match;
    while ((match = pattern.exec(source || ""))) attributes[match[1]] = decodeAttribute(match[2]);
    return attributes;
  }

  function serializeAttributes(data, supportsTone) {
    const keys = ["title", "description", "caption"];
    if (supportsTone) keys.push("tone");
    return keys
      .filter((key) => data[key])
      .map((key) => `  ${key}="${encodeAttribute(data[key])}"`)
      .join("\n");
  }

  function formatJson(value, fallback) {
    const source = String(value || fallback || "{}").trim();
    try {
      return JSON.stringify(JSON.parse(source), null, 2);
    } catch (_error) {
      return source;
    }
  }

  const JsonControl = createClass({
    isValid: function isValid() {
      try {
        JSON.parse(String(this.props.value || "{}"));
        return true;
      } catch (error) {
        return { error: { message: `Invalid JSON: ${error.message}` } };
      }
    },

    render: function render() {
      let error = "";
      try {
        JSON.parse(String(this.props.value || "{}"));
      } catch (caught) {
        error = caught.message;
      }
      return h("div", { className: this.props.classNameWrapper }, [
        h("textarea", {
          id: this.props.forID,
          key: "input",
          rows: 18,
          spellCheck: false,
          style: {
            boxSizing: "border-box",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "13px",
            lineHeight: "1.55",
            minHeight: "20rem",
            padding: "0.75rem",
            resize: "vertical",
            width: "100%",
          },
          value: this.props.value || "{}",
          onChange: (event) => this.props.onChange(event.target.value),
        }),
        error
          ? h("p", { key: "error", style: { color: "#b42318", fontSize: "12px" } }, `Invalid JSON: ${error}`)
          : null,
      ]);
    },
  });

  const JsonPreview = createClass({
    render: function render() {
      return h("pre", {}, formatJson(this.props.value, "{}"));
    },
  });

  CMS.registerWidget("crunch-json", JsonControl, JsonPreview);

  function commonFields(definition) {
    const fields = [
      { name: "title", label: "Title", widget: "string", default: definition.defaultTitle },
      { name: "description", label: "Instruction", widget: "text", required: false },
      { name: "caption", label: "Caption / source", widget: "text", required: false },
    ];
    if (definition.supportsTone) {
      fields.push({
        name: "tone",
        label: "Tone",
        widget: "select",
        options: tones,
        default: definition.defaultTone,
      });
    }
    if (definition.hasConfig) {
      fields.push({
        name: "configuration",
        label: "Configuration",
        widget: "crunch-json",
        default: JSON.stringify(definition.defaultConfig, null, 2),
        hint: "Validated JSON. Every option supported by the live shortcode remains available.",
      });
    }
    return fields;
  }

  function previewMarkup(definition, data) {
    const tone = definition.supportsTone ? data.tone || definition.defaultTone : definition.defaultTone;
    const configuration = definition.hasConfig ? formatJson(data.configuration, JSON.stringify(definition.defaultConfig)) : "";
    return `<figure class="crunch-interactive crunch-tone-${escapeHtml(tone)}">
  <header class="crunch-interactive__header">
    <span class="crunch-interactive__kind">${escapeHtml(definition.kicker)}</span>
    <h3>${escapeHtml(data.title || definition.defaultTitle)}</h3>
    ${data.description ? `<p>${escapeHtml(data.description)}</p>` : ""}
  </header>
  ${configuration ? `<pre style="max-height:18rem;overflow:auto;white-space:pre-wrap"><code>${escapeHtml(configuration)}</code></pre>` : ""}
  ${data.caption ? `<figcaption>${escapeHtml(data.caption)}</figcaption>` : ""}
</figure>`;
  }

  function registerConfiguredBlock(definition) {
    CMS.registerEditorComponent({
      id: definition.id,
      label: definition.label,
      collapsed: true,
      fields: commonFields(definition),
      pattern: new RegExp(
        `^\\{\\{<\\s*${definition.id}\\b([\\s\\S]*?)>\\}\\}\\s*\\n([\\s\\S]*?)\\n\\{\\{<\\s*\\/${definition.id}\\s*>\\}\\}$`
      ),
      fromBlock: function fromBlock(match) {
        return Object.assign(parseAttributes(match[1]), { configuration: match[2].trim() });
      },
      toBlock: function toBlock(data) {
        const attributes = serializeAttributes(data, definition.supportsTone);
        const opening = attributes ? `{{< ${definition.id}\n${attributes}\n>}}` : `{{< ${definition.id} >}}`;
        return `${opening}\n${formatJson(data.configuration, JSON.stringify(definition.defaultConfig))}\n{{< /${definition.id} >}}`;
      },
      toPreview: function toPreview(data) {
        return previewMarkup(definition, data);
      },
    });
  }

  function registerStandaloneBlock(definition) {
    CMS.registerEditorComponent({
      id: definition.id,
      label: definition.label,
      collapsed: true,
      fields: commonFields(definition),
      pattern: new RegExp(`^\\{\\{<\\s*${definition.id}\\b([\\s\\S]*?)>\\}\\}$`),
      fromBlock: function fromBlock(match) {
        return parseAttributes(match[1]);
      },
      toBlock: function toBlock(data) {
        const attributes = serializeAttributes(data, definition.supportsTone);
        return attributes ? `{{< ${definition.id}\n${attributes}\n>}}` : `{{< ${definition.id} >}}`;
      },
      toPreview: function toPreview(data) {
        return previewMarkup(definition, data);
      },
    });
  }

  const blocks = [
    {
      id: "chart",
      label: "Crunchpad chart",
      kicker: "Crunchpad / chart",
      defaultTitle: "Explore the data",
      defaultTone: "blue",
      supportsTone: true,
      hasConfig: true,
      defaultConfig: {
        type: "line",
        labels: ["0", "1", "2"],
        xLabel: "Step",
        yLabel: "Value",
        decimals: 2,
        series: [{ name: "Series", color: "blue", values: [1, 2, 3] }],
      },
    },
    {
      id: "function-lab",
      label: "Crunchpad function lab",
      kicker: "Crunchpad / function lab",
      defaultTitle: "Change the inputs",
      defaultTone: "orange",
      supportsTone: true,
      hasConfig: true,
      defaultConfig: {
        formula: "y = ax + b",
        expression: "a*x + b",
        xDomain: [-5, 5],
        yDomain: [-10, 10],
        parameters: [
          { name: "a", label: "Slope", min: -3, max: 3, step: 0.1, value: 1 },
          { name: "b", label: "Intercept", min: -5, max: 5, step: 0.1, value: 0 },
        ],
      },
    },
    {
      id: "stepper",
      label: "Crunchpad proof or code stepper",
      kicker: "Crunchpad / explainer",
      defaultTitle: "Walk through it",
      defaultTone: "teal",
      supportsTone: true,
      hasConfig: true,
      defaultConfig: {
        mode: "proof",
        statement: "Claim: …",
        steps: [{ title: "Start", math: "$x = 1$", explanation: "Explain why this step is valid." }],
      },
    },
    {
      id: "system-map",
      label: "Crunchpad system map",
      kicker: "Crunchpad / system map",
      defaultTitle: "The whole system",
      defaultTone: "orange",
      supportsTone: true,
      hasConfig: true,
      defaultConfig: {
        blocks: [
          { name: "Input", share: "source", note: "What enters the system.", cols: 6, rows: 1 },
          { name: "Output", share: "result", note: "What leaves the system.", cols: 6, rows: 1, focus: true },
        ],
      },
    },
    {
      id: "model-race",
      label: "Agora model race",
      kicker: "Agora / held-out model race",
      defaultTitle: "Which model wins?",
      defaultTone: "teal",
      supportsTone: false,
      hasConfig: true,
      defaultConfig: {
        models: [{ name: "Baseline", history: false, auc: 0.5, ap: 0.1, mrr: 0.1, r10: 0.1 }],
        metrics: {
          ap: { label: "PR-AUC", explanation: "Explain the metric.", historyVerdict: "Explain the result." },
        },
      },
    },
    {
      id: "caucus-atlas",
      label: "Agora caucus atlas",
      kicker: "Agora / member space",
      defaultTitle: "The caucus atlas",
      defaultTone: "violet",
      supportsTone: false,
      hasConfig: false,
    },
  ];

  blocks.forEach((definition) => {
    if (definition.hasConfig) registerConfiguredBlock(definition);
    else registerStandaloneBlock(definition);
  });

  CMS.registerPreviewStyle("/css/style.css");
  CMS.registerPreviewStyle("/css/interactives.css");
})(window);
