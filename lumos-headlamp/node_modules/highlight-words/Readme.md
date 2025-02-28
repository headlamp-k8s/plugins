Give it a piece of text and a search query, and it splits it into chunks separating matches from non-matches, allowing you to highlight the matches, visually or otherwise, in your app.

![Build status][build-status-badge] ![Node Version][node-version-badge]
![Npm version][npm-version-badge]
[![Npm downloads][npm-downloads-badge]][highlight-words-npm] ![License][license-badge]

## Installation

```
yarn add highlight-words
```

```
npm i --save highlight-words
```

## Usage

To use it, give it the body of text to search in and the query to search for.

```js
import highlightWords from 'highlight-words';

const chunks = highlightWords({
  text: 'The quick brown fox jumped over the lazy dog',
  query: 'over'
});

console.log(chunks);
/*
[
  {
    key: '62acb210-76dd-4682-b948-8d359a966dcb'
    text: 'The brown fox jumped ',
    match: false
  },
  {
    key: '69779adf-6d7c-45ec-ae9b-49d0cb292e28';
    text: 'over',
    match: true
  },
  {
    key: '46c5b7a0-5414-47c5-81ba-2496f33fe2f6';
    text: ' the lazy dog',
    match: false
  }
]
*/
```

[Play with this example on Code Sandbox.][sandbox-vanilla]

Alternatively, you can also use a regular expression as part of the query string to search for.
```js
const chunks = highlightWords({
  text: 'The quick brown fox jumped over the lazy dog',
  query: '/(quick|brown|fox)/'
});

console.log(chunks);
/*
[
  {
    key: '62acb210-76dd-4682-b948-8d359a966dcb'
    text: 'The ',
    match: false
  },
  {
    key: '69779adf-6d7c-45ec-ae9b-49d0cb292e28'
    text: 'quick',
    match: true
  },
  {
    key: 'a72a6578-9111-4dca-a30d-676aaf7964c0'
    text: ' ',
    match: false
  },
  {
    key: '24301852-f38b-4b54-b1fe-d8a82f47c49e'
    text: 'brown',
    match: true
  },
  {
    key: 'a72a6578-9111-4dca-a30d-676aaf7964c0'
    text: ' ',
    match: false
  },
  {
    key: '797b3bab-9244-451c-b246-4b03025b0691'
    text: 'fox',
    match: true
  },
  {
    key: 'c86dbb8a-3e5f-4c05-a48c-684abbb517e8'
    text: ' jumped over the lazy dog',
    match: false
  }
]
*/
```

> If using a regular expresssion, you can choose to either enclose the pattern in a string or not. In both cases, you need to format the regular expression properly, i.e. enclose the pattern between slashes, **and** you need to create capture groups, so that the match is remembered for later use.
>
> **Valid regular expression usage**
> ```
> query: '/(quick|brown|fox)/'
> query: /(quick|brown|fox)/
> ```
>
>**Invalid regular expression usage**
> ```
> query: '(quick|brown|fox)'
> query: '/quick|brown|fox/'
> query: /quick|brown|fox/
> ```

### Options

You can add a few options for the highlighter.

- _clipBy_. If you want to clip the occurences that are not a match and display elipses around them. This can help to provide context around your matches.
- _matchExactly_. By default, the highlighter will look for occurences of either words in your query. For example, if you have `brown fox` as your `query`, the highlighter will consider both `brown` and `fox` as separate matches. If set to `true`, then only the exact match of `brown fox` will be considered.

> _matchExactly_ will have no effect if you're using a regular expression as your query, since you will have full control over the query in that case.

### Arguments

`highlightWords` accepts an object as an argument, with the following structure:

| Property       | Type    | Required? | Description                                                   | Default |
| :------------- | :------ | :-------: | :------------------------------------------------------------ | :------ |
| `text`         | String  |     ✓     | The body of text you want to search in.                       | `empty` |
| `query`        | String  |     ✓     | The word(s) or regular expression you want to search for.     | `empty` |
| `clipBy`       | Number  |           | How many words do you want to clip from the non matches.      | `null`  |
| `matchExactly` | Boolean |           | Should we match the complete query or individual words in it? | `false` |

### What it returns

`highlightWords` returns an array of objects, each object with the following structure:

