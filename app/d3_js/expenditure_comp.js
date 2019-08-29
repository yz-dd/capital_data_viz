$('document').ready(() => {
    // set the dimensions and margins of the graph
    const margin = { top: 50, right:50, bottom: 80, left: 80 },
        innerWidth = 800 - margin.left - margin.right,
        innerHeight = 600 - margin.top - margin.bottom;

    //append the svg obejct 
    const comp_svg = d3.select('#expenditure_comp')
        .append('svg')
        .attr('width', innerWidth + margin.left + margin.right)
        .attr('height', innerHeight + margin.top + margin.bottom)
        .append('g')
        .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

    const comp_colorScale = ['', '', ''];

    const comp_render = data => {
        
        //adds expenditures for each year
        let year_total_data = [];

        data.forEach(record => {
            let existing = year_total_data.filter((d, i) => {
                return d.YEAR_COMPLETED == record.YEAR_COMPLETED;
            });
            if (existing.length) {
                let existingIndex = year_total_data.indexOf(existing[0])
                year_total_data[existingIndex].PROV_TOTAL = year_total_data[existingIndex].PROV_TOTAL + record.PROV_TOTAL;
                year_total_data[existingIndex].SD_ACTUAL = year_total_data[existingIndex].SD_ACTUAL + record.SD_ACTUAL;
                year_total_data[existingIndex]._3RD_PARTY_ACTUAL = year_total_data[existingIndex]._3RD_PARTY_ACTUAL + record._3RD_PARTY_ACTUAL;
            } else {
                year_total_data.push(record);
            }
        })

        console.log(year_total_data);

        let comp_keys = ['PROV_TOTAL', 'SD_TOTAL', '_3RD_PARTY_TOTAL'];
        //scales
        const comp_colorScale = d3.scaleOrdinal()
                    .domain(comp_keys)
                    .range([]);

        const comp_xScale = d3.scaleTime()
            .domain(d3.extent(data, d => { return d.YEAR_COMPLETED }))
            .range([0, innerWidth]);

        const comp_yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => { return d.TOTAL_ACTUAL }))
            .range([innerHeight, 0]);

        const comp_xAxis = d3.axisBottom(comp_xScale);

        const comp_yAxis = d3.axisLeft(comp_yScale)
            .tickSize(-innerWidth);

        const comp_xAxisG = comp_svg.append('g')
            .attr('transform', 'translate(0,' + innerHeight + ')')
            .attr('class', 'comp_xAxisG')
            .call(comp_xAxis);

        const comp_yAxisG = comp_svg.append('g')
            .attr('class', 'comp_yAxisG')
            .call(comp_yAxis);

        //grids
        comp_xAxisG.select('.domain').remove();
        comp_yAxisG.select('.domain').remove();

        //chart svg
        const area_group = comp_svg.append('g')
            .attr('class', 'area_svg');

        //line generator
        const lineGenerator = d3.line()
                .x(d => comp_xScale(d.YEAR_COMPLETED))
                .y(d => comp_yScale(d.TOTAL_ACTUAL))
                .curve(d3.curveBasis);
        
        area_group.append('path')
             .attr('clas', 'line-path')
             .attr('d', lineGenerator(data));
    };

    d3.csv('./assets/raw_data/capital_data_with_mincode.csv', data => {

        let parseDate = d3.timeParse("%Y");

        let exp_comp_data = data.map(d => {
            d.YEAR_COMPLETED = parseDate(d.YEAR_COMPLETED.substring(0, 4)).getFullYear();
            d.PROV_TOTAL = +d.PROV_TOTAL;
            d.TOTAL_ACTUAL = +d.TOTAL_ACTUAL;
            d.SD_ACTUAL = +d.SD_ACTUAL;
            d._3RD_PARTY_ACTUAL = +d._3RD_PARTY_ACTUAL;
            return d;
        });

        console.log(exp_comp_data);
        comp_render(exp_comp_data);
    });



});