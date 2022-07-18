import * as d3 from 'd3';
import _ from 'lodash'
import { useEffect, useRef } from 'react';

const marginL = { top: 40, right: 70, bottom: 20, left: 50 }
const marginR = { top: 40, right: 90, bottom: 20, left: 50 }

const widthL = 1100 - marginL.left - marginL.right;
const heightL = 450 - marginL.top - marginL.bottom;
const widthR = 1100 - marginR.left - marginR.right;
const heightR = 450 - marginR.top - marginR.bottom;

const getUniqueYears = (data) => {
    let year = data.map(d => {
        return {
           Year: d['Year'].slice(0,4) //first 4 characters
        }
    })
    let years = _.uniq(_.map(year, 'Year')).reverse();
    return years;
}

const totalOfEach = (data, value, each, forParam) => { // e.g. { basketball: 36, volleyball: 50, ..}
    let totals = {};
    let sum = 0;
    data.map(d => { 
        let val = +d[value];
        let sport = d[each];
        let yr = d[forParam].slice(0,4);
        if([sport, yr] in totals){
            sum = totals[[sport, yr]] 
        }else{
            sum = 0;
        }   
        totals[[sport, yr]] = sum+val;   
    })
    // console.log(totals)
    return totals;
}

const totalEach = (data, value, per, forParam) => {
    let totalPer = totalOfEach(data, value, per, forParam);
    let total = data.map(d => {
        let sport = d[per];
        let year = d[forParam].slice(0,4);
        let participationValue = totalPer[[sport, year]];
        return {
            sport: sport,
            year: year,
            totalParticipation: participationValue
        }
    })
    return total;
}

const getTotals = (data, totalValOf) => {
    let minYear = d3.min(data, d => d['Year'].slice(0,4))
    let maxYear = d3.max(data, d => d['Year'].slice(0,4))
    let tot_2018 = {};
    let tot_2002 = {};

    data.map(d => {
        if((d.Year.slice(0,4)) === minYear){
            if(d.Sport in tot_2002){
                let prevVal =  tot_2002[d.Sport][0]
                let currVal = d[totalValOf]
                tot_2002[d.Sport] = [prevVal+currVal]
            }else{
                tot_2002[d.Sport] = [d[totalValOf]]
            }
        }

        if((d.Year.slice(0,4)) === maxYear){
            if(d.Sport in tot_2018){
                let prevVal =  tot_2018[d.Sport][0]
                let currVal = d[totalValOf]
                tot_2018[d.Sport] = [prevVal+currVal]
            }else{
                tot_2018[d.Sport] = [d[totalValOf]]
            }
        }        
     })
     return [tot_2002, tot_2018];
}

const getMinMaxGirls = (data) => {
    let [tot_2018_G, tot_2002_G] = getTotals(data, "Girls Participation")
    return [tot_2018_G, tot_2002_G]
}

const getMinMaxBoys = (data) => {
    let [tot_2018_B, tot_2002_B] = getTotals(data, "Boys Participation")
    return [tot_2018_B, tot_2002_B]
}

const percentDiffG = (data) => {
    let [tot_2002, tot_2018] = getMinMaxGirls(data);
    let pDiff = {}
    // console.log(tot_2002['Basketball'], tot_2018['Basketball'])
    pDiff['BasketBall'] = (((tot_2018['Basketball']-tot_2002['Basketball'])/tot_2002['Basketball'])*100).toFixed(2)
    pDiff['Football -- 11-Player'] = (((tot_2018['Football -- 11-Player']-tot_2002['Football -- 11-Player'])/tot_2002['Football -- 11-Player'])*100).toFixed(2)
    pDiff['Soccer'] = (((tot_2018['Soccer']-tot_2002['Soccer'])/tot_2002['Soccer'])*100).toFixed(2)
    pDiff['Track and Field -- Outdoor'] = (((tot_2018['Track and Field -- Outdoor']-tot_2002['Track and Field -- Outdoor'])/tot_2002['Track and Field -- Outdoor'])*100).toFixed(2)
    pDiff['Volleyball'] = (((tot_2018['Volleyball']-tot_2002['Volleyball'])/tot_2002['Volleyball'])*100).toFixed(2)
    console.log('Girls - ', pDiff)
    return pDiff;
}