| Property | Type    | Description                                                                                             |
| :------- | :------ | :------------------------------------------------------------------------------------------------------ |
| `key`    | String  | A unique key to help you when you want to use the chunks in a map function, e.g. with React or Angular. |
| `text`   | String  | The word or words in the chunk.                                                                         |
| `match`  | Boolean | Is this chunk a match for your search?                                                                  |

## Use it with the framework of your choice

By default, the highlighter won't assume any HTML element to wrap matched text, so you can do whatever you want with the matches.

### React

```jsx
<p>
  {chunks.map(({ text, match, key }) =>
    match ? (
      <span className="highlight" key={key}>
        {text}
      </span>
    ) : (
      <span key={key}>{text}</span>
    )
  )}
  };
</p>
```

[Play with the React example on Code Sandbox.][sandbox-react]

### Angular

```html
<p>
  <span *ngFor="let chunk of chunks; trackBy: key" class="highlight">
    {{ chunk.text }}
  </span>
</p>
```

[Play with the Angular example on Code Sandbox.][sandbox-angular]

### Vue

```html
<p>
  <span
    v-for="chunk in chunks"
    :key="chunk.key"
    v-bind:class="{ active: chunk.match }"
  >
    {{ chunk.text }}
  </span>
</p>
```

[Play with the Vue example on Code Sandbox.][sandbox-vue]

### Svelte

```html
<p>
  {#each chunks as chunk (chunk.key)}
  <span class:highlight="{chunk.match}">{chunk.text}</span>
  {/each}
</p>
```

[Play with the Svelte example on Code Sandbox.][sandbox-svelte]

## A note on accessibility

When we are splitting a piece of text into multiple chunks for the purpose of styling each chunk differently, and then using said chunks **instead** of the original text, we are doing a disservice to our users who might rely on a screen reader. This is because some screen readers will read out the chunks of text individually rather than in one continous flow. For example, if we were to split the text _Eeeh! Help me!_, `highlight-words` will return to us several chunks. We then might decide to wrap each chunk's text in a `span`, like so:

```html
<p>
  <span>E</span>
  <span>e</span>
  <span>e</span>
  <span>h! H</span>
  <span>e</span>
  <span>lp m</span>
  <span>e</span>
  <span>!</span>
</p>
```

Some screen readers will announce each letter **e** individually. Not ideal!

Let's make it accessible by using aria attributes to allow screen readers to correctly announce our text.

```html
<p aria-label="Eeeh! Help me!">
  <span aria-hidden="true">E</span>
  <span aria-hidden="true">e</span>
  <span aria-hidden="true">e</span>
  <span aria-hidden="true">h! H</span>
  <span aria-hidden="true">e</span>
  <span aria-hidden="true">lp m</span>
  <span aria-hidden="true">e</span>
  <span aria-hidden="true">!</span>
</p>
```

or, for less repetition:

```html
<p aria-label="Eeeh! Help me!">
  <span aria-hidden="true">
    <span>E</span>
    <span>e</span>
    <span>e</span>
    <span>h! H</span>
    <span>e</span>
    <span>lp m</span>
    <span>e</span>
    <span>!</span>
  </span>
</p>
```

For a much better write-up than I could put together, have a read of [Michelle Barker's How to Accessibly Split Text](https://css-irl.info/how-to-accessibly-split-text).

## License

MIT License - fork, modify and use however you want.

[node-version-badge]: https://img.shields.io/node/v/highlight-words.svg?style=flat-square
[license-badge]: https://img.shields.io/npm/l/highlight-words.svg?style=flat-square
[npm-version-badge]: https://img.shields.io/npm/v/highlight-words.svg?style=flat-square
[highlight-words-npm]: https://www.npmjs.com/package/highlight-words
[npm-downloads-badge]: https://img.shields.io/npm/dt/highlight-words.svg?style=flat-square
[build-status-badge]: https://img.shields.io/circleci/build/github/tricinel/cuddy?label=circleci&style=flat-square
[sandbox-react]: https://codesandbox.io/s/highlight-words-react-1h7qw
[sandbox-angular]: https://codesandbox.io/s/highlight-words-angular-xpp46
[sandbox-vue]: https://codesandbox.io/s/highlight-words-vue-zopni
[sandbox-svelte]: https://codesandbox.io/s/highlight-words-svelte-ld807
[sandbox-vanilla]: https://codesandbox.io/s/highlight-words-vanilla-ijvkg
