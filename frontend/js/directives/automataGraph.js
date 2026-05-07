angular.module('automataApp').directive('automataGraph', function() {
  return {
    restrict: 'A',
    scope: { automata: '=', activeStep: '=' },
    link: function(scope, elem) {
      elem.addClass('graph-container');
      let cy = null;

      function renderGraph(automata) {
        if (!automata || !automata.states) return;

        // Clear container
        elem.empty();

        const nodes = automata.states.map(function(s) {
          return {
            data: {
              id: s,
              label: s,
              accept: (automata.acceptStates || []).includes(s) ? true : false,
              initial: automata.initialState === s ? true : false
            }
          };
        });

        const edges = (automata.transitions || []).map(function(t, idx) {
          return {
            data: { id: 'e' + idx, source: t.from, target: t.to, label: t.symbol }
          };
        });

        // initialize cytoscape
        cy = cytoscape({
          container: elem[0],
          elements: {
            nodes: nodes,
            edges: edges,
          },
          style: [
            {
              selector: 'node',
              style: {
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'background-color': '#3498db',
                'color': '#fff',
                'width': '50',
                'height': '50',
                'font-size': '12px',
                'border-width': 2,
                'border-color': '#2c3e50'
              }
            },
            // Accept states: concentric circles (double circle)
            {
              selector: 'node[accept]',
              style: {
                'border-width': 8,
                'border-color': '#27ae60',
                'background-color': '#3498db',
                'padding': 4
              }
            },
            // Initial state: different background color
            {
              selector: 'node[initial]',
              style: {
                'background-color': '#f1c40f',
                'border-color': '#d35400',
                'border-width': 4
              }
            },
            // Active/highlighted node during animation
            {
              selector: 'node.active',
              style: {
                'background-color': '#e74c3c',
                'width': 60,
                'height': 60
              }
            },
            {
              selector: 'edge',
              style: {
                'label': 'data(label)',
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#34495e',
                'line-color': '#95a5a6',
                'font-size': '10px',
                'text-rotation': 'autorotate',
                'text-margin-y': -6
              }
            }
          ],
          layout: { name: 'cose' }
        });

        // Run a COSE layout with increased spacing for readability
        const layout = cy.layout({
          name: 'cose',
          idealEdgeLength: 120,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 60,
          randomize: false,
          componentSpacing: 120,
          nodeRepulsion: 8000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000
        });

        layout.run();

        // After layout finishes, fit and center the graph nicely
        layout.on('layoutstop', function() {
          try {
            cy.resize();
            cy.fit(50);
            cy.center();
          } catch (e) {
            // ignore
          }
        });

        // handle window resize to keep graph centered
        const onResize = function() {
          try {
            cy.resize();
            cy.fit(50);
            cy.center();
          } catch (e) {}
        };
        window.addEventListener('resize', onResize);

        // cleanup when directive destroyed
        scope.$on('$destroy', function() {
          window.removeEventListener('resize', onResize);
          try { cy.destroy(); } catch (e) {}
        });
      }

      // Watch for active step changes to highlight nodes
      scope.$watch('activeStep', function(newVal) {
        if (cy && newVal) {
          // Remove active class from all nodes
          cy.nodes().removeClass('active');
          // Add active class to current step's state
          const stateNode = cy.$('#' + newVal.state);
          if (stateNode.length) {
            stateNode.addClass('active');
          }
        }
      });

      scope.$watch('automata', function(newVal) {
        if (newVal) {
          renderGraph(newVal);
        }
      }, true);
    }
  };
});
