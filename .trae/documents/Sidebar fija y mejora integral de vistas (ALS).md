**Objetivo**

* Hacer la sidebar fija (siempre visible en escritorio, con overlay en móvil) y mejorar todas las vistas (Dashboard, OIT lista/detalle/muestreo, Alertas, Recursos, Chat, Perfil) con estética consistente de ALS usando Tailwind/shadcn.

**Sidebar y Layout**

* Sidebar fija: posición fija en el lateral, altura completa, anchos `w-64` (256px) y colapsado `w-20`. Mantener overlay en móvil.
* Actualizar `DashboardLayout` para:
  - Renderizar `<aside>` fijo (desktop) y calcular el espacio del contenido con padding-left/margin-left.
  - Mostrar/ocultar sidebar en móvil con overlay (oscureciendo el fondo) y botón toggle.
  - Archivo a editar: `front/src/components/layout/DashboardLayout.tsx:53`.
* Sidebar cohesiva con ALS: iconos, resalte activo, transiciones suaves.
  - Archivo: `front/src/components/layout/Sidebar.tsx:1`.

**Branding ALS**

* Mantener primario azul (tokens HSL ya integrados) y tipografías sobrias.
* Respetar `logo.png`, títulos y colores de énfasis.

**Vistas a mejorar**

* Dashboard (`front/src/pages/DashboardPage.tsx:80`):
  - Grilla de tarjetas con `Card` y métricas; tabla reciente envuelta en contenedor `bg-card border rounded-xl`.
  - Responsivo en dos columnas para upload + recientes.

* OIT Lista (`front/src/pages/OitListPage.tsx:216`):
  - Banner de subida con clases Tailwind (ya en progreso).
  - Toolbar y filtros con botones shadcn y menús Radix (siguiente iteración).
  - Listado con filas tipo tarjeta y badges por estado.

* OIT Detalle (`front/src/pages/OitDetailPage.tsx:323`):
  - Tarjetas para “Muestreo y Análisis”, banners e errores con clases Tailwind (ya iniciado).
  - Tabs con Radix (plan de siguiente iteración) y secciones con `Card`.

* Muestreo (`front/src/pages/OitSamplingPage.tsx:73`):
  - Wizard envuelto en tarjeta `bg-card border rounded-xl` (ya aplicado) y controles con `Button`.

* Alertas (`front/src/pages/AlertsPage.tsx:165`):
  - Secciones “Pendientes/Historial” con contenedores Tailwind, tarjetas de notificación y acciones con `Button` (ya aplicado).

* Recursos (`front/src/pages/ResourcesPage.tsx:198`):
  - Contenedor principal con `bg-card border rounded-xl` y mensajes vacíos consistentes (aplicado).
  - Próximo: filtros con `Select` Radix y tabla con encabezado sticky y zebra.

* Chat (`front/src/pages/AiChatPage.tsx:87`):
  - Transcript envuelto en tarjeta y barra de entrada con spacing (aplicado).

* Perfil (`front/src/pages/ProfilePage.tsx:38`):
  - Contenedor y grilla con utilidades Tailwind (aplicado) y botones shadcn.

**Responsive y Accesibilidad**

* Breakpoints `md`/`lg` para reorganizar grillas y paddings.
* Focus rings visibles en inputs/botones; `aria-label` en icon buttons.

**Refactor progresivo**

* Sustituir clases de `style.css` por utilidades Tailwind conforme se migre cada vista.
* Mantener PWA y lógica/contextos intactos.

**Verificación**

* Correr dev y revisar scroll de contenido con sidebar fija.
* Recorrer todas las rutas: Dashboard, OIT, Alertas, Recursos, Chat, Perfil.
* Ajustar spacing/contrastes donde sea necesario.

¿Confirmas que avancemos con estas ediciones para dejar la sidebar fija y completar la estética en todas las vistas? 