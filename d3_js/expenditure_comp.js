$('document').ready(() => {
    // set the dimensions and margins of the graph
    const margin = { top: 50, right: 50, bottom: 80, left: 80 },
        innerWidth = 800 - margin.left - margin.right,
        innerHeight = 600 - margin.top - margin.bottom;

    //append the svg obejct 
    const source_svg = d3.select('#funding_source')
        .append('svg')
        .attr('width', innerWidth + margin.left + margin.right)
        .attr('height', innerHeight + margin.top + margin.bottom)
        .append('g')
        .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

    const source_render = data => {

        //     //adds expenditures for each year
        //     // only for the sum of 'PROV_TOTAL', 'SD_TOTAL', '_3RD_PARTY_TOTAL'
        //     let year_total_data = [];

        //     data.forEach(record => {
        //         let existing = year_total_data.filter((d, i) => {
        //             return d.YEAR_COMPLETED == record.YEAR_COMPLETED;
        //         });
        //         if (existing.length) {
        //             let existingIndex = year_total_data.indexOf(existing[0])
        //             year_total_data[existingIndex].PROV_TOTAL = year_total_data[existingIndex].PROV_TOTAL + record.PROV_TOTAL;
        //             year_total_data[existingIndex].SD_ACTUAL = year_total_data[existingIndex].SD_ACTUAL + record.SD_ACTUAL;
        //             year_total_data[existingIndex]._3RD_PARTY_ACTUAL = year_total_data[existingIndex]._3RD_PARTY_ACTUAL + record._3RD_PARTY_ACTUAL;
        //         } else {
        //             year_total_data.push(record);
        //         }
        //     })
        // console.log(year_total_data);

        // let clean_total = [];
        //     year_total_data.forEach(d => {
        //         let record = {
        //             YEAR_COMPLETED: d.YEAR_COMPLETED,
        //             PROV_TOTAL: d.PROV_TOTAL,
        //             SD_ACTUAL: d.SD_ACTUAL,
        //             _3RD_PARTY_ACTUAL: d._3RD_PARTY_ACTUAL
        //         }
        //         clean_total.push(record);
        //     });

        //     function compare(a, b) {
        //         const yr1 = a.YEAR_COMPLETED;
        //         const yr2 = b.YEAR_COMPLETED;

        //         let comparison = 0;
        //         if (yr1 > yr2) {
        //           comparison = 1;
        //         } else if (yr1 < yr2) {
        //           comparison = -1;
        //         }
        //         return comparison;
        //       }
        //     let clean_data = clean_total.sort(compare);

        //     console.log(clean_data)

        let keys = ['PROV_TOTAL', 'SD_ACTUAL', '_3RD_PARTY_ACTUAL'];

        // color palette
        let color = d3.scaleOrdinal()
            .domain(keys)
            .range(['#003366', '#FFE27D', '#a9a9a9']);

        //stack the data
        let stackedData = d3.stack()
            .keys(keys)
            (data)

        console.log(stackedData);

        //scales
        const source_xScale = d3.scaleLinear()
            .domain(d3.extent(data, function (d) { return d.YEAR_COMPLETED; }))
            .range([0, innerWidth]);

        const source_yScale = d3.scaleLinear()
            .domain([0, 350000000])
            .range([innerHeight, 0]);

        //axes
        const xAxis = d3.axisBottom(source_xScale)
            .ticks(5)
            .tickFormat(d3.format("d"));

        const yAxis = d3.axisLeft(source_yScale)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickFormat(d3.formatPrefix(".1", 1e6));

        const xAxisG = source_svg.append("g")
            .attr("transform", "translate(0," + innerHeight + ")")
            .attr('class', 'xAxisG')
            .call(xAxis);

        const yAxisG = source_svg.append("g")
            .attr('class', 'yAxisG')
            .call(yAxis);

        xAxisG.append("text")
            .attr("text-anchor", "end")
            .attr("x", innerWidth - 50)
            .attr("y", 40)
            .attr('fill', 'black')
            .attr('text-anchor', 'start')
            .text("Time (year)");

        let areaChart = source_svg.append('g');

        // Area generator
        let area = d3.area()
            .x(function (d) {  return source_xScale(d.data.YEAR_COMPLETED); })
            .y0(function (d) { return source_yScale(d[0]); })
            .y1(function (d) { return source_yScale(d[1]); })
            .curve(d3.curveCardinal);

        areaChart
            .selectAll("mylayers")
            .data(stackedData)
            .enter()
            .append("path")
            .attr("class", function (d) { return "myArea " + d.key })
            .style("fill", function (d) { return color(d.key); })
            .style('fill-opacity', '0.9')
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", area)

        let highlight = function (d) {
            console.log(d)
            // reduce opacity of all groups
            d3.selectAll(".myArea").style("opacity", .1)
            // expect the one that is hovered
            d3.select("." + d).style("opacity", 1)
        }

        let noHighlight = function (d) {
            d3.selectAll(".myArea").style("opacity", 1)
        }

        let size = 20
        source_svg.selectAll("rect")
            .data(keys)
            .enter()
            .append("rect")
            .attr("x", 550)
            .attr("y", function (d, i) { return 20 + i * (size + 5) })
            .attr("width", size)
            .attr("height", size)
            .style("fill", function (d) { return color(d) })
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight)

        source_svg.selectAll("labels")
            .data(keys)
            .enter()
            .append("text")
            .attr("x", 550 + size * 1.2)
            .attr("y", function (d, i) { return 20 + i * (size + 5) + (size / 2) }) 
            .style("fill", function (d) { return color(d) })
            .text(function (d) { return d })
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .on("mouseover", highlight)
            .on("mouseleave", noHighlight);

    }

    d3.csv('./assets/raw_data/year_total.csv', data => {

        let exp_source_data = data.map(d => {
            d.YEAR_COMPLETED = +d.YEAR_COMPLETED;
            d.PROV_TOTAL = +d.PROV_TOTAL;
            d.SD_ACTUAL = +d.SD_ACTUAL;
            d._3RD_PARTY_ACTUAL = +d._3RD_PARTY_ACTUAL;
            return d;
        });

        console.log(exp_source_data);
        source_render(exp_source_data);
    });
});