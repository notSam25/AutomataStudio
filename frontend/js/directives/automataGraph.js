angular.module("automataApp").directive("automataGraph", function () {
  return {
    restrict: "A",
    scope: { automata: "=", activeStep: "=" },
    link: function (scope, elem) {
      elem.addClass("graph-container");
      let cy = null;

      function renderGraph(automata) {
        if (!automata || !automata.states) return;

        // clear container
        elem.empty();

        const nodes = automata.states.map(function (s) {
          const stateName = typeof s === "string" ? s : s.name || s.id;
          const data = {
            id: stateName,
            label: stateName,
          };

          // Only set the data attributes when true so Cytoscape selectors
          // like node[initial] and node[accept] match only the intended nodes.
          if ((automata.acceptStates || []).includes(stateName)) {
            data.accept = true;
          }
          if (automata.initialState === stateName) {
            data.initial = true;
          }

          return { data };
        });

        const edges = (automata.transitions || []).map(function (t, idx) {
          const label = Array.isArray(t.symbol) ? t.symbol.join(",") : t.symbol;
          return {
            data: {
              id: "e" + idx,
              source: t.from,
              target: t.to,
              label: label,
            },
          };
        });

        // initialize cytoscape
        cy = cytoscape({
          container: elem[0],
          elements: { nodes: nodes, edges: edges },
          style: [
            {
              selector: "node",
              style: {
                label: "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "background-color": "#1fb6ff",
                color: "#ffffff",
                width: 50,
                height: 50,
                "font-size": 12,
                "border-width": 2,
                "border-color": "#cbd5e1",
              },
            },
            {
              selector: "node[accept]",
              style: {
                "border-width": 8,
                "border-color": "#16a34a",
                padding: 4,
              },
            },
            {
              selector: "node[initial][accept]",
              style: {
                "background-color": "#7c3aed",
                "border-color": "#16a34a",
                "border-width": 8,
              },
            },
            {
              selector: "node[initial]",
              style: {
                "background-color": "#7c3aed",
                "border-color": "#5b21b6",
                "border-width": 4,
              },
            },
            {
              selector: "node.active",
              style: { "background-color": "#ffd27a", width: 60, height: 60 },
            },
            {
              selector: "edge",
              style: {
                label: "data(label)",
                "curve-style": "bezier",
                "target-arrow-shape": "triangle",
                "target-arrow-color": "#9aa4b2",
                "line-color": "#9aa4b2",
                "font-size": 10,
                "text-rotation": "autorotate",
                "text-margin-y": -6,
              },
            },
          ],
          layout: { name: "cose" },
        });

        const layout = cy.layout({ name: "cose", fit: true });
        layout.run();

        layout.on("layoutstop", function () {
          try {
            cy.resize();
            cy.fit(50);
            cy.center();
          } catch (e) {}
        });

        const onResize = function () {
          try {
            cy.resize();
            cy.fit(50);
          } catch (e) {}
        };

        window.addEventListener("resize", onResize);

        scope.$on("$destroy", function () {
          window.removeEventListener("resize", onResize);
          try {
            cy.destroy();
          } catch (e) {}
        });
      }

      // highlight active step
      scope.$watch("activeStep", function (newVal) {
        if (cy) {
          try {
            cy.nodes().removeClass("active");
            if (newVal && newVal.state) {
              // activeStep.state can be a single state (e.g. "q0") or a
              // comma-separated list for NFAs (e.g. "q0,q1"). Build a
              // selector that targets the appropriate node ids.
              const states = String(newVal.state).split(",").map((s) => s.trim()).filter(Boolean);
              if (states.length) {
                const selector = states.map((s) => "#" + s).join(",");
                const nodes = cy.$(selector);
                if (nodes.length) nodes.addClass("active");
              }
            }
          } catch (e) {}
        }
      });

      // re-render when automata changes
      scope.$watch(
        "automata",
        function (newVal) {
          if (newVal) renderGraph(newVal);
        },
        true,
      );
    },
  };
});
