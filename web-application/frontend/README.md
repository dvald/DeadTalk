# Web application frontend

This folder contains the frontend for the web application, made with [Nuxt](https://nuxt.com/) as the framework, using [Vite](https://vitejs.dev/) as the build tool and using [Tailwind CSS](https://tailwindcss.com/)

## Table of Contents

- [Web application frontend](#web-application-frontend)
    - [Table of Contents](#table-of-contents)
    - [Getting started](#getting-started)
        - [Figma project](#figma-project)
        - [AirUI Design System](#airui-design-system)
        - [Requirements](#requirements)
        - [Installation](#installation)
        - [Env variables setup](#env-variables-setup)
        - [Launching the dev server](#launching-the-dev-server)
    - [Project structure and technology overview](#project-structure-and-technology-overview)
        - [Project structure](#project-structure)
            - [Folders](#folders)
            - [Relevant root files](#relevant-root-files)
        - [Tech stack](#tech-stack)
    - [Scripts](#scripts)
        - [Nuxt scripts](#nuxt-scripts)
        - [Template scripts](#template-scripts)
        - [Other useful Nuxt scripts](#other-useful-nuxt-scripts)
    - [Code formatting](#code-formatting)
    - [Testing](#testing)
    - [Building for production](#building-for-production)
    - [Development guide](#development-guide)
        - [Useful documentation links](#useful-documentation-links)
        - [Vue Composition API](#vue-composition-api)
        - [Nuxt config](#nuxt-config)
        - [Auto-imports](#auto-imports)
        - [Pages and routes](#pages-and-routes)
            - [Static Routes](#static-routes)
            - [Dynamic Routes](#dynamic-routes)
            - [Nested Routes](#nested-routes)
        - [Nuxt Content Pages](#nuxt-content-pages)
        - [Layouts](#layouts)
            - [Default Layout](#default-layout)
            - [Use a custom layout in a page](#use-a-custom-layout-in-a-page)
        - [Components](#components)
        - [Images](#images)
            - [Note for Static Site Generation (SSG)](#note-for-static-site-generation-ssg)
        - [Icons](#icons)
            - [Setup](#setup)
                - [Local setup](#local-setup)
                - [Server-served icons](#server-served-icons)
            - [How to use](#how-to-use)
            - [Custom icon collections](#custom-icon-collections)
            - [Iconify extension for VS Studio Code](#iconify-extension-for-vs-studio-code)
        - [Composables](#composables)
            - [Template composables](#template-composables)
        - [Stores](#stores)
            - [Template stores](#template-stores)
        - [Utils](#utils)
        - [Plugins](#plugins)
            - [Project Plugins](#project-plugins)
        - [Assets](#assets)
        - [Styling](#styling)
            - [UI theme update](#ui-theme-update)
            - [Using tailwind](#using-tailwind)
                - [Inline classes](#inline-classes)
                - [Array-based classes](#array-based-classes)
                - [Computed classes](#computed-classes)
            - [Light and dark mode](#light-and-dark-mode)
            - [Favicons](#favicons)
            - [Typography](#typography)
        - [Translations](#translations)
            - [i18n configuration](#i18n-configuration)
            - [Using translations](#using-translations)
            - [Translated pages navigation](#translated-pages-navigation)
            - [Update and apply translations](#update-and-apply-translations)
        - [Add a new language](#add-a-new-language)
        - [Routes and navigation](#routes-and-navigation)
            - [Programmatic navigation](#programmatic-navigation)
            - [Template navigation](#template-navigation)
        - [Roles and permissions](#roles-and-permissions)
            - [Example usage of `can`](#example-usage-of-can)
        - [API requests](#api-requests)
            - [Using named requests](#using-named-requests)
        - [Modals](#modals)
            - [Usage](#usage)
            - [Custom modals](#custom-modals)
        - [Forms](#forms)
            - [Triggers](#triggers)
                - [submit](#submit)
                    - [Via `@submit`](#via-submit)
                    - [Via button `@click`](#via-button-click)
            - [reset](#reset)
                - [Via `@reset`](#via-reset)
                - [Via button `@click`](#via-button-click-1)
            - [Validation](#validation)
                - [formData](#formdata)
                - [Form field requirements](#form-field-requirements)
                - [Validation composable](#validation-composable)
        - [Models](#models)
        - [App notifications](#app-notifications)
        - [Cookie consent](#cookie-consent)
            - [Configuration](#configuration)
        - [Usage](#usage-1)
            - [Styling](#styling-1)
            - [Robots.txt](#robotstxt)
            - [Suggested workflow](#suggested-workflow)
    - [Resources](#resources)
        - [Recommended tools](#recommended-tools)

## Getting started

### Figma project

This template is based on the DLT Figma project, which is used to design the application before development begins. It also serves as the source of truth for UI tokens, allowing the design team to update styles that can later be exported and applied to the frontend theme.

**Figma project:** [Figma DLT project](https://www.figma.com/design/BosmqIwM1rGLnevuQLkAp2/DTL-Template--AirUI-?node-id=108-5367&t=pEHmNx0JsqSOihyr-1)

Open it and copy it to your drafts in order to customize it for your own project. It will require to have an account in Figma.

**Note: Do not ask for edit access to the original file, as it is read-only for everyone except the author.**

### AirUI Design System

The AirUI Design System provides a unified collection of components, composables, utilities, and data models (constants, enums, types, and interfaces) used throughout this template. It ensures visual consistency, reusable patterns, and a standardized development workflow across the entire application.

By relying on AirUI, the frontend inherits a cohesive UI foundation and a shared set of building blocks that simplify implementation and maintenance.

- **Documentation website:** https://air-ui.netlify.app/
- **Author** Imaginario27 (Roberto Carlos Vera)

### Requirements

- [NodeJS](https://nodejs.org/) - Last stable version

### Installation

Make sure to install dependencies:

```bash
npm install
```

### Env variables setup

You can configure the project using environment variables. You can place those variables inside a `.env` file.

In order to get started, copy `.env.example` into `.env`:

```bash
cp .env.example .env
```

Here is the list of available configuration variables:

| Variable                     | Description                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `DEV_PORT`                   | Port to listen when running in development mode.                                                  |
| `VITE__PLATFORM_NAME`        | The platform name.                                                                                |
| `VITE__PLATFORM_DESCRIPTION` | The platform description.                                                                         |
| `VITE__I18N_LOCALE`          | The default locale for the internationalization plugin. `en` by default.                          |
| `VITE__DEV_TEST_HOST`        | The API server for development mode. This should be the backend base URL.                         |
| `VITE__API_SERVER_HOST`      | The API server for production mode. Since the backend usually serves the fronte, this can be `/`. |
| `VITE__CAPTCHA_SERVICE`      | The captcha service to use. Available ones: `reCAPTCHA`                                           |
| `VITE__RECAPTCHA_SITE_KEY`   | The reCaptcha site identifier, in order to use the Google reCaptcha service.                      |

If you want to add more variables, remember to use the `VITE__` prefix. [Learn more](https://vitejs.dev/guide/env-and-mode#env-files).

### Launching the dev server

Start the development on `DEV_PORT` env variable configuration or fallback to `http://localhost:3000`:

```bash
npm run dev
```

## Project structure and technology overview

### Project structure

#### Folders

| Directory      | Description                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `.data`        | Typically used for runtime or local data storage by sql lite (used by `@nuxt/content`).                                                 |
| `.nuxt`        | Auto-generated Nuxt build directory (temporary). Contains compiled files, server code, and build artifacts. Ignored in version control. |
| `api`          | Houses api bindings.                                                                                                                    |
| `assets`       | Contains unprocessed static assets like images, fonts, or CSS theme files.                                                              |
| `components`   | Stores local project Vue components.                                                                                                    |
| `composables`  | Holds composable functions (`useXyz`).                                                                                                  |
| `content`      | Used with `@nuxt/content` module to manage markdown and CMS-like content.                                                               |
| `control`      | Contains the controllers to handle different events.                                                                                    |
| `i18n`         | Likely contains localization files for `nuxt/i18n` module.                                                                              |
| `layouts`      | Defines layout components used by pages (e.g., default, admin, auth).                                                                   |
| `middleware`   | Contains route middleware. Used for guarding or processing routes.                                                                      |
| `models`       | Stores const, TypeScript interfaces and eventually, enums.                                                                              |
| `node_modules` | Auto-generated. Contains installed npm packages.                                                                                        |
| `pages`        | Directory for route-based components. Each file corresponds to a route.                                                                 |
| `plugins`      | Used to register custom Nuxt plugins that run before the app initializes (e.g., third-party libraries, global setup).                   |
| `public`       | Static files served as-is at the root. Useful for favicon, robots.txt, etc.                                                             |
| `scripts`      | Stores automation and tasks scripts (e.g., deployment or data processing scripts).                                                      |
| `stores`       | Contains Pinia stores. Used for global state management.                                                                                |
| `tests`        | Contains unit, integration, or end-to-end test files.                                                                                   |
| `utils`        | Custom utilities or helper functions.                                                                                                   |

#### Nuxt content specific folders

| Directory            | Description                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `content`            | Contains markdown files that are rendered as pages using the `@nuxt/content` module.                                   |
| `components/content` | Contains prose components specifically designed to customize the rendering of content from the `@nuxt/content` module. |

#### Relevant root files

| File Name           | Description                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `.browserslistrc`   | Defines the target browsers your project supports.                                           |
| `.npmrc`            | Configuration for npm behavior (e.g., registry, auth tokens).                                |
| `.prettierignore`   | Specifies files/directories Prettier should ignore.                                          |
| `.prettierrc`       | Configuration for Prettier formatting rules.                                                 |
| `app.vue`           | The main Vue component that wraps all pages.                                                 |
| `content.config.ts` | Configuration for the `@nuxt/content` module. Controls markdown parsing, etc.                |
| `error.vue`         | Custom global error page. Displayed on 404s or app errors.                                   |
| `nuxt.config.ts`    | Main Nuxt configuration file. Defines modules, runtime config, aliases, plugins, and more.   |
| `tsconfig.json`     | TypeScript configuration file. Controls type checking and project settings.                  |
| `vitest.config.ts`  | Configuration for [Vitest](https://vitest.dev/), a unit testing framework for Vite projects. |

### Tech stack

| Dependency                   | Purpose                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `@asanrom/request-browser`   | Lightweight HTTP client for browsers, good for making fetch-like requests.                      |
| `@imaginario27/air-ui-ds`    | Custom design system or component library. Required for the template.                           |
| `@imaginario27/air-ui-utils` | Utility library tied to `air-ui-ds`. Required for the template.                                 |
| `@nuxt/content`              | File-based CMS. Allows using markdown/JSON/yaml as content.                                     |
| `@nuxt/eslint`               | ESLint configuration and integration for Nuxt.                                                  |
| `@nuxtjs/i18n`               | Internationalization (i18n) support for Nuxt.                                                   |
| `@pinia/nuxt`                | Pinia store integration for Nuxt. Auto-importable.                                              |
| `@tailwindcss/vite`          | Vite plugin for Tailwind CSS. Enables HMR and build support.                                    |
| `@vueuse/core`               | Vue Composition API utility library. Tree-shakable and composable.                              |
| `@vueuse/nuxt`               | Auto-import wrapper of `@vueuse/core` for Nuxt.                                                 |
| `better-sqlite3`             | Fast, native SQLite3 binding for Node.js. Used by `nuxt-content` module.                        |
| `eslint`                     | Linter for JavaScript/TypeScript. Enforces code style and catches bugs.                         |
| `nuxt`                       | The Nuxt 3 framework itself. Handles routing, SSR, plugins, etc.                                |
| `pinia`                      | The official state management solution for Vue 3.                                               |
| `qrcode.vue`                 | Vue component to generate QR codes.                                                             |
| `tailwindcss`                | Utility-first CSS framework used for styling.                                                   |
| `vue`                        | Core Vue 3 library. Required by Nuxt under the hood.                                            |
| `vue-router`                 | Official Vue Router, although Nuxt handles routing internally. Might be used in isolated cases. |
| `vue3-toastify`              | Toast notification system for Vue apps.                                                         |

## Scripts

The project defines several NPM scripts to streamline development, building, testing, and maintenance tasks.  
Below is an overview of the available scripts and their purposes.

### Nuxt scripts

| Script          | Command               | Purpose                                                                     |
| --------------- | --------------------- | --------------------------------------------------------------------------- |
| **Build**       | `npm run build`       | Compiles and bundles the project for production using Nuxt.                 |
| **Dev**         | `npm run dev`         | Starts the local development server with hot-module replacement.            |
| **Preview**     | `npm run preview`     | Previews the production build locally.                                      |
| **Postinstall** | `npm run postinstall` | Runs `nuxt prepare` after installing dependencies to set up Nuxt internals. |

### Template scripts

| Script                         | Command                              | Purpose                                                                                      |
| ------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Test**                       | `npm run test`                       | Executes formatting tests.                                                                   |
| **Generate theme**             | `npm run generate-theme`             | Runs the script that regenerates the UI theme variables based on Figma exports.              |
| **Update Translations**        | `npm run update-translations`        | Merges translation files and updates missing translation keys.                               |
| **Apply Missing Translations** | `npm run apply-missing-translations` | Detects and fills missing translations across all locales.                                   |
| **Update Design System**       | `npm run update-design-system`       | Installs the latest versions of AirUI DS and AirUI Utils. (**Important: Token is required**) |
| **Lint**                       | `npm run lint`                       | Runs Prettier and ESLint to format and fix code issues.                                      |
| **Prettier**                   | `npm run prettier`                   | Formats the entire project using Prettier.                                                   |
| **Backend**                    | `npm run backend`                    | Starts the backend server located in the parent directory.                                   |

### Other useful Nuxt scripts

| Script                 | Command                 | Purpose                                                                                 |
| ---------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| **Analyze Build**      | `npx nuxt analyze dist` | Opens a visual report of your production bundle to help identify large dependencies.    |
| **Clean**              | `npx nuxi clean`        | Removes `.nuxt`, `dist`, and other generated files — useful for resetting your build.   |
| **Type Check**         | `npx nuxt typecheck`    | Runs TypeScript type checking.                                                          |
| **Dev Debug**          | `nuxt dev --debug`      | Starts the dev server with detailed logging for debugging.                              |
| **Inspect**            | `npx nuxt devtools`     | Launches Nuxt DevTools (v3.6+), allowing runtime inspection of routes, components, etc. |
| **Generate Types**     | `npx nuxi prepare`      | Generates types and auto-imports; useful after adding new layers or composables.        |
| **Check Auto Imports** | `npx nuxi info`         | Lists all auto-imported composables, components, and modules.                           |

## Code formatting

To automatically format all files using the project’s Prettier configuration, execute:

```bash
npm run prettier
```

## Testing

In order to test the code for errors, run:

```bash
npm test
```

## Building for production

In order to build the application, and generate a static site to be served in production, run:

```bash
npm run build
```

The optimized and bundled output will be placed in the `dist` directory. Deploy this folder as your production frontend.

## Development guide

### Useful documentation links

| Dependency                   | Documentation                                                   |
| ---------------------------- | --------------------------------------------------------------- |
| `@asanrom/request-browser`   | https://github.com/asanrom/request-browser                      |
| `@imaginario27/air-ui-ds`    | https://air-ui.netlify.app/                                     |
| `@imaginario27/air-ui-utils` | https://air-ui.netlify.app/                                     |
| `@nuxt/content`              | https://content.nuxt.com                                        |
| `@nuxt/eslint`               | https://nuxt.com/modules/eslint                                 |
| `@nuxt/image`                | https://image.nuxt.com                                          |
| `@nuxt/icon`                 | https://nuxt.com/modules/icon                                   |
| `@nuxtjs/i18n`               | https://i18n.nuxtjs.org                                         |
| `@pinia/nuxt`                | https://pinia.vuejs.org/ssr/nuxt.html                           |
| `@tailwindcss/vite`          | https://tailwindcss.com/docs/installation/framework-guides#vite |
| `@vueuse/core`               | https://vueuse.org                                              |
| `@vueuse/nuxt`               | https://vueuse.org/guide/#nuxt-integration                      |
| `better-sqlite3`             | https://github.com/WiseLibs/better-sqlite3                      |
| `eslint`                     | https://eslint.org                                              |
| `nuxt`                       | https://nuxt.com/docs                                           |
| `pinia`                      | https://pinia.vuejs.org                                         |
| `qrcode.vue`                 | https://github.com/scopewu/qrcode.vue                           |
| `tailwindcss`                | https://tailwindcss.com/docs                                    |
| `vue`                        | https://vuejs.org                                               |
| `vue3-toastify`              | https://vue3-toastify.js-bridge.com                             |

### Vue Composition API

The Composition API is a feature of Vue 3 that allows you to organize component logic by **feature**, rather than separating it across options like `data`, `methods`, or `computed`. This leads to cleaner, more maintainable, and more reusable code—especially in larger components.

Inside the `<script setup lang="ts">` block, you can define all related logic using reactive primitives such as `ref`, `reactive`, and `computed`.

The `<script setup>` syntax removes boilerplate, automatically exposes variables to the template, and provides seamless TypeScript integration, resulting in simpler and more readable components.

### Nuxt config

| Section               | Description                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **compatibilityDate** | Specifies the baseline date for Nuxt’s internal behavior. Ensures stable behavior despite framework updates.          |
| **devtools**          | Enables or disables Nuxt DevTools in development. (By activating the tool, the project dev start will last longer)    |
| **routeRules**        | Configures route-specific behavior.                                                                                   |
| **runtimeConfig**     | Defines runtime configuration. `public` values are exposed to the client; others stay server-only.                    |
| **devServer**         | Configures the development server port and host. Useful for local development.                                        |
| **modules**           | List of Nuxt modules used in the project.                                                                             |
| **plugins**           | Custom Nuxt plugins loaded before the app renders.                                                                    |
| **imports**           | Auto-import custom directories so you can use utilities, APIs, models, etc. without manual imports.                   |
| **components**        | Auto-import all components inside `@/components`. `pathPrefix: false` means components are imported by filename only. |
| **extends**           | Extends the app with the design system layers.                                                                        |
| **app.head**          | Global HTML metadata: attributes, preconnect links, font loading, and meta viewport config.                           |
| **i18n**              | Configuration for multilingual support (locales, default locale, locale files, browser detection, etc.).              |
| **eslint**            | Enables ESLint integration for code linting (options can be added).                                                   |
| **css**               | Global CSS files loaded in every page.                                                                                |
| **vite.plugins**      | Adds Vite plugins (here, TailwindCSS integration).                                                                    |

**More details:** https://nuxt.com/docs/getting-started/configuration

### Auto-imports

Nuxt automatically imports functions, composables, components, stores and utilities from predefined directories, allowing you to use them throughout your project without manual `import` statements. This reduces boilerplate, keeps files cleaner, and improves development speed.

You can also register custom directories for auto-importing inside the `nuxt.config.ts` file,, so their exports are available globally across your app.

**More details:** https://nuxt.com/docs/guide/concepts/auto-imports

### Pages and routes

Nuxt automatically generates routes based on the file structure inside the `pages/` directory. Each `.vue` file becomes a route, removing the need for manual router configuration. This filesystem-based routing keeps navigation simple, predictable, and easy to maintain.

#### Static Routes

Any Vue file directly inside `pages/` becomes a static route:

- `pages/index.vue` → `/`
- `pages/about.vue` → `/about`
- `pages/contact.vue` → `/contact`

#### Dynamic Routes

Nuxt supports dynamic routing through bracket-based filenames:

- `pages/users/[id].vue` → `/users/:id`
- `pages/blog/[slug].vue` → `/blog/:slug`
- `pages/products/[id?].vue` → `/products/:id?` _(optional parameter)_
- `pages/[...all].vue` → `/*` _(catch-all route)_

#### Nested Routes

You can create nested routes by using nested folders:

- `pages/users/index.vue` → `/users`
- `pages/users/[id].vue` → `/users/:id`
- `pages/users/[id]/settings.vue` → `/users/:id/settings`
- `pages/dashboard/reports/index.vue` → `/dashboard/reports`
- `pages/dashboard/reports/[type].vue` → `/dashboard/reports/:type`

Nuxt automatically infers the route structure based on the directory hierarchy, making it easy to build dashboards, multi-level menus, and complex navigation flows.

**More details:** https://nuxt.com/docs/guide/directory-structure/pages

### Nuxt Content Pages

The template uses the `@nuxt/content` module to render pages written in Markdown. All Markdown files are stored inside the `content/` directory, and Nuxt Content automatically parses them into rich, SEO-friendly pages.

A dedicated page component in the `pages/` directory handles rendering, providing features such as syntax highlighting, tables, images, and custom components.

### Layouts

Layouts in Nuxt allow you to define reusable page structures that wrap your pages with shared UI elements such as headers, navigation bars, footers, or sidebars. They act as templates that pages can inherit, helping you keep a consistent design across the application.

Layouts are stored inside the `layouts/` directory. Each layout is a Vue component and can contain `<slot />` where the page content will be injected.

#### Default Layout

If you create a `layouts/default.vue` file, it becomes the layout automatically applied to all pages:

#### Use a custom layout in a page

Inside the `<script setup lang="ts">` block in the page component, you can include:

```ts
<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
</script>
```

In the event of not specifying any layout, it will use the default.

### Components

The AirUI Design System provides a wide range of flexible, reusable components used throughout the application. However, the `components/` directory in this template contains _project-specific_ components that extend or complement the design system. More components can be added here if needed.

**Tips:**

- Group related components into folders, using lowercase and, if needed, hyphens (e.g., `cards`, `user-auth`) to keep the structure organized.
- Before creating a new component, check whether AirUI already provides one that fits your needs to avoid duplications and ensure design consistency.

### Images

Nuxt projects often leverage the `@nuxt/image` module to serve optimized, responsive, and lazy-loaded images out of the box. It supports multiple image providers (e.g., IPX, Cloudinary, Imgix) and can significantly improve performance and Core Web Vitals by automating image transformations like resizing and format conversion (e.g., WebP).

By default, the Nuxt template uses `IPX`, which will run automatically without further configuration by running the project in development or by building the project with `npm run build`.

Instead of using native `<img>` tags, prefer `<NuxtImg>`:

```html
<template>
    <NuxtImg
        src="/images/hero.jpg"
        alt="Hero banner"
        width="800"
        height="400"
        class="rounded shadow"
    />
</template>
```

This provides:

- **Automatic format conversion** (e.g., WebP, AVIF when supported)
- **Lazy loading**
- **Built-in support for resizing and CDN optimization**

#### Note for Static Site Generation (SSG)

If you're using `npm run generate` to statically pre-render pages, **make sure all images used with `<NuxtImg>` are accessible at build time**.

Please check the documentation: [Static Images](https://image.nuxt.com/advanced/static-images)

### Icons

The AirUI Design System uses under the hood [Nuxt Icon module](https://nuxt.com/modules/icon) to provide access to the full set of over 200.000 icons. This allows you to easily include icons in components and pages using the `<Icon>` component.

Check the usable icons here: https://icones.js.org/

#### Setup

Make sure you have the Nuxt Icon module installed and configured in your Nuxt project.

In order to use icon collections, decide whether you want to use local setup or server-served icons.

##### Local setup

Install the desired icon collection.

**Important:** The Material Design Icon collection is already installed by default via design system

```bash
npm install @iconify-json/collection-name
```

##### Server-served icons

Configure the server bundle to include the desired icon collections:

```ts
export default defineNuxtConfig({
    icon: {
        serverBundle: {
            collections: ["mdi"],
        },
    },
});
```

#### How to use

```html
<Icon name="mdi:help" />
```

1. Find the icon in the icon-libray page.
2. Copy the icon name (e.g., `mdi:help`).
3. Use it in the `name` prop of the `<Icon>` component.

For further customization, checkout the AirUI Design System documentation: https://air-ui.netlify.app/docs/components/icon

#### Custom icon collections

To use custom icon collections, you need to configure them in your `nuxt.config.ts` file. Here's an example of how to add a custom icon collection:

```ts
export default defineNuxtConfig({
    modules: ["@nuxt/icon"],
    icon: {
        customCollections: [
            {
                prefix: "my-icon",
                dir: "./assets/my-icons",
                // if you want to include all the icons in nested directories:
                // recursive: true,
            },
        ],
    },
});
```

#### Iconify extension for VS Studio Code

To easily find and copy icon names while developing, consider installing the [Iconify extension for VS Code](https://marketplace.visualstudio.com/items?itemName=antfu.iconify).

This extension allows you to browse and search through thousands of icons directly within your code editor.

### Composables

The AirUI Design System provides a set of common composables (e.g., dark mode, mobile detection, form helpers).  
In addition to those, the `composables/` directory in this template contains **project-specific composables** that encapsulate reusable logic for routing, pagination, translations, and more.

This template also integrates [**VueUse**](https://vueuse.org) — a rich collection of `useXxx`-named composables built on the Vue Composition API. Utilities like `useClipboard`, `useDebounce`, and `useMediaQuery` are available out of the box, auto‑imported, and ready to use throughout the app.

You can freely extend this directory with additional composables as the project grows.

#### Template composables

| Composable              | Purpose                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| `useGlobalEvents.ts`    | Adds function to listen to global app events, with auto-removal of listeners on component unmount. |
| `usePagination.ts`      | In this context, it provides pagination translated texts.                                          |
| `usePermissions.ts`     | Provides methods in order to check for the user's permissions.                                     |
| `useRequireLogin.ts`    | Provides a function to force the user to log in (for pages that require it).                       |
| `useRoutes.ts`          | Centralizes additional route helpers and navigation utilities.                                     |
| `useNavSidebar.ts`      | Manages the state of the application sidebar (open/close state, active section, etc.).             |
| `useToastifiedActions`  | Provides reusable methods that result in a toast notification, like copying a test to clipboard.   |
| `useToastifyConfig.ts`  | Configures and standardizes toast notifications using Toastify across the app.                     |
| `useTranslations.ts`    | Stores common translation strings used repeatedly throughout the application.                      |
| `useUniqueRequestId.ts` | Generates unique request IDs (UUID-like) for tracking or debugging API requests.                   |

### Stores

The project uses **Pinia** as its state management solution. Pinia provides a clean and intuitive way to manage shared state and related actions across the application.  
Each store in the `stores/` directory is responsible for handling a specific domain of the app, keeping logic organized, predictable, and easy to reuse.

#### Template stores

| Store                        | Purpose                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `useAccountStore.ts`         | Stores information about the profile of the current account.                        |
| `useLanguageStore.ts`        | Manages the currently selected language. Used in language selectors.                |
| `useNavigationToastStore.ts` | Controls navigation-related toast messages (displaying messages across navigation). |
| `useThemeStore.ts`           | Stores the current UI theme (light/dark) and manages theme switching logic.         |

### Utils

The AirUI Utils includes a set of utilities for common tasks such as form validation, string formatting, and other helpers.  
In addition to these, the template also provides a few custom utilities tailored to project-specific needs. You can extend the `utils/` directory with additional utilities as the application evolves.

**Tips:**

- Check the existing AirUI utilities and template utilities before creating a new one to avoid duplication.
- Keep utility functions small, focused, and domain-agnostic so they remain reusable across the project.
- When creating new utilities, always include TypeScript documentation (`/** ... */`) above the function to describe its purpose, inputs, and outputs.

### Plugins

Plugins in Nuxt allow you to extend the application by injecting global functionality, initializing libraries, or configuring third-party tools before your app is created. They run automatically and can be loaded either on the client, the server, or both.

The `plugins/` directory in this template contains project-specific plugin initializations. Each plugin can expose new global features through the Nuxt app instance, making them accessible anywhere in the project.

#### Project Plugins

| Plugin          | Purpose                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- |
| `vue3-toastify` | Registers and configures Toastify for global toast notifications across the application. |

### Assets

The `assets/` directory contains unprocessed frontend resources that are bundled and optimized by Vite during the build process. These assets include global styles, theme definitions, images, and other static resources used throughout the application.

This template organizes assets into the following structure:

| File             | Purpose                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `colors.css`     | Defines the primitive core color variables used across by the semantic UI theme variables.                                                                         |
| `primitives.css` | Contains low-level design tokens such as spacing, radius, sizes to use if needed to extend UI theme specific variables.                                            |
| `ui-theme.css`   | Consolidates the full UI theme by combining primitives, color tokens and light/dark mode variables.                                                                |
| `defaults.css`   | Specifies default styling rules and base resets applied across the project.                                                                                        |
| `main.css`       | Serves as the primary global stylesheet. It also defines the mapping between CSS variables and Tailwind utility classes, which can be used across the application. |

### Styling

#### UI theme update

When starting a new project, it is **essential** to import the UI theme CSS variables from the Figma project before beginning development. This ensures consistency between design and implementation from the very start.

Follow these steps:

1. **Export the CSS variables from the Figma project:**
    - Paste the updated color scheme variables into the `colors.css` file and remove any unused entries.
    - Update the theme variables (both light and dark modes) in the `ui-theme.css` file.

2. **Generate the updated theme:**
   Run the following command in your terminal:
    ```bash
    npm run generate-theme
    ```

#### Using tailwind

Tailwind CSS is used throughout the project to style components using utility-first classes. It enables rapid development without leaving the template.

There are several ways to apply Tailwind classes:

##### Inline classes

The most common approach, where all classes are written directly in the component:

```html
<div class="flex items-center gap-4" />
```

##### Array-based classes

When a component requires many Tailwind classes or conditional styles, you can use an array for better readability.  
Place **each class on its own line** to keep the structure clean and easy to scan.

Array-based classes also support **dynamic classes**, allowing you to compute class names based on props or component state.

```html
<div
    :class="[
    'flex',
    'items-center',
    'justify-between',
    'p-4',
    isActive && 'bg-background-primary-brand-default',
    hasError && 'border border-border-danger'
  ]"
/>
```

##### Computed classes

For components that require more advanced or reusable styling logic, you can define Tailwind classes inside a **computed property**.  
This keeps the template clean and allows you to centralize class rules based on props or state.

Example using a **computed class mapping**:

```ts
const gapClass = computed(() => {
    const variant = {
        [ButtonSize.XS]: "gap-1",
        [ButtonSize.SM]: "gap-1.5",
        [ButtonSize.MD]: "gap-2",
        [ButtonSize.LG]: "gap-2",
        [ButtonSize.XL]: "gap-2",
        [ButtonSize.XXL]: "gap-2",
    };

    return variant[props.size as ButtonSize] || "gap-2";
});
```

**More details:** https://tailwindcss.com/

#### Light and dark mode

The template supports both light and dark mode, allowing sections and components to adapt their appearance based on the active theme.

The `Section` component includes an `isDark` prop that can be used to manually switch a specific section into dark mode:

```html
<section isDark>...</section>
```

You can also enable dark mode for any element by adding the dark class manually:

```html
<div class="dark"></div>
```

Global theme handling is managed through the **theme store**, which controls whether the application is displayed in light or dark mode. A theme toggle is provided in the app header, allowing users to switch between modes at any time.

#### Favicons

Follow this steps to generate the favicons for the project:

1. Export the favicon image as a 512x512px PNG file.
2. Go to [FaviconIO] (https://favicon.io/) and select the option `Image (PNG → ICO)`
3. Upload the PNG file and then generate the favicons.
4. Open the downloaded compressed file and copy the images files (manifest is not necessary) to the project `/public/images/favicons/` directory. Replace if necessary.

#### Typography

The project uses the **Inter** font family for a clean and modern look. The font is loaded via Google Fonts in the global HTML head inside the `nuxt.config.ts` file.

In the event of needing to change the font or add additional fonts, update the link in the `nuxt.config.ts` file accordingly.

Then, modify the `font-family` in the `assets/defaults.css` file to reflect the new font choice.

### Translations

The template uses the `@nuxtjs/i18n` module to manage multilingual support across the application.  
This includes locale detection, automatic routing, translation helpers, and language-specific content handling.

**More details:** https://i18n.nuxtjs.org/

#### i18n configuration

You can configure all translation settings inside the `nuxt.config.ts` file under the `i18n` section.  
This includes defining locales, the default language, strategy, browser language detection, and the path to locale JSON files.

#### Using translations

To translate text inside components, use the `$t` helper:

```html
<p>{{ $t('Welcome') }}</p>
```

```ts
const message = $t("Welcome");
```

**Important:**

- Always use the original language string as the translation key (typically English). This key will be used by the translation script to find and create the translations strings.

#### Translated pages navigation

When navigating between pages in a multilingual application, **always use the `useLocalePath` composable ** to generate language-aware routes. This ensures that users stay in the correct language when moving through the app.

```html
<template>
    <NuxtLink :to="localePath('/about')"> {{ $t('About') }} </NuxtLink>
</template>
<script
    setup
    lang="ts"
>
    const localePath = useLocalePath();
</script>
```

#### Update and apply translations

To generate the updated locales `JSON` files, follow this steps

1. Update the translations

    ```bash
    npm run update-translations
    ```

2. The script will generate a `.missing.txt` file in `i18/locales`. Open and translate all strings.
3. After you translate the keys, update the `STATUS=PENDING` to `STATUS=READY` for the `.missing.txt` files that are fully translated.
4. Apply translations

    ```bash
    npm run apply-missing-translations
    ```

When the translations are applied, the `.missing.txt` file will be deleted automatically.

**Important:**

- Do not update the translations while working with the missing translations files, since it may break the order. The best practice is translating all the added keys for a task as the last commit before making the pull request.
- If you want to translate something to en empty string, use a single space instead: `" "`. Also remember that the translations are trimmed, so do not use spaces at the edges of the keys or values.

### Add a new language

To add a new language, follow this steps:

1. Add the new locale to `i18n` in the `nuxt.config.ts` file.

    ```ts
    locales: [
        {
            code: 'en',
            iso: 'en',
            name: 'English',
            file: 'en.json',
        },
        {
            code: 'es',
            iso: 'es',
            name: 'Español',
            file: 'es.json',
        },
        // ADD HERE YOU NEW LANGUAGE
    ],
    ```

2. Add the new language to `LanguageCode` type in `models/types/languages.ts`

    ```ts
    export type LanguageCode = "es" | "en" | "new-language";
    ```

3. Add the language flag png file to `public/images/flags` and name the file `flag-{language-code}.png`.
4. Run the update and apply translations scripts.

### Routes and navigation

Since this template is built with Nuxt, navigation is handled using Nuxt’s built-in routing utilities.

#### Programmatic navigation

Inside the `<script setup lang="ts">` section, use `navigateTo` to trigger navigation:

```ts
navigateTo("/dashboard");
```

#### Template navigation

Inside the template, use the `NuxtLink` component for navigation:

```html
<NuxtLink to="/dashboard"> Go to Dashboard </NuxtLink>
```

When working with translations, always use `localePath` to generate language-aware routes:

```html
<template>
    <NuxtLink :to="localePath('/about')"> {{ $t('About') }} </NuxtLink>
</template>
<script
    setup
    lang="ts"
>
    const localePath = useLocalePath();
</script>
```

### Roles and permissions

The current user's role can be accessed via `AuthController.Role`, and their permissions are available through `AuthController.Permissions`.

The `usePermissions` composable provides:

- Translations for permission group names, permission names, and descriptions
- A `can` object that exposes permission-based capabilities as reactive computed properties

This is particularly useful for controlling frontend behavior, such as conditionally rendering components or enabling actions based on the user's permissions.

#### Example usage of `can`

```html
<template>
    <div v-if="can.moderaUsers">Can only be viewed by users with moderateUsers permission.</div>
</template>
<script
    setup
    lang="ts"
>
    const { can } = usePermissions();
</script>
```

Further role- and permission-based route protection can be handled via middleware.

Please see the [Middleware section](#middleware) for more details.

### API requests

In order to make the API requests, the project uses:

- The [API bindings](./api/), automatically generated from the backend with its API documentation.
- The [request-browser](https://github.com/AgustinSRG/request-browser) wrapper library, that uses the API bindings to make requests using the browser native API.

**Example with `Request.Do`:**

```ts
const { requireLogin } = useRequireLogin();

Request.Do(ApiExample.Example({ exampleParameter: 1, otherParameter: "example" }))
    .onSuccess((response) => {
        // Add here code to run when the request finishes. the response contains the parsed data
        console.log("Example field: " + response.exampleResultField);
        console.log("Other field: " + response.otherField);
    })
    .onRequestError((err, handleErr) => {
        // Add here code to run when the request fails

        handleErr(err, {
            unauthorized: () => {
                requireLogin();
            },
            exampleError: () => {
                console.log("Request failed: Example error");
            },
            serverError: () => {
                console.log("Request failed: Internal server error");
            },
            networkError: () => {
                console.log("Request failed: Network or unknown error");
            },
        });
    })
    .onCancel(() => {
        // Add here code to run when the request is cancelled
        console.log("The request was cancelled");
    })
    .onUnexpectedError((err) => {
        // Add here code to run for an unexpected error
        // For example: an exception inside the onSuccess handler
        console.error(err);
    });
```

#### Using named requests

In some situations, you may want to identify a request by name so it can be aborted or replaced when a new request is triggered.  
To achieve this, you can use `Request.Pending` or `makeNamedApiRequest` when sending a named request, and `Request.Abort` or `abortNamedApiRequest` to cancel it.

When using named requests inside components, always generate **unique identifiers** so that each component instance manages its own request lifecycle.  
Use `getUniqueStringId()` to create a unique request ID.

```ts
<script setup lang="ts">
// States
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const data = ref(null)

// Request IDs
const requestId = getUniqueStringId()

// Require login function
const { requireLogin } = useRequireLogin();

// Data loaders
const loadData = async () => {
    // Abort previous timeouts and requests
    Timeouts.Abort(requestId)
    Request.Abort(requestId)

    // Reset error
    errorMessage.value = null

    isLoading.value = true

    Request.Pending(requestId, ApiExample.Example({ exampleParameter: 1, otherParameter: "example" }))
        .onSuccess((response) => {
            isLoading.value = false

            data.value = response
        })
        .onRequestError((err, handleErr) => {
            isLoading.value = false

            handleErr(err, {
                unauthorized: () => {
                    requireLogin();
                },
                exampleError: () => {
                    errorMessage.value = "Request failed: Example error"
                },
                serverError: () => {
                    errorMessage.value = "Request failed: Internal server error"
                },
                networkError: () => {
                    errorMessage.value = "Request failed: Network or unknown error"
                },
            })
        })
        .onCancel(() => {
            isLoading.value = false
        })
        .onUnexpectedError((err) => {
            isLoading.value = false
            errorMessage.value = err?.message || "Unknown error"
        })
}

await loadData()

// Abort request handling
onBeforeUnmount(() => {
    Timeouts.Abort(requestId)
    Request.Abort(requestId)
})
</script>
```

**Important to keep in mind:**

- Create an `isLoading` state to track the loading status.
- Create an `errorMessage` state. If toast notifications are used, `errorMessage` may not be necessary.
- Generate a unique `requestId` for the component instance.
- Inside the async fetch function:
    - Before triggering the request, abort any existing requests and timeouts, reset the error message, and set `isLoading` to `true`.
    - Assign the named request using `Request.Pending(requestId, ...)`.
    - Handle the different outcomes:
        - Always set `isLoading` to `false` once the request completes.
        - Assign the response data to your state if needed.
        - Handle errors either by setting `errorMessage` or showing a toast notification.
- Abort pending timeouts and requests inside `onBeforeUnmount` to avoid memory leaks and outdated state updates.
- Handle loading states and errors in the `<template>` block.

### Modals

The AirUI Design System includes several modal components that you can use throughout the application. These components provide a consistent structure for dialog windows, confirmations, warnings, and informational messages.

| Component                | Purpose                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `ModalDialog.vue`        | The base modal component that handles layout, positioning, and accessibility. Used to create custom modals |
| `DangerModalDialog.vue`  | Displays a modal dialog for destructive or high-risk actions (e.g., delete confirmation).                  |
| `InfoModalDialog.vue`    | Shows informational modals for non-critical messages or additional context.                                |
| `SuccessModalDialog.vue` | Modal dialog variant for success messages or confirmation states.                                          |

#### Usage

Modal visibility is controlled using `v-model`, typically tied to a boolean state. The modal will open when the state becomes `true` and close when updated back to `false`.

```html
<template>
    <DangerModalDialog
        v-if="permissionGroupId"
        v-model="showDeleteModal"
        :title="$t('Are you sure you want to delete this permission group?')"
        :description="$t('Once confirmed, the permission group will be deleted forever and cannot be undone.')"
        :buttonActionText="$t('Delete group')"
        :buttonCloseText="$t('Close')"
        :isLoading="isDeleting"
        @action="deletePermissionGroup"
    />
</template>

<script
    setup
    lang="ts"
>
    // States
    const showDeleteModal = ref(false);
</script>
```

#### Custom modals

To create a custom modal, leverage the `ModalDialog` component. It is recommended to store the custom modal inside a new components in the `components/modals` folder.

**Example:**

```html
<template>
    <ModalDialog
        :modelValue="modelValue"
        cardClass="max-w-[450px]"
        :hasCornerCloseButton="false"
        @update:modelValue="updateModelValue"
    >
        <ModalContent>
            <ModalTitle :title="$t('Change wallet password')" />
            <ChangePasswordForm
                :requireCurrentPassword
                :closeOnSubmit
                @close="closeModal"
                @submit="submit"
            />
        </ModalContent>
    </ModalDialog>
</template>
<script
    setup
    lang="ts"
>
    // Props
    defineProps({
        modelValue: {
            type: Boolean as PropType<boolean>,
            default: false,
        },
        requireCurrentPassword: Boolean as PropType<boolean>,
        closeOnSubmit: Boolean as PropType<boolean>,
    });

    // Emits
    const emit = defineEmits(["update:modelValue", "close", "submit"]);

    // Methods
    const updateModelValue = (value: boolean) => {
        emit("update:modelValue", value);
    };

    const closeModal = () => {
        // Emit the model update to close the modal
        updateModelValue(false);
    };

    const submit = (payload: string | { password: string; currentPassword: string }) => {
        emit("submit", payload);
    };
</script>
```

### Forms

The AirUI Design System provides a wide range of form components, fields and validation function to handle forms.

**Example:**

```html
<template>
    <form @submit="submit">
        <FormRow>
            <InputField
                id="email"
                v-model="formData.email"
                v-model:error="formErrors.email"
                :validator="validateField"
                :label="$t('Email')"
                :placeholder="$t('Ex.: john.steward@mail.com')"
                icon="mdi:at"
                :maxLength="FieldMaxLength.EMAIL"
                required
            />
        </FormRow>
        <FormActions>
            <ActionButton
                :text="$t('Go back')"
                :iconPosition="IconPosition.LEFT"
                icon="mdi:keyboard-backspace"
                :actionType="ButtonActionType.LINK"
                :to="localePath(`/${AppSlug.LOGIN}`)"
                isFullWidth
            />
            <ActionButton
                :text="$t('Recover')"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                type="submit"
                isFullWidth
                :isLoading="isSubmitting"
                :loadingText="loadingMessages.SUBMITTING"
            />
        </FormActions>
    </form>
</template>
<script
    setup
    lang="ts"
>
    // Imports
    import { Request } from "@asanrom/request-browser";

    // States
    const formData = reactive({
        email: "",
    });
    const isSubmitting = ref(false);

    // Validators
    const { formErrors, validateFormFields } = useForm({
        formData,
        requiredFields: ["email"],
        validators: {
            email: (value) => validateField(value, formFieldValidationErrors.value.REQUIRED_FIELD),
        },
    });

    // Toast
    const { $toast } = useNuxtApp();

    // Methods
    const submit = async () => {
        const isValid = validateFormFields();

        if (!isValid) {
            $toast.error(formSubmitErrors.value.REQUIRED_FIELDS, {
                toastId: "required-fields-error",
            });

            return;
        }

        isSubmitting.value = true;

        // ASYNC OPERATION HERE
    };
</script>
```

#### Triggers

##### submit

To submit a form, there two options:

###### Via `@submit`

1. Attach the `@submit` emitter to the `Form` and set the handle submit function. It automatically prevents default behaviour.
2. Set one of the form buttons`type` prop to `submit`.
3. The `@submit` event will be triggered when the form is submitted.

```html
<template>
    <form @submit="handleSubmit">
        ...
        <FormActions>
            <ActionButton
                type="submit"
                text="Submit"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
            />
        </FormActions>
    </form>
</template>
<script
    setup
    lang="ts"
>
    ...
</script>
```

###### Via button `@click`

`@submit` emitter can be omitted when the submit function is being set directly to the submit button `@click`.

In this case, the button does not require the `type` prop.

```html
<template>
    <form>
        ...
        <FormActions>
            <ActionButton
                text="Submit"
                :styleType="ButtonStyleType.PRIMARY_BRAND_FILLED"
                @click="handleSubmit"
            />
        </FormActions>
    </form>
</template>
<script
    setup
    lang="ts"
>
    ...
</script>
```

#### reset

To reset a form, there two options:

###### Via `@reset`

1. Attach the `@reset` emitter to the `Form` and set the handle submit function. It automatically prevents default behaviour.
2. Set one of the form buttons`type` prop to `reset`.
3. The `@reset` event will be triggered when the form is submitted.

```html
<template>
    <Form @reset="resetForm">
        ...
        <FormActions>
            <ActionButton
                type="reset"
                text="Reset"
            />
        </FormActions>
    </Form>
</template>
</template>
<script setup lang="ts">
...

// Composables
const { resetForm } = useForm({
    formData,
})
</script>
```

###### Via button `@click`

`@reset` emitter can be omitted when the submit function is being set directly to the submit button `@click`.

In this case, the button does not require the `type` prop.

```html
<template>
    <form>
        ...
        <FormActions>
            <ActionButton
                text="Reset"
                @click="resetForm"
            />
        </FormActions>
    </form>
</template>
<script
    setup
    lang="ts"
>
    ...

    // Composables
    const { resetForm } = useForm({
        formData,
    })
</script>
```

#### Validation

To properly validate a form, consider the following aspects:

##### formData

A reactive object named `formData` is required to store the form’s field values. This object should be defined inside the `<script>` block.

##### Form field requirements

Must use this two props:

- `required` attribute
- `v-model:error` binding (linked to `formErrors`)

##### Validation composable

Use the `useForm` composable to manage validation logic:

```ts
const { formErrors, resetForm, validateFormFields } = useForm({
    formData,
    requiredFields: ["fullName", "email"],
    validators: {
        fullName: validateField,
        email: validateEmail,
    },
    validateOn: FormValidationMode.SUBMIT, // Optional (Default: Submit)
});
```

- **formErrors:** An object that holds error messages for each form field.
- **resetForm:** A function to reset all fields and error states.
- **validateFormFields:** A function to validate all required fields using the provided validators.
- **validateOn (optional):**

    Defines when validation should be triggered before form submission.
    By default, the validation mode is set to `FormValidationMode.SUBMIT`, which means fields are only validated when the form is submitted.
    <br><br>
    If you prefer to validate fields when they lose focus, you can set `validateOn` to `FormValidationMode.BLUR`.
    Once the form has been submitted at least once, validation will automatically switch to BLUR mode for subsequent changes.
    <br><br>
    When calling `resetForm`, the validation mode will be reset to the initially defined `validateOn` value.

### Models

The `models/` directory is used to organize and store reusable data structures and definitions that support typing and consistency across the application.

The directory typically contains:

- **Constants (`const`)** – Shared constant values used throughout the app.
- **Enums** – Enumerated values for fixed sets of options (e.g., roles, statuses, modes, props values).
- **Types & Interfaces** – Strongly typed structures used for API responses, components, forms, and internal logic.

### App notifications

This template uses **`vue3-toastify`** to display toast notifications such as errors, warnings, or success messages. Toasts can be triggered from any component using the `$toast` helper injected by Nuxt.

```html
<script
    setup
    lang="ts"
>
    // Toast
    const { $toast } = useNuxtApp();

    $toast.error("This is an error toast message", {
        toastId: "unique-identifier",
    });
</script>
```

### Cookie consent

This template uses **`@dargmuesli/nuxt-cookie-control`** to manage cookie consent banners and user preferences. It provides an easy way to inform users about cookie usage and obtain their consent in compliance with privacy regulations.

#### Configuration

Cookie control settings are defined in the `nuxt.config.ts` file under the `cookieControl` section. This includes defining cookie categories, descriptions, and behavior.

### Usage

The `CookieControl` component should be added to the layout that renders your public-facing pages — typically the **`default` layout**.  
Placing it in this layout ensures that the cookie consent banner appears consistently across all public routes of the application.

Make sure to control the component’s visibility using a state variable, and pass the current locale so that all texts are displayed in the correct language based on the user’s selection.

```html
<template>
    <CookieControl
        v-if="cookieWindowVisible"
        :locale="locale"
    />
</template>

<script
    setup
    lang="ts"
>
    // States
    const cookieWindowVisible = ref(false);

    // Translation dependencies
    const { locale } = useI18n();

    onMounted(() => {
        setTimeout(() => {
            cookieWindowVisible.value = true;
        }, 1000);
    });
</script>
```

#### Styling

You can customize the appearance of the cookie consent banner and modal by modifying the `/assets/css/cookie-control.css` file. This file contains styles that override the default styles provided by the `@dargmuesli/nuxt-cookie-control` module.

**More details:** https://nuxt.com/modules/cookie-control

#### Robots.txt

The template includes a basic `robots.txt` file located in the `public/` directory. This file provides instructions to web crawlers about which parts of the site should be crawled or ignored.

**Important:**

- Review and customize the `robots.txt` file according to your SEO strategy and site structure.
- Ensure that sensitive or non-public areas of the site are appropriately restricted.

#### Suggested workflow

1. Create a new branch for your feature or fix, **making sure to pull the latest changes from the original starting branch (e.g., `develop`) before branching off**, then pull your new branch into your local environment.
2. Implement the required code changes.
3. Add or update translations if needed.
4. Test your implementation thoroughly.
5. Run the type checker using `npx nuxt typecheck`.
6. Format the project using Prettier.
7. Commit your changes following the **Conventional Commits** structure (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`) and provide a clear, concise description.
8. Push your branch and open a pull request for review.

## Resources

### Recommended tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
