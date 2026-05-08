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
          return {
            data: {
              id: stateName,
              label: stateName,
              accept: (automata.acceptStates || []).includes(stateName),
              initial: automata.initialState === stateName,
            },
          };
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
              const node = cy.$("#" + newVal.state);
              if (node.length) node.addClass("active");
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
