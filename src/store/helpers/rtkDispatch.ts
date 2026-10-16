import { store } from "@/store/page";

// RTK endpoint objects have complex generic types; keep this loose for dispatch helpers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RtkEndpoint = any;

export async function rtkMutation<T>(
  endpoint: RtkEndpoint,
  arg?: unknown
): Promise<T> {
  return store.dispatch(endpoint.initiate(arg)).unwrap() as Promise<T>;
}

export async function rtkQuery<T>(
  endpoint: RtkEndpoint,
  arg?: unknown,
  options?: { forceRefetch?: boolean }
): Promise<T> {
  return store
    .dispatch(
      endpoint.initiate(arg, {
        forceRefetch: options?.forceRefetch ?? false,
      })
    )
    .unwrap() as Promise<T>;
}
