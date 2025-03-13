import { hierarchy, tree, linkHorizontal, select } from 'd3';

export function createTreeChart(data) {
    // Configurations and dimensions
    const width = 1500;
    const marginTop = 10;
    const marginRight = 5;
    const marginBottom = 10;
    const marginLeft = 400;

    // Create hierarchy
    const root = hierarchy(data);
    const dx = 30;
    const dy = (width - marginRight - marginLeft) / (1 + root.height);
    const treeLayout = tree().nodeSize([dx, dy]);
    const diagonal = linkHorizontal()
        .x(d => d.y)
        .y(d => d.x);

    // Create SVG container
    const svg = select('#vaccineChart')
        .selectAll('svg')
        .data([null])
        .join('svg')
        .attr("viewBox", [-marginLeft, -marginTop, width, dx])
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto")
        .style("font", "10px sans-serif")
        .style("user-select", "none");


    // Layers for links and nodes
    const gLink = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

    const gNode = svg.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");

    // Initial positions
    root.x0 = dy / 2;
    root.y0 = 0;

    // Assign IDs and store children in _children for toggling
    root.descendants().forEach((d, i) => {
        d.id = i;
        // Save the children in _children so we can collapse/expand on click
        d._children = d.children;
    });

    function update(source) {
        // Duration of the transition
        const duration = 250;

        // Compute the new tree layout
        treeLayout(root);

        // Determine leftmost and rightmost nodes to calculate the dynamic height
        let left = root;
        let right = root;
        root.eachBefore(node => {
            if (node.x < left.x) left = node;
            if (node.x > right.x) right = node;
        });
        const height = right.x - left.x + marginTop + marginBottom;

        // Transition object for smooth animation
        const t = svg.transition()
            .duration(duration)
            .attr("height", height)
            .attr("viewBox", [-marginLeft, left.x - marginTop, width, height]);

        // Nodes & links data
        const nodes = root.descendants();
        const links = root.links();

        // Update nodes
        const node = gNode.selectAll("g")
            .data(nodes, d => d.id);

        // Enter new nodes
        const nodeEnter = node.enter().append("g")
            .attr("transform", () => `translate(${source.y0},${source.x0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", (event, d) => {
                // Toggle children on click
                d.children = d.children ? null : d._children;
                update(d);
            });

        nodeEnter.append("circle")
            .attr("r", 2.5)
            .attr("fill", d => d._children ? "#555" : "#999")
            .attr("stroke-width", 10);

        nodeEnter.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d._children ? -6 : 6)
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name)
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white")
            .attr("paint-order", "stroke");

        // Merge enter and update selection
        node.merge(nodeEnter).transition(t)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);

        // Exit nodes
        node.exit().transition(t).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);

        // Update links
        const link = gLink.selectAll("path")
            .data(links, d => d.target.id);

        // Enter new links
        const linkEnter = link.enter().append("path")
            .attr("d", () => {
                // Starting position = source node's previous position
                const o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            });

        // Merge enter and update selection for links
        link.merge(linkEnter).transition(t)
            .attr("d", diagonal);

        // Exit links
        link.exit().transition(t).remove()
            .attr("d", d => {
                const o = { x: source.x, y: source.y };
                return diagonal({ source: o, target: o });
            });

        // Save old positions for next transition
        root.eachBefore(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Initial render
    update(root);

    // Return the SVG node so it can be inserted elsewhere
    return svg.node();
}

document.addEventListener("DOMContentLoaded", () => {
    // Hierarchical data: "Cure Container" as the root and the individual components as children
    const treeData = {
        name: "Cure Container",
        children: [
            {
                name: "yeast",
                children: [
                    { name: "C. albicans" },
                    { name: "T. glabrata" }
                ]
            },
            {
                name: "culture media",
                children: [
                    { name: "carbon source" }
                ]
            },
            {
                name: "chromatography solution",
                children: [
                    { name: "seperating components" }
                ]
            },
            {
                name: "filtration",
                children: [
                    { name: "liquid filtration" }
                ]
            },
            {
                name: "syringes solution",
                children: [
                    { name: "fill syringes" }
                ]
            },
            {
                name: "packaging material",
                children: [
                    { name: "pack the syringes" }
                ]
            }
        ]
    };

    // Create the tree chart based on the hierarchical data
    const treeChart = createTreeChart(treeData);
});