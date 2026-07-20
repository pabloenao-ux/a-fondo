# A Fondo

Web del podcast **A Fondo** — conversaciones creadas con IA (NotebookLM) a partir de las lecturas, ensayos y textos que le interesan a Juan Pablo Henao V.

> *Hace visible el valor de la cultura.*

## Estado

**Prototipo (fase 1).** Sitio estático con el sistema de marca personal de JP
(paleta "cielo y tierra" + IBM Plex + isotipo de estratos).

- **23 fichas** cargadas desde `MiPodcast/` (los 22 episodios; dos llevaban "ep_03",
  por eso se renumeró 1→23).
- Cada ficha está **en preparación**: título y temática puestos; falta el audio y las notas,
  que JP añade después.
- **Temáticas provisionales** inferidas del título para que el filtro funcione desde ya.
- Audios (`.m4a`, ~975 MB) **todavía no cargados** — irán en un almacén externo (p. ej. Cloudflare R2).

## Estructura

```
a-fondo/
├── index.html          Home: hero + buscador + filtro por temática + rejilla
├── episodio.html       Ficha de un episodio (?ep=<id>)
├── assets/
│   ├── estilo.css      Sistema visual de marca
│   ├── app.js          Render, filtro/buscador y reproductor
│   └── favicon.svg
└── data/
    └── episodios.json  Contenido de los episodios (una entrada por ficha)
```

## Verlo en local

```powershell
py -3 -m http.server 4321 --directory "C:\Users\pablo\Desktop\a-fondo"
# luego abrir http://localhost:4321
```

## Desarrollar una ficha (añadir audio + notas)

En `data/episodios.json`, sobre la entrada del episodio:

1. `audio`: ruta o URL del `.m4a` (al subirlo, pasa de "En preparación" a reproducible).
2. `duracion`: `"MM:SS"`.
3. `tags`: ajusta las temáticas (alimentan el filtro de la home).
4. `porque`, `resumen`, `ideas`: los textos de la ficha (si están vacíos, se muestra el aviso "en preparación").

El campo `archivo` guarda el nombre `.m4a` original de `MiPodcast/`, para mapear cada audio con su ficha.

## Fase 2 (pendiente de decidir con JP)

- Subir los audios a un almacén externo (Cloudflare R2 / Backblaze B2) y enlazarlos.
- Confirmar el paso a **Astro** (cada episodio como Markdown) si se prefiere a editar el JSON.
- Desplegar en Vercel / Netlify (subdominio gratis) y, más adelante, dominio propio.
- Opcional: feed RSS para Spotify / Apple Podcasts.
