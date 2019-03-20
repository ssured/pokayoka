import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRaf } from 'react-use';
import { generateId } from '../utils/id';
import createContainer from 'constate';

const useKeyMap = function<T extends {}>() {
  const map = useRef(new WeakMap<T, string>());
  return (obj: T) => {
    if (!map.current.has(obj)) {
      map.current.set(obj, generateId());
    }
    return map.current.get(obj)!;
  };
};

// const useValue = () => {
//   const [value, rawSetValue] = useState(0);
//   const setValue = (value: number) => {
//     rawSetValue(value);
//     return value;
//   };
//   return {
//     value,
//     setValue,
//   };
// };

const ValueContainer = createContainer(() => useState(0));

export const useSparkLine = () => {
  const [, setValue] = useContext(ValueContainer.Context);
  return { setValue, SparkLineProvider: ValueContainer.Provider };
};

export const SparkLine: React.FunctionComponent<{
  height?: number;
  keepHistoryMs?: number;
}> = ({ height = 100, keepHistoryMs = 5000 }) => {
  const [data, setData] = useState([{ t: Date.now(), v: 0 }]);
  const [value] = useContext(ValueContainer.Context);

  useEffect(
    () => {
      setData(
        data
          .slice(data.findIndex(d => d.t >= Date.now() - keepHistoryMs))
          .concat({
            t: Date.now(),
            v: value,
          })
      );
    },
    [value]
  );

  // useEffect(() => {
  //   let marker: any;
  //   function addDatapoint() {
  //     setValue(Math.random() * height);
  //     marker = setTimeout(addDatapoint, 10 + Math.random() * 500);
  //   }
  //   addDatapoint();
  //   return () => clearTimeout(marker);
  // }, []);

  useRaf(10e12);

  const key = useKeyMap();

  return (
    <div style={{ display: 'flex', height }}>
      {data.concat({ t: Date.now(), v: 0 }).map((d, i) => {
        const ms =
          i > 0 && d.t - (i === 1 ? Date.now() - keepHistoryMs : data[i - 1].t);
        return (
          i > 0 && (
            <div
              key={key(d)}
              style={{
                flex: `${ms} ${ms} auto`,
                borderBottom: `${d.v}px solid black`,
              }}
            />
          )
        );
      })}
    </div>
  );
};
