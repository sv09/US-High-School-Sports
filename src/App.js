import { useState } from 'react';
import './App.css';
import participationData from './data/participation_statistics_total.json'
import topoData from './data/tiles.topo.json'
import statesName from './data/statesData.json'
import Linechart from './components/Linechart';
import Hexmap from './components/Hexmap';
import _ from 'lodash';



function App() {
  const [data, setData] = useState(participationData);

  return (
    <div className="App">
      <h1>Decline of Basketball Participation amongst US High School Girls</h1>
      <Linechart data={data}/>  
      <section>
        <h4>Explore more on the trends of female participation in basketball in US high schools nationwide</h4>
        <p><img src='hand-hexagon.jpg' alt="hand clicking a hexagon" width="30" height="30"/> for details</p>
        <Hexmap data={[topoData, statesName, data]}/>
      </section>
    </div>
  );
}

export default App;
