import "./App.css";
import React from "react";

import ForceGraph3D, {
  LinkObject,
  NodeObject,
  ForceGraphMethods,
} from "react-force-graph-3d";
import { filter, cons } from "shades";
import { TechNodeId, TechNode, TechLink, TechGraph, random_techgraph } from "./TechGraph";


function isLinkObject(
  link: TechNodeId | LinkObject<TechNode, TechLink>
): link is LinkObject<TechNode, TechLink> {
  return (link as LinkObject<TechNode, TechLink>).id !== undefined;
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
  const { useRef, useCallback } = React;

  const nodeColor = (node: TechNode) => {
    if (discovered.includes(node.id)) {
      return "green";
    }
    return "red";
  };

  const techgraph: TechGraph = random_techgraph(100);

  const FocusGraph = () => {
    const fgRef = useRef<ForceGraphMethods<TechNode, TechLink>>();

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
            if (discovered.includes(node.id)) {
              setDiscovered(
                filter((node_id) => node_id !== node.id)(discovered)
              );
            } else {
              setDiscovered(cons(node.id)(discovered));
            }
          }
        }
      },
      [fgRef]
    );

    return (
      <ForceGraph3D
        ref={fgRef}
        graphData={techgraph}
        nodeColor={(node) => nodeColor(node)}
        nodeLabel={(node) => String(node.id)}
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
