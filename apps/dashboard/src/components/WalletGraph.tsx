import { useRef, useEffect, useCallback } from 'react';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  score: number;
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
  confidence: number;
}

interface WalletGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (nodeId: string) => void;
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

function getColor(score: number): string {
  if (score >= 80) return COLORS[0];
  if (score >= 60) return COLORS[1];
  if (score >= 40) return COLORS[2];
  if (score >= 20) return COLORS[3];
  return COLORS[4];
}

export function WalletGraph({
  nodes: initialNodes,
  edges,
  width = 800,
  height = 600,
  onNodeClick,
}: WalletGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const hoveredNodeRef = useRef<string | null>(null);
  const dragNodeRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const nodes = initialNodes.map((n) => ({
      ...n,
      x: n.x || 100 + Math.random() * (width - 200),
      y: n.y || 100 + Math.random() * (height - 200),
      vx: 0,
      vy: 0,
      radius: Math.max(15, Math.min(40, 15 + n.score * 0.3)),
      color: getColor(n.score),
    }));
    nodesRef.current = nodes;
  }, [initialNodes, width, height]);

  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = 3000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    for (const edge of edges) {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) continue;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = (dist - 150) * 0.01;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      from.vx += fx;
      from.vy += fy;
      to.vx -= fx;
      to.vy -= fy;
    }

    for (const node of nodes) {
      if (node.id === dragNodeRef.current) continue;
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      const gravity = 0.001;
      node.vx += dx * gravity;
      node.vy += dy * gravity;

      node.vx *= 0.85;
      node.vy *= 0.85;
      node.x += node.vx;
      node.y += node.vy;

      node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
      node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
    }

    draw();
    animFrameRef.current = requestAnimationFrame(simulate);
  }, [edges, width, height]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    for (const edge of edges) {
      const from = nodesRef.current.find((n) => n.id === edge.from);
      const to = nodesRef.current.find((n) => n.id === edge.to);
      if (!from || !to) continue;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = `rgba(148, 163, 184, ${edge.confidence / 100})`;
      ctx.lineWidth = Math.max(1, edge.confidence / 20);
      ctx.stroke();

      const mx = (from.x + to.x) / 2;
      const my = (from.y + to.y) / 2;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(edge.label, mx, my - 4);
    }

    for (const node of nodesRef.current) {
      const isHovered = hoveredNodeRef.current === node.id;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#60a5fa' : node.color;
      ctx.fill();
      if (isHovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#fff';
      ctx.font = `${Math.max(10, node.radius * 0.4)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);

      if (isHovered) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        const textWidth = ctx.measureText(`${node.id} (Score: ${node.score})`).width;
        ctx.fillRect(node.x - textWidth / 2 - 8, node.y - node.radius - 28, textWidth + 16, 22);
        ctx.fillStyle = '#fff';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(
          `${node.id.slice(0, 10)}... (Score: ${node.score})`,
          node.x,
          node.y - node.radius - 12,
        );
      }
    }
  }

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [simulate]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragNodeRef.current) {
      const node = nodesRef.current.find((n) => n.id === dragNodeRef.current);
      if (node) {
        node.x = mx - dragOffsetRef.current.x;
        node.y = my - dragOffsetRef.current.y;
      }
      return;
    }

    const hovered = nodesRef.current.find((n) => {
      const dx = mx - n.x;
      const dy = my - n.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius;
    });
    hoveredNodeRef.current = hovered?.id ?? null;
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const node = nodesRef.current.find((n) => {
      const dx = mx - n.x;
      const dy = my - n.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius;
    });
    if (node) {
      dragNodeRef.current = node.id;
      dragOffsetRef.current = { x: mx - node.x, y: my - node.y };
    }
  }

  function handleMouseUp() {
    if (dragNodeRef.current && onNodeClick) {
      onNodeClick(dragNodeRef.current);
    }
    dragNodeRef.current = null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        hoveredNodeRef.current = null;
        dragNodeRef.current = null;
      }}
      style={{ borderRadius: 8, background: 'var(--bg-card)' }}
    />
  );
}
