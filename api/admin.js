// ═══════════════════════════════════════════════════════════════════
// API DEL SUPERADMIN (My Wedding) — lo que el navegador NO puede hacer solo:
// crear cuentas, ponerles a qué boda entran (permisos en el token), cambiar claves y suspender.
// Solo responde a una cuenta con rolBoda = "superadmin" (se verifica el token de Firebase).
// Necesita la variable de entorno FIREBASE_SA_JSON (cuenta de servicio de arain-database).
// ═══════════════════════════════════════════════════════════════════
const admin = require("firebase-admin");

const DOMINIO = "@mywedding.invalid";        // igual que src/base/config.ts
const MODULOS = ["organizacion", "invitaciones", "fotos", "luna", "juegos", "juegosAdultos"];

function app() {
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA_JSON || "{}")) });
  return admin;
}
const correoDe = (u) => { const x = String(u || "").trim().toLowerCase(); return x.includes("@") ? x : x + DOMINIO; };
const usuarioValido = (u) => /^[a-z0-9._-]{3,40}$/.test(String(u || "").trim().toLowerCase());
const slug = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "y").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "boda";

async function crearCuenta(a, { usuario, clave, nombre, bodaId }) {
  if (!usuarioValido(usuario)) throw new Error(`El usuario «${usuario}» no sirve: usa 3 a 40 letras, números, punto o guion, sin espacios.`);
  if (String(clave || "").length < 6) throw new Error(`La clave de «${usuario}» tiene que tener al menos 6 caracteres.`);
  const email = correoDe(usuario);
  const ya = await a.auth().getUserByEmail(email).catch(() => null);
  if (ya) throw new Error(`El usuario «${usuario}» ya existe.`);
  const u = await a.auth().createUser({ email, password: clave, displayName: nombre || usuario });
  const claims = { bodaId, rolBoda: "novios" };
  await a.auth().setCustomUserClaims(u.uid, claims);
  await a.firestore().doc(`usuarios_boda/${u.uid}`).set({ usuario: usuario.trim().toLowerCase(), nombre: nombre || usuario, email, ...claims, creado: new Date().toISOString() });
  return { uid: u.uid, usuario };
}

async function acciones(a, b) {
  const db = a.firestore();
  switch (b.accion) {
    case "crearBoda": {
      const nombre = String(b.nombre || "").trim();
      if (!nombre) throw new Error("Falta el nombre de la pareja.");
      const usuarios = (b.usuarios || []).filter((u) => u && String(u.usuario || "").trim());
      if (!usuarios.length) throw new Error("Agrega al menos un usuario para la pareja.");
      let id = slug(b.id || nombre), n = 1;
      while ((await db.doc(`bodas/${id}`).get()).exists) id = `${slug(b.id || nombre)}-${++n}`;
      const modulos = Object.fromEntries(MODULOS.map((m) => [m, !!(b.modulos || {})[m]]));
      await db.doc(`bodas/${id}`).set({ nombre, fecha: b.fecha || "", modulos, estado: "activa", creada: new Date().toISOString(), notas: b.notas || "" });
      const hechos = [];
      try { for (const u of usuarios) hechos.push(await crearCuenta(a, { ...u, bodaId: id })); }
      catch (e) {   // si falla una cuenta, no deja la boda a medias
        for (const h of hechos) { await a.auth().deleteUser(h.uid).catch(() => {}); await db.doc(`usuarios_boda/${h.uid}`).delete().catch(() => {}); }
        await db.doc(`bodas/${id}`).delete(); throw e;
      }
      return { id, usuarios: hechos };
    }
    case "crearUsuario": {
      if (!(await db.doc(`bodas/${b.bodaId}`).get()).exists) throw new Error("Esa boda no existe.");
      return crearCuenta(a, { usuario: b.usuario, clave: b.clave, nombre: b.nombre, bodaId: b.bodaId });
    }
    case "cambiarClave": {
      if (String(b.clave || "").length < 6) throw new Error("La clave tiene que tener al menos 6 caracteres.");
      await a.auth().updateUser(b.uid, { password: b.clave });
      return { ok: true };
    }
    case "borrarUsuario": {
      const d = await db.doc(`usuarios_boda/${b.uid}`).get();
      if (d.exists && d.data().rolBoda === "superadmin") throw new Error("No se puede borrar al superadmin desde acá.");
      await a.auth().deleteUser(b.uid).catch((e) => { if (e.code !== "auth/user-not-found") throw e; });
      await db.doc(`usuarios_boda/${b.uid}`).delete();
      return { ok: true };
    }
    case "estado": {   // suspender = las cuentas de esa boda no pueden entrar (y se cierran sus sesiones)
      const suspender = b.estado === "suspendida";
      await db.doc(`bodas/${b.bodaId}`).set({ estado: suspender ? "suspendida" : "activa", estadoCambio: new Date().toISOString() }, { merge: true });
      const us = await db.collection("usuarios_boda").where("bodaId", "==", b.bodaId).get();
      for (const d of us.docs) {
        await a.auth().updateUser(d.id, { disabled: suspender }).catch(() => {});
        if (suspender) await a.auth().revokeRefreshTokens(d.id).catch(() => {});
      }
      return { ok: true, cuentas: us.size };
    }
    default: throw new Error("Acción desconocida.");
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Solo POST" });
  try {
    const a = app();
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const yo = await a.auth().verifyIdToken(token).catch(() => null);
    if (!yo || yo.rolBoda !== "superadmin") return res.status(403).json({ error: "Solo el superadmin." });
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    res.status(200).json(await acciones(a, body));
  } catch (e) {
    res.status(400).json({ error: e.message || String(e) });
  }
};
