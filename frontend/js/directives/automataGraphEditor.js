angular.module('automataApp').directive('automataGraphEditor', function($document, $timeout) {
  return {
    restrict: 'A',
    scope: {
      automata: '=',
      onStateAdded: '&',
      onStateRemoved: '&',
      onTransitionAdded: '&',
      onTransitionRemoved: '&',
      onStateRenamed: '&',
      editorMode: '='
    },
    link: function(scope, elem) {
      elem.addClass('graph-editor-container');
      
      let network = null;
      let nodes = null;
      let edges = null;
      let nodeCounter = 0;

      // Initialize Vis.js network for graph editing
      function initializeGraph() {
        // Clear any existing content
        elem.empty();
        nodes = new vis.DataSet();
        edges = new vis.DataSet();
        nodeCounter = 0;

        // Add existing states as nodes
        if (scope.automata && scope.automata.states && scope.automata.states.length > 0) {
          scope.automata.states.forEach((state, index) => {
            const stateId = state.id || state.name;
            const isAccept = scope.automata.acceptStates && scope.automata.acceptStates.includes(stateId);
            const isInitial = scope.automata.initialState === stateId;
            
            let color = '#3498db';
            let font = { size: 14, color: '#fff' };
            
            if (isInitial) {
              color = '#f1c40f';
              font.color = '#000';
            }
            if (isAccept) {
              color = '#27ae60';
            }
            
            nodes.add({
              id: stateId,
              label: state.name || state.id,
              color: { 
                background: color, 
                border: '#2c3e50',
                highlight: { background: '#e74c3c', border: '#c0392b' }
              },
              font: font,
              shape: 'circle',
              mass: 2,
              title: stateId
            });
            
            // Track nodeCounter for auto-increment
            if (stateId.startsWith('q')) {
              const num = parseInt(stateId.substring(1));
              if (!isNaN(num)) {
                nodeCounter = Math.max(nodeCounter, num + 1);
              }
            }
          });
        }

        // Add transitions as edges
        if (scope.automata && scope.automata.transitions) {
          scope.automata.transitions.forEach((transition) => {
            edges.add({
              from: transition.from,
              to: transition.to,
              label: transition.symbol,
              arrows: 'to',
              smooth: { type: 'cubicBezier' },
              title: `${transition.from} → ${transition.to}: ${transition.symbol}`
            });
          });
        }

        // Create network
        const options = {
          physics: {
            enabled: true,
            stabilization: { iterations: 200 },
            barnesHut: { 
              gravitationalConstant: -26000, 
              centralGravity: 0.3, 
              springLength: 200,
              springConstant: 0.04
            }
          },
          interaction: {
            navigationButtons: true,
            keyboard: true,
            zoomView: true,
            dragView: true,
            hover: true
          },
          nodes: {
            borderWidth: 2,
            borderWidthSelected: 3,
            widthConstraint: { maximum: 200 }
          },
          edges: {
            color: { color: '#2c3e50', highlight: '#e74c3c' },
            width: 2,
            font: { size: 12, color: '#000', strokeWidth: 0, face: 'Arial' },
            smooth: { type: 'cubicBezier', forceDirection: 'horizontal' }
          }
        };

        network = new vis.Network(elem[0], { nodes: nodes, edges: edges }, options);
        setupEventHandlers();

        // Stabilize and fit view
        $timeout(function() {
          if (network) {
            network.fit({ animation: true });
          }
        }, 500);
      }

      function setupEventHandlers() {
        // Click on canvas to add state
        network.on('click', function(params) {
          if (params.nodes.length === 0 && params.edges.length === 0) {
            const canvasPos = params.pointer.canvas;
            addNewState(canvasPos);
          }
        });

        // Right-click on node to delete
        network.on('oncontext', function(params) {
          params.event.preventDefault();
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const label = nodes.get(nodeId).label;
            if (confirm(`Delete state "${label}"?`)) {
              removeState(nodeId);
            }
          } else if (params.edges.length > 0) {
            if (confirm('Delete this transition?')) {
              removeTransition(params.edges[0]);
            }
          }
        });

        // Double-click on node to rename
        network.on('doubleClick', function(params) {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const nodeData = nodes.get(nodeId);
            renameState(nodeId, nodeData.label);
          }
        });

        // Drag end to create transition
        network.on('dragEnd', function(params) {
          if (params.nodes.length > 0) {
            const fromNode = params.nodes[0];
            
            // Find if dropped on another node
            const toNode = network.getNodeAt(params.pointer.DOM);
            
            if (toNode && fromNode !== toNode) {
              showTransitionDialog(fromNode, toNode);
            }
          }
        });
      }

      function addNewState(position) {
        if (!scope.automata) {
          scope.automata = { states: [], transitions: [], acceptStates: [], alphabet: [] };
        }
        if (!scope.automata.states) scope.automata.states = [];

        const stateId = 'q' + nodeCounter++;
        const newState = { id: stateId, name: stateId };
        scope.automata.states.push(newState);

        nodes.add({
          id: stateId,
          label: stateId,
          color: { 
            background: '#3498db', 
            border: '#2c3e50',
            highlight: { background: '#e74c3c', border: '#c0392b' }
          },
          font: { size: 14, color: '#fff' },
          shape: 'circle',
          mass: 2,
          x: position.x,
          y: position.y,
          title: stateId
        });

        scope.$apply();
        if (scope.onStateAdded) {
          scope.onStateAdded({ state: newState });
        }
      }

      function removeState(stateId) {
        if (!confirm(`Delete state "${stateId}"?`)) return;

        // Remove from automata data
        scope.automata.states = scope.automata.states.filter(s => (s.id || s.name) !== stateId);
        
        // Remove related transitions
        scope.automata.transitions = scope.automata.transitions.filter(t => 
          t.from !== stateId && t.to !== stateId
        );

        if (scope.automata.initialState === stateId) {
          scope.automata.initialState = null;
        }

        scope.automata.acceptStates = scope.automata.acceptStates.filter(s => s !== stateId);

        // Remove from graph
        nodes.remove(stateId);
        
        // Remove edges connected to this node
        const edgesToRemove = edges.get({ 
          filter: item => item.from === stateId || item.to === stateId 
        });
        edgesToRemove.forEach(edge => edges.remove(edge.id));

        scope.$apply();
        if (scope.onStateRemoved) {
          scope.onStateRemoved({ stateId: stateId });
        }
      }

      function showTransitionDialog(fromStateId, toStateId) {
        const alphabet = (scope.automata.alphabet || []).length > 0 
          ? scope.automata.alphabet.join(', ') 
          : 'No alphabet defined';
        
        const symbol = prompt(`Enter transition symbol:\n\nAvailable alphabet: ${alphabet}`, '');

        if (symbol !== null && symbol.trim() !== '') {
          addTransition(fromStateId, toStateId, symbol.trim());
        }
      }

      function addTransition(fromStateId, toStateId, symbol) {
        if (!scope.automata.transitions) scope.automata.transitions = [];
        if (!scope.automata.alphabet) scope.automata.alphabet = [];

        // Check if transition already exists
        const existing = scope.automata.transitions.find(t => 
          t.from === fromStateId && t.to === toStateId && t.symbol === symbol
        );
        
        if (existing) {
          alert('Transition already exists');
          return;
        }

        const newTransition = {
          from: fromStateId,
          to: toStateId,
          symbol: symbol
        };

        scope.automata.transitions.push(newTransition);

        // Add symbol to alphabet if not present
        if (!scope.automata.alphabet.includes(symbol)) {
          scope.automata.alphabet.push(symbol);
        }

        // Add to graph
        edges.add({
          from: fromStateId,
          to: toStateId,
          label: symbol,
          arrows: 'to',
          smooth: { type: 'cubicBezier' },
          title: `${fromStateId} → ${toStateId}: ${symbol}`
        });

        scope.$apply();
        if (scope.onTransitionAdded) {
          scope.onTransitionAdded({ transition: newTransition });
        }
      }

      function removeTransition(edgeId) {
        if (!confirm('Delete this transition?')) return;

        const edge = edges.get(edgeId);
        if (edge) {
          // Remove from automata data
          scope.automata.transitions = scope.automata.transitions.filter(t => 
            !(t.from === edge.from && t.to === edge.to && t.label === edge.label)
          );
        }

        edges.remove(edgeId);

        scope.$apply();
        if (scope.onTransitionRemoved) {
          scope.onTransitionRemoved({ edgeId: edgeId });
        }
      }

      function renameState(stateId, oldLabel) {
        const newLabel = prompt('Enter new state name:', oldLabel);

        if (newLabel && newLabel.trim() && newLabel !== oldLabel) {
          // Update node
          const nodeData = nodes.get(stateId);
          nodeData.label = newLabel;
          nodes.update(nodeData);

          // Update in automata data
          const state = scope.automata.states.find(s => (s.id || s.name) === stateId);
          if (state) {
            const oldName = state.name;
            state.name = newLabel;

            // Update all transition references
            scope.automata.transitions.forEach(t => {
              if (t.from === oldName) t.from = newLabel;
              if (t.to === oldName) t.to = newLabel;
            });

            if (scope.automata.initialState === oldName) {
              scope.automata.initialState = newLabel;
            }

            scope.automata.acceptStates = scope.automata.acceptStates.map(s => 
              s === oldName ? newLabel : s
            );
          }

          scope.$apply();
          if (scope.onStateRenamed) {
            scope.onStateRenamed({ oldName: oldLabel, newName: newLabel });
          }
        }
      }

      // Watch for changes and reinitialize if needed
      scope.$watch('automata', function(newVal) {
        if (newVal && !network) {
          // Ensure arrays exist
          if (!scope.automata.states) scope.automata.states = [];
          if (!scope.automata.transitions) scope.automata.transitions = [];
          if (!scope.automata.acceptStates) scope.automata.acceptStates = [];
          if (!scope.automata.alphabet) scope.automata.alphabet = [];
          
          // Initialize the graph immediately
          initializeGraph();
        }
      }, true);

      // Cleanup
      scope.$on('$destroy', function() {
        if (network) {
          network.destroy();
        }
      });
    }
  };
});
