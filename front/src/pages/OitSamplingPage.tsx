import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import SamplingWizard, { SamplingData } from "../components/oit/SamplingWizard";
import { apiClient, OitDocumentOut } from "../services/api";
import Button from "../components/ui/Button";
import { 
  ClipboardList, 
  Save, 
  ArrowLeft, 
  Eye, 
  Download, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  FileText,
  BarChart3,
  Clock
} from "lucide-react";

export default function OitSamplingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<OitDocumentOut | null>(null);
  const [sampling, setSampling] = useState<SamplingData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const storageKey = `oit_sampling_${id}`;
  const assignmentTypes = (doc?.resource_plan?.assignments || []).map((a: any) => (a?.request?.type || "")).filter((v: string) => !!v);
  const samplingAllowed = !!(doc?.can_sample);
  const scheduledDate = doc?.approved_schedule_date;

  useEffect(() => {
    const docId = Number(id);
    if (!docId) return;
    (async () => {
      try {
        const detail = await apiClient.getOit(docId);
        setDoc(detail);
        /* 
        try {
          const sc = await apiClient.getSamplingSchema(docId);
          setSchema(sc);
        } catch (err) {
          console.warn("No se pudo cargar esquema de muestreo IA", err);
        }
        */
      } catch (error) {
        console.error(error);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setSampling(JSON.parse(raw));
      } catch (error) {
        console.error("Error parsing sampling data", error);
      }
    }
  }, [id, storageKey]);

  function handleComplete(data: SamplingData) {
    setSaving(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setSampling(data);
      const docId = Number(id);
      if (docId) {
        const downloadTime = data.fecha_fin ? new Date(data.fecha_fin).toISOString() : null;
        // Notificar backend de muestreo completado y programar descarga del export
        apiClient
          .completeSampling(docId, data as any, downloadTime)
          .then(() => {
            console.log("Muestreo marcado como completado y export programado");
          })
          .catch((err) => {
            console.error("Error al completar muestreo:", err);
          });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    localStorage.removeItem(storageKey);
    setSampling(null);
  }

  function handlePreview() {
    if (!sampling) return;
    setExportData(sampling);
    setShowPreview(true);
  }

  function handleExportData() {
    if (!sampling) return;
    
    const data = {
      ...sampling,
      oit_id: id,
      oit_name: doc?.original_name || doc?.filename,
      export_date: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `muestreo_oit_${id}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="secondary" 
        onClick={() => navigate('/dashboard/oit')} 
        className="inline-flex items-center gap-2 text-sm md:text-base"
        size="sm"
      >
        <ArrowLeft size={16} /> 
        <span className="hidden sm:inline">Volver</span>
      </Button>
      <Button 
        variant="secondary" 
        onClick={handlePreview} 
        disabled={!sampling} 
        className="inline-flex items-center gap-2 text-sm md:text-base"
        size="sm"
      >
        <Eye size={16} /> 
        <span className="hidden sm:inline">Vista previa</span>
      </Button>
      <Button 
        variant="secondary" 
        onClick={handleExportData} 
        disabled={!sampling} 
        className="inline-flex items-center gap-2 text-sm md:text-base"
        size="sm"
      >
        <Download size={16} /> 
        <span className="hidden sm:inline">Exportar</span>
      </Button>
      <Button 
        variant="secondary" 
        onClick={handleReset} 
        disabled={!sampling} 
        className="inline-flex items-center gap-2 text-sm md:text-base"
        size="sm"
      >
        <ClipboardList size={16} /> 
        <span className="hidden sm:inline">Reiniciar</span>
      </Button>
      <Button 
        variant="primary" 
        onClick={() => sampling && handleComplete(sampling)} 
        disabled={saving || !sampling} 
        className="inline-flex items-center gap-2 text-sm md:text-base"
        size="sm"
      >
        <Save size={16} /> 
        <span className="hidden sm:inline">Guardar cambios</span>
      </Button>
    </div>
  );

  return (
    <DashboardLayout title={`Muestreo OIT #${id}`} actions={headerActions}>
      <div className="max-w-4xl mx-auto px-2 sm:px-0">
        {/* Información del estado del muestreo */}
        {doc && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/dashboard/oit')}
                    className="p-2 hover:bg-white/60 transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 truncate">{doc.original_name || doc.filename}</h2>
                    <p className="text-sm text-slate-600">OIT #{doc.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {samplingAllowed ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">Muestreo habilitado</span>
                      <span className="sm:hidden">Habilitado</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="hidden sm:inline">Muestreo no habilitado</span>
                      <span className="sm:hidden">No habilitado</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!samplingAllowed && scheduledDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-amber-900 mb-1 text-sm sm:text-base">Muestreo programado</h3>
                    <p className="text-amber-800 text-xs sm:text-sm mb-2">
                      El muestreo estará disponible el <strong className="break-words">{formatDateTime(scheduledDate)}</strong>
                    </p>
                    <p className="text-amber-700 text-xs">
                      Por favor, regresa en la fecha programada para realizar el muestreo.
                    </p>
                  </div>
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 flex-shrink-0" />
                </div>
              </div>
            )}

            {!samplingAllowed && !scheduledDate && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-red-900 mb-1 text-sm sm:text-base">Muestreo no disponible</h3>
                    <p className="text-red-800 text-xs sm:text-sm">
                      El muestreo no está habilitado para este OIT. Por favor, revisa el plan de recursos y asegúrate de que esté aprobado.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard de muestreo */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm">
          <SamplingWizard
            storageKey={storageKey}
            initial={sampling || undefined}
            assignmentTypes={assignmentTypes}
            allowed={samplingAllowed}
            scheduledDate={scheduledDate}
            onComplete={handleComplete}
          />
        </div>

        {/* Modal de vista previa */}
        {showPreview && exportData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-2">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">Vista previa del muestreo</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    className="p-1 sm:p-2"
                  >
                    ×
                  </Button>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">Información general</h4>
                    <div className="grid gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div><span className="font-medium">Tipo de asignación:</span> {exportData.tipo_asignacion}</div>
                      <div><span className="font-medium">Tipo de muestreo:</span> {exportData.tipo_muestreo}</div>
                      <div><span className="font-medium">Objetivo:</span> {exportData.objetivo}</div>
                      <div><span className="font-medium">Alcance:</span> {exportData.alcance}</div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">Metodología</h4>
                    <div className="grid gap-1 sm:gap-2 text-xs sm:text-sm">
                      <div><span className="font-medium">Universo:</span> {exportData.universo}</div>
                      <div><span className="font-medium">Tamaño de muestra:</span> {exportData.tamano}</div>
                      <div><span className="font-medium">Método:</span> {exportData.metodo}</div>
                      <div><span className="font-medium">Criterios:</span> {exportData.criterios_inclusion}</div>
                    </div>
                  </div>
                  
                  {exportData.hallazgos && (
                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">Hallazgos</h4>
                      <p className="text-xs sm:text-sm text-slate-700">{exportData.hallazgos}</p>
                    </div>
                  )}
                  
                  {exportData.fotos && exportData.fotos.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-3 sm:p-4">
                      <h4 className="font-medium text-slate-900 mb-2 text-sm sm:text-base">Evidencias</h4>
                      <p className="text-xs sm:text-sm text-slate-700">{exportData.fotos.length} fotos adjuntas</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="primary"
                  onClick={handleExportData}
                  className="w-full sm:flex-1"
                  size="sm"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Exportar datos
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowPreview(false)}
                  className="w-full sm:flex-1"
                  size="sm"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
