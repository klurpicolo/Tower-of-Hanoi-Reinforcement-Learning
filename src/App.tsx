import './App.css'
import { MantineProvider } from '@mantine/core'
// import { Count } from './features/example/count/Count'
import DisplayAndControl from './features/hanoi/DisplayAndControl'

function App() {

  return (
    <MantineProvider>
      {/* <Count></Count> */}
      <DisplayAndControl></DisplayAndControl>
    </MantineProvider>
  )
}

export default App
