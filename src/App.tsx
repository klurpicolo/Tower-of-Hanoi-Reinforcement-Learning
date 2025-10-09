import "./App.css";
import { MantineProvider } from "@mantine/core";
import PlayGround from "./features/playground/flow/PlayGround";
import "@xyflow/react/dist/style.css";

function App() {
  return (
    <MantineProvider>
      <PlayGround></PlayGround>
    </MantineProvider>
  );
}

export default App;
