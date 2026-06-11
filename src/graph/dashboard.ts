/**
 * Self-contained HTML dashboard generation for the bookmark knowledge graph.
 *
 * Produces a single HTML file with the graph data inlined and a dependency-free
 * canvas force-directed renderer, so it opens offline with no server or network.
 */

import type { BookmarkKnowledgeGraph, GraphNode, GraphEdge } from './types.js'

interface DashboardNode {
  id: string
  label: string
  type: string
  size: number
}

interface DashboardData {
  nodes: DashboardNode[]
  edges: Array<{ source: string; target: string }>
  meta: { generatedAt: string; nodeCount: number; edgeCount: number }
}

/** Reduce a full graph to the minimal data the dashboard needs. */
export function buildDashboardData(graph: BookmarkKnowledgeGraph): DashboardData {
  const edgeCount = new Map<string, number>()
  for (const edge of graph.edges) {
    edgeCount.set(edge.source, (edgeCount.get(edge.source) || 0) + 1)
    edgeCount.set(edge.target, (edgeCount.get(edge.target) || 0) + 1)
  }

  const nodes: DashboardNode[] = graph.nodes.map((node: GraphNode) => ({
    id: node.id,
    label: node.name,
    type: node.type,
    size: 4 + Math.min(12, edgeCount.get(node.id) || 0)
  }))

  const edges = graph.edges.map((edge: GraphEdge) => ({
    source: edge.source,
    target: edge.target
  }))

  return {
    nodes,
    edges,
    meta: {
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length
    }
  }
}

/** Render the dashboard data into a single self-contained HTML document. */
export function renderDashboardHtml(data: DashboardData): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>open-bookmark · Knowledge Graph</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f1117; color: #e6e6e6; overflow: hidden; }
  #hud { position: fixed; top: 16px; left: 16px; z-index: 10; background: rgba(20,23,31,.85); border: 1px solid #2a2f3a; border-radius: 10px; padding: 14px 16px; backdrop-filter: blur(6px); }
  #hud h1 { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
  #hud .stat { font-size: 12px; color: #9aa4b2; }
  #legend { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
  #legend span { font-size: 12px; display: flex; align-items: center; gap: 6px; }
  #legend i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  canvas { display: block; }
  #tip { position: fixed; pointer-events: none; background: #1b1f2a; border: 1px solid #2a2f3a; border-radius: 6px; padding: 4px 8px; font-size: 12px; display: none; z-index: 20; }
</style>
</head>
<body>
<div id="hud">
  <h1>open-bookmark · Knowledge Graph</h1>
  <div class="stat" id="stat"></div>
  <div id="legend"></div>
</div>
<div id="tip"></div>
<canvas id="c"></canvas>
<script>
const DATA = ${json};
const COLORS = { bookmark: '#5b9dff', domain: '#5bd1a0', topic: '#d98cff', folder: '#ffcf5b' };
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const tip = document.getElementById('tip');
let W, H;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
addEventListener('resize', resize); resize();

const nodes = DATA.nodes.map(n => ({ ...n, x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0 }));
const index = new Map(nodes.map(n => [n.id, n]));
const edges = DATA.edges.filter(e => index.has(e.source) && index.has(e.target))
  .map(e => ({ s: index.get(e.source), t: index.get(e.target) }));

document.getElementById('stat').textContent = DATA.meta.nodeCount + ' nodes · ' + DATA.meta.edgeCount + ' edges';
const legend = document.getElementById('legend');
for (const [k, v] of Object.entries(COLORS)) {
  const s = document.createElement('span');
  s.innerHTML = '<i style="background:' + v + '"></i>' + k;
  legend.appendChild(s);
}

let cx = W / 2, cy = H / 2, scale = 1, tx = 0, ty = 0;
function tick() {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = a.x - b.x, dy = a.y - b.y;
      let d2 = dx * dx + dy * dy || 0.01;
      const f = 600 / d2;
      const d = Math.sqrt(d2);
      a.vx += (dx / d) * f; a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
  }
  for (const e of edges) {
    let dx = e.t.x - e.s.x, dy = e.t.y - e.s.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const f = (d - 80) * 0.01;
    e.s.vx += (dx / d) * f; e.s.vy += (dy / d) * f;
    e.t.vx -= (dx / d) * f; e.t.vy -= (dy / d) * f;
  }
  for (const n of nodes) {
    n.vx += (cx - n.x) * 0.0008;
    n.vy += (cy - n.y) * 0.0008;
    n.x += n.vx *= 0.85;
    n.y += n.vy *= 0.85;
  }
}
function draw() {
  ctx.setTransform(scale, 0, 0, scale, tx, ty);
  ctx.clearRect(-tx / scale, -ty / scale, W / scale, H / scale);
  ctx.strokeStyle = 'rgba(120,130,150,.18)';
  ctx.lineWidth = 1;
  for (const e of edges) {
    ctx.beginPath(); ctx.moveTo(e.s.x, e.s.y); ctx.lineTo(e.t.x, e.t.y); ctx.stroke();
  }
  for (const n of nodes) {
    ctx.beginPath();
    ctx.fillStyle = COLORS[n.type] || '#888';
    ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
function loop() { tick(); draw(); requestAnimationFrame(loop); }
loop();

let drag = null;
canvas.addEventListener('mousemove', ev => {
  const mx = (ev.clientX - tx) / scale, my = (ev.clientY - ty) / scale;
  if (drag) { tx += ev.movementX; ty += ev.movementY; return; }
  let hit = null;
  for (const n of nodes) { if ((n.x - mx) ** 2 + (n.y - my) ** 2 < (n.size + 3) ** 2) { hit = n; break; } }
  if (hit) { tip.style.display = 'block'; tip.style.left = ev.clientX + 10 + 'px'; tip.style.top = ev.clientY + 10 + 'px'; tip.textContent = hit.label + ' (' + hit.type + ')'; }
  else tip.style.display = 'none';
});
canvas.addEventListener('mousedown', () => drag = true);
addEventListener('mouseup', () => drag = false);
canvas.addEventListener('wheel', ev => {
  ev.preventDefault();
  const factor = ev.deltaY < 0 ? 1.1 : 0.9;
  scale *= factor;
}, { passive: false });
</script>
</body>
</html>`
}
