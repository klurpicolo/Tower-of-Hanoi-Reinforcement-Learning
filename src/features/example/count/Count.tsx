import { useMemo } from "react";
import { Observer } from "mobx-react-lite";

import CountModel from "./CountModel";
import { CountView } from "./CountView";

export function Count() {
  const model = useMemo(() => new CountModel(), []);

  return (
    <Observer>
      {() => (
        <CountView
          count={model.count}
          increment={() => model.increment()}
          decrement={() => model.decrement()}
        />
      )}
    </Observer>
  );
}
