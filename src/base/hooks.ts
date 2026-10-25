import { useState, useEffect, useRef, useCallback } from "react";
import { onSnapshot } from "firebase/firestore";
import { guardarFusionando } from "./guardar";
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

export function useData<T>(coleccion: string, inicial: T) {
  const [data, setDataLocal] = useState<T>(inicial);
  const actual = useRef<T>(inicial);   // lo que este teléfono tiene a la vista (base del cambio)
  const setData = useCallback((d: T) => { actual.current = d; setDataLocal(d); }, []);

  useEffect(() => {
    const unsub = onSnapshot(dref(coleccion), snap => {
      if (snap.exists()) setData(snap.data() as T);
    });
    return unsub;
  }, [coleccion, setData]);

  const guardar = async (nuevo: T) => {
    const antes = actual.current;
    setData(nuevo);
    await guardarFusionando(dref(coleccion), antes as object, nuevo as object);
  };

  return [data, guardar] as const;
}
