import { createContext, useContext } from "react";

const ThemeContext = createContext("null");

export function MainApp() {
  return (
    <ThemeContext value="dark">
      <MiddleComponent></MiddleComponent>
    </ThemeContext>
  );
}

export function MiddleComponent() {
  return (
    <>
      <div>This is middle component</div>
      <DataShowComponent></DataShowComponent>
    </>
  );
}

export function DataShowComponent() {
  const theme = useContext(ThemeContext);
  return (
    <>
      <p>theme {theme}</p>
    </>
  );
}
