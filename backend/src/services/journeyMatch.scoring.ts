export interface MatchGraph {
  username: string;
  goals: { topics?: string[]; subtopics?: string[] }[];
  experiences: { id: string; title?: string; context?: string; challengeFaced?: string; outcome?: string; skills?: string[] }[];
  transitions: { from: string; to: string }[];
}
export interface JourneyMatch {
  percentage: number;
  computedAt: string;
  method: "weighted-graph-overlap-v1";
  breakdown: { dimension: string; percentage: number; weight: number }[];
}
const stop = new Set("a an and are as at be been by did do for from had has have i in into is it its me my of on or our that the their them then there these they this to was we were what when which who will with you your".split(" "));
const normalize = (value: string) => value.normalize("NFKC").toLowerCase().trim().replace(/\s+/g, " ");
const terms = (text: string) => normalize(text.slice(0, 12000)).split(/[^\p{L}\p{N}+#.]+/u).map(x => x.replace(/^\.+|\.+$/g, "")).filter(x => /[\p{L}\p{N}]/u.test(x) && x.length > 2 && !stop.has(x));
const clean = (values: string[]) => new Set(values.filter(x => typeof x === "string").map(normalize).filter(x => /[\p{L}\p{N}]/u.test(x)));
export function graphFeatures(graph: MatchGraph) {
  const experiences = graph.experiences.slice(0, 100);
  const skills = clean(experiences.flatMap(e => (e.skills ?? []).slice(0, 30)));
  const goals = clean(graph.goals.slice(0, 50).flatMap(g => [...(g.topics ?? []), ...(g.subtopics ?? [])]));
  const experienceTerms = new Set(experiences.flatMap(e => terms([e.title, e.context, e.challengeFaced, e.outcome].filter(Boolean).join(" "))));
  const nodes = new Map(experiences.map(e => [e.id, [...clean(e.skills ?? [])].slice(0, 12).map(s => "skill:" + s).concat(terms(e.title ?? "").slice(0, 8).map(s => "title:" + s))]));
  const transitions = new Set<string>();
  for (const edge of graph.transitions.slice(0, 200)) {
    for (const from of nodes.get(edge.from) ?? []) {
      for (const to of nodes.get(edge.to) ?? []) transitions.add(JSON.stringify([from, to]));
    }
  }
  return { skills, goals, experienceTerms, transitions, meaningful: experiences.length > 0 && (skills.size > 0 || experienceTerms.size > 0) };
}
export function compareJourneys(owner: MatchGraph, other: MatchGraph, computedAt = new Date().toISOString()): JourneyMatch | null {
  if (owner.username === other.username) return null;
  const a = graphFeatures(owner), b = graphFeatures(other);
  if (!a.meaningful || !b.meaningful) return null;
  const dimensions = [
    ["Skills", a.skills, b.skills, 0.40],
    ["Goal topics", a.goals, b.goals, 0.25],
    ["Experience terms", a.experienceTerms, b.experienceTerms, 0.20],
    ["Directed transitions", a.transitions, b.transitions, 0.15],
  ] as const;
  const available = dimensions.filter(([, left, right]) => left.size > 0 && right.size > 0);
  const totalWeight = available.reduce((sum, [, , , weight]) => sum + weight, 0);
  if (!totalWeight) return null;
  let score = 0;
  const breakdown = available.map(([dimension, left, right, weight]) => {
    const intersection = [...left].filter(x => right.has(x)).length;
    const similarity = intersection / new Set([...left, ...right]).size;
    score += similarity * weight / totalWeight;
    return { dimension, percentage: Math.round(similarity * 100), weight: weight / totalWeight };
  });
  return { percentage: Math.round(score * 100), computedAt, method: "weighted-graph-overlap-v1", breakdown };
}
