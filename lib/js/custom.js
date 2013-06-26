function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        stop = start;
        start = 0;
    };
    if (typeof step == 'undefined'){
        step = 1;
    };
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    };
    var result = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    };
    return result;
};

var simpleWorkflow = {
    nodes: [
        {name: "Hypothesis", level: 0},
        {name: "Experiment", level: 1},
        {name: "Simulation", level: 1},
        {name: "Data", level: 2},
        {name: "Plots", level: 3},
        {name: "Figures", level: 4},
        {name: "Paper", level: 5}
    ],
    links: [],
    levels: range(6),
    allToAll: range(6),
}

var advancedWorkflow = {
    nodes: [
        {name: "Hypothesis", level: 0},  // 0
        {name: "Experiment", level: 1},  // 1
        {name: "Simulation", level: 1},
        {name: "Data", level: 2},  // 3
        {name: "Data", level: 2},
        {name: "Data", level: 2},
        {name: "Data", level: 2},
        {name: "Analysis", level: 3},  // 7
        {name: "Analysis", level: 3},
        {name: "Analysis", level: 3},
        {name: "Analysis", level: 3},
        {name: "Meta-analysis", level: 4},  // 11
        {name: "Meta-analysis", level: 4},
        {name: "Plot", level: 5},  // 13
        {name: "Plot", level: 5},
        {name: "Plot", level: 5},
        {name: "Figure", level: 6},  // 16
        {name: "Figure", level: 6},
        {name: "Paper", level: 7}  // 18
    ],
    links: [
        {source: 1, target: 3},
        {source: 1, target: 4},
        {source: 2, target: 5},
        {source: 2, target: 6},
        {source: 3, target: 7},
        {source: 4, target: 8},
        {source: 5, target: 9},
        {source: 6, target: 10},
        {source: 7, target: 11},
        {source: 7, target: 13},
        {source: 8, target: 12},
        {source: 9, target: 11},
        {source: 9, target: 12},
        {source: 10, target: 15},
        {source: 11, target: 13},
        {source: 11, target: 14},
        {source: 12, target: 15},
        {source: 13, target: 16},
        {source: 14, target: 16},
        {source: 14, target: 17},
        {source: 15, target: 17},
    ],
    levels: range(8),
    allToAll: [0, 6],
}

var actualWorkflow = {
    nodes: [
        {name: "ACC function", level: 0},
        {name: "Experiment", level: 1},
        {name: "Nengo", level: 1},
        {name: "NEO", level: 2},
        {name: "NumPy, SciPy", level: 3},
        {name: "matplotlib", level: 4},
        {name: "SVGUtil", level: 5},
        {name: "LaTeX", level: 6}
    ],
    links: [],
    levels: range(7),
    allToAll: range(7),
}


function addLevelLinks(workflow) {
    workflow.nodes.forEach(function(node, i) {
        if (workflow.allToAll.indexOf(node.level) !== -1) {
            workflow.nodes.forEach(function(othernode, j) {
                if (othernode.level === node.level + 1) {
                    workflow.links.push({source: i, target: j});
                }
            });
        }
    });
}

