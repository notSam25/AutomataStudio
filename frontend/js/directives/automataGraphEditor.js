//directive for editing automata graph with vis
angular
  .module("automataApp")
  .directive("automataGraphEditor", function ($document, $timeout) {
    return {
      restrict: "A",
      scope: {
        automata: "=",
        onStateAdded: "&",
        onStateRemoved: "&",
        onTransitionAdded: "&",
        onTransitionRemoved: "&",
        onStateRenamed: "&",
        editorMode: "=",
      },
      link: function (scope, elem) {
        elem.addClass("graph-editor-container");

        let network = null;
        let nodes = null;
        let edges = null;
        let nodeCounter = 0;

        //redraw network on window resize
        function onWindowResize() {
          if (network) {
            network.redraw();
          }
        }

        //observe container resize to refit network
        const resizeObserver = new ResizeObserver(function () {
          if (network) {
            $timeout(function () {
              network.redraw();
              network.fit({ animation: false });
            }, 100);
          }
        });

        resizeObserver.observe(elem[0]);

        //disconnect observer and destroy network on cleanup
        scope.$on("$destroy", function () {
          resizeObserver.disconnect();
          if (network) {
            network.destroy();
          }
        });

        //build vis network from automata model
        function initializeGraph() {
          //clear existing content
          elem.empty();
          nodes = new vis.DataSet();
          edges = new vis.DataSet();
          nodeCounter = 0;

          // Add existing states as nodes
          if (
            scope.automata &&
            scope.automata.states &&
            scope.automata.states.length > 0
          ) {
            //add each state as a node
            scope.automata.states.forEach((state, index) => {
              const stateId = state.id || state.name;
              const isAccept =
                scope.automata.acceptStates &&
                scope.automata.acceptStates.includes(stateId);
              const isInitial = scope.automata.initialState === stateId;

              // theme colors (light Desmos-like)
              let color = "#1fb6ff"; // default node
              let font = { size: 14, color: "#ffffff" };

              if (isInitial) {
                color = "#7c3aed"; // initial state accent
                font.color = "#ffffff";
              }
              if (isAccept) {
                color = "#1fb6ff"; // accept uses accent with thicker border
              }

              //add node to dataset
              nodes.add({
                id: stateId,
                label: state.name || state.id,
                color: {
                  background: color,
                  border: "#cbd5e1",
                  highlight: { background: "#ffd27a", border: "#ffb02e" },
                },
                font: font,
                shape: "circle",
                mass: 2,
                title: stateId,
              });

              // Track nodeCounter for auto-increment
              if (stateId.startsWith("q")) {
                const num = parseInt(stateId.substring(1));
                if (!isNaN(num)) {
                  nodeCounter = Math.max(nodeCounter, num + 1);
                }
              }
            });
          }

          //add each transition as an edge
          if (scope.automata && scope.automata.transitions) {
            scope.automata.transitions.forEach((transition) => {
              edges.add({
                from: transition.from,
                to: transition.to,
                label: transition.symbol,
                arrows: "to",
                smooth: { type: "cubicBezier" },
                title: `${transition.from} → ${transition.to}: ${transition.symbol}`,
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
                springConstant: 0.04,
              },
            },
            interaction: {
              navigationButtons: true,
              keyboard: true,
              zoomView: true,
              dragView: true,
              hover: true,
            },
            nodes: {
              borderWidth: 2,
              borderWidthSelected: 3,
              widthConstraint: { maximum: 200 },
            },
            edges: {
              color: { color: "#94a3b8", highlight: "#1fb6ff" },
              width: 2,
              font: { size: 12, color: "#1f2937", strokeWidth: 0, face: "Arial" },
              smooth: { type: "cubicBezier", forceDirection: "horizontal" },
            },
          };

          //create vis network with configured options
          network = new vis.Network(
            elem[0],
            { nodes: nodes, edges: edges },
            options,
          );

          // Explicitly set canvas size to match container
          const canvas = elem[0].querySelector("canvas");
          if (canvas) {
            const rect = elem[0].getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
          }

          //attach interaction handlers
          setupEventHandlers();

          // Stabilize and fit view
          $timeout(function () {
            if (network) {
              network.fit({ animation: true });
              // Re-fit after a longer delay to ensure layout stabilizes
              $timeout(function () {
                if (network) {
                  network.fit({ animation: false });
                }
              }, 300);
            }
          }, 500);
        }

        //attach user interaction handlers
        function setupEventHandlers() {
          //click to add new state
          network.on("click", function (params) {
            if (params.nodes.length === 0 && params.edges.length === 0) {
              const canvasPos = params.pointer.canvas;
              addNewState(canvasPos);
            }
          });

          //right click to delete state or transition
          network.on("oncontext", function (params) {
            params.event.preventDefault();
            if (params.nodes.length > 0) {
              const nodeId = params.nodes[0];
              const label = nodes.get(nodeId).label;
              if (confirm(`Delete state "${label}"?`)) {
                removeState(nodeId);
              }
            } else if (params.edges.length > 0) {
              if (confirm("Delete this transition?")) {
                removeTransition(params.edges[0]);
              }
            }
          });

          //double click to rename state
          network.on("doubleClick", function (params) {
            if (params.nodes.length > 0) {
              const nodeId = params.nodes[0];
              const nodeData = nodes.get(nodeId);
              renameState(nodeId, nodeData.label);
            }
          });

          //drag end to create transition if dropped on node
          network.on("dragEnd", function (params) {
            if (params.nodes.length > 0) {
              const fromNode = params.nodes[0];

              //find if dropped on another node
              const toNode = network.getNodeAt(params.pointer.DOM);

              if (toNode && fromNode !== toNode) {
                showTransitionDialog(fromNode, toNode);
              }
            }
          });
        }

        //add a new state node at the given position
        function addNewState(position) {
          if (!scope.automata) {
            scope.automata = {
              states: [],
              transitions: [],
              acceptStates: [],
              alphabet: [],
            };
          }
          if (!scope.automata.states) scope.automata.states = [];

          const stateId = "q" + nodeCounter++;
          const newState = { id: stateId, name: stateId };
          scope.automata.states.push(newState);

          //add node to vis dataset
          nodes.add({
            id: stateId,
            label: stateId,
            color: {
              background: "#3498db",
              border: "#2c3e50",
              highlight: { background: "#e74c3c", border: "#c0392b" },
            },
            font: { size: 14, color: "#fff" },
            shape: "circle",
            mass: 2,
            x: position.x,
            y: position.y,
            title: stateId,
          });

          scope.$apply();
          if (scope.onStateAdded) {
            scope.onStateAdded({ state: newState });
          }
        }

        //remove a state and its transitions from model and graph
        function removeState(stateId) {
          if (!confirm(`Delete state "${stateId}"?`)) return;

          //remove from automata model
          scope.automata.states = scope.automata.states.filter(
            (s) => (s.id || s.name) !== stateId,
          );

          //remove related transitions from model
          scope.automata.transitions = scope.automata.transitions.filter(
            (t) => t.from !== stateId && t.to !== stateId,
          );

          if (scope.automata.initialState === stateId) {
            scope.automata.initialState = null;
          }

          scope.automata.acceptStates = scope.automata.acceptStates.filter(
            (s) => s !== stateId,
          );

          //remove node from graph
          nodes.remove(stateId);

          //remove edges connected to this node
          const edgesToRemove = edges.get({
            filter: (item) => item.from === stateId || item.to === stateId,
          });
          edgesToRemove.forEach((edge) => edges.remove(edge.id));

          scope.$apply();
          if (scope.onStateRemoved) {
            scope.onStateRemoved({ stateId: stateId });
          }
        }

        //prompt user for transition symbol and add transition
        function showTransitionDialog(fromStateId, toStateId) {
          const alphabet =
            (scope.automata.alphabet || []).length > 0
              ? scope.automata.alphabet.join(", ")
              : "No alphabet defined";

          const symbol = prompt(
            `Enter transition symbol:\n\nAvailable alphabet: ${alphabet}`,
            "",
          );

          if (symbol !== null && symbol.trim() !== "") {
            addTransition(fromStateId, toStateId, symbol.trim());
          }
        }

        //add transition to automata model and graph
        function addTransition(fromStateId, toStateId, symbol) {
          if (!scope.automata.transitions) scope.automata.transitions = [];
          if (!scope.automata.alphabet) scope.automata.alphabet = [];

          //check if transition already exists
          const existing = scope.automata.transitions.find(
            (t) =>
              t.from === fromStateId &&
              t.to === toStateId &&
              t.symbol === symbol,
          );

          if (existing) {
            alert("Transition already exists");
            return;
          }

          const newTransition = {
            from: fromStateId,
            to: toStateId,
            symbol: symbol,
          };

          scope.automata.transitions.push(newTransition);

          // Add symbol to alphabet if not present
          if (!scope.automata.alphabet.includes(symbol)) {
            scope.automata.alphabet.push(symbol);
          }

          //add edge to vis graph
          edges.add({
            from: fromStateId,
            to: toStateId,
            label: symbol,
            arrows: "to",
            smooth: { type: "cubicBezier" },
            title: `${fromStateId} → ${toStateId}: ${symbol}`,
          });

          scope.$apply();
          if (scope.onTransitionAdded) {
            scope.onTransitionAdded({ transition: newTransition });
          }
        }

        //remove a transition from model and graph
        function removeTransition(edgeId) {
          if (!confirm("Delete this transition?")) return;

          const edge = edges.get(edgeId);
          if (edge) {
            //remove from automata model
            scope.automata.transitions = scope.automata.transitions.filter(
              (t) =>
                !(
                  t.from === edge.from &&
                  t.to === edge.to &&
                  t.symbol === edge.label
                ),
            );
          }

          edges.remove(edgeId);

          scope.$apply();
          if (scope.onTransitionRemoved) {
            scope.onTransitionRemoved({ edgeId: edgeId });
          }
        }

        //rename state and update all references in model and graph
        function renameState(stateId, oldLabel) {
          const newLabel = prompt("Enter new state name:", oldLabel);

          if (newLabel && newLabel.trim() && newLabel !== oldLabel) {
            //update node label in vis
            const nodeData = nodes.get(stateId);
            nodeData.label = newLabel;
            nodes.update(nodeData);

            //update model entry
            const state = scope.automata.states.find(
              (s) => (s.id || s.name) === stateId,
            );
            if (state) {
              const oldName = state.name;
              state.name = newLabel;

              //update all transition references
              scope.automata.transitions.forEach((t) => {
                if (t.from === oldName) t.from = newLabel;
                if (t.to === oldName) t.to = newLabel;
              });

              if (scope.automata.initialState === oldName) {
                scope.automata.initialState = newName;
              }

              scope.automata.acceptStates = scope.automata.acceptStates.map(
                (s) => (s === oldName ? newLabel : s),
              );
            }

            scope.$apply();
            if (scope.onStateRenamed) {
              scope.onStateRenamed({ oldName: oldLabel, newName: newLabel });
            }
          }
        }

        //watch automata model and initialize graph when present
        scope.$watch(
          "automata",
          function (newVal) {
            if (newVal && !network) {
              //ensure arrays exist in model
              if (!scope.automata.states) scope.automata.states = [];
              if (!scope.automata.transitions) scope.automata.transitions = [];
              if (!scope.automata.acceptStates)
                scope.automata.acceptStates = [];
              if (!scope.automata.alphabet) scope.automata.alphabet = [];

              //initialize network
              initializeGraph();
            }
          },
          true,
        );

        //cleanup network on directive destroy
        scope.$on("$destroy", function () {
          if (network) {
            network.destroy();
          }
        });
      },
    };
  });
