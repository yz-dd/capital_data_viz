$('document').ready(() => {
    // set the dimensions and margins of the graph
    const margin = { top: 50, right: 50, bottom: 100, left: 50 },
        width = 800 - margin.left - margin.right,
        height = 2000 - margin.top - margin.bottom;

    // append the ses_svg object
    const ses_svg = d3.select('#expenditure_ses_bubble')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

    const colorScale = ['#668ac7', '#eac466', '#e95151'];

    const render = data => {

        let filtered_data = data.filter(d => {
            if (d.MINCODE != ' ' && !isNaN(d.SES_INDEX))
                return d;
        });

        //adds total expenditures for each school by matching mincode
        let exp_sum_data = [];
        filtered_data.forEach(record => {
            let existing = exp_sum_data.filter((d, i) => {
                return d.MINCODE == record.MINCODE
            });
            if (existing.length) {
                let existingIndex = exp_sum_data.indexOf(existing[0])
                exp_sum_data[existingIndex].TOTAL_ACTUAL = exp_sum_data[existingIndex].TOTAL_ACTUAL + record.TOTAL_ACTUAL;
            } else {
                exp_sum_data.push(record);
            }
        });

        // gets avg 4yr expenditure and exp per student
        exp_sum_data.forEach(d => {
            d.AVG_TOTAL_ACTUAL_4YR = d.TOTAL_ACTUAL / 4;
            d.EXPEN_PER_STU = Math.round((d.TOTAL_ACTUAL / 4) / d.AVG_SIZE);
        });

        console.log(exp_sum_data);
        const xAxisLabel = 'Capital Expenditures Per Student';
        const yAxisLabel = 'SES Index';

        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(exp_sum_data, d => { return d.SES_INDEX; }))
            .range([height, 0]);

        // Add a scale for bubble size
        const rScale = d3.scaleLinear()
            .domain(d3.extent(exp_sum_data, d => { return d.EXPEN_PER_STU; }))
            .range([5, 60]);

            console.log(rScale.domain());
        const xAxis = d3.axisBottom(xScale)
            .tickSize(-height);

        const yAxis = d3.axisLeft(yScale)
            .tickSize(-width);

        const xAxisG = ses_svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('class', 'xAxisG')
            .call(xAxis);

        const yAxisG = ses_svg.append('g')
            .attr('class', 'yAxisG')
            .call(yAxis);

        //grids
        xAxisG.select('.domain').remove();
        xAxisG.selectAll('.tick text').remove();
        $('.xAxisG g:nth-child(6)').attr('id', 'center_line')
        yAxisG.select('.domain').remove();

        xAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('y', 60)
            .attr('x', width / 2)
            .attr('fill', 'black')
            .text(xAxisLabel);

        yAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('y', -40)
            .attr('x', -height / 2)
            .attr('fill', 'black')
            .attr('transform', `rotate(-90)`)
            .attr('text-anchor', 'middle')
            .text(yAxisLabel);


        //legends
        let legend_data = [5, 25, 50];
        let ses = ['Rich', 'Average', 'Poor']
        const legend = ses_svg.append('g')
            .attr('class', 'bubble_legend');

        legend.selectAll('circle')
            .data(legend_data)
            .enter()
            .append('circle')
            .attr("r", 10)
            .attr("cx", (d, i) => { return i * 100 + -40 })
            .attr("cy", -10)
            .attr("fill", (d, i) => { return colorScale[i] });
        legend.append('text')
            .attr("x", -25)
            .attr("y", -10)
            .text(ses[0])
            .attr("alignment-baseline", "middle");
        legend.append('text')
            .attr("x", 75)
            .attr("y", -10)
            .text(ses[1])
            .attr("alignment-baseline", "middle");
        legend.append('text')
            .attr("x", 175)
            .attr("y", -10)
            .text(ses[2])
            .attr("alignment-baseline", "middle");

        // Size legend
        let sizeScale = d3.scaleLinear()
            .domain(legend_data)
            .range([5,20]);

        let sizeLegend = d3.legendSize()
            .scale(sizeScale)
            .shape("circle")
            .shapePadding(40)
            .cells(4)
            .labels(['$1k','$10k','$20k', '$30k/student'])
            .labelOffset(20)
            .orient('horizontal');

        legend.append("g")
            .attr("transform", "translate(450, -30)")
            .call(sizeLegend);

        const bubble_group = ses_svg.append('g')
            .attr('class', 'bubble_svg');

        const simulation = d3.forceSimulation(exp_sum_data)
            .force('charge', d3.forceManyBody().strength(1))
            .force('x', d3.forceX().x(d => {
                return xScale(50);
            }))
            .force('y', d3.forceY().y(d => {
                return yScale(d.SES_INDEX);
            }
            ))
            .force('collision', d3.forceCollide().radius(d => { return rScale(d.EXPEN_PER_STU); }))
            .on('tick', ticked);

        function ticked() {
            let bubble = bubble_group.selectAll('circle')
                .data(exp_sum_data);

            bubble.enter()
                .append('circle')
                .attr('data-ses-index', d => { return d.SES_INDEX; })
                .attr('data-mincode', d => { return d.MINCODE; })
                .attr('data-school-name', d => { return d.SCHOOL_NAME; })
                .attr('data-sd', d => { return d.SD_NUM; })
                .attr('data-exp-total', d => { return d.TOTAL_ACTUAL; })
                .attr('data-exp-prov', d => { return d.PROV_TOTAL; })
                .attr('data-expen-per-stu', d => { return d.EXPEN_PER_STU; })
                .attr('r', d => { return rScale(d.EXPEN_PER_STU); })
                .style('fill', d => {
                    if (d.SES_INDEX < -1) {
                        return colorScale[2];
                    } else if (d.SES_INDEX > 1) {
                        return colorScale[0];
                    } else {
                        return colorScale[1];
                    }
                })
                .style('stroke', d => {
                    if (d.EXPEN_PER_STU > 8000)
                      return '#003366';  
                })
                .style('stroke-width', d => {
                    if (d.EXPEN_PER_STU > 8000)
                      return '3';  
                })
                .merge(bubble)
                .attr('cx', d => {
                    return d.x;
                })
                .attr('cy', d => {

                    return d.y;
                })
                .attr('class', 'bubble')

            bubble.exit().remove();
        }

    };


    //read data and render 
    //Read the data
    d3.queue()
        .defer(d3.csv, './assets/raw_data/capital_data_with_mincode.csv')
        .defer(d3.csv, './assets/raw_data/school_ses.csv')
        .defer(d3.csv, './assets/raw_data/school_avg_size_4yr.csv')
        .await((error, cap_data, ses_data, size_data) => {
            if (error) {
                console.error('Something went wrong: ' + error);
            }

            let combined = cap_data.map((cap_d, i) => {
                ses_data.forEach((ses_d, i) => {
                    if (cap_d.MINCODE == ses_d.MINCODE && cap_d.YEAR_COMPLETED == ses_d.SCHOOL_YEAR) {
                        console.log('match!');
                        cap_d.SCHOOL_NAME = ses_d.SCHOOL_NAME;
                        cap_d.MINCODE = +cap_d.MINCODE;
                        cap_d.SCHOOL_LATITUDE = +cap_d.SCHOOL_LATITUDE;
                        cap_d.SCHOOL_LONGITUDE = +cap_d.SCHOOL_LONGITUDE;
                        cap_d.PROV_TOTAL = +cap_d.PROV_TOTAL;
                        cap_d.SD_ACTUAL = +cap_d.SD_ACTUAL;
                        cap_d._3RD_PARTY_ACTUAL = +cap_d._3RD_PARTY_ACTUAL;
                        cap_d.TOTAL_ACTUAL = +cap_d.TOTAL_ACTUAL;
                        cap_d.SES_INDEX = +ses_d.SES_INDEX;
                    }
                });
                return cap_d;
            });

            let combined_data = combined.map((c_d, i) => {
                size_data.forEach((size_d, i) => {
                    if (c_d.MINCODE == size_d.MINCODE)
                        c_d.AVG_SIZE = size_d.AVG_SIZE_4YR;
                });
                return c_d;
            });

            console.log(combined_data);
            render(combined_data);
        });


});