function feedforward(containerName, workflow, w, h, fontsize, pad) {
    if (typeof fontsize == 'undefined') { fontsize = 22; }
    if (typeof pad == 'undefined') { pad = 3; }

    var force = d3.layout.force()
        .nodes(workflow.nodes)
        .links(workflow.links)
        .size([w, h]);

    var nodes = force.nodes(), n_nodes = nodes.length;
    var links = force.links();

    var svg = d3.select(containerName).select("svg");
    if (svg.empty()) {
        svg = d3.select(containerName).append("svg:svg")
            .attr("width", w)
            .attr("height", h);
        svg.append("svg:defs")
            .append("svg:marker")
            .attr("id", "arrow_" + containerName.charAt(containerName.length - 1))
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("refY", 0)
            .attr("markerWidth", 6)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .append("svg:path")
            .style("fill", "#000")
            .attr("d", "M0,-5L10,0L0,5Z");
    }


    var nodeGroup = svg.selectAll("g")
        .data(nodes)
      .enter()
        .append("svg:g");

    nodeGroup.append("svg:rect")
        .attr("rx", 5)
        .attr("ry", 5);

    nodeGroup.append("svg:text")
        .attr("text-anchor", "start")
        .style("font-size", fontsize)
        .attr("x", pad)
        .attr("dy", "-.3em")  // Because of baseline...
        .text(function(d) { return d.name; });

    return function() {
        svg.selectAll("text")
            .each(function(d) {
                var bbox = this.getBBox();
                d.rw = bbox.width + pad * 2;
                d.rh = bbox.height + pad * 2; })
            .attr("y", function(d) { return d.rh - pad; });

        svg.selectAll("rect")
            .attr("height", function(d) { return d.rh; } )
            .attr("width", function(d) { return d.rw; } );

        // Collect info about the width
        var level_w = [];
        var space = w;  // Space not taken up by nodes
        workflow.levels.forEach(function(level) {
            var max_w = 0;
            nodes.forEach(function(o) {
                if (o.level === level) {
                    max_w = Math.max(max_w, o.rw);
                }
            });
            level_w.push(max_w);
            space -= max_w;
        });
        var x_space = (space - 2) / (level_w.length - 1);

        // Collect info about the height
        var level_h = [];
        var y_space = 15;
        var middle = h * 0.5;
        workflow.levels.forEach(function(level) {
            var sum_h = 0;
            nodes.forEach(function(o) {
                if (o.level === level) {
                    sum_h += o.rh + y_space;
                }
            });
            sum_h -= y_space;  // no space after last node
            level_h.push(sum_h);
        });

        var x_so_far = 0;
        workflow.levels.forEach(function(level) {
            var levelnodes = [];
            nodes.forEach(function(o) {
                if (o.level === level) {
                    levelnodes.push(o);
                }
            });

            levelnodes.forEach(function(o) {
                o.x = x_so_far;
                // This centers the nodes;
                // if you're the max, level_w[level] - o.rw === 0
                o.x += (level_w[level] - o.rw) * 0.5;

            });
            x_so_far += level_w[level] + x_space;

            var y_so_far = middle - level_h[level] * 0.5;
            levelnodes.forEach(function(o, i) {
                o.y = y_so_far;
                y_so_far += o.rh + y_space;
            });
        });

        svg.selectAll("g").attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        force.start();

        svg.selectAll("line")
            .data(links)
          .enter()
            .append("svg:line")
            .attr("x1", function(d) { return d.source.x + d.source.rw; })
            .attr("y1", function(d) { return d.source.y + d.source.rh * 0.5; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y + d.target.rh * 0.5; })
            .attr("marker-end", "url(#arrow_"
                  + containerName.charAt(containerName.length - 1) + ")");
        return svg;
    };
}

function add_onclick_ellipse(svg) {
    svg.on("click", function() {
        var ellipse = svg.select("ellipse");
        if (ellipse.empty()) {
            svg.append("svg:ellipse")
                .style('opacity', 0)
                .attr("cx", 380)
                .attr("cy", 100)
                .attr("rx", 60)
                .attr("ry", 90)
                .transition()
                .style('opacity', 1);
        } else {
            ellipse.transition()
                .style('opacity', 0)
                .remove();
        }
    });
}

function set_tip_loc(slide) {
    var top = parseFloat(slide.style.top);
    d3.select(slide).select("div.tip")
        .attr("style", "top: " + (-300 + Math.abs(top)) + "px;");
}

addLevelLinks(simpleWorkflow);
addLevelLinks(advancedWorkflow);
// addLevelLinks(actualWorkflow);
var r1 = feedforward("#workflow-1", simpleWorkflow, 960, 140, 34);
var r2 = feedforward("#workflow-2", advancedWorkflow, 960, 200);
// var r3 = feedforward("#workflow-3", actualWorkflow, 960, 140, 34);

Reveal.addEventListener('slidechanged', function( event ) {
    set_tip_loc(event.currentSlide);

    if (!d3.select(event.currentSlide).select("#workflow-1").empty()
        && typeof r1 === 'function') {
        r1 = feedforward("#workflow-1", simpleWorkflow, 960, 140, 34);
        r1();
        r1 = null;
    }
    if (!d3.select(event.currentSlide).select("#workflow-2").empty()
        && typeof r2 === 'function') {
        r2 = feedforward("#workflow-2", advancedWorkflow, 960, 200);
        var svg = r2();
        add_onclick_ellipse(svg);
        r2 = null;
        // d3.select("#workflow-2-copy")
        //     .html(d3.select("#workflow-2").html());
    }
    // if (!d3.select(event.currentSlide).select("#workflow-3").empty()
    //     && typeof r3 === 'function') {
    //     r3 = feedforward("#workflow-3", actualWorkflow, 960, 140, 24);
    //     r3();
    //     r3 = null;
    // }
});
