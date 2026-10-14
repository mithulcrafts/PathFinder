import type { UserJourneyResponse } from '../api/journey.api';
import { L } from '../constants/colors';

/** Retains the node IDs used by both screens' detail sheets. */
export function buildJourneyGraphElements(
  journey: UserJourneyResponse | null,
  { filterMissingTransitions = false }: { filterMissingTransitions?: boolean } = {},
): string {
  if (!journey) return "[]";
  const elements: { data: Record<string, string | number> }[] = [];
  // User Node
  elements.push({ data: { id: 'user', label: '@' + journey.username, color: L.navy, shape: 'ellipse', textColor: '#fff', borderWidth: 0, borderColor: '#000' } });

  // Goals
  journey.goals.forEach(g => {
    elements.push({ data: { id: 'g_' + g.id, label: g.title, color: L.terracotta, shape: 'round-rectangle', textColor: '#fff', borderWidth: 0, borderColor: '#000' } });
    elements.push({ data: { id: 'e_ug_' + g.id, source: 'user', target: 'g_' + g.id, label: 'HAS_GOAL' } });
  });

  // Experiences
  journey.experiences.forEach(exp => {
    elements.push({ data: { id: 'x_' + exp.id, label: exp.title, color: L.teal, shape: 'round-rectangle', textColor: '#fff', borderWidth: 0, borderColor: '#000' } });
    elements.push({ data: { id: 'e_ux_' + exp.id, source: 'user', target: 'x_' + exp.id, label: 'HAS_EXPERIENCE' } });

    exp.goalIds?.forEach(gid => {
      elements.push({ data: { id: `e_xg_${exp.id}_${gid}`, source: 'x_' + exp.id, target: 'g_' + gid, label: 'CONTRIBUTED_TO' } });
    });

    exp.skills?.forEach((s, idx) => {
      const sId = 's_' + exp.id + '_' + idx;
      elements.push({ data: { id: sId, label: s.name, color: L.surface, shape: 'round-rectangle', textColor: L.navy, borderWidth: 1, borderColor: L.teal } });
      elements.push({ data: { id: 'e_xs_' + sId, source: 'x_' + exp.id, target: sId, label: 'BUILT_SKILL' } });
    });
  });

  // Transitions
  let transitions = journey.transitions;
  if (filterMissingTransitions) {
    const validExperienceIds = new Set(journey.experiences.map(exp => exp.id));
    transitions = transitions.filter(t =>
      validExperienceIds.has(t.fromExperienceId) && validExperienceIds.has(t.toExperienceId));
  }
  transitions.forEach((t, idx) => {
    elements.push({ data: { id: 't_' + idx, source: 'x_' + t.fromExperienceId, target: 'x_' + t.toExperienceId, label: t.decisionLabel } });
  });

  return JSON.stringify(elements);
}

/** Shared graph document for the personal and public journey screens. */
export function createJourneyGraphHtml(
  elementsJson: string,
  options: { mode?: 'personal' | 'public'; screenWidth?: number } = {},
): string {
  const personal = options.mode === 'personal';
  const nodeWidth = personal
    ? Math.max(140, Math.min(185, Math.round((options.screenWidth ?? 360) * 0.44)))
    : 160;
  const nodeHeight = personal ? Math.round(nodeWidth * 0.52) : 80;
  const maxTextWidth = personal ? Math.round(nodeWidth - 40) : 130;
  const fontFamily = personal
    ? 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    : 'Inter, sans-serif';

  return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.23.0/cytoscape.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body, html {
          width: 100%; height: 100%; margin: 0; padding: 0;
          background-color: ${L.background};
          font-family: 'Inter', sans-serif;
          background-image: radial-gradient(${L.navySoft}40 1px, transparent 1px);
          background-size: 24px 24px;
        }
        #cy { width: 100%; height: 100%; }
        #cy-wrapper {
          width: 100%; height: 100%;
          box-shadow: inset 0 0 40px rgba(0,0,0,0.03);
        }
    </style>
