import * as d3 from 'd3';
import * as topojson from "https://cdn.skypack.dev/topojson@3.0.2"; 
import { useRef, useEffect } from 'react';
import _ from 'lodash';

const margin = { top: 30, right: 90, bottom: 30, left: 50 }
const width = 820 - margin.left - margin.right;
const height = 520 - margin.top - margin.bottom;
const buffer = 25;

const getMinMax = (data) => {
    let minYear = d3.min(data, d => d['Year'])
    let maxYear = d3.max(data, d => d['Year'])
    let diff = {}

    data.map(d => {
        // if(d.Year === minYear && d.Sport === 'Soccer'){
        if(d.Year === minYear && d.Sport === 'Basketball'){
            if(d.State in diff){
                diff[d.State].push(d["Girls Participation"])
            }else{
                diff[d.State] = [d["Girls Participation"]]
            }
        }

        // if(d.Year === maxYear && d.Sport === 'Soccer'){
        if(d.Year === maxYear && d.Sport === 'Basketball'){
            if(d.State in diff){
                diff[d.State].push(d["Girls Participation"])
            }else{
                diff[d.State] = [d["Girls Participation"]]
            }
        }
     })
     return diff;
}

const percentDiff = (data) => {
    let diff = getMinMax(data);
    // console.log(diff)
    let pDiff = {}
    for(const [key,val] of Object.entries(diff)){
        pDiff[key] = (((val[0]-val[1])/val[1])*100).toFixed(2)
    }
    // console.log(pDiff)
    return pDiff;
}

