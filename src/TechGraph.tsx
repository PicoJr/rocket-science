import { prepend } from "shades";
import { createGeometricReservoirSample} from "pandemonium";

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

const nodes_tier_proportions = [0.05, 0.1, 0.2, 0.3, 0.2, 0.1, 0.05];
const tiers = nodes_tier_proportions.map((_, idx) => idx);
const nb_tiers = tiers.length;
const nodes_tier_proportions_cum_sum = prepend([0])(nodes_tier_proportions).map(
  (
    (sum) => (value) =>
      (sum += value)
  )(0)
);

const tiers_from_id = (i: number, n: number) => {
  const tier = tiers.find((t) => {
    return (
      n * nodes_tier_proportions_cum_sum[t] <= i &&
      i < n * nodes_tier_proportions_cum_sum[Math.min(t + 1, nb_tiers)]
    );
  });
  if (tier !== undefined) {
    return tier;
  } else {
    return nb_tiers - 1;
  }
};

function random_techgraph(n: number): TechGraph {
  var seedrandom = require('seedrandom');
  var seeded_rng = seedrandom("foo");
  const sample_fn = createGeometricReservoirSample<number>(seeded_rng);
  const nodes_by_tier: Map<number, number[]> = new Map(
    tiers.map((t: number) => {
      return [
        t,
        [...Array.from(Array(n).keys())].filter((i) => tiers_from_id(i, n) === t),
      ];
    })
  );
  var techgraph: TechGraph = {
    nodes: [...Array.from(Array(n).keys())].map((i) => ({
      id: i,
      sources: [],
      targets: [],
    })),
    links: [],
    node_id_map: new Map(),
  };
  console.log(nodes_by_tier);
  // make sure node 0 is linked to all other tier 0 nodes
  nodes_by_tier.get(0)?.forEach((i) => {
    if (i !== 0) {
      techgraph.links.push({
        source: 0,
        target: i,
      });
    }
  });

  // link all tier nodes with tier + 1 nodes
  tiers.forEach((t: number) => {
    if (nodes_by_tier.has(t) && nodes_by_tier.has(t + 1)) {
      const source_tier = nodes_by_tier.get(t) || [];
      const target_tier = nodes_by_tier.get(t + 1) || [];
      source_tier?.forEach((i_source_tier: number) => {
        const node_targets = sample_fn(2, target_tier as number & number[]);
        node_targets?.forEach((i_target_tier: number) => {
          // console.log("links: " + i_source_tier + " -> " + i_target_tier);
          techgraph.links.push({
            source: i_source_tier,
            target: i_target_tier,
          });
        });
      });
    }
  });

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

export {
  type TechNodeId,
  type TechNode,
  type TechLink,
  type TechGraph,
  random_techgraph,
  tiers_from_id,
  nb_tiers
};
