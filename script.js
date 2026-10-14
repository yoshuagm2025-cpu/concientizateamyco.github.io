/* ConcientizaTeam | Interacciones locales. No se almacenan credenciales,
   no se simulan sesiones y no se envían formularios a una base de datos. */
'use strict';
document.documentElement.classList.add('js');
const ICONO_OJO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const ICONO_OJO_TACHADO = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 3 18 18M10 5.2c.6-.1 1.3-.2 2-.2 6.5 0 10 7 10 7a18 18 0 0 1-3 4M6 6.5A19 19 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1.1M10 10a3 3 0 0 0 4 4"/></svg>';

function obtenerError(campo) {
  const valor = campo.value.trim();
  if (campo.required && !valor) return campo.type === 'password' ? 'Escribe tu contraseña.' : 'Completa este campo.';
  if (['nombre', 'reg-nombre', 'asunto'].includes(campo.id) && valor.length < 3) return 'Escribe al menos 3 caracteres.';
  if (campo.type === 'email' && (campo.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor))) return 'Escribe un correo válido, por ejemplo nombre@dominio.com.';
  if (campo.id === 'mensaje' && valor.length < 10) return 'Describe tu consulta con al menos 10 caracteres.';
  if (campo.id === 'reg-clave') {
    if (campo.value.length < 8 || campo.value.length > 128) return 'La contraseña debe tener entre 8 y 128 caracteres.';
    if (!/[A-Za-z]/.test(campo.value) || !/\d/.test(campo.value)) return 'Incluye letras y números en la contraseña.';
  }
  if (campo.id === 'reg-clave2' && campo.value !== document.getElementById('reg-clave').value) return 'Las contraseñas no coinciden.';
  if (campo.maxLength > 0 && campo.value.length > campo.maxLength) return `Usa como máximo ${campo.maxLength} caracteres.`;
  return '';
}
function actualizarDescripcion(campo, id, agregar) {
  const ids = new Set((campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  agregar ? ids.add(id) : ids.delete(id);
  if (ids.size) campo.setAttribute('aria-describedby', [...ids].join(' '));
  else campo.removeAttribute('aria-describedby');
}
function validarCampo(campo) {
  const texto = obtenerError(campo), id = `error-${campo.id}`;
  let error = document.getElementById(id);
  campo.classList.toggle('campo-invalido', Boolean(texto));
  if (texto) {
    campo.setAttribute('aria-invalid', 'true');
    if (!error) {
      error = document.createElement('p'); error.id = id; error.className = 'mensaje-error';
      // Insert outside the eye wrapper so the icon never moves with error text.
      (campo.closest('.campo-clave') || campo).insertAdjacentElement('afterend', error);
    }
    error.textContent = texto; actualizarDescripcion(campo, id, true);
  } else {
    campo.removeAttribute('aria-invalid'); if (error) error.remove(); actualizarDescripcion(campo, id, false);
  }
  return !texto;
}
function mostrarMensaje(formulario, texto, fallo = false) {
  const region = formulario.querySelector('.mensaje-form');
  region.hidden = false; region.className = `mensaje-form ${fallo ? 'mensaje-fallo' : 'mensaje-exito'}`;
  region.textContent = texto;
  return region;
}
function configurarFormulario(formulario, alValidar) {
  if (!formulario) return;
  formulario.noValidate = true;
  const campos = [...formulario.querySelectorAll('input:not([type="hidden"]),textarea')];
  campos.forEach(campo => {
    campo.addEventListener('blur', () => validarCampo(campo));
    campo.addEventListener('input', () => {
      formulario.querySelector('.mensaje-form').hidden = true;
      if (campo.hasAttribute('aria-invalid')) validarCampo(campo);
    });
  });
  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const invalidos = campos.filter(campo => !validarCampo(campo));
    if (invalidos.length) {
      mostrarMensaje(formulario, 'Revisa los campos indicados antes de continuar.', true);
      invalidos[0].focus(); return;
    }
    alValidar(formulario);
  });
  formulario.querySelector('button[type="submit"]').disabled = false;
}
function iniciarMostrarClave() {
  document.querySelectorAll('input[type="password"]').forEach(campo => {
    const envoltorio = document.createElement('div'); envoltorio.className = 'campo-clave';
    campo.before(envoltorio); envoltorio.append(campo);
    const boton = document.createElement('button');
    boton.type = 'button'; boton.className = 'campo-clave-boton'; boton.innerHTML = ICONO_OJO;
    boton.setAttribute('aria-label', 'Mostrar contraseña'); boton.setAttribute('aria-controls', campo.id);
    boton.setAttribute('aria-pressed', 'false');
    boton.addEventListener('click', () => {
      const visible = campo.type === 'password'; campo.type = visible ? 'text' : 'password';
      boton.innerHTML = visible ? ICONO_OJO_TACHADO : ICONO_OJO;
      boton.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
      boton.setAttribute('aria-pressed', String(visible));
    });
    envoltorio.append(boton);
  });
}
function iniciarFormularios() {
  const contacto = document.getElementById('form-contacto');
  const servicios = { seguridad: 'Capacitación en seguridad', riesgos: 'Concienciación sobre riesgos', 'buenas-practicas': 'Buenas prácticas laborales', informatica: 'Seguridad informática básica' };
  if (contacto) {
    const servicio = new URLSearchParams(window.location.search).get('servicio');
    if (servicios[servicio]) contacto.elements.asunto.value = `Consulta: ${servicios[servicio]}`;
    configurarFormulario(contacto, form => {
      const asunto = form.elements.asunto.value.trim();
      const cuerpo = `Nombre: ${form.elements.nombre.value.trim()}\nCorreo de contacto: ${form.elements.correo.value.trim()}\n\n${form.elements.mensaje.value.trim()}`;
      const region = mostrarMensaje(form, 'Tu correo está preparado. Ábrelo en tu aplicación de email y confirma el envío allí. Los datos permanecen en el formulario.');
      const enlace = document.createElement('a'); enlace.className = 'boton boton-pequeno';
      enlace.textContent = 'Abrir mi aplicación de correo';
      enlace.href = `mailto:contacto@concientizateam.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
      region.append(document.createElement('br'), enlace);
    });
  }
  configurarFormulario(document.getElementById('form-login'), form => {
    mostrarMensaje(form, 'El formato es válido. No se inició sesión: el servicio de autenticación aún no está conectado.');
    ocultarYLimpiarClaves(form);
  });
  const registro = document.getElementById('form-registro');
  if (registro) {
    const clave = document.getElementById('reg-clave'), confirmacion = document.getElementById('reg-clave2');
    clave.addEventListener('input', () => { if (confirmacion.value || confirmacion.hasAttribute('aria-invalid')) validarCampo(confirmacion); });
    configurarFormulario(registro, form => {
      mostrarMensaje(form, 'Los datos son válidos. No se creó ninguna cuenta: el registro aún no está conectado a un servidor. No se guardó tu contraseña.');
      ocultarYLimpiarClaves(form);
    });
  }
}
function ocultarYLimpiarClaves(form) {
  form.querySelectorAll('.campo-clave').forEach(wrapper => {
    const campo = wrapper.querySelector('input'), boton = wrapper.querySelector('button');
    campo.value = ''; campo.type = 'password'; boton.innerHTML = ICONO_OJO;
    boton.setAttribute('aria-label', 'Mostrar contraseña'); boton.setAttribute('aria-pressed', 'false');
  });
}
function iniciarMenu() {
  const boton = document.querySelector('.menu-toggle'), menu = document.getElementById('menu-principal');
  const cerrar = () => { menu.classList.remove('abierto'); boton.setAttribute('aria-expanded', 'false'); };
  boton.addEventListener('click', () => boton.setAttribute('aria-expanded', String(menu.classList.toggle('abierto'))));
  menu.addEventListener('click', e => { if (e.target.closest('a')) cerrar(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('abierto')) { cerrar(); boton.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.sitio-encabezado')) cerrar(); });
  window.matchMedia('(max-width: 900px)').addEventListener('change', cerrar);
}
function iniciarServicios() {
  const catalogo = document.querySelector('.servicios-catalogo'); if (!catalogo) return;
  const detalles = [...catalogo.querySelectorAll('details')], controles = document.createElement('div');
  controles.className = 'servicios-controles';
  const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'boton boton-secundario boton-pequeno';
  const actualizar = () => { const abiertos = detalles.every(d => d.open); boton.textContent = abiertos ? 'Cerrar todos los detalles' : 'Abrir todos los detalles'; boton.setAttribute('aria-expanded', String(abiertos)); };
  boton.addEventListener('click', () => { const abrir = !detalles.every(d => d.open); detalles.forEach(d => { d.open = abrir; }); actualizar(); });
  detalles.forEach(d => d.addEventListener('toggle', actualizar));
  controles.append(boton); catalogo.before(controles); actualizar();
}
function iniciarCarrusel() {
  const carrusel = document.querySelector('.carrusel'); if (!carrusel) return;
  const slides = [...carrusel.querySelectorAll('.carrusel-diapositiva')];
  const movimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pausa = carrusel.querySelector('.carrusel-pausa');
  let actual = 0, timer = null, pausado = movimiento.matches, dentro = false;
  const puntos = slides.map((slide, i) => {
    const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'carrusel-punto';
    boton.setAttribute('aria-label', `Ver imagen ${i + 1}`);
    boton.addEventListener('click', () => { ir(i); programar(); });
    carrusel.querySelector('.carrusel-puntos').append(boton); return boton;
  });
  function ir(i) {
    actual = (i + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      slide.classList.toggle('activa', index === actual); slide.setAttribute('aria-hidden', String(index !== actual));
      puntos[index].classList.toggle('activo', index === actual); puntos[index].setAttribute('aria-current', String(index === actual));
    });
  }
  function programar() {
    clearInterval(timer);
    if (!pausado && !movimiento.matches && !dentro && !carrusel.contains(document.activeElement) && !document.hidden) timer = setInterval(() => ir(actual + 1), 6000);
  }
  function actualizarPausa() {
    pausa.textContent = pausado ? '▶' : 'Ⅱ'; pausa.setAttribute('aria-label', pausado ? 'Reanudar carrusel' : 'Pausar carrusel'); pausa.setAttribute('aria-pressed', String(pausado));
    carrusel.querySelector('.carrusel-pista').setAttribute('aria-live', pausado ? 'polite' : 'off');
  }
  pausa.addEventListener('click', () => { pausado = !pausado; actualizarPausa(); programar(); });
  carrusel.querySelector('.carrusel-anterior').addEventListener('click', () => { ir(actual - 1); programar(); });
  carrusel.querySelector('.carrusel-siguiente').addEventListener('click', () => { ir(actual + 1); programar(); });
  carrusel.addEventListener('mouseenter', () => { dentro = true; programar(); });
  carrusel.addEventListener('mouseleave', () => { dentro = false; programar(); });
  carrusel.addEventListener('focusin', programar);
  carrusel.addEventListener('focusout', () => setTimeout(programar, 0));
  document.addEventListener('visibilitychange', programar);
  movimiento.addEventListener('change', () => { pausado = movimiento.matches; actualizarPausa(); programar(); });
  let inicio = null;
  carrusel.addEventListener('touchstart', e => { inicio = [e.touches[0].clientX,e.touches[0].clientY]; }, {passive: true});
  carrusel.addEventListener('touchend', e => {
    if (!inicio) return;
    const dx = e.changedTouches[0].clientX - inicio[0], dy = e.changedTouches[0].clientY - inicio[1];
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { ir(actual + (dx < 0 ? 1 : -1)); programar(); }
    inicio = null;
  }, {passive: true});
  ir(0); actualizarPausa(); programar();
}
function iniciarSubir() {
  if (!document.getElementById('presentacion')) return;
  const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'boton boton-subir'; boton.textContent = '↑'; boton.setAttribute('aria-label', 'Volver al inicio');
  const actualizar = () => boton.classList.toggle('visible', window.scrollY > 400);
  boton.addEventListener('click', () => window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));
  document.body.append(boton); window.addEventListener('scroll', actualizar, {passive: true}); actualizar();
}
// Recover the user's original artwork when files with their original names are supplied.
function iniciarImagenes() {
  document.querySelectorAll('img[data-original-src]').forEach(img => {
    const original = new Image(); original.onload = () => { img.src = original.src; };
    original.src = img.dataset.originalSrc;
  });
}
iniciarMostrarClave();
iniciarFormularios();
iniciarMenu();
iniciarServicios();
iniciarCarrusel();
iniciarSubir();
iniciarImagenes();
