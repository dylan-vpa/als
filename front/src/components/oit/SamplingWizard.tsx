import React, { useEffect, useMemo, useState } from "react";
import PhotoUploader from "./PhotoUploader";
import StepIndicator from "./StepIndicator";
import { CheckCircle, AlertCircle } from "lucide-react";

export interface SamplingData {
  tipo_asignacion?: string | null;
  tipo_muestreo?: "texto" | "imagen" | "mixto" | "";
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
  fecha_inicio?: string;
  fecha_fin?: string;
  imagenes_plan?: string[];
  fotos?: string[];
}

interface SamplingWizardProps {
  storageKey: string;
  initial?: SamplingData | null;
  onComplete: (data: SamplingData) => void;
  assignmentTypes?: string[];
  allowed?: boolean;
  scheduledDate?: string | null;
  schema?: any;
}

export default function SamplingWizard({
  storageKey,
  initial,
  onComplete,
  assignmentTypes,
  allowed = true,
  scheduledDate,
}: SamplingWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SamplingData>({
    tipo_asignacion: null,
    tipo_muestreo: "",
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

  // Configuración de pasos según tipo de muestreo
  const getStepsConfig = () => {
    const tipo = data.tipo_muestreo;

    if (tipo === "texto") {
      return {
        labels: ["Información", "Metodología", "Resultados"],
        totalSteps: 3
      };
    } else if (tipo === "imagen") {
      return {
        labels: ["Información", "Metodología", "Evidencias Plan", "Resultados"],
        totalSteps: 4
      };
    } else if (tipo === "mixto") {
      return {
        labels: ["Información", "Metodología", "Plan", "Evidencias", "Resultados"],
        totalSteps: 5
      };
    }

    return {
      labels: ["Información", "Metodología", "Plan", "Evidencias", "Resultados"],
      totalSteps: 5
    };
  };

  const stepsConfig = getStepsConfig();
  const maxStep = stepsConfig.totalSteps - 1;

  // Cargar datos
  useEffect(() => {
    const ls = localStorage.getItem(storageKey);
    if (initial) {
      setData((d) => ({ ...d, ...initial }));
    } else if (ls) {
      try {
        const parsed = JSON.parse(ls);
        setData((d) => ({ ...d, ...parsed }));
      } catch { }
    }
  }, [initial, storageKey]);

  // Persistir cambios
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [storageKey, data]);

  // Validaciones por paso
  const stepValid = (s: number): boolean => {
    const tipo = data.tipo_muestreo;

    // Paso 0: Información (siempre igual)
    if (s === 0) {
      return !!(
        data.tipo_muestreo?.trim() &&
        data.tipo_asignacion?.trim() &&
        data.objetivo && data.objetivo.trim().length > 2 &&
        data.alcance && data.alcance.trim().length > 2
      );
    }

    // Paso 1: Metodología (siempre igual)
    if (s === 1) {
      return !!(
        data.universo && data.universo > 0 &&
        data.criterios_inclusion?.trim() &&
        data.metodo?.trim() &&
        data.tamano && data.tamano > 0
      );
    }

    // Pasos siguientes según tipo
    if (tipo === "texto") {
      if (s === 2) {
        return !!(
          data.hallazgos?.trim() &&
          data.fecha_inicio?.trim() &&
          data.fecha_fin?.trim()
        );
      }
    } else if (tipo === "imagen") {
      if (s === 2) {
        return (data.imagenes_plan || []).length > 0;
      }
      if (s === 3) {
        return !!(
          data.hallazgos?.trim() &&
          data.fecha_inicio?.trim() &&
          data.fecha_fin?.trim() &&
          (data.fotos || []).length > 0
        );
      }
    } else if (tipo === "mixto") {
      if (s === 2) {
        return !!(
          data.unidades?.trim() &&
          data.aleatoriedad?.trim() &&
          data.responsables?.trim()
        );
      }
      if (s === 3) {
        return (data.imagenes_plan || []).length > 0;
      }
      if (s === 4) {
        return !!(
          data.hallazgos?.trim() &&
          data.fecha_inicio?.trim() &&
          data.fecha_fin?.trim() &&
          (data.fotos || []).length > 0
        );
      }
    }

    return true;
  };

  const canNext = useMemo(() => stepValid(step), [step, data]);

  const completedSteps = useMemo(() => {
    return stepsConfig.labels.map((_, idx) => stepValid(idx));
  }, [data, stepsConfig.labels]);

  const goToStep = (idx: number) => {
    if (idx <= maxStep && (idx === 0 || completedSteps[idx - 1])) {
      setStep(idx);
    }
  };

  const next = () => {
    if (step < maxStep && canNext) setStep(step + 1);
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = () => {
    if (!canNext) return;
    onComplete(data);
  };

  // Renderizado de campos
  const renderStep0 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tipo de asignación <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          value={data.tipo_asignacion || ""}
          onChange={(e) => setData({ ...data, tipo_asignacion: e.target.value })}
        >
          <option value="">Seleccione</option>
          {(assignmentTypes || []).map((t, idx) => (
            <option key={idx} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tipo de muestreo <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          value={data.tipo_muestreo || ""}
          onChange={(e) => setData({ ...data, tipo_muestreo: e.target.value as any })}
        >
          <option value="">Seleccione</option>
          <option value="texto">Formulario de texto</option>
          <option value="imagen">Formulario con imágenes</option>
          <option value="mixto">Mixto (texto + imágenes)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Objetivo del muestreo <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Ej. Verificar cumplimiento de OIT en campo"
          value={data.objetivo || ""}
          onChange={(e) => setData({ ...data, objetivo: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Alcance <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Ej. Zonas, periodos y restricciones"
          value={data.alcance || ""}
          onChange={(e) => setData({ ...data, alcance: e.target.value })}
        />
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Población/Universo <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Número total de elementos"
            value={data.universo ?? ""}
            onChange={(e) => setData({ ...data, universo: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Tamaño de la muestra <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="N elementos"
            value={data.tamano ?? ""}
            onChange={(e) => setData({ ...data, tamano: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Método de muestreo <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          value={data.metodo || ""}
          onChange={(e) => setData({ ...data, metodo: e.target.value })}
        >
          <option value="">Seleccione</option>
          <option value="aleatorio_simple">Aleatorio simple</option>
          <option value="sistematico">Sistemático</option>
          <option value="estratificado">Estratificado</option>
          <option value="conglomerados">Por conglomerados</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Criterios de inclusión <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Qué elementos entran en la muestra"
          value={data.criterios_inclusion || ""}
          onChange={(e) => setData({ ...data, criterios_inclusion: e.target.value })}
        />
      </div>
    </div>
  );

  const renderStepPlan = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Unidades de muestreo <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Ej. Puntos, vehículos, equipos…"
          value={data.unidades || ""}
          onChange={(e) => setData({ ...data, unidades: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Aleatoriedad/selección <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Cómo se seleccionan las unidades"
          value={data.aleatoriedad || ""}
          onChange={(e) => setData({ ...data, aleatoriedad: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Responsables <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Nombres y roles"
          value={data.responsables || ""}
          onChange={(e) => setData({ ...data, responsables: e.target.value })}
        />
      </div>
    </div>
  );

  const renderStepEvidenciasPlan = () => (
    <PhotoUploader
      photos={data.imagenes_plan || []}
      onAdd={(photos) => setData({ ...data, imagenes_plan: [...(data.imagenes_plan || []), ...photos] })}
      onRemove={(index) => {
        const arr = [...(data.imagenes_plan || [])];
        arr.splice(index, 1);
        setData({ ...data, imagenes_plan: arr });
      }}
      label="Evidencias del plan de muestreo"
      required={data.tipo_muestreo !== "texto"}
    />
  );

  const renderStepResultados = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Hallazgos preliminares <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Resumen de hallazgos y observaciones"
          value={data.hallazgos || ""}
          onChange={(e) => setData({ ...data, hallazgos: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Fecha inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            value={data.fecha_inicio || ""}
            onChange={(e) => setData({ ...data, fecha_inicio: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Fecha fin <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            value={data.fecha_fin || ""}
            onChange={(e) => setData({ ...data, fecha_fin: e.target.value })}
          />
        </div>
      </div>

      {data.tipo_muestreo !== "texto" && (
        <PhotoUploader
          photos={data.fotos || []}
          onAdd={(photos) => setData({ ...data, fotos: [...(data.fotos || []), ...photos] })}
          onRemove={(index) => {
            const arr = [...(data.fotos || [])];
            arr.splice(index, 1);
            setData({ ...data, fotos: arr });
          }}
          label="Fotos/Evidencias finales"
          required
        />
      )}
    </div>
  );

  // Renderizado dinámico según tipo y paso
  const renderCurrentStep = () => {
    const tipo = data.tipo_muestreo;

    if (step === 0) return renderStep0();
    if (step === 1) return renderStep1();

    if (tipo === "texto") {
      if (step === 2) return renderStepResultados();
    } else if (tipo === "imagen") {
      if (step === 2) return renderStepEvidenciasPlan();
      if (step === 3) return renderStepResultados();
    } else if (tipo === "mixto") {
      if (step === 2) return renderStepPlan();
      if (step === 3) return renderStepEvidenciasPlan();
      if (step === 4) return renderStepResultados();
    }

    return null;
  };

  // Si no está habilitado, mostrar mensaje estético mejorado
  if (!allowed) {
    const formattedDate = scheduledDate
      ? new Date(scheduledDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : "una fecha futura";

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-lg w-full bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            Muestreo No Disponible
          </h3>
          <p className="text-slate-700 mb-6 leading-relaxed">
            El muestreo no está habilitado para este OIT.
            {scheduledDate ? (
              <>
                <br /><br />
                Está programado para el <strong className="text-slate-900">{formattedDate}</strong>.
              </>
            ) : (
              <>
                <br /><br />
                Por favor, revisa que el plan de recursos esté aprobado.
              </>
            )}
          </p>
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Espera la fecha programada</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Asegúrate de aprobar el plan</span>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Si crees que esto es un error, contacta al administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator
        steps={stepsConfig.labels}
        currentStep={step}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      <div className="bg-muted/30 rounded-xl p-6 border border-border">
        {renderCurrentStep()}
      </div>

      {!canNext && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span>Por favor completa todos los campos requeridos para continuar</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          {step > 0 && (
            <button
              onClick={back}
              className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              Volver
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {step < maxStep && (
            <button
              onClick={next}
              disabled={!canNext || !allowed}
              className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          )}
          {step === maxStep && (
            <button
              onClick={finish}
              disabled={!canNext || !allowed}
              className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Finalizar muestreo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}