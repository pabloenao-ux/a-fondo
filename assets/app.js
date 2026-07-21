/* ============================================================
   A Fondo — lógica de render (vanilla JS, sin dependencias)
   ============================================================ */

const RUTA_DATOS = "data/episodios.json";

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const largosEstratos = [44, 50, 46, 38, 32];
const coloresEstratos = ["#5B9BC9", "#C2A878", "#F6F3EE", "#E7DDCB", "#8C9296"];
const numFmt = (n) => String(n).padStart(2, "0");

function estratosHTML(escala = 1) {
  return `<div class="portada__estratos">` +
    largosEstratos.map((l, i) =>
      `<i style="width:${l * escala}px;background:${coloresEstratos[i]}"></i>`
    ).join("") + `</div>`;
}

function portadaHTML(ep, grande = false) {
  return `
    <div class="portada ${grande ? "portada--grande" : ""}" data-bg="${ep.bg}" style="background-image:url('assets/img/${ep.id}.webp')">
      <span class="portada__num">A FONDO · ${numFmt(ep.numero)}</span>
      <h3 class="portada__titulo">${ep.titulo}</h3>
    </div>`;
}

function iconoPlay() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.28-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z"/></svg>`;
}

const publicado = (ep) => Boolean(ep.audio);

async function cargarEpisodios() {
  const res = await fetch(RUTA_DATOS + "?v=" + Date.now());
  const data = await res.json();
  return data.sort((a, b) => a.numero - b.numero);
}

/* ============================================================
   HOME  —  hero + filtros + rejilla
   ============================================================ */
let TODOS = [];
let filtroTema = null;
let filtroTexto = "";

async function renderHome() {
  TODOS = await cargarEpisodios();
  $("#conteo").textContent = `${TODOS.length} episodios`;
  renderChips();
  aplicarFiltro();

  $("#busqueda").addEventListener("input", (e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    aplicarFiltro();
  });
}

function temasConConteo() {
  const mapa = new Map();
  TODOS.forEach((ep) => ep.tags.forEach((t) => mapa.set(t, (mapa.get(t) || 0) + 1)));
  return [...mapa.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function renderChips() {
  const chips = temasConConteo();
  const html = [
    `<button class="chip ${filtroTema === null ? "chip--activo" : ""}" data-tema="">Todas <span class="chip__n">${TODOS.length}</span></button>`,
    ...chips.map(([t, n]) =>
      `<button class="chip ${filtroTema === t ? "chip--activo" : ""}" data-tema="${t}">${t} <span class="chip__n">${n}</span></button>`
    ),
  ].join("");
  const cont = $("#chips");
  cont.innerHTML = html;
  cont.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.tema;
      filtroTema = t === "" ? null : t;
      renderChips();
      aplicarFiltro();
    });
  });
}

function aplicarFiltro() {
  const vis = TODOS.filter((ep) => {
    const okTema = !filtroTema || ep.tags.includes(filtroTema);
    const okTexto = !filtroTexto || ep.titulo.toLowerCase().includes(filtroTexto);
    return okTema && okTexto;
  });

  const cont = $("#rejilla");
  if (!vis.length) {
    cont.innerHTML = `<p class="sin-resultados">No hay episodios que coincidan. <button class="enlace-limpiar" onclick="limpiarFiltros()">Ver todos</button></p>`;
    return;
  }

  cont.innerHTML = vis.map((ep) => `
    <a class="tarjeta" href="episodio.html?ep=${ep.id}">
      ${portadaHTML(ep)}
      <div class="tarjeta__cuerpo">
        <div class="tarjeta__tags">${ep.tags.map((t) => `<span class="pildora">${t}</span>`).join("")}</div>
        <div class="tarjeta__pie">
          ${publicado(ep)
            ? `<span class="tarjeta__play">${iconoPlay()} Escuchar</span><span>${ep.duracion || ""}</span>`
            : `<span class="estado-prep">● En preparación</span>`}
        </div>
      </div>
    </a>`).join("");
}

function limpiarFiltros() {
  filtroTema = null;
  filtroTexto = "";
  const inp = $("#busqueda");
  if (inp) inp.value = "";
  renderChips();
  aplicarFiltro();
}

/* ============================================================
   FICHA DE EPISODIO
   ============================================================ */
