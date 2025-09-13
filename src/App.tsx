import './App.css'
// import { Count } from './features/example/count/Count'
import DisplayAndControl from './features/hanoi/DisplayAndControl'
import { TowerOfHanoi } from './features/hanoi/tower/TowerOfHanoi'

function App() {

  return (
    <>
      {/* <Count></Count> */}
      <TowerOfHanoi></TowerOfHanoi>
      <DisplayAndControl></DisplayAndControl>
    </>
  )
}

export default App
