import './App.css';
import React from 'react';

import ForceGraph3D from 'react-force-graph-3d';
import { filter, cons } from 'shades';

type TechLink = {
    source: number,
    target: number,
}

type TechNode = {
    id: number,
    neighbors: TechNode[],
    links: TechLink[],
}

type TechGraph = {
    nodes: TechNode[],
    links: TechLink[],
}

function dummy_techgraph(): TechGraph {
  var techgraph: TechGraph =  {
      nodes: [
        {
            id: 0,
            neighbors: [],
            links: [],
        },
        {
            id: 1,
            neighbors: [],
            links: [],
        },
        {
            id: 2,
            neighbors: [],
            links: [],
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
    ]
    };
    // cross-link node objects
    techgraph.links.forEach(link => {
      const a = techgraph.nodes[link.source];
      const b = techgraph.nodes[link.target];
      !a.neighbors && (a.neighbors = []);
      !b.neighbors && (b.neighbors = []);
      a.neighbors.push(b);
      b.neighbors.push(a);

      !a.links && (a.links = []);
      !b.links && (b.links = []);
      a.links.push(link);
      b.links.push(link);
    });
  return techgraph;
}



function App() {

  const [discovered, setDiscovered] = React.useState(new Array<number>());

  const nodeColor = (node: TechNode) => {
    if (discovered.includes(node.id)) {
        return "green";
    }
    return "red";
  }

  const toggleDiscovered = (node: TechNode) => {
    console.log("toggling %d", node.id)
    console.log(discovered)
    if (discovered.includes(node.id)) {
        setDiscovered(filter(node_id => node_id != node.id)(discovered));
    } else {
        setDiscovered(cons(node.id)(discovered));
    }
}

  return (
    <div className="App">
    <ForceGraph3D
      graphData={dummy_techgraph()}
      nodeColor={node => nodeColor(node)}
      onNodeClick={node => toggleDiscovered(node)}
    />
    </div>
  );
}

export default App;
