<h1 align="center">React Query Firebase</h1>
<p align="center">
  <span>A set of <a href="https://react-query.tanstack.com">React Query</a> hooks integrating with <a href="https://firebase.google.com/">Firebase</a>.</span>
</p>
<p align="center">
  <span><a href="https://react-query-firebase.invertase.dev/">📚 Documentation</a> &bull; <a href="/LICENSE.md">License</a></span>
</p>
<br />

React Query Firebase provides a set of easy to use hooks for handling asynchronous tasks with Firebase in your React application, with
full TypeScript support.

> **Note**: The library supports the Firebase JS SDK v9 - [learn more about it here](https://firebase.googleblog.com/2021/08/the-new-firebase-js-sdk-now-ga.html)!

Unlike other solutions, hooks are built on top of [React Query](https://react-query.tanstack.com) which takes care of complex challenges
such as caching, automatic refetching, realtime data subscriptions, pagination & infinite queries, mutations, SSR Support, data selectors, side effect handlers
and more.

As an example, let's use a Firestore hook to fetch a document & run a transaction whilst easily handling loading and error state:

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
