import { getTrendingGraph } from "../../services/community.service.js";

export function getGraph(limit = 20) {
  return getTrendingGraph(limit);
}
