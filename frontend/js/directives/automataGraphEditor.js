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

        const toolbar = angular.element('<div class="graph-editor-toolbar"></div>');
        const resetButton = angular.element(
          '<button type="button" class="btn btn-secondary btn-sm graph-editor-reset">Reset view</button>',
        );
        const graphHost = angular.element('<div class="graph-editor-canvas"></div>');

        toolbar.append(resetButton);
        elem.append(toolbar);
        elem.append(graphHost);

        let network = null;
        let nodes = null;
        let edges = null;
        let nodeCounter = 0;
        let edgeCounter = 0;
        let selectedNodeId = null;
        let graphSignature = "";
        let transitionSignature = "";
        let stateSignature = "";
        let initialView = null;

        resetButton.on("click", function () {
          scope.$applyAsync(function () {
            resetView();
          });
        });

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
          graphHost.empty();
          selectedNodeId = null;
          nodes = new vis.DataSet();
          edges = new vis.DataSet();
          nodeCounter = 0;
          edgeCounter = 0;

          syncNodesFromModel();

          syncEdgesFromModel();

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
            graphHost[0],
            { nodes: nodes, edges: edges },
            options,
          );

          //freeze layout after stabilization so manual dragging stays in place
          network.once("stabilizationIterationsDone", function () {
            network.setOptions({ physics: false });
          });

          // Explicitly set canvas size to match container
          const canvas = graphHost[0].querySelector("canvas");
          if (canvas) {
            const rect = graphHost[0].getBoundingClientRect();
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
                  if (!initialView) {
                    initialView = {
                      position: network.getViewPosition(),
                      scale: network.getScale(),
                    };
                  }
                }
              }, 300);
            }
          }, 500);
        }

        function resetView() {
          if (!network) {
            return;
          }

          if (initialView && initialView.position && initialView.scale) {
            network.moveTo({
              position: initialView.position,
              scale: initialView.scale,
              animation: {
                duration: 350,
                easingFunction: "easeInOutQuad",
              },
            });
            return;
          }

          network.fit({ animation: true });
        }

        function getGraphSignature(model) {
          const accepts = (model.acceptStates || []).join("|");
          return [accepts, model.initialState || ""].join("#");
        }

        function getStateSignature(model) {
          return (model.states || [])
            .map((state) => state.id || state.name || state)
            .join("|");
        }

        function getTransitionSignature(model) {
          return (model.transitions || [])
            .map((transition) => {
              return [
                transition.from,
                transition.to,
                transition.symbol,
                transition.writeSymbol || "",
                transition.move || "",
                transition.stackSymbol || "",
                transition.pushSymbol || "",
              ].join("~");
            })
            .join("|");
        }

        function syncEdgesFromModel() {
          if (!edges) {
            return;
          }

          const existingEdges = edges.getIds();
          if (existingEdges.length > 0) {
            edges.remove(existingEdges);
          }

          edgeCounter = 0;

          if (scope.automata && scope.automata.transitions) {
            scope.automata.transitions.forEach((transition) => {
              const edgeId = "edge-" + edgeCounter++;
              edges.add({
                id: edgeId,
                from: transition.from,
                to: transition.to,
                symbol: transition.symbol,
                writeSymbol: transition.writeSymbol || null,
                move: transition.move || null,
                stackSymbol: transition.stackSymbol || null,
                pushSymbol: transition.pushSymbol || null,
                label: buildTransitionLabel(transition),
                arrows: "to",
                smooth: { type: "cubicBezier" },
                title: `${transition.from} → ${transition.to}: ${buildTransitionLabel(transition)}`,
              });
            });
          }
        }

        function syncNodesFromModel() {
          if (!nodes) {
            return;
          }

          const existingNodes = nodes.getIds();
          const nextStateIds = (scope.automata.states || []).map(
            (state) => state.id || state.name,
          );

          existingNodes.forEach((nodeId) => {
            if (!nextStateIds.includes(nodeId)) {
              nodes.remove(nodeId);
            }
          });

          (scope.automata.states || []).forEach((state) => {
            const stateId = state.id || state.name;
            const isAccept =
              scope.automata.acceptStates &&
              scope.automata.acceptStates.includes(stateId);
            const isInitial = scope.automata.initialState === stateId;

            let color = "#1fb6ff";
            let font = { size: 14, color: "#ffffff" };

            if (isInitial) {
              color = "#7c3aed";
              font.color = "#ffffff";
            }
            if (isAccept) {
              color = "#1fb6ff";
            }

            const existingNode = nodes.get(stateId);
            const nextNode = {
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
            };

            if (existingNode) {
              nodes.update(nextNode);
            } else {
              nodes.add(nextNode);
            }

            if (stateId && stateId.startsWith("q")) {
              const num = parseInt(stateId.substring(1));
              if (!isNaN(num)) {
                nodeCounter = Math.max(nodeCounter, num + 1);
              }
            }
          });
        }

        //attach user interaction handlers
        function setupEventHandlers() {
          //click canvas to add states or select nodes for connections
          network.on("click", function (params) {
            if (params.nodes.length > 0) {
              const clickedNodeId = params.nodes[0];

              if (selectedNodeId && selectedNodeId === clickedNodeId) {
                showTransitionDialog(selectedNodeId, clickedNodeId);
                network.unselectAll();
                selectedNodeId = null;
                return;
              }

              if (selectedNodeId && selectedNodeId !== clickedNodeId) {
                showTransitionDialog(selectedNodeId, clickedNodeId);
                network.unselectAll();
                selectedNodeId = null;
                return;
              }

              selectedNodeId = clickedNodeId;
              network.selectNodes([clickedNodeId]);
              return;
            }

            if (selectedNodeId) {
              selectedNodeId = null;
              network.unselectAll();
              return;
            }

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

          //capture node positions after drag so positions can be persisted
          network.on("dragEnd", function (params) {
            try {
              const movedNodes = params.nodes || [];
              if (movedNodes.length === 0) return;
              movedNodes.forEach((nodeId) => {
                const nodePos = network.getPositions([nodeId])[nodeId];
                // update scope model entry
                const state = scope.automata.states.find((s) => (s.id || s.name) === nodeId);
                if (state) {
                  state.x = nodePos.x;
                  state.y = nodePos.y;
                }
              });
              scope.$applyAsync();
            } catch (e) {}
          });
          if (!scope.automata.states) scope.automata.states = [];

          const stateId = "q" + nodeCounter++;
          const newState = { id: stateId, name: stateId };
          scope.automata.states.push(newState);

          //add node to vis dataset
          nodes.add({
            id: stateId,
            label: stateId,
            color: {
              background: "#1fb6ff",
              border: "#cbd5e1",
              highlight: { background: "#ffd27a", border: "#ffb02e" },
            },
            font: { size: 14, color: "#ffffff" },
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

          if (network) {
            network.destroy();
            network = null;
          }

          initializeGraph();
        }

        //prompt user for transition symbol and add transition
        function showTransitionDialog(fromStateId, toStateId) {
          const type = String(scope.automata.type || "DFA").toUpperCase();

          const symbol = prompt("Enter transition symbol:", "");
          if (symbol === null || symbol.trim() === "") {
            return;
          }

          if (type === "PDA") {
            const stackSymbol = prompt("Enter required stack symbol or leave blank:", "");
            if (stackSymbol === null) {
              return;
            }

            const pushSymbol = prompt("Enter push symbol or leave blank:", "");
            if (pushSymbol === null) {
              return;
            }

            addTransition(fromStateId, toStateId, symbol.trim(), {
              stackSymbol: stackSymbol.trim() || null,
              pushSymbol: pushSymbol.trim() || null,
            });
            return;
          }

          if (type === "TURING") {
            const writeSymbol = prompt("Enter write symbol or leave blank:", symbol.trim());
            if (writeSymbol === null) {
              return;
            }

            const move = prompt("Enter head move (L, R, or S):", "R");
            if (move === null) {
              return;
            }

            addTransition(fromStateId, toStateId, symbol.trim(), {
              writeSymbol: writeSymbol.trim() || symbol.trim(),
              move: move.trim().toUpperCase() || "R",
            });
            return;
          }

          addTransition(fromStateId, toStateId, symbol.trim());
        }

        //add transition to automata model and graph
        function addTransition(fromStateId, toStateId, symbol, metadata) {
          if (!scope.automata.transitions) scope.automata.transitions = [];
          if (!scope.automata.alphabet) scope.automata.alphabet = [];

          if (symbol.indexOf(",") !== -1) {
            alert("Alphabet symbols cannot contain commas. Use separate symbols like 0 and 1 instead of 0,1.");
            return;
          }

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
            writeSymbol: metadata && metadata.writeSymbol ? metadata.writeSymbol : null,
            move: metadata && metadata.move ? metadata.move : null,
            stackSymbol: metadata && metadata.stackSymbol ? metadata.stackSymbol : null,
            pushSymbol: metadata && metadata.pushSymbol ? metadata.pushSymbol : null,
          };

          scope.automata.transitions.push(newTransition);

          // Add symbol to alphabet if not present
          if (!scope.automata.alphabet.includes(symbol)) {
            scope.automata.alphabet.push(symbol);
          }

          const edgeLabel = buildTransitionLabel(newTransition);
          const edgeId = "edge-" + edgeCounter++;

          if (fromStateId === toStateId) {
            // self loops need a visible curve so the arrow does not sit on top of the node
            edges.add({
              id: edgeId,
              from: fromStateId,
              to: toStateId,
              symbol: symbol,
              writeSymbol: newTransition.writeSymbol,
              move: newTransition.move,
              stackSymbol: newTransition.stackSymbol,
              pushSymbol: newTransition.pushSymbol,
              label: edgeLabel,
              arrows: "to",
              selfReferenceSize: 35,
              smooth: { enabled: true, type: "curvedCW", roundness: 0.35 },
              title: `${fromStateId} → ${toStateId}: ${edgeLabel}`,
            });
          } else {
            //add edge to vis graph
            edges.add({
              id: edgeId,
              from: fromStateId,
              to: toStateId,
              symbol: symbol,
              writeSymbol: newTransition.writeSymbol,
              move: newTransition.move,
              stackSymbol: newTransition.stackSymbol,
              pushSymbol: newTransition.pushSymbol,
              label: edgeLabel,
              arrows: "to",
              smooth: { type: "cubicBezier" },
              title: `${fromStateId} → ${toStateId}: ${edgeLabel}`,
            });
          }

          scope.$apply();
          if (scope.onTransitionAdded) {
            scope.onTransitionAdded({ transition: newTransition });
          }
        }

        //build a readable label for the transition
        function buildTransitionLabel(transition) {
          const parts = [transition.symbol];
          if (transition.stackSymbol || transition.pushSymbol) {
            parts.push(`stack:${transition.stackSymbol || "*"}`);
            parts.push(`push:${transition.pushSymbol || "ε"}`);
          }
          if (transition.writeSymbol || transition.move) {
            parts.push(`write:${transition.writeSymbol || transition.symbol}`);
            parts.push(`move:${transition.move || "R"}`);
          }
          return parts.join(" | ");
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
                  t.symbol === edge.symbol &&
                  (t.writeSymbol || null) === (edge.writeSymbol || null) &&
                  (t.move || null) === (edge.move || null) &&
                  (t.stackSymbol || null) === (edge.stackSymbol || null) &&
                  (t.pushSymbol || null) === (edge.pushSymbol || null)
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
            if (newLabel.indexOf(",") !== -1) {
              alert("State names cannot contain commas.");
              return;
            }

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
            if (!newVal) {
              return;
            }

            const nextSignature = getGraphSignature(newVal);
            const nextStateSignature = getStateSignature(newVal);
            if (!network || nextSignature !== graphSignature) {
              graphSignature = nextSignature;
              //ensure arrays exist in model
              if (!scope.automata.states) scope.automata.states = [];
              if (!scope.automata.transitions) scope.automata.transitions = [];
              if (!scope.automata.acceptStates)
                scope.automata.acceptStates = [];
              if (!scope.automata.alphabet) scope.automata.alphabet = [];

              if (network) {
                network.destroy();
                network = null;
              }

              //initialize network
              initializeGraph();
              stateSignature = nextStateSignature;
            }
          },
          true,
        );

        scope.$watch(
          function () {
            return scope.automata ? getStateSignature(scope.automata) : "";
          },
          function (newVal, oldVal) {
            if (!network || !nodes || newVal === oldVal) {
              return;
            }

            stateSignature = newVal;
            syncNodesFromModel();
          },
        );

        scope.$watch(
          function () {
            return scope.automata ? getTransitionSignature(scope.automata) : "";
          },
          function (newVal, oldVal) {
            if (!network || !nodes || newVal === oldVal) {
              return;
            }

            transitionSignature = newVal;
            syncEdgesFromModel();
          },
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
