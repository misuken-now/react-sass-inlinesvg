# react-sass-inlinesvg

This is a React library that allows you to control inline SVG (SVG in HTML) from Sass.

This library was inspired by a great library called [react-inlinesvg].  
It has almost the same functionality as [react-inlinesvg], but with more convenience and flexibility.

View the [demo](https://misuken-now.github.io/react-sass-inlinesvg/storybook/?path=/story/atoms-svg--catalog)

## Highlight

- 🏖 **Easy to use**：Just use the mixins provided
- 🛠 **Flexible**: Various controls are available from Sass
- 🚀 **Performance**: Faster speeds with a more optimized cache mechanism
- 📌 **SSR**: Avoid layout deviations due to initial display elements
- 🟦 **Typescript**: Nicely typed

| Function                                           | react-sass-inlinesvg | [react-inlinesvg] | [smart-svg] |
| -------------------------------------------------- | -------------------- | ----------------- | ----------- |
| Specify SVG in Sass                                | ✅                   | ❌                | ✅          |
| Specify SVG in JSX                                 | ✅                   | ✅                | ❌          |
| Style control for individual child elements in SVG | ✅                   | ✅                | ❌          |
| SVG coloring                                       | ✅                   | ✅                | ✅          |
| Circular and rectangular supports                  | ✅                   | ❌                | ✅          |
| SVG display for pseudo-elements                    | ❌                   | ❌                | ✅          |
| Use outside of React                               | ❌                   | ❌                | ✅          |
| IE11 Support                                       | ✅                   | ✅                | ❌          |
| performance                                        | A                    | C                 | A+          |

Articles on implementation innovations and performance details.  
https://dwango.github.io/articles/2022-12_nicolive_svg/

The following will help you in selecting a library.

- **react-sass-inlinesvg** - This is useful when you want to apply different styles to individual child elements within an SVG element and want to specify which SVG to display from the Sass.
- **[react-inlinesvg]** - It is a stable library.
- **[smart-svg]** - This is the smartest way if it meets the functional requirements.

[react-inlinesvg]: https://github.com/gilbarbara/react-inlinesvg
[smart-svg]: https://github.com/misuken-now/smart-svg

## Installing

### Yarn

```
yarn add react-sass-inlinesvg
```

### npm

```
npm i react-sass-inlinesvg
```

## Storybook

### Yarn

```
yarn start
```

### npm

```
npm run start
```

## Using

### Setup

To use react-sass-inlinesvg with the component name SVG, prepare the following configuration.

The "src/atoms" part is optional.

```
src
  atoms
    svg
      _index.scss             // Definition of mixin
      _names.scss             // SVG Name Definition
      svg.stories.module.scss // Styles for Stories
      Svg.stories.tsx         // Story Definition
      Svg.tsx                 // React Component
```

Paste the following source code into each file and rewrite only the specified sections.

#### src/atoms/svg/\_index.scss

Set `$css-modules` to `true` only for CSS Modules.

```scss
@use "sass:meta";
@use "./names";

@forward "react-sass-inlinesvg" with ($css-modules: false,  $svg-names: meta.module-variables("names"));
@forward "./names";
```

#### src/atoms/svg/\_names.scss

Define variables for the available SVG names.

```scss
$React: "React"; // Variable name and value must be the same
$Sass: "Sass";
$Svg: "Svg";
```

#### src/atoms/svg/svg.stories.module.scss

Copy and paste the following verbatim (no changes necessary).

```scss
@use "." as *;

.svg-catalog {
  @include story-catalog;
}
```

#### src/atoms/svg/Svg.stories.tsx

Copy and paste the following verbatim (no changes necessary).

```tsx
import React from "react";
import { renderStoryCatalog } from "react-sass-inlinesvg";

import { SVG, pathMap } from "./Svg";
import classNames from "./svg.module.scss";

export default { component: SVG };
export const Catalog = () =>
  renderStoryCatalog(SVG, pathMap, classNames.svgCatalog);
```

#### src/atoms/svg/Svg.tsx

Pass an object that defines the correspondence between SVG names and paths as the argument to `setup()`.

```tsx
import { setup, ExtractProps } from "react-sass-inlinesvg";

export type SVGProps = ExtractProps<typeof SVG>;
export const { SVG, pathMap } = setup({
  React: () => "https://cdn.svgporn.com/logos/react.svg",
  Sass: () => "https://cdn.svgporn.com/logos/sass.svg",
  Svg: () => "https://cdn.svgporn.com/logos/svg.svg",
});
```

Launch Storybook and if you see SVG in the catalog, setup is complete.

### Examples

Example of displaying SVG in a component called "Example."

```
src
  atoms                       // atoms as in Setup example
    ...
  example
    example.module.scss       // style definition
    Example.stories.tsx       // story definition
    Example.tsx               // component
```

#### src/templates/example/Example.tsx

1. Place the `<SVG>` component
2. Pass `className` to the element

```tsx
import React from "react";
import { SVG } from "../../atoms/svg/Svg";
import classNames from "./example.module.scss";

export const Example = () => {
  return (
    <div>
      {/* Standard way to pass className to SVG. */}
      <button className={classNames.reactButton}>
        <SVG className={classNames.svg} /> React
      </button>
      <button className={classNames.sassButton}>
        <SVG className={classNames.svg} /> Sass
      </button>
      {/* How to use SVG without passing className. */}
      <button className={classNames.button}>
        <SVG /> SVG
      </button>
      <button className={classNames.button}>
        <SVG /> NULL
      </button>
    </div>
  );
};
```

#### src/example/example.module.scss

1. Refer to `_index.scss` in `svg` with `@use`.
2. Specify the SVG you want to display using `@include` in the selector for `<SVG>`.

```scss
// In `@use`, you can omit "/_index.scss" and the string after the trailing slash becomes a namespace.
// Please refer to the official documentation for the usage of the `@use` namespace in Sass.
// https://sass-lang.com/documentation/at-rules/use#choosing-a-namespace
@use "../../atoms/svg";

.react-button {
  font-size: 48px;

  .svg {
    @include svg.show(svg.$React, 0.8em); // Display the React logo
  }

  &:hover .svg {
    @include svg.show(
      svg.$Sass
    ); // Hover over the button to display the Sass logo
  }

  &:active .svg {
    @include svg.show(svg.$Svg); // Show the SVG logo when the button is pressed
  }
}

.sass-button {
  font-size: 48px;

  .svg {
    @include svg.show(svg.$Sass, 0.8em); // Display the Sass logo
  }

  &:hover .svg {
    @include svg.show(svg.$Svg);
  }

  &:hover .svg,
   // Selector for preventing flickering.(Moment after the hover ends, when the SVG has not yet been rewritten)
   &:not(:hover) .svg[data-svg-name="#{svg.$Svg}"] {
    fill: gray; // SVG changes color when hovering over a button.
  }

  &:active .svg {
    @include svg.none; // When the button is pressed, the element does not maintain its area and becomes invisible.(`display: none` equivalent)
  }
}

.button {
  font-size: 48px;

  &:nth-of-type(3) {
    > svg {
      @include svg.show(svg.$Svg, 0.8em); // Display the Sass logo
    }

    &:hover > svg {
      @include svg.hidden; // When the button is pressed, the element is made invisible while maintaining its area.(`visibility: hidden` equivalent)
    }

    &:active > svg {
      @include svg.null; // When the button is pressed, the entire element disappears and is not restored.
    }
  }

  &:nth-of-type(4) {
    > svg {
      @include svg.null; // Do not display the element itself(Note that there are elements that are not visible for a moment after the initial drawing.)
    }
  }
}
```

#### src/example/Example.stories.scss

1. Add storybook stories.

```tsx
import React from "react";

import { Example } from "./Example";

export default { component: Example };
export const Default = {};
```

If you start Storybook and the SVG is displayed, you have completed the usage check.

## API(Sass)

| mixin              | visibility | area | element |
| ------------------ | ---------- | ---- | ------- |
| svg.show           | ✅         | ✅   | ✅      |
| svg.hidden         | ❌         | ✅   | ✅      |
| svg.hidden-opacity | ❌         | ✅   | ✅      |
| svg.none           | ❌         | ❌   | ✅      |
| svg.null           | ❌         | ❌   | ❌      |

### @include svg.show($svg-name, $args...) { /\* content \*/ };

Displays the specified SVG.

**$svg-name** {string}

SVG name defined in `src/atoms/svg/_names.scss` OR "HIDDEN" "HIDDEN-OPACITY" "NONE" "NULL".

**$args**

Equivalent to `show()` in [smart-svg], except that `$url` argument can be used.

**content**

If necessary, CSS properties can be written within the block to add display during loading.

### @include svg.show-circle($svg-name, $args...) { /\* content \*/ };

The specified SVG is surrounded by a circular shape.

**$svg-name** {string}

SVG name defined in `src/atoms/svg/_names.scss` OR "HIDDEN" "HIDDEN-OPACITY" "NONE" "NULL".

**$args**

Equivalent to `show-circle()` in [smart-svg], except `$url` and `$fill-image` arguments can be used.

**content**

If necessary, CSS properties can be written within the block to add display during loading.

### @include svg.show-square($svg-name, $args...) { /\* content \*/ };

The specified SVG is surrounded by a rectangle shape.

**$svg-name** {string}

SVG name defined in `src/atoms/svg/_names.scss` OR "HIDDEN" "HIDDEN-OPACITY" "NONE" "NULL".

**$args**

Equivalent to `show-square()` in [smart-svg], except `$url` and `$fill-image` arguments can be used.

**content**

If necessary, CSS properties can be written within the block to add display during loading.

### @include svg.hidden($size: null);

Like `visibility: hidden`, it will be invisible with the area of the element reserved.  
It will not respond to `:hover` pseudo-selectors.

**$size** {string} ▶︎ `null`

The value used for the `width` `height` CSS property.  
If omitted, `width` `height` will not be set.

### @include svg.hidden-opacity($size: null);

Use `opacity: 0` to make the element invisible with the area of the element reserved.  
It also responds to `:hover` pseudo-selectors.

**$size** {string} ▶︎ `null`

The value used for the `width` `height` CSS property.  
If omitted, `width` `height` will not be set.

### @include svg.none($size: null);

Like `display: none`, the element is hidden with no area.

**$size** {string} ▶︎ `null`

The value used for the `width` `height` CSS property.  
If omitted, `width` `height` will not be set.

### @include svg.null;

The `<svg>` element itself will not be output, just as if you had returned `null` in a React component.  
**However, the `<svg>` element will not be visible after that. **

Note that if you specify `@include svg.null` from the CSS selector side, an invisible element will be drawn for a moment.  
This may affect `+` `:first-child` `:last-child` `:nth-*` `:empty`, etc.

### @include story-catalog;

This is a mixin that provides styles for the Story catalog.

## API(tsx)

### setup(pathMap, options)

When the SVG component sets the available SVG information, it returns the component and the pathMap passed as arguments.

**pathMap** {{[string]: () => string}}

A map of functions that return SVG names and paths.

```ts
{
  FooIcon: () => "https://.../foo-icon.svg",
  BarIcon: () => "https://.../bar-icon.svg",
}
```

**options.fetchOptions** {RequestInit}

[request]: https://developer.mozilla.org/ja/docs/Web/API/Request/Request

Custom options for the [request].

**options.uniqueHash** {string} ▶︎ a random 8 characters string` [A-Za-z0-9]`

A string to use with `uniquifyIDs`.

**options.uniquifyIDs** {boolean} ▶︎ `false`

Create unique IDs for each icon.

### ExtractProps

The type from which the Props type of the SVG component is extracted.

```ts
type SVGProps = ExtractProps<typeof SVG>;
```

### renderStoryCatalog()

Function to draw a catalog of stories.

## Props

Based on `React.SVGProps<SVGSVGElement>`.

**defaultName** {string}

SVG name for initial rendering.  
Available when there is no need to switch SVGs and no need to specify it on the Sass side.

If `defaultName` is `"NULL"`, unlike `@include svg.null;`, the element is not output from the first drawing.

**description** {string}

A description for your SVG. It will override an existing `<desc>` tag.

**innerRef** {React.Ref}

Set a ref in SVGElement.

**onLoad** {function}

A callback to be invoked upon successful load.
This will receive 2 arguments: the `src` prop and a `hasCache` boolean

**onError** {function}

A callback to be invoked if loading the SVG fails.
This will receive a single argument with:

a `FetchError` with:

```ts
{
  message: string;
  type: string;
  errno: string;
  code: string;
}
```

or an Error, which has the following properties:

```ts
{
  message: string;
}
```

**title** {string}

A title for your SVG. It will override an existing `<title>` tag.

## How react-sass-inlinesvg works

[animationstart]: https://developer.mozilla.org/ja/docs/Web/API/Element/animationstart_event

1. Draw `<svg>` with empty `<svg>`.
   - `<svg className="svg" aria-busy="true"></svg>`
2. Add `<style>` containing `@keyframes` to `<head>`.
3. Start listening for animation.
   - `<svg className="svg" aria-busy="true" data-svg-status="loading"></svg>`
4. The `animation` event of `<svg>` element's `::before` fires.
5. Event handling.
   1. Extract SVG names from `event.animationName`.
   2. Resolve URL from SVG name and fetch
      - `<svg className="svg" aria-busy="true" data-svg-status="loading" data-svg-name="FooIcon"></svg>`
6. Reflect the acquired SVG content in the element
   - `<svg className="svg" data-svg-status="complete" data-svg-name="FooIcon">*</svg>`

No change in `ref` will occur as the state or content of the SVG changes, since we will always use a single svg element.

## More Advanced Usage

### Selector by state

If you want to control the style in detail according to the state of the SVG before it completes loading, please refer to the following.

```scss
@use "../../atoms/svg";

.svg {
  @include svg.show(svg.$React) {
    // The style described here will be used for display during loading.
  }

  &[aria-busy="true"] {
    // After drawing the element - before animationstart event listening starts.
    &[data-svg-status="loading"] {
      // After animationstart event listening starts - Before animationstart event processing.
      &[data-svg-name] {
        // After animationstart event is processed - before SVG content is reflected.
      }
    }
  }
  &[data-svg-status="complete"] {
    // After reflecting SVG contents.
  }
  &[data-svg-status="error"] {
    // on error.
  }
}
```

### Flicker Prevention

In react-sass-inlinesvg, there is a momentary time lag due to the mechanism of switching SVG via animationstart.  
Therefore, in `.sass-button {}` in the `src/example/example.module.scss` example, if you try to change the color when the SVG switches on hover as shown below, the SVG and color switching timing will not match, causing a flicker.

```scss
.sass-button {
  // ...

  &:hover .svg * {
    fill: gray; // SVG changes color when hovering over a button.
  }
}
```

This can be handled by applying a style that specifies that the hover condition has changed and the SVG has not yet switched.

```scss
.sass-button {
  // ...

  &:hover .svg *,
  // Selector for preventing flickering.(Moment after the hover ends, when the SVG has not yet been rewritten)
  &:not(:hover) .svg[data-svg-name="#{svg.$Svg}"] * {
    fill: gray; // SVG changes color when hovering over a button.
  }
}
```

## Browser Support

Any browsers that support inlining [SVGs](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg) and [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and [animationstart](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationstart_event) will work.

If you need to support legacy browsers you'll need to include a polyfiil for `fetch` and `Number.isNaN` in your app. Take a look at [react-app-polyfill](https://www.npmjs.com/package/react-app-polyfill) or [polyfill.io](https://polyfill.io/v3/).

## CORS

If you are loading remote SVGs, you'll need to make sure it has [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) support.

## Why you need this package?

[why-you-need-this-package]: https://github.com/gilbarbara/react-inlinesvg/blob/main/README.md#why-you-need-this-package

[react-inlinesvg]In addition to the reasons given in [why-you-need-this-package], it is beneficial when you want to control which SVGs are displayed from your Sass.

Using react-sass-inlinesvg provides the following benefits.

1. Eliminates the need to write JS logic to switch between SVGs based on various conditions, such as `:hover`.
2. JSX improves component reusability by eliminating the need to determine specific SVGs.
3. React processing costs are reduced by a design that cuts wasteful processing as much as possible.
   - Significant performance differences, especially when displaying large numbers of SVGs.
   - Significant performance differences, especially for large displays of overlapping SVGs.

## Note

- When using react-sass-inlinesvg, SVG must be switched with Sass
  - If I have two SVG components and switch between them in JSX, I have a problem with elements disappearing momentarily.

# LICENSE

[@misuken-now/react-sass-inlinesvg](https://github.com/misuken-now/react-sass-inlinesvg)・MIT
