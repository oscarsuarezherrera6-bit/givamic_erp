# GIVAMIC - Sistema de Almacén (Mini ERP)

Sistema integrado de gestión de almacén con 9 módulos, autenticación por roles y generación de vales PDF en formato SIG-FO-103.

## Stack

- React 18 + Vite 5
- Tailwind CSS 3
- React Router 6
- Recharts (gráficos)
- jsPDF (generación PDF vales de salida)
- localStorage (persistencia)

## Instalación y ejecución

```bash
cd givamic-erp
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| admin@givamic.pe | admin123 | Administrador |
| almacen@givamic.pe | almacen123 | Almacenero |

## Módulos

| Módulo | Ruta | Descripción |
|---|---|---|
| Dashboard | / | KPIs, gráficos, resúmenes |
| Facturas de Compra | /facturas | Registro de facturas, ingreso automático a stock |
| Transferencias | /transferencias | Salidas al almacén central → sede, genera vale PDF |
| Vales de Salida | /vales | Historial de vales, reporte mensual por sede |
| Movimientos | /movimientos | Historial con exportación CSV |
| Inventario | /inventario | Stock valorizado por sede |
| Máquinas | /maquinas | Lustradoras y aspiradoras por sede |
| Maestros | /maestros | Sedes, Productos, Proveedores, Usuarios, Logo |

## Datos iniciales

El sistema carga automáticamente:
- 3 sedes (Almacén Central, San Isidro, Miraflores)
- 10 productos de limpieza con precios en soles
- 3 proveedores peruanos con RUC
- 5 facturas de los últimos 2 meses
- 10 transferencias (VS-0001 al VS-0010)
- 4 máquinas (2 lustradoras, 2 aspiradoras)

## Agregar nuevas sedes

1. Ir a **Maestros → Sedes**
2. Clic en **Agregar Sede**
3. Ingresar nombre, dirección y responsable
4. La nueva sede aparece inmediatamente en los dropdowns de Transferencias e Inventario

## PDF Vale de Salida (SIG-FO-103)

- Formato A4 horizontal
- Encabezado con logo (configurable en Maestros → Logo)
- Banda de datos generales en azul corporativo
- Tabla numerada de hasta 14 ítems con precios
- Sección de firmas de aprobación
- Nombre del archivo: `Vale_Salida_VS-XXXX_[sede]_[fecha].pdf`

## Notas

- Los datos se persisten en `localStorage` del navegador
- Limpiar localStorage resetea todos los datos al seed inicial
- El número de vale es correlativo y nunca se repite (VS-0001, VS-0002…)
