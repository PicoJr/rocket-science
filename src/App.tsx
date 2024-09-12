import "./App.css";
import React from "react";

import ForceGraph3D, {
  LinkObject,
  NodeObject,
  ForceGraphMethods,
} from "react-force-graph-3d";
import { append, cons } from "shades";
import { Gradient } from "typescript-color-gradient";

import {
  TechNodeId,
  TechNode,
  TechLink,
  TechGraph,
  random_techgraph,
  tiers_from_id,
  nb_tiers,
} from "./TechGraph";
import { Map } from "immutable";

function research_success_probability(p0: number, retries: number): number {
  return p0 + (1 - p0) * (1 - 1 / Math.sqrt(1 + retries / 10)); 
}

function isLinkObject(
  link: TechNodeId | LinkObject<TechNode, TechLink>
): link is LinkObject<TechNode, TechLink> {
  return (link as LinkObject<TechNode, TechLink>).id !== undefined;
}

function isNodeObject(
  node: TechNodeId | NodeObject<TechNode>
): node is NodeObject<TechNode> {
  return (node as NodeObject<TechNode>).id !== undefined;
}

function discovered_or_near_other_discovered(
  node_id_or_link_object: TechNodeId | LinkObject<TechNode, TechLink>,
  graph: TechGraph,
  discovered: Array<TechNodeId>
): boolean {
  const node_id = isLinkObject(node_id_or_link_object)
    ? node_id_or_link_object.id
    : node_id_or_link_object;
  const node = graph.node_id_map.get(node_id);
  return (
    node !== undefined &&
    (discovered.includes(node.id) ||
      node.sources.find((id) => {
        return discovered.includes(id);
      }) !== undefined)
  );
}

function App() {
  const initialy_discovered = [0];
  const [discovered, setDiscovered] = React.useState(initialy_discovered);
  const [retries, setRetries] = React.useState(Map<TechNodeId, number>());
  const { useRef, useCallback } = React;

  const nb_nodes = 100;
  const base_probability = 0.20;
  // const techgraph: TechGraph = random_techgraph(nb_nodes);

  const gradient = new Gradient()
    .setGradient("#1fe049", "#1f80e0", "#801fe0", "#e0801f")
    .setNumberOfColors(nb_tiers)
    .getColors();

  const nodeColor = (node: TechNode) => {
    if (discovered.includes(node.id)) {
      return gradient.at(tiers_from_id(node.id, nb_nodes)) || "yellow";
    }
    return "#d8d8da";
  };

  const nodeSize = (node: TechNode) => {
    if (discovered.includes(node.id)) {
      return 8;
    }
    return 4;
  };

  const FocusGraph = () => {
    const fgRef = useRef<ForceGraphMethods<TechNode, TechLink>>();

    const { useMemo } = React;
    const techgraph: TechGraph = useMemo(() => random_techgraph(nb_nodes), []);

    const handleClick = useCallback(
      (node: NodeObject<TechNode>, event: MouseEvent) => {
        if (
          node.x !== undefined &&
          node.y !== undefined &&
          node.z !== undefined &&
          fgRef.current !== undefined
        ) {
          // Aim at node from outside it
          const distance = 40;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
          const cameraPosition: { x: number; y: number; z: number } =
            fgRef.current.camera().position;
          const node_distance = Math.hypot(
            node.x - cameraPosition.x,
            node.y - cameraPosition.y,
            node.z - cameraPosition.z
          );

          if (node_distance > 2 * distance) {
            fgRef.current.cameraPosition(
              {
                x: node.x * distRatio,
                y: node.y * distRatio,
                z: node.z * distRatio,
              }, // new position
              { x: node.x, y: node.y, z: node.z }, // new position
              500 // ms transition duration
            );
          } else {
            if (!discovered.includes(node.id)) {
              const r: number = retries.get(node.id) || 0;
              const p0 = Math.pow(base_probability, tiers_from_id(node.id, nb_nodes));
              const p = research_success_probability(p0, r);
              const new_retries = retries.set(node.id, r + 1); 
              if (Math.random() < p) {
                setDiscovered(cons(node.id)(discovered));
              } else {
                setRetries(new_retries);
              }
            }
          }
        }
      },
      [fgRef]
    );

    const initialy_highlighted: TechLink[] = [];
    const [highlightLinks, setHighlightLinks] =
      React.useState(initialy_highlighted);

    const handleNodeHover = (node: NodeObject<TechNode> | null) => {
      if (node) {
        const links_from = node.targets.map((target) => ({
          source: node.id,
          target: target,
        }));
        const links_to = node.targets.map((source) => ({
          source: source,
          target: node.id,
        }));
        const new_links: TechLink[] = append(links_from)(links_to);
        setHighlightLinks(new_links);
      }
    };

    const linkWidth = (link: LinkObject<TechNode, TechLink>) => {
      const source_id = isNodeObject(link.source)
        ? link.source.id
        : link.source;
      const target_id = isNodeObject(link.target)
        ? link.target.id
        : link.target;
      return highlightLinks.some(
        (e) => e.source === source_id && e.target === target_id
      )
        ? 4
        : 1;
    };

    return (
      <ForceGraph3D
        ref={fgRef}
        graphData={techgraph}
        nodeColor={(node) => nodeColor(node)}
        nodeVal={(node) => nodeSize(node)}
        nodeLabel={(node) => {
          const r: number = retries.get(node.id) || 0;
          const p0 = Math.pow(base_probability, tiers_from_id(node.id, nb_nodes));
          const p = research_success_probability(p0, r);
          return String(p);
        }}
        onNodeClick={(node, event) => handleClick(node, event)}
        nodeVisibility={(node) =>
          discovered_or_near_other_discovered(node.id, techgraph, discovered)
        }
        linkVisibility={(link) =>
          discovered_or_near_other_discovered(
            link.source,
            techgraph,
            discovered
          )
        }
        linkWidth={(link) => linkWidth(link)}
        onNodeHover={handleNodeHover}
      />
    );
  };

  return (
    <div className="App">
      <FocusGraph />
    </div>
  );
}

export default App;
