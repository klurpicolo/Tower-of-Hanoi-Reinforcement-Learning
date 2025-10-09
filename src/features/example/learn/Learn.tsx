import { useEffect, useMemo, useRef, useState } from "react";

export function Learn() {
  const [a, setA] = useState(0);
  const bRef = useRef(0);

  useEffect(() => {
    setEffectLog((logs) => [...logs, `Effect run: a=${a}, b=${bRef.current}`]);
    return () => {
      setEffectLog((logs) => [
        ...logs,
        `Effect cleanup: a=${a}, b=${bRef.current}`,
      ]);
    };
  }, [a]);

  const cacheVal = useMemo(() => {
    return a + bRef.current;
  }, [a]);

  const [effectLog, setEffectLog] = useState<string[]>([]);

  const handleClick = () => {
    setA(a + 1);
    bRef.current = bRef.current + 1;
  };

  return (
    <>
      <button onClick={handleClick}>Increase A</button>
      <p>Use state value {a}</p>
      <p>Use ref value {bRef.current}</p>
      <p>Use memo val {cacheVal}</p>
      <p>Effect logs</p>
      {effectLog.map((str, index) => (
        <p key={index}>{str}</p>
      ))}
    </>
  );
}
