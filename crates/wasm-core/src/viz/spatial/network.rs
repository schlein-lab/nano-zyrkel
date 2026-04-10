//! # NetworkGraph — nodes + edges with a tiny force layout
//!
//! Lightweight implementation suitable for graphs up to a few hundred
//! nodes. Uses a relaxation loop with repulsive forces between every node
//! pair and attractive forces along edges. The layout is computed once at
//! draw time so consumers can re-run it after data changes.

use serde::Deserialize;
use std::f64::consts::TAU;
use wasm_bindgen::prelude::*;

use crate::viz::basic::canvas::ChartCanvas;

#[derive(Deserialize, Clone)]
struct InputNode {
    id: String,
    #[serde(default)]
    label: Option<String>,
    #[serde(default)]
    color: Option<String>,
    #[serde(default)]
    radius: Option<f64>,
}

#[derive(Deserialize, Clone)]
struct InputEdge {
    source: String,
    target: String,
    #[serde(default)]
    weight: Option<f64>,
}

struct LayoutNode {
    id: String,
    label: Option<String>,
    color: String,
    radius: f64,
    x: f64,
    y: f64,
    vx: f64,
    vy: f64,
}

/// Builder for a force-directed network graph.
#[wasm_bindgen]
pub struct NetworkGraph {
    canvas: ChartCanvas,
    nodes: Vec<InputNode>,
    edges: Vec<InputEdge>,
    iterations: u32,
    node_color: String,
    edge_color: String,
}

#[wasm_bindgen]
impl NetworkGraph {
    /// Create a new network graph for `canvas`.
    #[wasm_bindgen(constructor)]
    pub fn new(canvas: ChartCanvas) -> NetworkGraph {
        Self {
            canvas,
            nodes: Vec::new(),
            edges: Vec::new(),
            iterations: 200,
            node_color: "#06B6D4".to_string(),
            edge_color: "#9CA3AF".to_string(),
        }
    }

    /// Provide nodes as `[{id, label?, color?, radius?}, ...]`.
    #[wasm_bindgen]
    pub fn nodes(mut self, nodes: JsValue) -> Result<NetworkGraph, JsValue> {
        self.nodes = serde_wasm_bindgen::from_value(nodes)
            .map_err(|e| JsValue::from_str(&format!("network nodes: {e}")))?;
        Ok(self)
    }

    /// Provide edges as `[{source, target, weight?}, ...]`.
    #[wasm_bindgen]
    pub fn edges(mut self, edges: JsValue) -> Result<NetworkGraph, JsValue> {
        self.edges = serde_wasm_bindgen::from_value(edges)
            .map_err(|e| JsValue::from_str(&format!("network edges: {e}")))?;
        Ok(self)
    }

    /// Number of relaxation iterations. Default 200.
    #[wasm_bindgen]
    pub fn iterations(mut self, n: u32) -> NetworkGraph {
        self.iterations = n.max(10);
        self
    }

    /// Default node color when none is supplied per node.
    #[wasm_bindgen(js_name = nodeColor)]
    pub fn node_color(mut self, color: &str) -> NetworkGraph {
        self.node_color = color.to_string();
        self
    }

    /// Edge color.
    #[wasm_bindgen(js_name = edgeColor)]
    pub fn edge_color(mut self, color: &str) -> NetworkGraph {
        self.edge_color = color.to_string();
        self
    }

