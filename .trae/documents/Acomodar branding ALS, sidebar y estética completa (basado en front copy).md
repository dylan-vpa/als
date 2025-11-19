**Objetivo**

* Ajustar todo el frontend para ALS: branding, colores, layouts, y vistas con estética consistente al referente “front copy”, optimizando responsive en móvil y escritorio.

**Branding y tema**

* Colores: establecer `primary` azul ALS (`#1d4ed8`) y `primary-foreground` claro; mantener tokens HSL en `src/index.css` y mapear en `tailwind.config.cjs`.

* Identidad: usar `logo.png` existente; actualizar títulos (`index.html`) y textos (Navbar → Dashboard) a identidad de ALS.

* Favicon/manifest: mantener `public/manifest.webmanifest` y `logo.png`.

**Layouts y Sidebar**

* DashboardLayout: migrar shell a Tailwind (flex con `aside` fijo) para evitar padding manual; eliminar dependencia de `--sidebar-width` y `.dashboard-shell` de `style.css`.

* Sidebar: ajustar ancho por defecto a `w-64` (256px) y colapsado `w-20`; mantener overlay en móvil; resaltar item activo, iconos, y transiciones.

* Header: mantener `DashboardHeader` con botones shadcn; sustituir estilos inline por utilidades Tailwind.

**Autenticación (login/registro)**

* Hero: ocupar altura completa de la columna en desktop; oculto en móvil; overlay y tipografía consistentes.

* Formularios: usar `Input` y `Button` shadcn; mensajes de error accesibles; CTA en variante primaria.

**Dashboard**

* Portada: tarjetas (`Card`) para métricas principales (OITs, pendientes, completadas, errores) con iconos `lucide-react` y barras/medidores simples.

* Tabla reciente: adaptar estilo a shadcn (`Table` ligero o Tailwind table utilidades) con encabezado sticky.

**OIT (lista)**

* Toolbar: acciones (`Upload`, `Filtrar`) con `Button` variantes; iconografía consistente.

* Filtros: usar `Radix Select/DropdownMenu` para tipo y estado; chips (`badge`) para filtros activos.

* Lista: filas tipo `Card` con avatar, título, subtítulos y estatus (`badge` con color por estado).

* Modal de subida: `Dialog` con dropzone estilizada Tailwind.

**OIT (detalle)**

* Hero: breadcrumb y acciones; meta con iconos; botones secundarios.

* Tabs: migrar a `Radix Tabs`; paneles con `Card` y grillas.

* Resumen y secciones: tarjetas con `badge`, chips de estado y grid responsivo.

**Alertas**

* Listado: tarjetas con severidad (success/warning/danger), timestamp y acciones “marcar leído”; filtro por tipo con `Select`.

**Recursos**

* Tabla: estilo Tailwind/shadcn con encabezado sticky, zebra, scroll horizontal y acciones en `Button`.

* Formularios de creación/edición: `Input`, `Select`, `Button` con validación ligera.

**Chat**

* Header y transcript: mensajes tipo burbuja (usuario/sistema) con `Card`/divs; input bar con `Button` y `Input`.

**Perfil**

* Avatar y datos: `Card` con `Input`; sección seguridad con `Button` y estados.

**Responsive**

* Breakpoints: `md` y `lg` para reorganización de grillas y paddings; sidebar overlay en móvil; tablas con scroll.

* Accesibilidad: focus rings (`focus:ring`), `aria-label` en botones de icono.

**Refactor y limpieza**

* Migrar gradualmente clases personalizadas de `style.css` a utilidades Tailwind; conservar mientras se completan vistas para no romper.

* Mantener PWA y contextos/servicios sin cambios.

**Verificación**

* Ejecutar dev server, recorrer: Auth, Dashboard, OIT (lista/detalle), Alertas, Recursos, Chat, Perfil.

* Validar responsive y contraste de colores; afinar espacios y tamaños.

**Entregables**

* Layouts (`DashboardLayout`, `Sidebar`, `DashboardHeader`) con Tailwind/shadcn.

* Vistas migradas: Auth, Dashboard, OIT (lista/detalle), Alertas, Recursos, Chat, Perfil.

* Tokens y tema azul ALS aplicados globalmente.

