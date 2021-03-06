# Flare UI Themes

This package provides some CSS themes designed for
[Flare UI](https://github.com/tenry92/flare-ui) 0.2.

For now this package only provides a single **flat** theme.

## Themes

Currently this package only contains a single flat theme, but more themes are
planned.

Contents:

* **flat**

## Download

Choose one of the following options:

- Download the latest release from GitHub
- Install via npm: `npm install flare-ui-themes`
- Install via yarn: `yarn add flare-ui-themes`
- Clone the repo with `git clone https://github.com/tenry92/flare-ui-themes.git`,
  run `npm install` (or `yarn`) and `npm run build` (or `yarn build`)

Each theme provides a single CSS file, you have to link in your HTML, and
possibly additional image files, which are loaded by the CSS. In order to load
a CSS theme, simply add a `<link>` in the head of your HTML:

```html
<head>
  ...
  <link rel="stylesheet" href="themes/flat/flat.css">
</head>
```

## License

This package is licensed under the MIT License.
