import './App.css'
import { MantineProvider } from '@mantine/core'
// import { Count } from './features/example/count/Count'
import DisplayAndControl from './features/hanoi/DisplayAndControl'
import { Learn } from './features/example/learn/Learn'
import LearnFLow from './features/example/flow/LearnFlow'
import '@xyflow/react/dist/style.css';
import { TowerOfHanoi } from './features/hanoi/tower2/TowerOfHanoi'
import { MainApp } from './features/example/context/LearnContext'


function App() {

  return (
    <MantineProvider>
      {/* <Count></Count> */}
      {/* <DisplayAndControl></DisplayAndControl> */}
      {/* <TowerOfHanoi peg1={[0,1,2]} peg2={[]} peg3={[]}></TowerOfHanoi> */}
      {/* <Learn></Learn> */}
      {/* <LearnFLow></LearnFLow> */}
      {/* <div style={{ height: '100vh', width: '100vw' }}>
        <ReactFlow nodes={nodes} edges={edges}>
          <Background />
          <Controls />
        </ReactFlow>
      </div> */}
      {/* <MainApp></MainApp> */}
      <LearnFLow></LearnFLow>
    </MantineProvider>
  )
}

export default App
