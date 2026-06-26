const DEFAULT_NODES = [
  "LLM Wiki",
  "Capture",
  "Connect",
  "Retrieve",
  "Synthesize",
  "Prompt",
  "Memory",
  "Feedback",
  "Decision",
  "Next Course"
];

const DEFAULT_LINKS = [
  ["LLM Wiki", "Capture"],
  ["Capture", "Connect"],
  ["Connect", "Retrieve"],
  ["Retrieve", "Synthesize"],
  ["Synthesize", "Decision"],
  ["Prompt", "LLM Wiki"],
  ["Memory", "Retrieve"],
  ["Feedback", "Decision"],
  ["Decision", "Next Course"],
  ["Feedback", "LLM Wiki"],
  ["Memory", "Connect"]
];

export async function startKnowledgeGraph(canvas, options = {}) {
  if (!canvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const palette = options.palette || {
    line: "rgba(96, 240, 213, 0.22)",
    node: "rgba(255, 255, 255, 0.92)",
    core: "rgba(98, 238, 199, 0.96)",
    text: "rgba(230, 244, 255, 0.78)"
  };

  try {
    const d3 = await import("https://cdn.jsdelivr.net/npm/d3@7/+esm");
    runD3Graph(canvas, d3, palette, reducedMotion);
  } catch {
    runFallbackGraph(canvas, palette, reducedMotion);
  }
}

function runD3Graph(canvas, d3, palette, reducedMotion) {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let simulation = null;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (simulation) {
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.7).restart();
    }
  };

  const compact = window.innerWidth < 720;
  const labels = compact ? DEFAULT_NODES.slice(0, 7) : DEFAULT_NODES;
  const nodeSet = new Set(labels);
  const nodes = labels.map((id) => ({ id, radius: id === "LLM Wiki" ? 9 : 5 }));
  const links = DEFAULT_LINKS.filter(([source, target]) => nodeSet.has(source) && nodeSet.has(target)).map(
    ([source, target]) => ({ source, target })
  );

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.strokeStyle = palette.line;
    for (const link of links) {
      context.beginPath();
      context.moveTo(link.source.x, link.source.y);
      context.lineTo(link.target.x, link.target.y);
      context.stroke();
    }

    for (const node of nodes) {
      const isCore = node.id === "LLM Wiki";
      context.beginPath();
      context.fillStyle = isCore ? palette.core : palette.node;
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fill();
      context.font = isCore ? "700 13px system-ui" : "600 11px system-ui";
      context.fillStyle = palette.text;
      context.fillText(node.id, node.x + node.radius + 7, node.y + 4);
    }
  };

  resize();
  window.addEventListener("resize", resize);

  simulation = d3
    .forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(compact ? -46 : -64))
    .force("link", d3.forceLink(links).id((node) => node.id).distance(compact ? 70 : 96))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(42))
    .on("tick", draw);

  if (reducedMotion) {
    simulation.stop();
    for (let i = 0; i < 120; i += 1) simulation.tick();
    draw();
  }
}

function runFallbackGraph(canvas, palette, reducedMotion) {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let frameId = 0;
  let start = performance.now();

  const points = DEFAULT_NODES.slice(0, window.innerWidth < 720 ? 7 : 10).map((label, index) => ({
    label,
    angle: (Math.PI * 2 * index) / 10,
    radius: index === 0 ? 0 : 88 + (index % 3) * 36
  }));

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const draw = () => {
    const elapsed = reducedMotion ? 0 : (performance.now() - start) / 5200;
    const centerX = width / 2;
    const centerY = height / 2;
    context.clearRect(0, 0, width, height);

    const placed = points.map((point, index) => {
      const spin = point.angle + elapsed * (index % 2 === 0 ? 0.22 : -0.16);
      return {
        ...point,
        x: centerX + Math.cos(spin) * point.radius,
        y: centerY + Math.sin(spin) * point.radius * 0.62
      };
    });

    context.strokeStyle = palette.line;
    for (let index = 1; index < placed.length; index += 1) {
      context.beginPath();
      context.moveTo(placed[0].x, placed[0].y);
      context.lineTo(placed[index].x, placed[index].y);
      context.stroke();
    }

    for (const point of placed) {
      const isCore = point.label === "LLM Wiki";
      context.beginPath();
      context.fillStyle = isCore ? palette.core : palette.node;
      context.arc(point.x, point.y, isCore ? 9 : 5, 0, Math.PI * 2);
      context.fill();
      context.font = isCore ? "700 13px system-ui" : "600 11px system-ui";
      context.fillStyle = palette.text;
      context.fillText(point.label, point.x + 12, point.y + 4);
    }

    if (!reducedMotion) {
      frameId = requestAnimationFrame(draw);
    }
  };

  resize();
  window.addEventListener("resize", resize);
  draw();

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
    } else {
      start = performance.now();
      draw();
    }
  });
}
