// from https://github.com/styled-components/styled-components/issues/630#issuecomment-473901594
import { ThemedStyledFunction } from 'styled-components';

export function withProps<U>() {
  return <
    P extends keyof JSX.IntrinsicElements | React.ComponentType<any>,
    T extends object,
    O extends object = {}
  >(
    fn: ThemedStyledFunction<P, T, O>
  ): ThemedStyledFunction<P & U, T, O & U> =>
    (fn as unknown) as ThemedStyledFunction<P & U, T, O & U>;
}
