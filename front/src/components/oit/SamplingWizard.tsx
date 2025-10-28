import React, { useEffect, useMemo, useState } from "react";

export interface SamplingData {
  objetivo?: string;
  alcance?: string;
  universo?: number | null;
  criterios_inclusion?: string;
  metodo?: string;
  tamano?: number | null;
  unidades?: string;
  aleatoriedad?: string;
  responsables?: string;
  hallazgos?: string;
  fecha_inicio?: string; // ISO yyyy-mm-dd
  fecha_fin?: string; // ISO yyyy-mm-dd
  // Nuevos campos para evidencias/imágenes
  imagenes_plan?: string[]; // data URLs
  fotos?: string[]; // data URLs
}

export default function SamplingWizard({
  storageKey,
  initial,
  onComplete,
}: {
  storageKey: string;
  initial?: SamplingData | null;
  onComplete: (data: SamplingData) => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SamplingData>({
    objetivo: "",
    alcance: "",
    universo: null,
    criterios_inclusion: "",
    metodo: "",
    tamano: null,
    unidades: "",
    aleatoriedad: "",
    responsables: "",
    hallazgos: "",
    fecha_inicio: "",
    fecha_fin: "",
    imagenes_plan: [],
    fotos: [],
  });

  // Cargar de initial o localStorage
  useEffect(() => {
    const ls = localStorage.getItem(storageKey);
    if (initial) {
      setData((d) => ({ ...d, ...initial }));
    } else if (ls) {
      try {
        const parsed = JSON.parse(ls);
        setData((d) => ({ ...d, ...parsed }));
      } catch {}
    }
  }, [initial, storageKey]);

  // Persistir cambios
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [storageKey, data]);

  // Validaciones por paso
  const stepValid = (s: number) => {
    if (s === 0) {
      return (
        (data.objetivo || "").trim().length > 2 &&
        (data.alcance || "").trim().length > 2
      );
    }
    if (s === 1) {
      return (
        !!data.universo &&
        data.universo > 0 &&
        (data.criterios_inclusion || "").trim().length > 0
      );
    }
    if (s === 2) {
      return (
        (data.metodo || "").trim().length > 0 &&
        !!data.tamano &&
        data.tamano > 0
      );
    }
    if (s === 3) {
      return (
        (data.unidades || "").trim().length > 0 &&
        (data.aleatoriedad || "").trim().length > 0 &&
        (data.responsables || "").trim().length > 0
      );
    }
    if (s === 4) {
      return (
        (data.hallazgos || "").trim().length > 0 &&
        (data.fecha_inicio || "").trim().length > 0 &&
        (data.fecha_fin || "").trim().length > 0
      );
    }
    return true;
  };

  const canNext = useMemo(() => stepValid(step), [step, data]);

  const allowedStep = useMemo(() => {
    // Paso máximo alcanzable según validaciones previas
    let max = 0;
    for (let i = 0; i <= 4; i++) {
      if (i === 0 || (i > 0 && stepValid(i - 1))) {
        if (stepValid(i)) {
          max = i;
        } else {
          break;
        }
      }
    }
    return Math.max(max, step); // nunca bajar el actual al calcular
  }, [data, step]);

  const goToStep = (idx: number) => {
    if (idx <= allowedStep) setStep(idx);
  };

  const next = () => {
    if (step < 4 && canNext) setStep(step + 1);
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = () => {
    if (!canNext) return;
    onComplete(data);
  };

  // Helpers de imagen
  const readFilesAsDataUrls = async (files: File[], maxEachMB = 1.5, maxCount = 6) => {
    const selected = files.slice(0, maxCount);
    const promises = selected.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          if (file.size > maxEachMB * 1024 * 1024) {
            reject(new Error(`La imagen ${file.name} supera ${maxEachMB}MB`));
            return;
          }
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = () => reject(new Error("No se pudo leer la imagen"));
          fr.readAsDataURL(file);
        })
    );
    const results: string[] = [];
    for (const p of promises) {
      try {
        const r = await p;
        results.push(r);
      } catch (e) {
        console.warn(e);
      }
    }
    return results;
  };

  // Progreso visual
  const progressPct = ((step + 1) / 5) * 100;

  return (
    <div>
      {/* Progress bar */}
      <div style={{ height: 6, background: "var(--border)", borderRadius: 4, marginBottom: 12 }}>
        <div
          style={{
            width: `${progressPct}%`,
            height: 6,
            background: "var(--primary)",
            borderRadius: 4,
            transition: "width 250ms ease",
          }}
        />
      </div>

      {/* Stepper */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["Definición", "Población", "Muestra", "Plan", "Resultados"].map((label, idx) => (
          <div
            key={idx}
            className={`badge ${idx === step ? "badge-success" : ""}`}
            style={{
              cursor: idx <= allowedStep ? "pointer" : "not-allowed",
              opacity: idx <= allowedStep ? 1 : 0.5,
              border: "1px solid var(--border)",
              background: idx === step ? "var(--primary)" : "var(--secondary)",
              color: idx === step ? "#fff" : "var(--text-primary)",
            }}
            onClick={() => goToStep(idx)}
            title={label}
          >
            Paso {idx + 1}: {label}
          </div>
        ))}
      </div>

      {/* Paso 0 */}
      {step === 0 && (
        <div className="form-grid" style={{ gap: 12 }}>
          <div className="input-group">
            <label className="label">
              Objetivo del muestreo <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              placeholder="Ej. Verificar cumplimiento de OIT en campo"
              value={data.objetivo || ""}
              onChange={(e) => setData({ ...data, objetivo: e.target.value })}
            />
            {(data.objetivo || "").trim().length <= 2 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group">
            <label className="label">
              Alcance <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              placeholder="Ej. Zonas, periodos y restricciones"
              value={data.alcance || ""}
              onChange={(e) => setData({ ...data, alcance: e.target.value })}
            />
            {(data.alcance || "").trim().length <= 2 && (
              <small className="error">Requerido</small>
            )}
          </div>
        </div>
      )}

      {/* Paso 1 */}
      {step === 1 && (
        <div className="form-grid" style={{ gap: 12 }}>
          <div className="input-group">
            <label className="label">
              Población/Universo <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="Número total de elementos"
              value={data.universo ?? ""}
              onChange={(e) =>
                setData({ ...data, universo: e.target.value ? Number(e.target.value) : null })
              }
            />
            {(!data.universo || data.universo <= 0) && (
              <small className="error">Debe ser mayor a 0</small>
            )}
          </div>
          <div className="input-group">
            <label className="label">
              Criterios de inclusión <span style={{ color: "#d33" }}>*</span>
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Qué elementos entran en la muestra"
              value={data.criterios_inclusion || ""}
              onChange={(e) => setData({ ...data, criterios_inclusion: e.target.value })}
            />
            {(data.criterios_inclusion || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
        </div>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <div className="form-grid" style={{ gap: 12 }}>
          <div className="input-group">
            <label className="label">
              Método de muestreo <span style={{ color: "#d33" }}>*</span>
            </label>
            <select
              className="input"
              value={data.metodo || ""}
              onChange={(e) => setData({ ...data, metodo: e.target.value })}
            >
              <option value="">Seleccione</option>
              <option value="aleatorio_simple">Aleatorio simple</option>
              <option value="sistematico">Sistemático</option>
              <option value="estratificado">Estratificado</option>
              <option value="conglomerados">Por conglomerados</option>
            </select>
            {(data.metodo || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group">
            <label className="label">
              Tamaño de la muestra <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="N elementos"
              value={data.tamano ?? ""}
              onChange={(e) =>
                setData({ ...data, tamano: e.target.value ? Number(e.target.value) : null })
              }
            />
            {(!data.tamano || data.tamano <= 0) && (
              <small className="error">Debe ser mayor a 0</small>
            )}
          </div>
        </div>
      )}

      {/* Paso 3 */}
      {step === 3 && (
        <div className="form-grid" style={{ gap: 12 }}>
          <div className="input-group">
            <label className="label">
              Unidades de muestreo <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              placeholder="Ej. Puntos, vehículos, equipos…"
              value={data.unidades || ""}
              onChange={(e) => setData({ ...data, unidades: e.target.value })}
            />
            {(data.unidades || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group">
            <label className="label">
              Aleatoriedad/selección <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              placeholder="Cómo se seleccionan las unidades"
              value={data.aleatoriedad || ""}
              onChange={(e) => setData({ ...data, aleatoriedad: e.target.value })}
            />
            {(data.aleatoriedad || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group">
            <label className="label">
              Responsables <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              placeholder="Nombres y roles"
              value={data.responsables || ""}
              onChange={(e) => setData({ ...data, responsables: e.target.value })}
            />
            {(data.responsables || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label className="label">Evidencia del plan (imágenes opcionales, máx. 6 × 1.5MB)</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const urls = await readFilesAsDataUrls(files);
                setData({ ...data, imagenes_plan: [...(data.imagenes_plan || []), ...urls] });
              }}
            />
            {(data.imagenes_plan || []).length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {(data.imagenes_plan || []).map((src, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img src={src} alt={`plan-${idx}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ position: "absolute", top: 2, right: 2, padding: "2px 6px", fontSize: 12 }}
                      onClick={() => {
                        const arr = [...(data.imagenes_plan || [])];
                        arr.splice(idx, 1);
                        setData({ ...data, imagenes_plan: arr });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paso 4 */}
      {step === 4 && (
        <div className="form-grid" style={{ gap: 12 }}>
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label className="label">
              Hallazgos preliminares <span style={{ color: "#d33" }}>*</span>
            </label>
            <textarea
              className="input"
              rows={4}
              placeholder="Resumen de hallazgos y observaciones"
              value={data.hallazgos || ""}
              onChange={(e) => setData({ ...data, hallazgos: e.target.value })}
            />
            {(data.hallazgos || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group">
            <label className="label">
              Fecha inicio <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              type="date"
              value={data.fecha_inicio || ""}
              onChange={(e) => setData({ ...data, fecha_inicio: e.target.value })}
            />
            {(data.fecha_inicio || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group">
            <label className="label">
              Fecha fin <span style={{ color: "#d33" }}>*</span>
            </label>
            <input
              className="input"
              type="date"
              value={data.fecha_fin || ""}
              onChange={(e) => setData({ ...data, fecha_fin: e.target.value })}
            />
            {(data.fecha_fin || "").trim().length === 0 && (
              <small className="error">Requerido</small>
            )}
          </div>
          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label className="label">Fotos/Evidencias (opcionales, máx. 6 × 1.5MB)</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const urls = await readFilesAsDataUrls(files);
                setData({ ...data, fotos: [...(data.fotos || []), ...urls] });
              }}
            />
            {(data.fotos || []).length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {(data.fotos || []).map((src, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <img src={src} alt={`foto-${idx}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ position: "absolute", top: 2, right: 2, padding: "2px 6px", fontSize: 12 }}
                      onClick={() => {
                        const arr = [...(data.fotos || [])];
                        arr.splice(idx, 1);
                        setData({ ...data, fotos: arr });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
        <div>
          {step > 0 && (
            <button className="btn btn-secondary" onClick={back}>
              Volver
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {step < 4 && (
            <button className="btn btn-primary" onClick={next} disabled={!canNext}>
              Siguiente
            </button>
          )}
          {step === 4 && (
            <button className="btn btn-success" onClick={finish} disabled={!canNext}>
              Finalizar muestreo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}