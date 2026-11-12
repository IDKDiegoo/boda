import { useState, useEffect, useRef, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
import { encolarGuardado } from "./guardar";
import { BODA_FECHA } from "./config";
import { dref } from "./firebase";

export type VideoInfo = { tipo: "youtube" | "tiktok" | "otro"; id?: string; url: string };

export function getVideoInfo(url: string): VideoInfo | null {
  if (!url) return null;
  // YouTube: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/);
  if (yt) return { tipo:"youtube", id:yt[1], url };
  // TikTok
  if (url.includes("tiktok.com")) return { tipo:"tiktok", url };
  // Otro link genérico
  if (url.startsWith("http")) return { tipo:"otro", url };
  return null;
}

export function useCuentaRegresiva() {
  const [tiempo, setTiempo] = useState({ dias:0, horas:0, minutos:0, segundos:0 });
  useEffect(() => {
    const calc = () => {
      const diff = BODA_FECHA.getTime() - Date.now();
      if (diff <= 0) { setTiempo({ dias:0, horas:0, minutos:0, segundos:0 }); return; }
      setTiempo({
        dias:     Math.floor(diff / 86400000),
        horas:    Math.floor((diff % 86400000) / 3600000),
        minutos:  Math.floor((diff % 3600000) / 60000),
        segundos: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  return tiempo;
}

/**
 * Un documento en vivo que se puede editar. Mientras este teléfono tenga cambios por guardar, lo que llega
 * del servidor NO reemplaza la pantalla (si no, se borraban letras al escribir); cuando todo quedó
 * guardado se muestra lo último del servidor, que ya trae lo de este teléfono y lo de los demás.
 */
export function useDocVivo<T>(coleccion: string, inicial: T, siNoExiste?: T) {
  const [data, setDataLocal] = useState<T>(inicial);
  const actual = useRef<T>(inicial);   // lo que este teléfono tiene a la vista (base del cambio)
  const porGuardar = useRef(0);
  const guardado = useRef<{ v: T } | null>(null);   // lo último del servidor que llegó mientras se guardaba
  const setData = useCallback((d: T) => { actual.current = d; setDataLocal(d); }, []);

  useEffect(() => {
    const unsub = onSnapshot(dref(coleccion), snap => {
      const v = snap.exists() ? (snap.data() as T) : siNoExiste;
      if (v === undefined) return;
      if (porGuardar.current > 0) { guardado.current = { v }; return; }
      setData(v);
    }, e => console.warn("Sin conexión en vivo con", coleccion, e?.code));
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coleccion, setData]);

  const guardar = async (nuevo: T) => {
    const antes = actual.current;
    setData(nuevo);
    porGuardar.current++;
    try { await encolarGuardado(dref(coleccion), antes as object, nuevo as object); }
    finally {
      porGuardar.current--;
      if (porGuardar.current === 0 && guardado.current) { const g = guardado.current.v; guardado.current = null; setData(g); }
    }
  };

  return [data, guardar] as const;
}

export function useData<T>(coleccion: string, inicial: T) {
  return useDocVivo<T>(coleccion, inicial);
}
