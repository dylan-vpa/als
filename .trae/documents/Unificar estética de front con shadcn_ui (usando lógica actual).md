**Objetivo**

* Modernizar la UI de "front" con shadcn/ui + Tailwind, manteniendo la lógica actual, y optimizar UX/flujo responsive para móvil y escritorio.

**Qué se actualizará**

* Configuración de estilos: Tailwind + postcss con tokens de shadcn.

* Componentes base: Button, Card, Input, Modal → versión shadcn.

* Layout principal: Sidebar y Header con Tailwind, estados y transiciones responsivas.

* Mantener PWA, rutas y contextos actuales.

**Dependencias a añadir en** **`front`**

* Prod: `@radix-ui/react-*` (avatar, dialog, dropdown-menu, label, select, slot, tabs), `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`.

* Dev: `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/forms`, `@tailwindcss/typography`.

**Configuración**

* `tailwind.config.cjs` y `postcss.config.cjs` como en "front copy".

* `src/index.css` con layers base; importar junto a `style.css` para transición sin romper.

* `src/lib/utils.ts` con `cn`.

**Migración de UI (sin tocar lógica)**

* Button: mapear `variant` y `size` actuales a shadcn, mantener API.

* Card: contenedor con clases tailwind/shadcn.

* Input: componer `Label` + `Input`, mantener `label` y `error`.

* Modal: reemplazar por `Dialog` controlado (`open`, `onClose`, `title`, `actions`).

**Responsive y accesibilidad**

* Sidebar: colapsable (ancho 72→20), hits en hover/active, foco visible.

* Header: buscador con atajo, badges accesibles, modal de búsqueda con teclado.

* Breakpoints móviles: espaciados, grids, tablas con scroll horizontal.

**Verificación**

* Instalar dependencias, `npm run dev`.

* Probar: Auth (inputs/botones), Dashboard (Sidebar/Header), OIT (lista/filtros/modales), Recursos (tablas).

* Ajustar paddings, colores y contrastes hasta igualar "front copy".

**Entregables**

* Config Tailwind + postcss y `index.css` en `front`.

* UI base reescrita con shadcn.

* Sidebar/Header estil

