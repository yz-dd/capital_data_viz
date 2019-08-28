$('document').ready(() => {
    // set the dimensions and margins of the graph
    const margin = { top: 30, right: 50, bottom: 30, left: 50 },
        width = 500 - margin.left - margin.right,
        height = 1600 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    const bubble_group = svg.append('g')
        .attr('class', 'bubble_svg');

    const colorScale = ['orange', 'lightblue'];

    const render = data => {

        let filtered_data = data.filter( d => {
            if(d.MINCODE != ' ' && !isNaN(d.SES_INDEX)) 
                return d;
        });

        const title = 'Capital Funding: Expenditures vs. SES Index';
        const xAxisLabel = 'Capital Expenditures';
        const yAxisLabel = 'SES Index';

        const xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain(d3.extent(filtered_data, d=> {return d.SES_INDEX;}))
            .range([height, 0])
            .nice(12);
    
        console.log(yScale.domain());

        // Add a scale for bubble size
        const rScale = d3.scaleLinear()
            .domain(d3.extent(filtered_data, d => {return d.TOTAL_ACTUAL}))
            .range([5, 60]);

        const xAxis = d3.axisBottom(xScale);

        const yAxis = d3.axisLeft(yScale);

        const xAxisG = svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        const yAxisG = svg.append("g")
            .call(yAxis);

        xAxisG.remove();
        yAxisG.select('.domain').remove();

        xAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('y', 75)
            .attr('x', width / 2)
            .attr('fill', 'black')
            .text(xAxisLabel);

        yAxisG.append('text')
            .attr('class', 'axis-label')
            .attr('y', -93)
            .attr('x', -height / 2)
            .attr('fill', 'black')
            .attr('transform', `rotate(-90)`)
            .attr('text-anchor', 'middle')
            .text(yAxisLabel);

        svg.append('text')
            .attr('class', 'title')
            .attr('y', -10)
            .text(title);

        const simulation = d3.forceSimulation(filtered_data)
            .force('charge', d3.forceManyBody().strength(1))
            .force('x', d3.forceX().x(function (d) {
                return xScale(50);
            }))
            .force('y', d3.forceY().y(d => {
                return yScale(d.SES_INDEX);}
            ))
            .force('collision', d3.forceCollide().radius(d => { return rScale(d.TOTAL_ACTUAL)}))
            .on('tick', ticked);

        function ticked() {
            let bubble = bubble_group.selectAll('circle')
                .data(filtered_data);

            bubble.enter()
                .append('circle')
                .attr('data-ses-index', d => {return d.SES_INDEX;})
                .attr('r', d => {return rScale(d.TOTAL_ACTUAL)})
                .style('fill', d => {
                    if (d.SES_INDEX < 0) {
                        return colorScale[0];
                    } else {
                        return colorScale[1];
                    }
                })
                .merge(bubble)
                .attr('cx', function (d) { 
                    return d.x;
                })
                .attr('cy', function (d) {
                  
                    return d.y;
                })
                .attr('class', 'bubble')

            bubble.exit().remove();
        }

    };


    //read data and render 
    //Read the data
    d3.queue()
        .defer(d3.csv, "./raw_data/capital_data_with_mincode.csv")
        .defer(d3.csv, "./raw_data/school_ses.csv")
        .await((error, cap_data, ses_data) => {
            if (error) {
                console.error('Something went wrong: ' + error);
            }

            let combined_data = cap_data.map((cap_d, i) => {
                ses_data.forEach((ses_d, i) => {
                    if (cap_d.MINCODE == ses_d.MINCODE && cap_d.YEAR_COMPLETED == ses_d.SCHOOL_YEAR) {
                        console.log('match!');
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

            console.log(combined_data);
            render(combined_data);
        });


});