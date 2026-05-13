import React, { useCallback, useRef, useState } from 'react';
import {
  Upload, X, Check, AlertCircle, Loader2, BarChart3,
  FileStack, Pentagon, ChevronDown, Layers,
} from 'lucide-react';
import { API_BASE } from '@/shared/lib/api';
import { useProfileStore } from '@/shared/stores';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'polygon' | 'spatial' | 'shapefile';

interface UploadResult {
  success: boolean;
  imported: number;
  polygons?: number;
  lines?: number;
  points?: number;
  layer_name?: string;
  errors: string[];
  parcels?: { code: string }[];
}

interface PreviewData {
  counts: { polygon: number; line: number; point: number };
  total: number;
  property_keys: string[];
  sample_values: Record<string, string>;
}

const SHP_EXTENSIONS = ['.shp', '.dbf', '.shx', '.prj', '.cpg', '.qpj'];
const SHP_REQUIRED = ['.shp', '.dbf', '.shx'];

const TAB_CONFIG: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'polygon',   label: 'ნაკვეთი',    icon: <Pentagon className="h-3.5 w-3.5" />,  desc: 'ნაკვეთის საზღვრები' },
  { id: 'spatial',   label: 'ფენა',       icon: <Layers className="h-3.5 w-3.5" />,    desc: 'ხაზი / წერტილი / პოლიგონი' },
  { id: 'shapefile', label: 'Shapefile',  icon: <FileStack className="h-3.5 w-3.5" />, desc: '.shp ფაილები' },
];

// ─── Property Selection Modal ─────────────────────────────────────────────────

