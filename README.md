> [!IMPORTANT]  
> This project is currently a work in progress. Please check back soon for updates!

<h1 align="center">TanStack Query Firebase</h1>
<p align="center">
  <span>A set of <a href="https://tanstack.com/query/latest">TanStack Query</a> hooks integrating with <a href="https://firebase.google.com/">Firebase</a>.</span>
</p>
<p align="center">
  <span><a href="#installation">Installation</a> &bull;
  <a href="https://invertase.docs.page/tanstack-query-firebase"> Documentation</a> &bull;
  <a href="/LICENSE.md">License</a></span>
</p>
<br />

TanStack Query Firebase provides a set of hooks for handling asynchronous tasks with Firebase in your applications.

> Looking for React Query Firebase? Check out the [old branch](https://github.com/invertase/tanstack-query-firebase/tree/react-query-firebase).

## Why should I use React Query Firebase?

When managing Firebase’s asynchronous API calls within your application, state synchronization can become cumbersome in most applications. You will commonly find yourself handling loading states, error states, and data synchronization manually. 

This library provides a hands-off approach to these problems, by leveraging the popular [TanStack Query](https://tanstack.com/query/latest) project. Out of the box, you get:

- **Automatic Caching**: Avoid redundant Firebase calls with built-in caching.
- **Out-of-the-box Synchronization**: TanStack Query keeps your UI in sync with the Firebase backend effortlessly.
- **Background Updates**: Fetch and sync data seamlessly in the background without interrupting the user experience.
- **Error Handling & Retries**: Get automatic retries on failed Firebase calls, with robust error handling baked in.
- **Dev Tools for Debugging**: Leverage the React Query Devtools to gain insights into your data-fetching logic and Firebase interactions.

By combining Firebase with TanStack Query, you can make your app more resilient, performant, and scalable, all while writing less code.

## Installation

This project expects you have `firebase` installed as a peer dependency. If you haven't done so already, install `firebase`:

```bash
npm i --save firebase
```

Next, install specific packages for your framework of choice:

### React

```
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```

See the [Documentation](https://invertase.docs.page/tanstack-query-firebase/react) for more information on how to use the library.

## Status

The status of the following Firebase services and frameworks are as follows:

- ✅ Ready for use
- 🟠 Work in progress
- () Not yet started

| Module         | React | Vue | Solid | Angular | Svelte |
|----------------|:-----:|:---:|:-----:|:-------:|:------:|
| analytics      |       |     |       |         |        |
| app-check      |       |     |       |         |        |
| auth           |   🟠   |     |       |         |        |
| database       |       |     |       |         |        |
| firestore      |   🟠   |     |       |         |        |
| firestore/lite |       |     |       |         |        |
| functions      |       |     |       |         |        |
| installations  |       |     |       |         |        |
| messaging      |       |     |       |         |        |
| performance    |       |     |       |         |        |
| remote-config  |       |     |       |         |        |
| vertexai       |       |     |       |         |        |

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
