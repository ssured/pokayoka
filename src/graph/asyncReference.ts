import {
  IType,
  IAnyStateTreeNode,
  IAnyComplexType,
  IStateTreeNode,
  ReferenceIdentifier,
  types,
  getIdentifier,
  IAnyModelType,
  IAnyType,
  ReferenceOptionsOnInvalidated,
} from 'mobx-state-tree';
import { IObservableObject, observable, transaction, runInAction } from 'mobx';
import { nothing, Maybe } from './maybe';

// Types are copied from internal mobx-state-tree types
type ExtractT<T extends IAnyType> = T extends IType<any, any, infer X>
  ? X
  : never;
type RedefineIStateTreeNode<
  T,
  STN extends IAnyStateTreeNode
> = T extends IAnyStateTreeNode ? Omit<T, '!!types'> & STN : T;

interface AsyncReferenceOptionsGetSet<IT extends IAnyComplexType> {
  get(
    identifier: ReferenceIdentifier,
    parent: IAnyStateTreeNode | null
  ): ObservableAsyncPlaceholder<ExtractT<IT>>;
  set(
    value: ExtractT<IT>,
    parent: IAnyStateTreeNode | null
  ): ReferenceIdentifier;
}

type AsyncReferenceOptions<IT extends IAnyComplexType> =
  | AsyncReferenceOptionsGetSet<IT>
  | ReferenceOptionsOnInvalidated<IT>
  | (AsyncReferenceOptionsGetSet<IT> & ReferenceOptionsOnInvalidated<IT>);

// HERE we amend the normal reference type
// with a loading observable: `ObservableLoadingPlaceholder<ExtractT<IT>>,`
interface IAsyncReferenceType<IT extends IAnyComplexType>
  extends IType<
    ReferenceIdentifier,
    ReferenceIdentifier,
    ObservableAsyncPlaceholder<
      RedefineIStateTreeNode<
        ExtractT<IT>,
        IStateTreeNode<ReferenceIdentifier, ReferenceIdentifier>
      >
    >
  > {}

export const INITIAL = 0;
type INITIAL = typeof INITIAL;
export const PENDING = 1;
type PENDING = typeof PENDING;
export const FULFILLED = 2;
type FULFILLED = typeof FULFILLED;
export const REJECTED = 3;
type REJECTED = typeof REJECTED;

type ObservableAsyncPlaceholder<T> = (
  | {
      id: ReferenceIdentifier;
      state: INITIAL | PENDING;
      value: undefined;
      error: undefined;
    }
  | {
      id: ReferenceIdentifier;
      state: FULFILLED;
      value: T;
      error: undefined;
    }
  | {
      id: ReferenceIdentifier;
      state: REJECTED;
      value: undefined;
      error: Error;
    }) & {
  settled: boolean;
  maybe: Maybe<T>;
} & IObservableObject;

const update = (task: () => void) => runInAction(() => transaction(task));

/**
 * `types.reference` - Creates a reference to another type, which should have defined an identifier.
 * See also the [reference and identifiers](https://github.com/mobxjs/mobx-state-tree#references-and-identifiers) section.
 */
export function asyncReference<IT extends IAnyModelType>(
  Type: IT,
  loader: (
    id: ReferenceIdentifier,
    parent: IAnyStateTreeNode | null
  ) => Promise<ExtractT<IT>>
): IAsyncReferenceType<IT> {
  const placeholders = new Map<
    ReferenceIdentifier,
    ObservableAsyncPlaceholder<ExtractT<IT>>
  >();

  function getPlaceholder(
    id: ReferenceIdentifier
  ): ObservableAsyncPlaceholder<ExtractT<IT>> {
    if (!placeholders.has(id)) {
      placeholders.set(
        id,
        observable({
          id,
          state: INITIAL as INITIAL,
          value: undefined,
          error: undefined,
          get settled() {
            return this.state !== INITIAL && this.state !== PENDING;
          },
          get maybe() {
            return this.state === FULFILLED ? this.value : nothing;
          },
        })
      );
    }
    return placeholders.get(id)!;
  }

  const options: AsyncReferenceOptions<IT> = {
    get(identifier, parent) {
      const placeholder = getPlaceholder(identifier);

      if (placeholder.state === INITIAL) {
        update(() => {
          // @ts-ignore
          placeholder.state = PENDING;
        });

        // trigger side effect
        loader(identifier, parent)
          .then(instance =>
            update(() => {
              // @ts-ignore
              placeholder.state = FULFILLED;
              placeholder.value = instance;
              placeholder.error = undefined;
            })
          )
          .catch(e =>
            update(() => {
              // @ts-ignore
              placeholder.state = REJECTED;
              placeholder.value = undefined;
              placeholder.error = e;
            })
          );
      }

      return placeholder;
    },
    set(value) {
      return getIdentifier(value) as string;
    },
  };

  return types.reference(Type, options as any);
}

export function asPlaceholder<IT extends IAnyModelType>(
  value: ExtractT<IT>
): ObservableAsyncPlaceholder<ExtractT<IT>> {
  return value as any;
}