function PropertyModal({
  preview,
  onConfirm,
  onCancel,
}: {
  preview: PreviewData;
  onConfirm: (nameField: string | null, prefix: string | null) => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<'auto' | 'field' | 'prefix'>('auto');
  const [selectedField, setSelectedField] = useState<string>(preview.property_keys[0] || '');
  const [prefix, setPrefix] = useState('');

  const handleSubmit = () => {
    if (mode === 'field') onConfirm(selectedField || null, null);
    else if (mode === 'prefix') onConfirm(null, prefix.trim() || null);
    else onConfirm(null, null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#161b22] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">ფაილის პარამეტრები</h2>
            <p className="text-[11px] text-white/40 mt-0.5">
              {preview.counts.polygon} პოლიგონი
              {preview.counts.line > 0 && ` · ${preview.counts.line} ხაზი`}
              {preview.counts.point > 0 && ` · ${preview.counts.point} წერტილი`}
            </p>
          </div>
          <button onClick={onCancel} className="text-white/30 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Mode selector */}
          <div>
            <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider mb-2">
              ნაკვეთის სახელი
            </p>
            <div className="space-y-2">
              {/* Auto */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                <input
                  type="radio" name="mode" value="auto" checked={mode === 'auto'}
                  onChange={() => setMode('auto')}
                  className="accent-green-400"
                />
                <div>
                  <p className="text-xs font-medium text-white/80">ავტომატური კოდი</p>
                  <p className="text-[10px] text-white/35">შემთხვევითი მოკლე ID (ნაგულისხმევი)</p>
                </div>
              </label>

              {/* From property */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                <input
                  type="radio" name="mode" value="field" checked={mode === 'field'}
                  onChange={() => setMode('field')}
                  className="accent-green-400 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80">ფაილის ველი</p>
                  <p className="text-[10px] text-white/35 mb-2">GeoJSON property-ს გამოყენება</p>
                  {mode === 'field' && preview.property_keys.length > 0 && (
                    <div className="relative">
                      <select
                        value={selectedField}
                        onChange={e => setSelectedField(e.target.value)}
                        className="w-full text-xs bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-white/80 appearance-none pr-7"
                      >
                        {preview.property_keys.map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 h-3 w-3 text-white/30 pointer-events-none" />
                    </div>
                  )}
                  {mode === 'field' && selectedField && preview.sample_values[selectedField] && (
                    <p className="text-[10px] text-white/30 mt-1.5 truncate">
                      მაგ: <span className="text-white/50">{preview.sample_values[selectedField]}</span>
                    </p>
                  )}
                  {mode === 'field' && preview.property_keys.length === 0 && (
                    <p className="text-[10px] text-yellow-400/70">ვლები ვერ მოიძებნა ფაილში</p>
                  )}
                </div>
              </label>

              {/* Manual prefix */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-colors">
                <input
                  type="radio" name="mode" value="prefix" checked={mode === 'prefix'}
                  onChange={() => setMode('prefix')}
                  className="accent-green-400 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80">ხელით პრეფიქსი</p>
                  <p className="text-[10px] text-white/35 mb-2">მაგ. "ნაკვეთი" → ნაკვეთი_1, ნაკვეთი_2…</p>
                  {mode === 'prefix' && (
                    <input
                      type="text"
                      value={prefix}
                      onChange={e => setPrefix(e.target.value)}
                      placeholder="პრეფიქსი..."
                      autoFocus
                      className="w-full text-xs bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-white/80 placeholder-white/20 focus:outline-none focus:border-green-500/50"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Property preview table */}
          {preview.property_keys.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2">
                ფაილის ველები
              </p>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden max-h-36 overflow-y-auto">
                {preview.property_keys.slice(0, 12).map(k => (
                  <div key={k} className="flex items-center gap-3 px-3 py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-[11px] font-mono text-[#58a6ff]/80 w-32 flex-shrink-0 truncate">{k}</span>
                    <span className="text-[11px] text-white/35 truncate">{preview.sample_values[k] || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-white/[0.08] text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            გაუქმება
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-semibold transition-colors"
          >
            ატვირთვა ({preview.counts.polygon} ნაკვეთი)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ParcelUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const { activeProfile } = useProfileStore();
  const profileId = activeProfile?.id;

  const [tab, setTab] = useState<Tab>('polygon');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shpFiles, setShpFiles] = useState<File[]>([]);
  const [spatialFiles, setSpatialFiles] = useState<File[]>([]);
  const [spatialResults, setSpatialResults] = useState<Record<string, { status: 'done' | 'error'; message: string }>>({});
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const shpInputRef = useRef<HTMLInputElement>(null);

  const profileParam = profileId ? `?profile_id=${profileId}` : '';
  const token = () => localStorage.getItem('token');

  const resetState = () => {
    setError(null);
    setResult(null);
    setAnalysisResult(null);
    setPreview(null);
    setPendingFile(null);
    setSpatialFiles([]);
    setSpatialResults({});
  };

  // ── Preview then modal ──────────────────────────────────────────────────────
  const previewAndUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setAnalysisResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/upload/geojson-preview`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json().catch(async () => {
        const t = await res.text().catch(() => 'Server error');
        throw new Error(t.slice(0, 120));
      });
      if (!res.ok) throw new Error(data.detail || 'Preview failed');

      if (data.counts.polygon === 0) {
        // No polygons — upload lines/points directly
        await doUpload(file, null, null);
      } else {
        setPendingFile(file);
        setPreview(data as PreviewData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Actual polygon upload after modal confirm ───────────────────────────────
  const doUpload = async (
    file: File,
    nameField: string | null,
    prefix: string | null,
  ) => {
    setPreview(null);
    setPendingFile(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const params = new URLSearchParams();
      if (profileId) params.set('profile_id', profileId);
      if (nameField) params.set('parcel_name_field', nameField);
      if (prefix) params.set('manual_prefix', prefix);
      const qs = params.toString() ? `?${params}` : '';

      const res = await fetch(`${API_BASE}/upload/geojson${qs}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json().catch(async () => {
        const t = await res.text().catch(() => 'Server error');
        throw new Error(t.slice(0, 120));
      });
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setResult(data);
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Unified spatial upload (auto-detects line / point / polygon) ───────────
  const uploadSpatial = async (file: File, options?: { skipCallback?: boolean }) => {
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const params = new URLSearchParams();
      params.set('default_name', file.name.replace(/\.[^.]+$/, ''));
      if (profileId) params.set('profile_id', profileId);
      const qs = `?${params.toString()}`;
      const res = await fetch(`${API_BASE}/upload/spatial${qs}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json().catch(async () => {
        const t = await res.text().catch(() => 'Server error');
        throw new Error(t.slice(0, 120));
      });
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setResult(data);
      if (!options?.skipCallback) {
        onUploadComplete?.();
      }
      return { ok: true as const, data };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      return { ok: false as const, error: msg };
    } finally {
      setUploading(false);
    }
  };

  // ── Upload multiple spatial files sequentially ──────────────────────────────
  const uploadAllSpatial = async () => {
    if (spatialFiles.length === 0) return;
    const files = [...spatialFiles];
    setSpatialFiles([]);
    const results: Record<string, { status: 'done' | 'error'; message: string }> = {};
    let anySuccess = false;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const key = `${file.name}::${i}`;
      const res = await uploadSpatial(file, { skipCallback: true });
      if (res.ok) {
        anySuccess = true;
        const d = res.data;
        const parts = [
          (d.polygons ?? 0) > 0 ? `${d.polygons} პოლიგონი` : '',
          (d.lines ?? 0) > 0 ? `${d.lines} ხაზი` : '',
          (d.points ?? 0) > 0 ? `${d.points} წერტილი` : '',
          (d.skipped ?? 0) > 0 ? `${d.skipped} გამოტოვებული` : '',
        ].filter(Boolean).join(', ') || '0 ობიექტი';
        results[key] = { status: 'done', message: parts };
      } else {
        results[key] = { status: 'error', message: res.error };
      }
    }
    setSpatialResults(results);
    if (anySuccess) {
      onUploadComplete?.();
    }
  };

  // ── Shapefile ───────────────────────────────────────────────────────────────
  const uploadShapefileComponents = async () => {
    const missing = SHP_REQUIRED.filter(
      ext => !shpFiles.some(f => f.name.toLowerCase().endsWith(ext))
    );
    if (missing.length > 0) { setError(`სავალდებულო ფაილები: ${missing.join(', ')}`); return; }
    setUploading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    shpFiles.forEach(f => formData.append('files', f));
    try {
      const res = await fetch(`${API_BASE}/upload/shapefile-files${profileParam}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json().catch(async () => {
        const t = await res.text().catch(() => 'Server error');
        throw new Error(t.slice(0, 120));
      });
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setResult(data);
      setShpFiles([]);
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Analysis ────────────────────────────────────────────────────────────────
  const runAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const res = await fetch(`${API_BASE}/upload/analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
      });
      const data = await res.json().catch(async () => {
        const t = await res.text().catch(() => 'Server error');
        throw new Error(t.slice(0, 120));
      });
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setAnalysisResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Drag & drop helpers ─────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.geojson') || f.name.endsWith('.json')
    );
    if (files.length === 0) { setError('.geojson ან .json ფაილი საჭიროა'); return; }
    if (tab === 'polygon') {
      if (files.length > 1) { setError('ნაკვეთების ჩასატვირთად მხოლოდ 1 ფაილი აირჩიეთ'); return; }
      previewAndUpload(files[0]);
    } else if (tab === 'spatial') {
      setSpatialFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        return [...prev, ...files.filter(f => !names.has(f.name))];
      });
      setSpatialResults({});
    }
  }, [tab]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    e.target.value = '';
    if (tab === 'polygon') {
      if (files.length > 1) { setError('ნაკვეთების ჩასატვირთად მხოლოდ 1 ფაილი აირჩიეთ'); return; }
      previewAndUpload(files[0]);
    } else if (tab === 'spatial') {
      setSpatialFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        return [...prev, ...files.filter(f => !names.has(f.name))];
      });
      setSpatialResults({});
    }
  };

  const handleShpFilesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => SHP_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)));
    const invalid = selected.filter(f => !SHP_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (invalid.length > 0) setError(`გამოტოვებულია: ${invalid.map(f => f.name).join(', ')}`);
    setShpFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
    e.target.value = '';
  };

  const extColor = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    const colors: Record<string, string> = {
      shp: 'text-green-400 bg-green-400/10 border-green-400/20',
      dbf: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      shx: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      prj: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      cpg: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    };
    return colors[ext] || 'text-text-muted bg-bg-border/20 border-bg-border/30';
  };

  const missingRequired = SHP_REQUIRED.filter(
    ext => !shpFiles.some(f => f.name.toLowerCase().endsWith(ext))
  );

  const isGeoJsonTab = tab === 'polygon' || tab === 'spatial';

  return (
    <>
      {/* Property selection modal */}
      {preview && pendingFile && (
        <PropertyModal
          preview={preview}
          onConfirm={(nameField, prefix) => doUpload(pendingFile, nameField, prefix)}
          onCancel={() => { setPreview(null); setPendingFile(null); }}
        />
      )}

      <div className="space-y-3">
        {/* Tab switcher */}
        <div className="grid grid-cols-3 rounded-lg border border-bg-border/50 overflow-hidden text-[10px] font-medium">
          {TAB_CONFIG.map((t, i) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); resetState(); }}
              className={`flex flex-col items-center gap-1 py-2 px-1 transition-colors ${
                i < TAB_CONFIG.length - 1 ? 'border-r border-bg-border/50' : ''
              } ${tab === t.id ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-primary'}`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Drop zone — GeoJSON tabs */}
        {isGeoJsonTab && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer
              ${isDragging ? 'border-accent bg-accent/10 scale-[1.02]' : 'border-bg-border/50 bg-bg-card/50 hover:border-accent/50 hover:bg-bg-card'}
              ${uploading ? 'pointer-events-none opacity-70' : ''}`}
          >
            <input
              type="file"
              accept=".geojson,.json"
              multiple={tab === 'spatial'}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="flex flex-col items-center gap-2">
              {uploading
                ? <Loader2 className="h-8 w-8 text-accent animate-spin" />
                : <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-accent' : 'text-text-muted'}`} />}
              <div>
                <p className="text-xs font-medium text-text-primary">
                  {uploading
                    ? (tab === 'polygon' ? 'ფაილი იანალიზდება...' : 'იტვირთება...')
                    : 'ჩააგდეთ ან აირჩიეთ ფაილი'}
                </p>
                <p className="text-[10px] text-text-muted mt-1">
                  {tab === 'polygon' && 'GeoJSON პოლიგონები → ნაკვეთები'}
                  {tab === 'spatial' && 'ავტომატური: ხაზი / წერტილი / პოლიგონი → სივრცული ფენები'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Spatial file queue */}
        {tab === 'spatial' && spatialFiles.length > 0 && (
          <div className="space-y-2">
            <div className="rounded-lg border border-bg-border/40 bg-bg-card/40 divide-y divide-bg-border/30">
              {spatialFiles.map(f => (
                <div key={f.name} className="flex items-center gap-2 px-3 py-2">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border text-purple-400 bg-purple-400/10 border-purple-400/20">
                    .{f.name.split('.').pop()?.toLowerCase()}
                  </span>
                  <span className="text-xs text-text-secondary truncate flex-1">{f.name}</span>
                  <span className="text-[10px] text-text-muted flex-shrink-0">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    onClick={() => setSpatialFiles(prev => prev.filter(x => x.name !== f.name))}
                    className="text-text-muted hover:text-red-400 flex-shrink-0"
                    disabled={uploading}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={uploadAllSpatial}
              disabled={uploading || spatialFiles.length === 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />იტვირთება...</>
                : <><Upload className="h-3.5 w-3.5" />{spatialFiles.length} ფაილის ატვირთვა</>}
            </button>
          </div>
        )}

        {/* Spatial upload results */}
        {tab === 'spatial' && Object.keys(spatialResults).length > 0 && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 space-y-1.5">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">დასრულებულია</span>
              <button onClick={() => setSpatialResults({})} className="ml-auto hover:text-green-300">
                <X className="h-3.5 w-3.5 text-green-400" />
              </button>
            </div>
            {Object.entries(spatialResults).map(([key, r]) => {
              const displayName = key.split('::')[0];
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.status === 'done' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-text-secondary truncate flex-1">{displayName}</span>
                  <span className={r.status === 'done' ? 'text-green-400' : 'text-red-400'}>{r.message}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Shapefile tab */}
        {tab === 'shapefile' && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {SHP_REQUIRED.map(ext => {
                const present = shpFiles.some(f => f.name.toLowerCase().endsWith(ext));
                return (
                  <span key={ext} className={`px-2 py-0.5 rounded border font-mono font-semibold transition-colors ${
                    present ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-text-muted bg-bg-border/20 border-bg-border/30'
                  }`}>
                    {present ? '✓ ' : ''}{ext}
                  </span>
                );
              })}
              <span className="text-text-muted self-center">+ .prj .cpg (სურვილისამებრ)</span>
            </div>

            {shpFiles.length > 0 && (
              <div className="rounded-lg border border-bg-border/40 bg-bg-card/40 divide-y divide-bg-border/30">
                {shpFiles.map(f => (
                  <div key={f.name} className="flex items-center gap-2 px-3 py-2">
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${extColor(f.name)}`}>
                      .{f.name.split('.').pop()?.toLowerCase()}
                    </span>
                    <span className="text-xs text-text-secondary truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-text-muted flex-shrink-0">
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={() => setShpFiles(prev => prev.filter(x => x.name !== f.name))}
                      className="text-text-muted hover:text-red-400 flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => shpInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-bg-border/50 rounded-xl py-3 text-xs text-text-muted hover:border-accent/50 hover:text-accent transition-colors disabled:opacity-50"
            >
              <FileStack className="h-4 w-4" />
              {shpFiles.length === 0 ? 'აირჩიეთ shapefile ფაილები' : 'დაამატეთ მეტი ფაილი'}
            </button>
            <input ref={shpInputRef} type="file" accept=".shp,.dbf,.shx,.prj,.cpg,.qpj" multiple onChange={handleShpFilesInput} className="hidden" />

            <button
              onClick={uploadShapefileComponents}
              disabled={uploading || shpFiles.length === 0 || missingRequired.length > 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {uploading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />იტვირთება...</>
                : <><Upload className="h-3.5 w-3.5" />Shapefile-ის ატვირთვა</>}
            </button>
            {missingRequired.length > 0 && shpFiles.length > 0 && (
              <p className="text-[10px] text-yellow-500 text-center">საჭიროა: {missingRequired.join(', ')}</p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Success — single upload result (parcel tab only) */}
        {result && tab !== 'spatial' && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {result.imported > 0 && (
                  <span className="text-xs font-medium text-green-400">{result.imported} ნაკვეთი ჩაიტვირთა</span>
                )}
                {(result.polygons ?? 0) > 0 && (
                  <span className="text-xs font-medium text-green-400 ml-2">{result.polygons} პოლიგონი</span>
                )}
                {(result.lines ?? 0) > 0 && (
                  <span className="text-xs font-medium text-green-400 ml-2">{result.lines} ხაზი</span>
                )}
                {(result.points ?? 0) > 0 && (
                  <span className="text-xs font-medium text-green-400 ml-2">{result.points} წერტილი</span>
                )}
              </div>
              <button onClick={() => setResult(null)} className="ml-auto hover:text-green-300">
                <X className="h-3.5 w-3.5 text-green-400" />
              </button>
            </div>
            {result.errors?.length > 0 && (
              <p className="text-[10px] text-yellow-400 mb-2">{result.errors.length} შეცდომა იგნორირებულია</p>
            )}
            {result.imported > 0 && (
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="w-full flex items-center justify-center gap-2 mt-1 px-3 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                {analyzing
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />ანალიზი მიმდინარეობს...</>
                  : <><BarChart3 className="h-3.5 w-3.5" />სრული ანალიზის გაშვება</>}
              </button>
            )}
          </div>
        )}

        {/* Analysis result */}
        {analysisResult && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">სრული ანალიზი დაწყებულია</span>
              <button onClick={() => setAnalysisResult(null)} className="ml-auto hover:text-blue-300">
                <X className="h-3.5 w-3.5 text-blue-400" />
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {analysisResult.steps?.map((step: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="truncate">
                    {step === 'weather' && '☁️ ამინდის მონაცემები'}
                    {step === 'satellite' && '🛰️ სატელიტური მონაცემები (NDVI/NDRE)'}
                    {step === 'mineral' && '🔬 მინერალური ანალიზი'}
                    {step === 'mineral_comprehensive' && '🔬 კომპლექსური მინერალური ანალიზი'}
                    {step === 'disease' && '🦠 დაავადების რისკის ანალიზი'}
                    {step === 'vra_subzones' && '🎯 VRA ქვეზონების გენერაცია'}
                    {step === 'yield_forecast' && '🌾 მოსავლის პროგნოზი'}
                    {step === 'harvest_timing' && '⏰ მოსავლის დროის რეკომენდაცია'}
                    {step === 'irrigation' && '💧 მორწყვის გრაფიკი'}
                    {step === 'economics' && '💰 ეკონომიკური ანალიზი'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted mt-2">
              9-საფეხურიანი ანალიზი ფონურ რეჟიმში მიმდინარეობს. შედეგები 5-10 წუთში იქნება ხელმისაწვდომი.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
