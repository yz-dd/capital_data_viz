$('document').ready(() => {

    const margin = { top: 50, right: 50, bottom: 80, left: 150 },
        innerWidth = 800 - margin.left - margin.right,
        innerHeight = 1600 - margin.top - margin.bottom;

    const dist_source_svg = d3.select("#district_funding_source")
        .append('svg')
        .attr('width', innerWidth + margin.left + margin.right)
        .attr('height', innerHeight + margin.top + margin.bottom)
        .append('g')
        .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

    const dist_source_render = data => {

        //adds expenditures for each district
        // only for the sum of 'PROV_TOTAL', 'SD_TOTAL', '_3RD_PARTY_TOTAL'

        let dist_total_data = [];

        data.forEach(record => {
            let existing = dist_total_data.filter((d, i) => {
                return d.SD_NUM == record.SD_NUM;
            });
            if (existing.length) {
                let existingIndex = dist_total_data.indexOf(existing[0])
                dist_total_data[existingIndex].PROV_TOTAL = dist_total_data[existingIndex].PROV_TOTAL + record.PROV_TOTAL;
                dist_total_data[existingIndex].SD_ACTUAL = dist_total_data[existingIndex].SD_ACTUAL + record.SD_ACTUAL;
                dist_total_data[existingIndex]._3RD_PARTY_ACTUAL = dist_total_data[existingIndex]._3RD_PARTY_ACTUAL + record._3RD_PARTY_ACTUAL;
            } else {
                dist_total_data.push(record);
            }
        })


        dist_total_data.forEach((d, i) => {
            let total = 0;
            total += d['_3RD_PARTY_ACTUAL'] = d['_3RD_PARTY_ACTUAL'];
            total += d['SD_ACTUAL'] = d['SD_ACTUAL'];
            total += d['PROV_TOTAL'] = d['PROV_TOTAL'];
            d.total = total;
            return d;
        });
        console.log(dist_total_data);

        //scales
        const dist_yScale = d3.scaleBand()
            .range([0, innerHeight])
            .paddingInner(0.5)
            .align(0.1);

        const dist_xScale = d3.scaleLinear()
            .range([0, innerWidth]);

        // set the colors
        const dist_color = d3.scaleOrdinal()
            .range(['#003366', '#FFE27D', '#a9a9a9']);

        let keys = ['PROV_TOTAL', 'SD_ACTUAL', '_3RD_PARTY_ACTUAL'];

        dist_total_data.sort(function (a, b) { return b.PROV_TOTAL - a.PROV_TOTAL; });

        dist_xScale.domain([0, d3.max(data, function (d) { return d.total; })]).nice();
        dist_yScale.domain(data.map(function (d) { return d.SD_NAME }));
        dist_color.domain(keys);

        function formatNumber(num) {
            return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        }

        dist_source_svg.append("g")
            .selectAll("g")
            .data(d3.stack().keys(keys)(dist_total_data))
            .enter().append("g")
            .attr("fill", function (d) { return dist_color(d.key); })
            .selectAll("rect")
            .data(function (d) { return d; })
            .enter().append("rect")
            .attr("y", function (d) { return dist_yScale(d.data.SD_NAME); })
            .attr("x", 0)
            .attr("width", function (d) { return dist_xScale(d[1]) - dist_xScale(d[0]); })
            .attr("height", dist_yScale.bandwidth())
            .on("mouseover", function () { tooltip.style("display", null); })
            .on("mouseout", function () { tooltip.style("display", "none"); })
            .on("mousemove", function (d) {
                var xPosition = d3.mouse(this)[0] - 5;
                var yPosition = d3.mouse(this)[1] - 5;
                tooltip.attr("transform", "translate(" + xPosition + "," + yPosition + ")");
                tooltip.select("text").text(formatNumber(Math.round(d[1] - d[0])));
            });

        const xAxis = d3.axisLeft(dist_yScale);
        const yAxis = d3.axisBottom(dist_xScale).ticks(null, "s");

        const yAxisG = dist_source_svg.append("g")
            .attr("class", "axis")
            .call(xAxis);

        yAxisG.select('.domain').remove();
        yAxisG.selectAll('.tick line').remove();


        const xAxisG = dist_source_svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0," + innerHeight + ")")
            .call(yAxis);

        var legend = dist_source_svg.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("text-anchor", "start")
            .selectAll("g")
            .data(keys.slice())
            .enter().append("g")
            .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

        legend.append("rect")
            .attr("x", innerWidth - 85)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", dist_color);

        legend.append("text")
            .attr("x", innerWidth - 60)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function (d) { return d; });

        // Prep the tooltip bits, initial display is hidden
        var tooltip = dist_source_svg.append("g")
            .attr("class", "dist_tooltip")
            .style("display", "none")
            .style("pointer-events", "none")
            .style("cursor", "pointer");

        tooltip.append("rect")
            .attr("width", 120)
            .attr("height", 40)
            .attr("fill", "white")
            .attr('stroke', '#003366')
            .style("opacity", 0.8);

        tooltip.append("text")
            .attr("x", 20)
            .attr("dy", "1.2em")
            .style("text-anchor", "start")
            .attr("font-size", "18px")
            .attr("font-weight", "bold");
    };


    d3.csv('./assets/raw_data/capital_data_with_mincode.csv', data => {

        let exp_source_data = data.map(d => {
            d.YEAR_COMPLETED = +d.YEAR_COMPLETED;
            d.PROV_TOTAL = +d.PROV_TOTAL;
            d.SD_ACTUAL = +d.SD_ACTUAL;
            d._3RD_PARTY_ACTUAL = +d._3RD_PARTY_ACTUAL;
            return d;
        });

        dist_source_render(exp_source_data);
    });

});