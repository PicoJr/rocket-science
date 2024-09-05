import "./App.css";
import React from "react";

import ForceGraph3D, { LinkObject } from "react-force-graph-3d";
import { filter, cons } from "shades";

type TechNodeId = number;

type TechLink = {
  source: TechNodeId;
  target: TechNodeId;
};

type TechNode = {
  id: TechNodeId;
  sources: TechNodeId[];
  targets: TechNodeId[];
};

type TechGraph = {
  nodes: TechNode[];
  links: TechLink[];
  node_id_map: Map<TechNodeId, TechNode>;
};

function dummy_techgraph(): TechGraph {
  var techgraph: TechGraph = {
    nodes: [
      {
        id: 0,
        sources: [],
        targets: [],
      },
      {
        id: 1,
        sources: [],
        targets: [],
      },
      {
        id: 2,
        sources: [],
        targets: [],
      },
      {
        id: 3,
        sources: [],
        targets: [],
      },
    ],
    links: [
      {
        source: 0,
        target: 1,
      },
      {
        source: 1,
        target: 2,
      },
      {
        source: 2,
        target: 3,
      },
    ],
    node_id_map: new Map(),
  };
  // cross-link node objects
  techgraph.links.forEach((link) => {
    const a = techgraph.nodes[link.source];
    const b = techgraph.nodes[link.target];
    !a.targets && (a.targets = []);
    !b.sources && (b.sources = []);
    a.targets.push(b.id);
    b.sources.push(a.id);
  });
  techgraph.nodes.forEach((node) => {
    techgraph.node_id_map.set(node.id, node);
  });
  return techgraph;
}

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
  if (node === undefined) {
    return false;
  } else {
    return (
      discovered.includes(node.id) ||
      node.sources.find((id) => {
        return discovered.includes(id);
      }) !== undefined
    );
  }
}

function App() {
  const initialy_discovered = [0];
  const [discovered, setDiscovered] = React.useState(initialy_discovered);

  const nodeColor = (node: TechNode) => {
    if (discovered.includes(node.id)) {
      return "green";
    }
    return "red";
  };

  const toggleDiscovered = (node: TechNode) => {
    console.log("toggling %d", node.id);
    console.log(discovered);
    if (discovered.includes(node.id)) {
      setDiscovered(filter((node_id) => node_id !== node.id)(discovered));
    } else {
      setDiscovered(cons(node.id)(discovered));
    }
  };

  const techgraph: TechGraph = dummy_techgraph();

  return (
    <div className="App">
      <ForceGraph3D
        graphData={techgraph}
        nodeColor={(node) => nodeColor(node)}
        onNodeClick={(node) => toggleDiscovered(node)}
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
    </div>
  );
}

export default App;
