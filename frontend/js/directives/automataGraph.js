angular.module("automataApp").directive("automataGraph", function () {
  return {
    restrict: "A",
    scope: { automata: "=", activeStep: "=" },
    link: function (scope, elem) {
      elem.addClass("graph-container");
      let cy = null;

      function renderGraph(automata) {
        if (!automata || !automata.states) return;

        //directive for rendering automata graph
        angular.module("automataApp").directive("automataGraph", function () {
        elem.empty();

        const nodes = automata.states.map(function (s) {
          const stateName = typeof s === "string" ? s : s.name || s.id;
          return {
            data: {
              //renders automata using cytoscape
              function renderGraph(automata) {

                if (!automata || !automata.states) return;

                //clear container
                elem.empty();

                //map states to cytoscape nodes
                const nodes = automata.states.map(function (s) {
                  const stateName = typeof s === "string" ? s : s.name || s.id;
                  return {
                    data: {
                      id: stateName,
                      label: stateName,
                      accept: (automata.acceptStates || []).includes(stateName)
                        ? true
                        : false,
                      initial: automata.initialState === stateName ? true : false,
                    },
                  };
                });

                //map transitions to cytoscape edges
                const edges = (automata.transitions || []).map(function (t, idx) {
                  return {
                    data: {
                      id: "e" + idx,
                      source: t.from,
                      target: t.to,
                      label: t.symbol,
                    },
                  };
                });

                //initialize cytoscape instance with styles
                cy = cytoscape({
                  container: elem[0],
                  elements: {
                    nodes: nodes,
                    edges: edges,
                  },
                  style: [
                    {
                      selector: "node",
                      style: {
                        label: "data(label)",
                        "text-valign": "center",
                        "text-halign": "center",
                        "background-color": "#1fb6ff",
                        color: "#ffffff",
                        width: "50",
                        height: "50",
                        "font-size": "12px",
                        "border-width": 2,
                        "border-color": "#cbd5e1",
                      },
                    },
                    //accept states style
                    {
                      selector: "node[accept]",
                      style: {
                        "border-width": 8,
                        "border-color": "#16a34a",
                        "background-color": "#1fb6ff",
                        padding: 4,
                      },
                    },
                    //initial state style
                    {
                      selector: "node[initial]",
                      style: {
                        "background-color": "#7c3aed",
                        "border-color": "#5b21b6",
                        "border-width": 4,
                      },
                    },
                    //active node style used during animation
                    {
                      selector: "node.active",
                      style: {
                        "background-color": "#ffd27a",
                        width: 60,
                        height: 60,
                      },
                    },
                    {
                      selector: "edge",
                      style: {
                        label: "data(label)",
                        "curve-style": "bezier",
                        "target-arrow-shape": "triangle",
                        "target-arrow-color": "#9aa4b2",
                        "line-color": "#9aa4b2",
                        "font-size": "10px",
                        "text-rotation": "autorotate",
                        "text-margin-y": -6,
                      },
                    },
                  ],
                  layout: { name: "cose" },
                });

                //run layout for readability
                const layout = cy.layout({
                  name: "cose",
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
                  numIter: 1000,
                });

                layout.run();

                //fit and center graph after layout
                layout.on("layoutstop", function () {
                  try {
                    cy.resize();
                    cy.fit(50);
                    cy.center();
                  } catch (e) {
                    //ignore errors
                  }
                });

                //resize handler to keep graph centered
                const onResize = function () {
                  try {
                    cy.resize();
                    cy.fit(50);
                    cy.center();
                  } catch (e) {}
                };
                window.addEventListener("resize", onResize);

                //cleanup resources on directive destroy
                scope.$on("$destroy", function () {
                  window.removeEventListener("resize", onResize);
                  try {
                    cy.destroy();
                  } catch (e) {}
                });
              }

              //watch active step to highlight node
              scope.$watch("activeStep", function (newVal) {
                if (cy && newVal) {
                  //remove active class from all nodes
                  cy.nodes().removeClass("active");
                  //add active class to current step state
                  const stateNode = cy.$("#" + newVal.state);
                  if (stateNode.length) {
                    stateNode.addClass("active");
                  }
                }
              });

              //watch automata model to re-render graph
              scope.$watch(
                "automata",
                function (newVal) {
                  if (newVal) {
                    renderGraph(newVal);
                  }
                },
                true,
              );
