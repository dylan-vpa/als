import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ClipboardList, 
  FileDown, 
  RefreshCcw, 
  CalendarDays, 
  Info, 
  FileText, 
  ArrowLeft, 
  MoreVertical,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight
} from "lucide-react";
import Button from "../../ui/Button";
import { OitDocumentOut } from "../../../services/api";
import type { SamplingData } from "../SamplingWizard";

interface OitDetailHeaderProps {
  doc: OitDocumentOut;
  statusLabel: string;
  sampling: SamplingData | null;
  offline?: boolean;
  checkingDocument: boolean;
  downloading: boolean;
  downloadingHtml: boolean;
  downloadingBundle: boolean;
  onCheckDocument: () => void;
  onDownloadReport: () => void;
  onDownloadReportHtml: () => void;
  onDownloadBundle: () => void;
}

export default function OitDetailHeader({
  doc,
  statusLabel,
  sampling,
  offline,
  checkingDocument,
  downloading,
  downloadingHtml,
  downloadingBundle,
  onCheckDocument,
  onDownloadReport,
  onDownloadReportHtml,
  onDownloadBundle
}: OitDetailHeaderProps) {
  const navigate = useNavigate();
  const samplingDisabled = !(doc.can_sample ?? false);
  const pendingGaps = doc.pending_gap_count ?? 0;
  const samplingHelper = samplingDisabled
    ? pendingGaps > 0
      ? "No se puede iniciar el muestreo porque faltan recursos por conseguir."
      : "Aprueba el plan para habilitar el muestreo."
    : null;

  // Función para obtener el icono y color según el estado
  const getStatusIcon = () => {
    switch (doc.status) {
      case 'check':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'alerta':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (doc.status) {
      case 'check':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'alerta':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
      {/* Header principal con navegación */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/oit')}
            className="p-2 hover:bg-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">OIT #{doc.id}</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
              {getStatusIcon()}
              {statusLabel}
            </span>
            {pendingGaps > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium border border-amber-200">
                <AlertTriangle className="w-3 h-3" />
                {pendingGaps} faltante{pendingGaps === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {/* Menú de acciones compacto */}
        <div className="flex items-center gap-2">
          {/* Acciones principales agrupadas */}
          <div className="hidden md:flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadBundle}
              disabled={!doc.reference_bundle_available || downloadingBundle || (offline ?? false)}
              className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              title="Descargar README"
            >
              <Info className="w-4 h-4" />
            </Button>

            <div className="w-px h-4 bg-slate-200" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onCheckDocument}
              disabled={checkingDocument || (offline ?? false)}
              className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              title="Verificar documento"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>

            <div className="w-px h-4 bg-slate-200" />

            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadReport}
              disabled={!sampling || downloading || (offline ?? false)}
              className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              title="Descargar informe"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadReportHtml}
              disabled={!sampling || downloadingHtml || (offline ?? false)}
              className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              title="Descargar informe HTML"
            >
              <FileText className="w-4 h-4" />
            </Button>
          </div>

          {/* Botón de muestreo - destacado */}
          {samplingDisabled ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              title={samplingHelper || undefined}
              className="border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100"
            >
              <ClipboardList className="w-4 h-4 mr-1.5" />
              Muestreo
            </Button>
          ) : (
            <Link
              to={`/dashboard/oit/${doc.id}/muestreo`}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
            >
              <ClipboardList className="w-4 h-4" />
              Muestreo
            </Link>
          )}
        </div>
      </div>

      {/* Información del documento */}
      <div className="bg-white/60 rounded-lg p-4 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-2 truncate">
          {doc.original_name || doc.filename}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            {new Date(doc.created_at).toLocaleString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {sampling && (
            <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Muestreo completado
            </span>
          )}
          {offline && (
            <span className="inline-flex items-center gap-1.5 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              Sin conexión
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
