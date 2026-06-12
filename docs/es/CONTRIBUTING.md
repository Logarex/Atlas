# Contribuir a Atlas

Gracias por querer ayudar. Este documento cubre todo lo que necesitas saber para añadir o actualizar los datos y fotos de las tiendas.

---

## Datos de las tiendas

Todas las tiendas se encuentran como archivos JSON individuales en `packages/data/stores/`. Cada archivo se llama `apple-[store-id].json`.

### Añadir o editar una tienda

1. Encuentra el archivo existente o crea uno nuevo utilizando un archivo existente como referencia.
2. Rellena los campos. Los obligatorios son `id`, `name`, `status`, `city`, `countryCode`, y `address`.
3. Ejecuta el script de validación desde la raíz del repositorio para detectar cualquier error:

```bash
npm run data:validate
```

4. Regenera el paquete móvil para que la aplicación incorpore tus cambios:

```bash
npm run mobile:generate-stores
```

5. Abre un pull request. Una breve descripción de lo que has cambiado es suficiente.

---

## Fotos

### Dónde se guardan las fotos

Las fotos públicas de las tiendas se encuentran en `apps/mobile/assets/stores/`. Se sirven a los usuarios a través de **GitHub Releases**: sube el archivo como un recurso de lanzamiento (release asset) y luego haz referencia a su URL en el JSON de la tienda. Esto mantiene el tamaño de la aplicación pequeño mientras utiliza el CDN de GitHub (Fastly) para una entrega rápida.

### Añadir una foto

1. Toma o consigue una foto de tu propiedad o que esté bajo una licencia Creative Commons o equivalente.
2. Expórtala como **WebP**, con un tamaño de unos 1200 px en el lado más largo. Mantén el archivo por debajo de 500 KB cuando sea posible.
3. Para una miniatura (mostrada en la tarjeta de la tienda antes de tocar los detalles), exporta una segunda versión de unos 400 px de ancho y nómbrala con el sufijo `-thumb`.
4. Sube ambos archivos al [GitHub Release `store-photos`](https://github.com/Logarex/Atlas/releases).
5. Copia la URL de descarga de cada archivo de la lista de recursos del lanzamiento.
6. Añade una entrada de foto al archivo JSON de la tienda:

```json
{
  "id": "apple-store-name-1",
  "url": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1.webp",
  "thumbUrl": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1-thumb.webp",
  "credit": "Tu nombre",
  "license": "CC-BY-4.0",
  "caption": "Breve descripción de la foto",
  "takenOn": "YYYY-MM-DD"
}
```

7. Ejecuta `npm run mobile:generate-stores` y abre un pull request.

### Directrices para las fotos

- Solo envía fotos que hayas tomado tú mismo o que claramente sean de uso libre.
- Rellena siempre el `credit` y la `license`.
- Evita fotos con personas reconocibles a menos que tengas su consentimiento — y establece `"peopleVisible": true` en el formulario de contribución de la aplicación si lo envías a través de ella.

---

## Contribuciones a través de la aplicación

La aplicación tiene formularios integrados para sugerir correcciones y enviar fotos. Estos crean issues en GitHub que los mantenedores revisan antes de fusionar cualquier cosa en la base de datos.

---

## Preguntas

Abre un issue en GitHub si algo no está claro o si te encuentras con algún problema.
