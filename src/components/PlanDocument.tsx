"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Upload, Trash2 } from "lucide-react";
import { MonthCycle, todayStamp } from "@/lib/demo";
import { getLocalFile, saveLocalFile } from "@/lib/localFiles";

type Plan = MonthCycle["plan"];
export default function PlanDocument({ plan, monthKey, team, onChange }: { plan: Plan; monthKey: string; team: boolean; onChange: (update: (plan: Plan) => Plan) => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const example = !plan.file && !plan.exampleRemoved && monthKey === "2026-09";
  const source = example ? "/planejamento-exemplo.png" : url;
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    setUrl(""); setError("");
    if (plan.file?.url) {
      setUrl(plan.file.url);
      return;
    }
    if (plan.file) getLocalFile(plan.file.id).then(blob => {
      if (!active) return;
      if (!blob) { setError("Arquivo indisponível neste navegador. Peça à equipe para enviá-lo novamente."); return; }
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(() => { if (active) setError("Não foi possível abrir o arquivo. Tente enviá-lo novamente."); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [plan.file?.id, plan.file?.url]);

  async function upload(file?: File) {
    if (!file || saving) return;
    if (!(file.type.startsWith("image/") || file.type === "application/pdf") || file.size > 20 * 1024 * 1024) { setError("Escolha uma imagem ou PDF de até 20 MB."); return; }
    setSaving(true); setError("");
    try {
      let fileUrl: string | undefined;
      try {
        const { uploadFileToStorage } = await import("@/lib/cloudStorage");
        fileUrl = await uploadFileToStorage(file, `plans/${monthKey}-${Date.now()}-${file.name}`);
      } catch (err) {
        console.warn("Upload em nuvem falhou, tentando fallback local:", err);
      }
      const id = crypto.randomUUID();
      if (!fileUrl) {
        await saveLocalFile(id, file);
      }
      onChange(current => {
        const version = current.version + 1;
        return { ...current, version, status: "rascunho", exampleRemoved: true, file: { id, name: file.name, type: file.type, size: file.size, addedAt: todayStamp(), url: fileUrl }, activity: [{ id: crypto.randomUUID(), author: "Equipe Nurea", action: "Arquivo do planejamento atualizado", note: file.name, version, at: todayStamp() }, ...current.activity] };
      });
    } catch { setError("Não foi possível salvar o arquivo. Tente novamente ou escolha um arquivo menor."); }
    finally { setSaving(false); }
  }
  return <div className="plan-document">
    <div className="document-actions">
      {source && <a className="outline-button" href={source} download={plan.file?.name ?? "planejamento-exemplo.png"}><Download size={16} /> Baixar {example ? "exemplo" : "arquivo"}</a>}
      {team && <><input ref={input} type="file" accept="image/*,application/pdf" className="sr-only" aria-label="Arquivo do planejamento" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} /><button className="primary-button" disabled={saving} onClick={() => input.current?.click()}><Upload size={16} /> {saving ? "Salvando…" : source || plan.file ? "Substituir arquivo" : "Adicionar planejamento"}</button>
      {(plan.file || example) && <button className="outline-button danger-button" disabled={saving} onClick={() => {
        if (!window.confirm("Remover o planejamento deste mês? A aprovação será cancelada. Você poderá enviar outro arquivo.")) return;
        onChange(current => ({ ...current, file: undefined, exampleRemoved: true, status: "rascunho", version: current.version + 1, activity: [{ id: crypto.randomUUID(), author: "Equipe Nurea", action: "Arquivo do planejamento removido", at: todayStamp(), version: current.version + 1 }, ...current.activity] }));
      }}><Trash2 size={16} /> Remover arquivo</button>}</>}
    </div>
    {error && <p className="file-error" role="alert">{error}</p>}
    <div className="plan-image-frame">
      {source ? <>{example && <div className="plan-image-label">Exemplo ilustrativo</div>}{plan.file?.type === "application/pdf" ? <><object data={source} type="application/pdf" className="plan-pdf" aria-label="Prévia do planejamento"><p>Abra o PDF para consultar o planejamento.</p></object><a className="outline-button" href={source} target="_blank" rel="noopener noreferrer">Abrir PDF</a></> : <img src={source} alt={plan.file?.name ?? "Exemplo de planejamento editorial"} />}</> : <div className="plan-month-empty"><FileText size={28} /><strong>{plan.file && !error ? "Carregando planejamento…" : "Nenhum planejamento disponível"}</strong><p>{team ? "Adicione uma imagem ou PDF e envie para aprovação." : "A equipe adicionará aqui o planejamento deste mês."}</p></div>}
    </div>
  </div>;
}
