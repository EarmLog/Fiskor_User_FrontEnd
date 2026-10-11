# Fiskor ERP — Frontend

Interfaz web del sistema **Fiskor**, un ERP pensado para la realidad fiscal y
cambiaria de Venezuela (IVA 16 %, IGTF 3 %, doble moneda Bs/USD y tasa BCV).

- **React 18** + **Vite 5**
- **React Router 6** para la navegación
- **Tailwind CSS** para los estilos
- **Axios** para el consumo de la API
- **Lucide** para los iconos

## Requisitos

- Node.js 18 o superior

## Instalación y ejecución

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm run build      # compila a dist/ para producción
npm run preview    # sirve la compilación
```

> El backend debe estar corriendo en `http://127.0.0.1:5050`. En desarrollo, Vite
> redirige las peticiones `/api` hacia ese puerto (ver `vite.config.js`).

## Estructura

```
src/
  components/   Layout (barra lateral y superior), Modal y kit de UI (Boton, Tabla, ...)
  context/      AuthContext (sesión) y AppContext (empresa, tasa, caja)
  pages/        una página por módulo del ERP
  services/     cliente HTTP con token y manejo de sesión expirada
  App.jsx       definición de rutas
  main.jsx      punto de entrada
```

## Páginas

`Login` · `Dashboard` (panel) · `POS` (punto de venta) · `Inventario` · `Ventas` ·
`Compras` · `Clientes` · `Proveedores` · `Tesoreria` · `Nomina` · `Fiscal` ·
`Usuarios` · `Empresa` · `Reportes` · `Auditoria`.

## Notas

- Las rutas privadas quedan tras el inicio de sesión; sin sesión se redirige a `Login`.
- La sesión se guarda en el navegador y se valida contra la API al recargar.
