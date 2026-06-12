# Atlas

Atlas es una aplicación móvil para descubrir, rastrear y coleccionar las tiendas Apple Store de todo el mundo. Sirve como mapa mundial y como cuaderno personal de tus visitas a tiendas.

**Atlas está construido para durar.** Este es un proyecto 100% de código abierto impulsado por la comunidad. Depende de sus usuarios para enriquecer los detalles de las tiendas, agregar ubicaciones faltantes y compartir fotos. Dado que la aplicación no depende de una base de datos central de pago, seguirá existiendo mientras la comunidad siga usándola y actualizándola.

## Características

- **Mapa Mundial:** Explora cientos de tiendas Apple Store en todo el mundo.
- **Rastreo de Visitas:** Marca tiendas como visitadas, añade la fecha y guarda notas personales.
- **Detalles de Tiendas:** Ver contexto histórico, detalles de arquitectura y fotos.
- **Local Primero (Local First):** Todos tus datos personales (visitas, fotos privadas, notas) se quedan en tu dispositivo. Sin rastreo, sin base de datos externa.
- **Impulsado por la Comunidad:** Propón nuevas tiendas, sugiere ediciones o envía fotos directamente desde la aplicación.
- **Exportar e Importar:** Haz copias de seguridad de tus visitas y fotos personales de forma segura en un archivo local, y restáuralas cuando quieras.

## Datos y Fotos

Los datos de las tiendas son de código abierto y se gestionan en este repositorio en `packages/data/stores/`.
Las fotos públicas se alojan mediante GitHub Releases para mantener la aplicación ligera y rápida, sin depender de servicios de terceros de pago.

## Cómo ejecutar el proyecto

1. Installa las dependencias:
   ```bash
   npm install
   ```

2. Inicia la aplicación móvil:
   ```bash
   npm run mobile:start
   ```

## Contribuir

¿Quieres añadir una tienda que falta o compartir una foto? Consulta la [Guía de Contribución](CONTRIBUTING.md) para saber cómo ayudar a construir la base de datos.

## Licencia

Este proyecto tiene doble licencia para proteger tanto el código como los datos:

- **Código:** El código fuente de la aplicación está bajo la licencia [GNU General Public License v3.0 (GPLv3)](../../LICENSE). Cualquier persona es libre de usar, modificar y distribuir el código, siempre y cuando todas las modificaciones también sean publicadas como código abierto bajo la GPLv3.
- **Datos:** El conjunto de datos de las tiendas (`packages/data`) está bajo la licencia [Open Data Commons Open Database License (ODbL) v1.0](../../packages/data/LICENSE-DATA). Eres libre de copiar, distribuir y utilizar la base de datos, siempre y cuando atribuyas a los creadores y compartas las modificaciones bajo la misma licencia.
- **Fotos:** Las fotos individuales aportadas al proyecto permanecen bajo la licencia especificada en los datos (usualmente CC-BY-4.0).

## Aviso legal

Este es un proyecto estudiantil no oficial. No está afiliado, patrocinado ni respaldado por Apple Inc. Apple, el logotipo de Apple y Apple Store son marcas comerciales de Apple Inc., registradas en los EE. UU. y en otros países.