</head>
<body>
    <div id="cy-wrapper">
      <div id="cy"></div>
    </div>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var cy = cytoscape({
                container: document.getElementById('cy'),
                elements: ${elementsJson},
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'color': 'data(textColor)',
                            'font-size': '12px',
                            'font-family': '${fontFamily}',
                            'font-weight': '600',
                            'background-color': 'data(color)',
                            'shape': 'data(shape)',
                            'border-width': 'data(borderWidth)',
                            'border-color': 'data(borderColor)',
                            'width': '${nodeWidth}px',
                            'height': '${nodeHeight}px',
                            'text-wrap': 'wrap',
                            'text-max-width': '${maxTextWidth}px',
                            'padding': '0px',
                            'transition-property': 'background-color, transform, border-width',
                            'transition-duration': 0.2,
                            'underlay-color': '#000000',
                            'underlay-padding': '4px',
                            'underlay-opacity': 0.1
                        }
                    },
                    {
                        selector: 'node:active',
                        style: {
                            'border-width': 3,
                            'border-color': '${L.terracotta}',
                            'underlay-opacity': 0.2,
                            'underlay-padding': '6px'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'width': 2,
                            'line-color': '#C4D4D1',
                            'target-arrow-color': '#C4D4D1',
                            'target-arrow-shape': 'triangle',
                            'curve-style': 'bezier',
                            'label': 'data(label)',
                            'font-size': '10px',
                            'font-family': 'Inter, sans-serif',
                            'font-weight': '500',
                            'text-rotation': 'autorotate',
                            'text-background-opacity': 1,
                            'text-background-color': '${L.background}',
                            'text-background-padding': '4px',
                            'text-background-shape': 'round-rectangle',
                            'text-border-opacity': 1,
                            'text-border-width': 1,
                            'text-border-color': '${L.border}',
                            'color': '${L.navySoft}',
                            'arrow-scale': 1.2
                        }
                    }
                ],
                layout: {
                  name: 'cose',
                  animate: true,
                  animationDuration: 800,
                  animationEasing: 'ease-out-quint',
                  fit: true,
                  padding: 80,
                  componentSpacing: 100,
                  nodeRepulsion: 900000,
                  nodeOverlap: 150,
                  idealEdgeLength: 220,
                  edgeElasticity: 150,
                  nestingFactor: 5,
                  gravity: 80,
                  numIter: 1000
                }
            });

            cy.on('tap', 'node', function(evt){
              var node = evt.target;
              cy.animate({
                center: { eles: node },
                zoom: 1.4,
                duration: 400,
                ${personal ? "easing: 'ease-in-out-cubic'" : ''}
              });
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'node_tap',
                  nodeId: node.id(),
                  nodeLabel: node.data('label')
                }));
              } else if (window.parent) {
                window.parent.postMessage(JSON.stringify({
                  type: 'node_tap',
                  nodeId: node.id(),
                  nodeLabel: node.data('label')
                }), '*');
              }
            });

            cy.on('tap', function(evt){
              if(evt.target === cy){
                cy.animate({
                  fit: { padding: 40 },
                  duration: 400,
                  ${personal ? "easing: 'ease-in-out-cubic'" : ''}
                });
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'bg_tap'
                  }));
                } else if (window.parent) {
                  window.parent.postMessage(JSON.stringify({
                    type: 'bg_tap'
                  }), '*');
                }
              }
            });

            window.cy = cy;
            ${personal ? `
            window.addEventListener('message', function(event) {
              if (event.data === 'export' && window.cy) {
                const msg = JSON.stringify({
                  type: 'export_result',
                  data: window.cy.png({ bg: '#FAF9F6', full: true, scale: 2 })
                });
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(msg);
                } else if (window.parent) {
                  window.parent.postMessage(msg, '*');
                }
              }
            });
            ` : ''}
        });
    </script>
</body>
</html>
`;
}