const Hexmap = (props) => {
    const svgRef = useRef();
    
    useEffect(() => {
        let [topoData, statesData, stats] = props.data;
        // console.log(stats)
        let svg = d3.select(svgRef.current)
                        .attr('width', width + margin.left + margin.right)
                        .attr('height', height + margin.top + margin.bottom)


        var tiles = topojson.feature(topoData, topoData.objects.tiles);
        // console.log(tiles.features)

        // build list of state codes
        var stateCodes = {};
        let i = 1; 
        let check = 0;
        topoData.objects.tiles.geometries.forEach(geometry => {
            let stateName = '';
            let name = geometry.properties.name
            name.split(' ').map(s => {
                if(check === i-1){
                    stateName += (s.charAt(0) + s.substring(1).toLowerCase()) + ' ';
                }
            })
            stateCodes[name] = _.find(statesData, {'state': stateName.trim()}).code
            check = i;
            i += 1;
        })

        // console.log(stateCodes)

        var transform = d3.geoTransform({
            point: function point(x, y) {
                return this.stream.point(x*0.8, -y*0.8);
            }
        })

        var path = d3.geoPath().projection(transform);
        svg.selectAll('.tiles')
            .data(tiles.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'tiles')
            .attr('fill', 'white')
            .attr('stroke', '#474747')
            .attr('stroke-width', 2)
            .attr('transform', `translate(${-width/2.5}, ${height-margin.bottom+margin.top})`)
            .style('cursor', 'pointer')
            .on('click', (i,d) => detail(d))
     
        svg.selectAll('state-label')
            .data(tiles.features)
            .enter()
            .append('text')
            .attr('class', d => {return 'state-label state-label' + d.id})
            .attr('transform', d => `translate(${-width/2.5 + path.centroid(d)[0]}, ${height-margin.bottom+margin.top + path.centroid(d)[1]})`) //
            .attr('dx', '-1em')
            .attr('dy', '0.4em')
            .text(d => {return stateCodes[d.properties.name]})
            .attr('fill', '#474747')
            .style('cursor', 'pointer')

        let pDiff = percentDiff(stats)

        var customDownTriangle = { 
            draw: function(context, size){
                let s = Math.sqrt(size)/2;
                context.moveTo(-(1.25*s),-(1.25*s));
                context.lineTo((2*s), -(1.25*s)); 
                context.lineTo(s/2,(1.25*s));
                context.closePath();
            }
        }
        const arrow = d3.symbol().type(function(d){
            if(pDiff[stateCodes[d.properties.name]]<0){
                return customDownTriangle;
            }else{
                return d3.symbolTriangle;
            }
        })
        svg.selectAll('state-label')
            .data(tiles.features)
            .enter()
            .append('path')
            .attr('class', d => {return 'state-label state-label' + d.id})
            .attr('transform', d => `translate(${-(width/2.5 - 15) + path.centroid(d)[0]}, ${height-margin.bottom+margin.top + path.centroid(d)[1]})`) //
            // .attr('dx', '5em')
            .attr('dy', '0.4em')
            .attr('d', arrow)
            .attr('fill', d => pDiff[stateCodes[d.properties.name]]<0? '#d90e0e': '#2a2a2a')
            .style('cursor', 'pointer')
         
        svg.append('text')
            .attr('class', 'source-L')
            .text('Source: NFHS')
            .attr('fill', '#b0b0b0')
            .attr('transform', `translate(${margin.left-buffer}, ${height+margin.bottom + buffer})`)
            .style('font-size', '12px')
            
        const getYears = (data) => {
            let year = data.map(d => {
                return {
                    Year: d['year'].slice(0,4) //first 4 characters
                }
            })
            let years = _.map(year, 'Year').reverse();
            return years;
        }
    
        const stateLineChart = (code, name, percentDiff) => {
            let quant = '';
            if(percentDiff < 0){
                quant = 'less'
            }else{
                quant = 'more'
            }

            let stateData = []
            stats.map(d => { 
                // if(d.State === code && d.Sport === 'Soccer'){
                if(d.State === code && d.Sport === 'Basketball'){
                    let obj = {
                        'year': d.Year.slice(0,4),
                        'participation': d['Girls Participation']
                    }
                    stateData.push(obj)              
                }
            });

            let years = getYears(stateData)
    
            //define x scale
            const xScale = d3.scalePoint()
            .range([margin.left, width-margin.right])
            .domain(years)
    
            //set x axis
            let xAxis = d3.axisBottom(xScale)
    
            //define y scale
            let yScale = d3.scaleLinear()
                            .range([height-margin.bottom, margin.top])
                            // .domain([d3.min(stateData, d => d['participation']), d3.max(stateData, d => d['participation'])+1])
                            .domain([0, d3.max(stateData, d => d['participation'])+40])
    
            //set y axis
            let yAxis = d3.axisLeft(yScale)
    
            //call axes on svg
            svg.append('g')
            .attr('class', 'x-axis')
                .attr('transform', `translate(${margin.left}, ${height-margin.bottom + margin.top + (margin.top/2)})`)
                .call(xAxis)
    
            svg.append('g')
                .attr('class', 'y-axis')
                .attr('transform', `translate(${margin.left+(margin.left/2)}, ${margin.top})`)
                .call(yAxis)


            //plot line for each object
            svg.append('path')
                .datum(stateData)
                .attr('class', 'state-line')
                .attr('d', d3.line()
                    .x(d => {return xScale(d.year)})
                    .y(d => {return yScale(d.participation)}))
                .attr('fill', 'none')
                .attr('stroke', '#474747')
                .attr('stroke-width', 1.5)
                .attr('transform', `translate(${margin.left}, ${margin.top})`)

            //y axis label
            svg.append('text')
            .attr('class', 'y-axis-label-hex')
            .attr('x',0)
            .attr('y', 0)
            .text('Female Participants')
            .attr('transform', `translate(${(margin.left/2)},${height/2+margin.top+(margin.bottom)})rotate(-90)`)

            svg.append('text')
            .attr('fill', '#474747')
            .attr('class', 'window-title')
            .attr('x',0)
            .attr('y', 0)
            .text(`${name} had ${Math.abs(percentDiff)}% ${quant} high school female participation in Basketball from 2002 to 2018.`)
            .attr('transform', `translate(${margin.right}, ${margin.top + (margin.top/2)})`)

            svg.append('text')
            .attr('fill', '#474747')
            .attr('class', 'close-window')
            .text('X')
            .attr('transform', `translate(${width+margin.right+buffer}, ${margin.top - (margin.top/2)})`)
            .style('cursor', 'pointer')
            .on('click', (i,d) => hexMap())

            svg.append('text')
            .attr('class', 'source-L')
            .text('Source: NFHS')
            .attr('fill', '#b0b0b0')
            .attr('transform', `translate(${margin.left-buffer}, ${height+margin.bottom + buffer})`)
            .style('font-size', '12px')

        }
            
        const detail = (d) => {
            d3.selectAll('.tiles').style('opacity', 0)
            d3.selectAll('.state-label').style('opacity', 0)
            
            let stateCode = stateCodes[d.properties.name];
            let sn = d.properties.name;
            let stateFullName = ''
            sn.split(' ').map(s => {
                if(check === i-1){
                    stateFullName += (s.charAt(0) + s.substring(1).toLowerCase()) + ' ';
                }
            })
            stateLineChart(stateCode, stateFullName, pDiff[stateCodes[d.properties.name]])
        }

        const hexMap = () => {
            d3.selectAll('.close-window').style('opacity', 0)
            d3.selectAll('.window-title').style('opacity', 0)
            d3.selectAll('.y-axis-label-hex').style('opacity', 0)
            d3.selectAll('.state-line').style('opacity', 0)
            d3.selectAll('.y-axis').style('opacity', 0)
            d3.selectAll('.x-axis').style('opacity', 0)
            d3.selectAll('.tiles').style('opacity', 1)
            d3.selectAll('.state-label').style('opacity', 1)
        }

    }, []);
    
    return (
        <div className='hexmap'>
            <svg ref={svgRef}>
            </svg>
        </div>
    )
}

export default Hexmap;