export type CountViewProps = {
  count: number;
  increment: () => void;
  decrement: () => void;
};

export function CountView({ count, increment, decrement }: CountViewProps) {
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
}
