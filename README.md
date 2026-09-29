# Burger Queen · Sistema de pedidos

Aplicación en Angular para tomar pedidos en un restaurante de hamburguesas,
enviarlos a cocina y administrar trabajadores y productos.

Consume la [Burger Queen API v2.0.0](https://app.swaggerhub.com/apis-docs/ssinuco/BurgerQueenAPI/2.0.0).

## Cómo correrlo

### 1. La API (mock oficial de Laboratoria)

```bash
git clone https://github.com/Laboratoria/burger-queen-api-mock.git
cd burger-queen-api-mock
npm install
npm start          # queda en http://localhost:8080
```

Usuarias que trae el mock (contraseña `123456` para todas):

| Correo               | Rol    |
| -------------------- | ------ |
| admin@systers.xyz    | admin  |
| waiter@systers.xyz   | waiter |
| chef@systers.xyz     | chef   |

Si tu API corre en otra URL, cámbiala en `src/environments/environment.ts`.

### 2. La app

```bash
npm install
npm start          # http://localhost:4200
```

## Qué hace cada rol

| Rol    | Pantallas                                                        |
| ------ | ---------------------------------------------------------------- |
| waiter | Nuevo pedido · Listos para servir                                |
| chef   | Cocina                                                           |
| admin  | Todo lo anterior + Trabajadores + Productos                      |

Flujo de un pedido: `pending` (en cocina) → `delivering` (listo para servir) → `delivered` (entregado).
Los pedidos nunca se borran, así se conservan para estadísticas.

## Historias de usuario cubiertas

1. **Login** – `features/login`. Valida correo y contraseña, traduce los errores de la API
   ("Cannot find user", "Incorrect password", sin conexión) a mensajes claros.
2. **Tomar pedido** – `features/waiter/new-order`. Dos menús (Desayuno / Resto del día),
   nombre de cliente, agregar/quitar productos, resumen con total y envío a cocina (`POST /orders`).
3. **Cocina** – `features/kitchen`. Pedidos pendientes ordenados por llegada, botón
   "Marcar como listo" (`PATCH` con `status: delivering` y `dateProcessed`) y tabla con el
   tiempo de preparación de cada pedido.
4. **Listos para servir** – `features/waiter/ready-orders`. Lista de pedidos en `delivering`,
   botón "Marcar entregado" e historial de entregados.
5. **Trabajadores** – `features/admin/users`. Listar, agregar, editar y eliminar (`/users`).
6. **Productos** – `features/admin/products`. Listar, agregar, editar y eliminar (`/products`).

## Estructura

```
src/app/
├── core/
│   ├── models/         # interfaces: User, Product, Order
│   ├── services/       # AuthService + un servicio por recurso (users, products, orders)
│   ├── guards/         # authGuard (sesión) y roleGuard (rol permitido por ruta)
│   └── interceptors/   # agrega el token Bearer y cierra sesión ante un 401
├── shared/
│   ├── layout/         # barra lateral con navegación según rol
│   └── utils/          # helpers de tiempo
└── features/
    ├── login/
    ├── waiter/         # new-order, ready-orders
    ├── kitchen/
    └── admin/          # users, products
```

## Decisiones técnicas

- **Componentes standalone y control flow nuevo** (`@if`, `@for`), sin NgModules.
- **Signals** para el estado de cada pantalla y `computed` para listas derivadas
  (pendientes, listos, total del pedido).
- **Reactive Forms** en login y en los formularios de administración; `ngModel` solo
  para el nombre de cliente en el pedido.
- **Sesión** guardada en `localStorage` (`bq_token`, `bq_user`); el interceptor la usa en
  cada petición.
- Cocina y "Listos para servir" **se refrescan solos cada 15 segundos** con `interval` de RxJS.
- Los productos de la API tienen categorías `Breakfast`, `Lunch`, `Combos`, `Sides` y
  `Beverages`; `Breakfast` es el menú de desayuno y las demás forman el menú del resto del día.
