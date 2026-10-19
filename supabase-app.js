/* Integración ConcientizaTeam ↔ Supabase JS v2.
   Funciona en GitHub Pages; no necesita Node ni servidor propio.
   Mantén este archivo junto a los tres HTML y supabase-config.js. */
(() => {
  "use strict";

  const cfg = window.SUPABASE_CONFIG;
  const factory = window.supabase?.createClient;
  const forms = ["form-registro", "form-login", "form-contacto"]
    .map(id => document.getElementById(id)).filter(Boolean);

  function avisar(form, texto, esError = false) {
    const caja = form.querySelector(".mensaje-form");
    if (!caja) return;
    caja.textContent = texto; // textContent evita interpretar HTML de terceros.
    caja.hidden = false;
    caja.style.color = esError ? "#a82b2b" : "#12614e";
    caja.style.fontWeight = "600";
    caja.style.marginTop = "0.8rem";
  }
  function activar(form) {
    const boton = form.querySelector('button[type="submit"]');
    if (boton) boton.disabled = false;
    return boton;
  }
  if (!cfg || !factory || !/^https:\/\/.+\.supabase\.co$/.test(cfg.url || "") ||
      !cfg.publishableKey?.startsWith("sb_publishable_") ||
      cfg.publishableKey.includes("REEMPLAZAR")) {
    forms.forEach(f => {
      activar(f);
      const btn = f.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      avisar(f, "Falta configurar Supabase o cargar la biblioteca. Revisa supabase-config.js y la consola.", true);
    });
    console.error("ConcientizaTeam: verifica supabase-config.js y la carga CDN de Supabase.");
    return;
  }

  const client = factory(cfg.url, cfg.publishableKey);
  forms.forEach(activar);
  // En caso de que el script.js original tenga validaciones de demostración:
  window.addEventListener("load", () => forms.forEach(activar));

  async function conBoton(form, trabajo) {
    const boton = activar(form);
    if (boton) boton.disabled = true;
    try {
      await trabajo();
    } catch (err) {
      console.error("Error en Supabase:", err);
      avisar(form, err?.message || "No se pudo completar la operación.", true);
    } finally {
      if (boton) boton.disabled = false;
    }
  }

  const registro = document.getElementById("form-registro");
  if (registro) registro.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopImmediatePropagation(); // impide que un script.js anterior simule el envío.
    void conBoton(registro, async () => {
      if (!registro.reportValidity()) return;
      const nombre = document.getElementById("reg-nombre").value.trim();
      const email = document.getElementById("reg-correo").value.trim();
      const clave = document.getElementById("reg-clave").value;
      const repetir = document.getElementById("reg-clave2").value;
      if (clave !== repetir) return avisar(registro, "Las contraseñas no coinciden.", true);
      const { data, error } = await client.auth.signUp({
        email,
        password: clave,
        options: {
          data: { nombre },
          emailRedirectTo: new URL("login.html", window.location.href).href
        }
      });
      if (error) throw error;
      registro.reset();
      avisar(registro, data.session
        ? "¡Cuenta creada! Ya tienes una sesión iniciada."
        : "Solicitud de registro recibida. Revisa tu correo y confirma tu cuenta si recibiste un enlace.");
    });
  }, true);

  const login = document.getElementById("form-login");
  let botonSalir;
  async function mostrarSesion(user) {
    if (!login || !user) return;
    login.hidden = true;
    const panel = document.getElementById("panel-acceso");
    let caja = document.getElementById("sesion-activa");
    if (!caja) {
      caja = document.createElement("div");
      caja.id = "sesion-activa";
      caja.className = "aviso";
      panel.appendChild(caja);
    }
    caja.textContent = "Sesión iniciada como: " + (user.email || "usuario");
    if (!botonSalir) {
      botonSalir = document.createElement("button");
      botonSalir.type = "button";
      botonSalir.textContent = "Cerrar sesión";
      botonSalir.style.marginTop = "1rem";
      panel.appendChild(botonSalir);
      botonSalir.addEventListener("click", async () => {
        botonSalir.disabled = true;
        const { error } = await client.auth.signOut();
        botonSalir.disabled = false;
        if (error) return alert("No se pudo cerrar la sesión: " + error.message);
        caja.remove();
        botonSalir.remove();
        botonSalir = null;
        login.hidden = false;
        login.reset();
      });
    }
  }
  if (login) {
    login.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      void conBoton(login, async () => {
        if (!login.reportValidity()) return;
        const email = document.getElementById("login-correo").value.trim();
        const password = document.getElementById("login-clave").value;
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await mostrarSesion(data.user);
      });
    }, true);
    void client.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) return mostrarSesion(data.user);
    }).catch(console.error);
  }

  const contacto = document.getElementById("form-contacto");
  if (contacto) contacto.addEventListener("submit", (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    void conBoton(contacto, async () => {
      if (!contacto.reportValidity()) return;
      const registro = {
        nombre: document.getElementById("nombre").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        asunto: document.getElementById("asunto").value.trim(),
        mensaje: document.getElementById("mensaje").value.trim()
      };
      const { error } = await client.from("mensajes_contacto").insert(registro);
      if (error) throw error;
      contacto.reset();
      avisar(contacto, "¡Mensaje enviado! Tu consulta quedó registrada correctamente.");
    });
  }, true);
})();