    /// Run the layout and draw the graph.
    #[wasm_bindgen]
    pub fn draw(self) -> Result<(), JsValue> {
        if self.nodes.is_empty() {
            return Ok(());
        }

        let plot_left = self.canvas.plot_left();
        let plot_top = self.canvas.plot_top();
        let plot_w = self.canvas.plot_width();
        let plot_h = self.canvas.plot_height();
        let cx = plot_left + plot_w / 2.0;
        let cy = plot_top + plot_h / 2.0;
        let radius = (plot_w.min(plot_h) / 2.0) - 16.0;

        let mut layout: Vec<LayoutNode> = self
            .nodes
            .iter()
            .enumerate()
            .map(|(i, node)| {
                let angle = i as f64 / self.nodes.len() as f64 * TAU;
                LayoutNode {
                    id: node.id.clone(),
                    label: node.label.clone(),
                    color: node.color.clone().unwrap_or_else(|| self.node_color.clone()),
                    radius: node.radius.unwrap_or(6.0),
                    x: cx + radius * angle.cos(),
                    y: cy + radius * angle.sin(),
                    vx: 0.0,
                    vy: 0.0,
                }
            })
            .collect();

        let id_to_index: std::collections::HashMap<String, usize> = layout
            .iter()
            .enumerate()
            .map(|(i, node)| (node.id.clone(), i))
            .collect();

        let edge_indices: Vec<(usize, usize, f64)> = self
            .edges
            .iter()
            .filter_map(|e| {
                let s = *id_to_index.get(&e.source)?;
                let t = *id_to_index.get(&e.target)?;
                Some((s, t, e.weight.unwrap_or(1.0)))
            })
            .collect();

        let area = plot_w * plot_h;
        let k = (area / layout.len() as f64).sqrt() * 0.35;

        for _ in 0..self.iterations {
            // Repulsive forces between every pair of nodes.
            for i in 0..layout.len() {
                for j in (i + 1)..layout.len() {
                    let dx = layout[i].x - layout[j].x;
                    let dy = layout[i].y - layout[j].y;
                    let dist = (dx * dx + dy * dy).sqrt().max(0.1);
                    let force = (k * k) / dist;
                    let fx = (dx / dist) * force;
                    let fy = (dy / dist) * force;
                    layout[i].vx += fx;
                    layout[i].vy += fy;
                    layout[j].vx -= fx;
                    layout[j].vy -= fy;
                }
            }
            // Attractive forces along edges.
            for &(s, t, weight) in &edge_indices {
                let dx = layout[s].x - layout[t].x;
                let dy = layout[s].y - layout[t].y;
                let dist = (dx * dx + dy * dy).sqrt().max(0.1);
                let force = (dist * dist) / k * weight;
                let fx = (dx / dist) * force;
                let fy = (dy / dist) * force;
                layout[s].vx -= fx;
                layout[s].vy -= fy;
                layout[t].vx += fx;
                layout[t].vy += fy;
            }
            // Apply velocity with damping and clamp inside the plot area.
            for node in layout.iter_mut() {
                let speed = (node.vx * node.vx + node.vy * node.vy).sqrt();
                let damped = speed.min(8.0);
                if speed > 0.0 {
                    node.x += node.vx / speed * damped;
                    node.y += node.vy / speed * damped;
                }
                node.vx *= 0.85;
                node.vy *= 0.85;
                node.x = node.x.clamp(plot_left + 8.0, plot_left + plot_w - 8.0);
                node.y = node.y.clamp(plot_top + 8.0, plot_top + plot_h - 8.0);
            }
        }

        let ctx = self.canvas.ctx();
        // Edges first.
        ctx.set_stroke_style_str(&self.edge_color);
        ctx.set_line_width(0.75);
        for &(s, t, _) in &edge_indices {
            ctx.begin_path();
            ctx.move_to(layout[s].x, layout[s].y);
            ctx.line_to(layout[t].x, layout[t].y);
            ctx.stroke();
        }
        // Nodes on top.
        for node in &layout {
            ctx.set_fill_style_str(&node.color);
            ctx.begin_path();
            let _ = ctx.arc(node.x, node.y, node.radius, 0.0, TAU);
            ctx.fill();
            if let Some(label) = &node.label {
                ctx.set_fill_style_str("#374151");
                ctx.set_font("11px Inter, sans-serif");
                ctx.set_text_align("center");
                ctx.set_text_baseline("top");
                let _ = ctx.fill_text(label, node.x, node.y + node.radius + 2.0);
            }
        }
        Ok(())
    }
}