function segsDesde(mmss) { const [m, s] = mmss.split(":").map(Number); return m * 60 + s; }
function mmssDesde(segs) { return `${numFmt(Math.floor(segs / 60))}:${numFmt(Math.floor(segs % 60))}`; }

async function renderFicha() {
  const id = new URLSearchParams(location.search).get("ep");
  const eps = await cargarEpisodios();
  const ep = eps.find((e) => e.id === id) || eps[0];
  document.title = `${ep.titulo} — A Fondo`;

  const tieneNotas = ep.porque || ep.resumen || (ep.ideas && ep.ideas.length) || (ep.fuentes && ep.fuentes.length);

  $("#ficha").innerHTML = `
    <div class="ficha__col-izq">
      ${portadaHTML(ep, true)}
      ${publicado(ep) ? bloquePlayer(ep) : bloquePrepAudio()}
    </div>
    <div class="ficha__col-der">
      <div class="ficha__tags">${ep.tags.map((t) => `<span class="pildora">${t}</span>`).join("")}</div>
      <h1 class="ficha__titulo">${ep.titulo}</h1>
      <p class="ficha__meta">Episodio ${numFmt(ep.numero)}${ep.duracion ? " · " + ep.duracion : ""}</p>
      ${tieneNotas ? bloquesNotas(ep) : avisoPrep()}
    </div>`;

  if (publicado(ep)) iniciarPlayer(ep);
}

function bloquePlayer(ep) {
  return `
    <div class="player" id="player">
      <button class="player__btn" id="btnPlay" aria-label="Reproducir">${iconoPlay()}</button>
      <div class="player__cuerpo">
        <div class="player__barra" id="barra"><div class="player__progreso" id="progreso"></div></div>
        <div class="player__tiempos"><span id="tActual">00:00</span><span id="tTotal">${ep.duracion || "--:--"}</span></div>
      </div>
    </div>`;
}

function bloquePrepAudio() {
  return `<div class="player player--prep"><span class="estado-prep">● Audio en preparación</span></div>`;
}

function bloquesNotas(ep) {
  let html = "";
  if (ep.porque) html += `<div class="bloque bloque--porque"><p class="bloque__rotulo">Por qué lo elegí</p><p class="bloque__texto">${ep.porque}</p></div>`;
  if (ep.resumen) html += `<div class="bloque"><p class="bloque__rotulo">De qué va</p><p class="bloque__texto">${ep.resumen}</p></div>`;
  if (ep.ideas && ep.ideas.length) html += `<div class="bloque"><p class="bloque__rotulo">Ideas a fondo</p><ul class="ideas">${ep.ideas.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
  if (ep.fuentes && ep.fuentes.length) html += `<div class="bloque"><p class="bloque__rotulo">Fuentes</p><ul class="fuentes">${ep.fuentes.map((f) => `<li><a href="${f.url}" target="_blank" rel="noopener">${f.titulo}</a></li>`).join("")}</ul></div>`;
  return html;
}

function avisoPrep() {
  return `
    <div class="aviso-prep">
      <p class="bloque__rotulo">Ficha en preparación</p>
      <p>Este episodio ya tiene su lugar en <em>A&nbsp;Fondo</em>. Pronto sumaré el audio y las notas: por qué elegí este texto, de qué va y las ideas que vale la pena llevarse.</p>
    </div>`;
}

function iniciarPlayer(ep) {
  const btn = $("#btnPlay"), barra = $("#barra"), progreso = $("#progreso"), tActual = $("#tActual");
  const audio = new Audio(ep.audio);
  audio.preload = "metadata";
  const tTotal = $("#tTotal");
  audio.addEventListener("loadedmetadata", () => { if (tTotal) tTotal.textContent = mmssDesde(audio.duration); });
  const iconoPausa = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z"/></svg>`;
  btn.addEventListener("click", () => {
    if (audio.paused) { audio.play(); btn.innerHTML = iconoPausa; }
    else { audio.pause(); btn.innerHTML = iconoPlay(); }
  });
  audio.addEventListener("timeupdate", () => {
    progreso.style.width = (audio.currentTime / audio.duration) * 100 + "%";
    tActual.textContent = mmssDesde(audio.currentTime);
  });
  barra.addEventListener("click", (e) => {
    const r = barra.getBoundingClientRect();
    audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
  });
}

/* --- arranque --- */
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.pagina === "home") renderHome();
  if (document.body.dataset.pagina === "ficha") renderFicha();
});