const percentDiffB = (data) => {
    let [tot_2002, tot_2018] = getMinMaxBoys(data);
    let pDiff = {}
    // console.log(tot_2002['Basketball'], tot_2018['Basketball'])
    pDiff['BasketBall'] = (((tot_2018['Basketball']-tot_2002['Basketball'])/tot_2002['Basketball'])*100).toFixed(2)
    pDiff['Football -- 11-Player'] = (((tot_2018['Football -- 11-Player']-tot_2002['Football -- 11-Player'])/tot_2002['Football -- 11-Player'])*100).toFixed(2)
    pDiff['Soccer'] = (((tot_2018['Soccer']-tot_2002['Soccer'])/tot_2002['Soccer'])*100).toFixed(2)
    pDiff['Track and Field -- Outdoor'] = (((tot_2018['Track and Field -- Outdoor']-tot_2002['Track and Field -- Outdoor'])/tot_2002['Track and Field -- Outdoor'])*100).toFixed(2)
    pDiff['Volleyball'] = (((tot_2018['Volleyball']-tot_2002['Volleyball'])/tot_2002['Volleyball'])*100).toFixed(2)
    console.log('Boys - ', pDiff)
    return pDiff;
}

const Linechart = (props) => {
    const svgRefL = useRef();
    const svgRefR = useRef();
    
    useEffect(() => {
        let data = props.data;

        //get an array of unique years in the data
        let years = getUniqueYears(data);

        const textLabel = (d) => {
            let txt = d.get('2018')[0]['sport'];
            if(txt === 'Track and Field -- Outdoor'){
                txt = 'Track and Field'
            }
            if(txt === 'Football -- 11-Player'){
                txt = 'Football'
            }
            return txt
        }
    
        //girlsParticipationChart
        let totalG = totalEach(data, 'Girls Participation', 'Sport', 'Year')
        let svgL = d3.select(svgRefL.current)
                    .attr('width', widthL/2 + marginL.left + marginL.right)
                    .attr('height', heightL + marginL.top + marginL.bottom)
                    .style('fill', '#474747');

        //define x scale for Left part
        const xScaleL = d3.scalePoint()
                .range([marginL.left, (widthL/2)-marginL.right])
                .domain(years)

        //set x axis for Left part
        let xAxisL = d3.axisBottom(xScaleL)

        //define y scale for Right part
        let yScaleL = d3.scaleLinear()
                        .range([heightL-marginL.bottom, marginL.top])
                        .domain([d3.min(totalG, d => d['totalParticipation']), d3.max(totalG, d => d['totalParticipation'])+1000])

        //set y axis for Left part
        let yAxisL = d3.axisLeft(yScaleL)

        //call axes on Left svg
        svgL.append('g')
            .attr('transform', `translate(${marginL.left + marginL.top/2}, ${heightL-marginL.bottom + 10})`)
            .call(xAxisL)
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
        
        svgL.append('g')
            .attr('transform', `translate(${2*marginL.left}, 0)`)
            .call(yAxisL)

        let uniqPlotDataL = Array.from(new Set(totalG.map(d => d['totalParticipation'])))
                            .map(tot=> {
                                return totalG.find(d => d['totalParticipation'] === tot)
                            })

        //group the data by sport and year
        let plotDataL = Array.from(d3.group(uniqPlotDataL, d => d.sport, d => d.year), ([key, value]) => ({key, value})
        );

        var lineValueL = d3.line()
                            .x(d => {return xScaleL(d[0])})
                            .y(d => {return yScaleL(d[1][0]['totalParticipation'])})

        const textLabelXL = (d) => {
            return xScaleL('2018')+marginL.left + marginL.top
        }

        const textLabelYL = (d) => {
            if(d.get('2018')[0]['sport'] === 'Soccer'){
                return yScaleL(d.get('2018')[0]['totalParticipation'])+10
            }
            return yScaleL(d.get('2018')[0]['totalParticipation']);
        }

        //plot line for each object
        plotDataL.forEach((d,i) => {
            let line = svgL.append('path')
                .attr('class', 'lines')
                .attr('d', lineValueL(d.value))
                .attr('fill', 'none')
                .attr('stroke', d.key === 'Basketball'? '#d90e0e' : '#737373')
                .attr('stroke-width', 1.5)
                .attr('transform', `translate(${marginL.left+ marginL.top/2}, 0)`)

            svgL.append('text')
                .attr('x', textLabelXL(d.value))
                .attr('y', textLabelYL(d.value))
                .attr('dy', '0.15em')
                .text(textLabel(d.value))
                .style('font-size', '15px')
        })

        //y axis label
        svgL.append('text')
            .attr('class', 'y-axis-label-L')
            .attr('x',0)
            .attr('y', 0)
            .text('Participation of girls in each sport')
            .attr('transform', `translate(${marginL.left-(marginL.left/4)},${heightL-marginL.bottom-(marginL.top)})rotate(-90)`) //height/2+margin.top+(margin.bottom)

        svgL.append('text')
            .attr('class', 'girls-chart-t')
            .text('Basketball participation in US High schools amongst girls reduced by 12.71% from 2002 to 2018')
            .attr('transform', `translate(${marginL.left-marginL.right+20}, ${marginL.top-marginL.bottom})`)
            .style('font-size', '15px')

        svgL.append('text')
            .attr('class', 'source-L')
            .text('Source: NFHS')
            .attr('fill', '#b0b0b0')
            .attr('transform', `translate(${marginL.left-(marginL.left/2)}, ${heightL-marginL.bottom+marginL.top + 30})`)
            .style('font-size', '12px')

        // let diffG = percentDiffG(data);
        
        //boysParticipationChart
        let totalB = totalEach(data, 'Boys Participation', 'Sport', 'Year')
        let svgR = d3.select(svgRefR.current)
                    .attr('width', widthR/2 + marginR.left + marginR.right)
                    .attr('height', heightR + marginR.top + marginR.bottom)
                    .style('fill', '#474747');

        //define x scale for Left part
        const xScaleR = d3.scalePoint()
                .range([marginR.left, (widthR/2)-marginR.right])
                .domain(years)

        //set x axis for Right part
        let xAxisR = d3.axisBottom(xScaleR)

        let yScaleR = d3.scaleLinear()
                        .range([heightR-marginR.bottom, marginR.top])
                        .domain([d3.min(totalB, d => d['totalParticipation']), d3.max(totalB, d => d['totalParticipation'])+1000])

        //set y axis for Left part
        let yAxisR = d3.axisLeft(yScaleR)

        //call axes on Right svg
        svgR.append('g')
            .attr('transform', `translate(${marginR.left + marginR.top/2}, ${heightR-marginR.bottom + 10})`)
            .call(xAxisR)
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
        
        svgR.append('g')
            .attr('transform', `translate(${2*marginR.left}, 0)`)
            .call(yAxisR)   

        let uniqPlotDataR = Array.from(new Set(totalB.map(d => d['totalParticipation'])))
                            .map(tot=> {
                                return totalB.find(d => d['totalParticipation'] === tot)
                            })

        //group the data by sport and year
        let plotDataR = Array.from(d3.group(uniqPlotDataR, d => d.sport, d => d.year), ([key, value]) => ({key, value})
        );


        var lineValueR = d3.line()
                            .x(d => {return xScaleR(d[0])})
                            .y(d => {return yScaleR(d[1][0]['totalParticipation'])})

        const textLabelXR = (d) => {
            return xScaleR('2018')+marginR.left + marginR.top
        }

        const textLabelYR = (d) => {
            // if(d.get('2018')[0]['sport'] === 'Soccer'){
            //     return yScaleR(d.get('2018')[0]['totalParticipation'])+10
            // }
            return yScaleR(d.get('2018')[0]['totalParticipation']);
        }


        //plot line for each object
        plotDataR.forEach((d,i) => {
            let line = svgR.append('path')
                .attr('class', 'lines')
                .attr('d', lineValueR(d.value))
                .attr('fill', 'none')
                .attr('stroke', d.key === 'Basketball'? '#d90e0e' : '#737373')
                .attr('stroke-width', 1.5)
                .attr('transform', `translate(${marginR.left+ marginR.top/2}, 0)`)

            svgR.append('text')
                .attr('x', textLabelXR(d.value))
                .attr('y', textLabelYR(d.value))
                .attr('dy', '0.15em')
                .text(textLabel(d.value))
                .style('font-size', '15px')
        })

        //y axis label
        svgR.append('text')
            .attr('class', 'y-axis-label-R')
            .attr('x',0)
            .attr('y', 0)
            .text('Participation of boys in each sport')
            .attr('transform', `translate(${marginR.left-(marginR.left/4)},${heightR-marginR.bottom-(marginR.top)})rotate(-90)`)

        svgR.append('text')
            .attr('class', 'girls-chart-t')
            .text('Basketball participation in US High schools amongst boys only reduced by 0.02% from 2002 to 2018')
            .attr('transform', `translate(${marginR.left-marginR.right+40}, ${marginR.top-marginR.bottom})`)
            .style('font-size', '15px')

        // let diffB = percentDiffB(data);

    }, [])

    return(
        <div className='line-chart'>
            <svg className='container' ref={svgRefL}>
            </svg>
            <svg className='container' ref={svgRefR}>
            </svg>
        </div>
    );
}

export default Linechart;