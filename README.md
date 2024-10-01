> [!IMPORTANT]  
> This project is currently undergoing a overhaul, to support TanStack v5 - this includes a package restructuring, and enables support for other web frameworks!

<h1 align="center">React Query Firebase</h1>
<p align="center">
  <span>A set of <a href="https://react-query.tanstack.com">React Query</a> hooks integrating with <a href="https://firebase.google.com/">Firebase</a>.</span>
</p>
<p align="center">
  <span><a href="#installation">Installation</a> &bull;
  <a href="https://react-query-firebase.invertase.dev/"> Documentation</a> &bull;
  <a href="/LICENSE.md">License</a></span>
</p>
<br />

React Query Firebase provides a set of easy to use hooks for handling asynchronous tasks with Firebase in your React application.

## Why should I use React Query Firebase?

- **Backed by React Query** - Unlike other solutions, hooks are built on top of [React Query](https://react-query.tanstack.com) which takes care of complex challenges
  such as caching, automatic refetching, realtime data subscriptions, pagination & infinite queries, mutations, SSR Support, data selectors, side effect handlers and more. You also get [DevTool](https://react-query.tanstack.com/devtools)
  support out of the box!
- **Un-opinionated** - You provide the Query Keys, Configuration & Firebase instances, allowing for full control over how your data is integrated and cached. You can also roll it alongside any existing Firebase usage.
- **Performant & Efficient** - Whether your queries are one-off or realtime, the library is designed to be performant and efficient. Data fetching is handled via [Queries](https://react-query.tanstack.com/guides/queries) and
  [Query Keys](https://react-query.tanstack.com/guides/query-keys), meaning components can share data throughout your application without needless database reads.
- **Mutations** - Sign a user in, delete a document, run a transaction, log an event... React Query Firebase takes care of that for you via [Mutations](https://react-query.tanstack.com/guides/mutations), allowing you to focus
  on your application and not managing complex local loading & error states.
- **Fully Typed** - The library is built with and has full compatibility with TypeScript.

> **Note**: The library supports the Firebase JS SDK v9 - [learn more about it here](https://firebase.googleblog.com/2021/08/the-new-firebase-js-sdk-now-ga.html)!

## Example

As an example, let's use a Firestore hooks to fetch a document & run a transaction whilst easily handling asynchronous state.

```tsx
import {
  useFirestoreDocument,
  useFirestoreTransaction,
} from "@react-query-firebase/firestore";
import { doc } from "firebase/firestore";
import { firestore } from "./config/firebase";

type Product = {
  name: string;
  price: number;
};

function ProductPage({ id }: { id: string }) {
  // Create a Firestore document reference
  const ref = doc(firestore, "products", id);

  // Query a Firestore document using useQuery
  const product = useFirestoreDocument<Product>(
    ["product", id],
    ref,
    {
      // Subscribe to realtime changes
      subscribe: true,
      // Include metadata changes in the updates
      includeMetadataChanges: true,
    },
    {
      // Optionally handle side effects with React Query hook options
      onSuccess(snapshot) {
        console.log("Successfully fetched product ID: ", snapshot.id);
      },
    }
  );

  // Run a Firestore transaction as Mutation using useMutation
  const like = useFirestoreTransaction(
    auth,
    async (tsx) => {
      const record = await tsx.get(ref);
      tsx.update(ref, {
        likes: record.data().likes + 1,
      });
    },
    {
      onError(error) {
        console.error("Failed to like product!", error);
      },
    }
  );

  if (product.isLoading) {
    return <div>Loading...</div>;
  }

  if (product.isError) {
    return <div>Failed to fetch product: {product.error.message}</div>;
  }

  const snapshot = product.data; // DocumentSnapshot<Product>

  return (
    <div>
      <h1>{snapshot.data().name}</h1>
      <button disabled={like.isLoading} onClick={() => like.mutate()}>
        Like Product!
      </button>
      {like.isError && <p>Failed to like product: {like.error.message}</p>}
    </div>
  );
}
```

## Installation

If you haven't done so already, install `react`, `react-query` & `firebase` (v9):

```bash
npm i --save react react-query firebase
```

Before using this library, ensure React Query is setup on your project by following the [Installation](https://react-query.tanstack.com/quick-start) guide.

Next install one of the React Query Firebase packages, e.g:

```bash
npm i --save @react-query-firebase/firestore
```

See below for a full list of available packages.

## Packages

- [`@react-query-firebase/analytics`](https://react-query-firebase.invertase.dev/analytics)
- [`@react-query-firebase/auth`](https://react-query-firebase.invertase.dev/auth)
- [`@react-query-firebase/database`](https://react-query-firebase.invertase.dev/database)
- [`@react-query-firebase/firestore`](https://react-query-firebase.invertase.dev/firestore)
- [`@react-query-firebase/functions`](https://react-query-firebase.invertase.dev/functions)

## License

- See [LICENSE](/LICENSE)

---

<p align="center">
  <a href="https://invertase.io/?utm_source=readme&utm_medium=footer&utm_campaign=docs.page">
    <img width="75px" src="https://static.invertase.io/assets/invertase/invertase-rounded-avatar.png">
  </a>
  <p align="center">
    Built and maintained by <a href="https://invertase.io/?utm_source=readme&utm_medium=footer&utm_campaign=docs.page">Invertase</a>.
  </p>
</p>
