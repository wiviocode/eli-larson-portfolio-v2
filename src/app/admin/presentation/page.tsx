"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { GalleryMediaItem } from "@/db/schema";
import { parsePresentation, type Presentation, type PhotoDetails } from "@/lib/presentation";
import { getPhotoSource } from "@/lib/gallery-image";

function PhotoPicker({ items, ids, max, onChange }: { items: GalleryMediaItem[]; ids: number[]; max: number; onChange: (ids: number[]) => void }) {
  const [search, setSearch] = useState("");
  const [browsing, setBrowsing] = useState(false);
  function move(index: number, delta: number) {
    const next = [...ids];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  }
  return <div className="curation-picker">
    <p className="curation-help">{ids.length} / {max} photographs. The first frame opens the sequence.</p>
    <ol className="curation-sequence">
      {ids.map((id, index) => {
        const photo = items.find(item => item.id === id);
        return <li key={id}>
          <div className="curation-thumbnail">{photo ? <Image src={getPhotoSource(photo)!} alt={photo.caption || photo.altText || `Photograph ${id}`} fill sizes="150px" quality={75} /> : <span>Missing photo #{id}</span>}</div>
          <div className="curation-frame-controls"><span>{index + 1}</span>
            <button type="button" aria-label={`Move frame ${index + 1} earlier`} disabled={index === 0} onClick={() => move(index, -1)}>←</button>
            <button type="button" aria-label={`Move frame ${index + 1} later`} disabled={index === ids.length - 1} onClick={() => move(index, 1)}>→</button>
            <button type="button" aria-label={`Remove frame ${index + 1}`} onClick={() => onChange(ids.filter(value => value !== id))}>×</button>
          </div>
        </li>;
      })}
    </ol>
    <button type="button" className="curation-button" aria-expanded={browsing} onClick={() => setBrowsing(!browsing)}>{browsing ? "Close photo chooser" : "Choose photographs"}</button>
    {browsing && <div className="curation-browser">
      <label>Find a photograph<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search captions or filenames" /></label>
      <div className="curation-photo-options">
        {items.filter(item => `${item.caption} ${item.altText} ${item.fileName}`.toLowerCase().includes(search.toLowerCase())).map(photo => {
          const selected = ids.includes(photo.id);
          return <button type="button" key={photo.id} aria-pressed={selected} disabled={!selected && ids.length >= max} onClick={() => onChange(selected ? ids.filter(id => id !== photo.id) : [...ids, photo.id])}>
            <div className="curation-thumbnail"><Image src={getPhotoSource(photo)!} alt={photo.caption || photo.altText || `Photograph ${photo.id}`} fill sizes="180px" quality={75} /></div>
            <span>{selected ? `✓ Frame ${ids.indexOf(photo.id) + 1}` : "Add photograph"}</span>
          </button>;
        })}
      </div>
    </div>}
  </div>;
}

export default function PresentationEditor() {
  const [config, setConfig] = useState<Presentation | null>(null);
  const [items, setItems] = useState<GalleryMediaItem[]>([]);
  const [revision, setRevision] = useState<string | null>(null);
  const [saved, setSaved] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailId, setDetailId] = useState("");
  const dirty = !!config && JSON.stringify(config) !== saved;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/presentation", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load presentation.");
      if (cancelled) return;
      setConfig(data.config); setSaved(JSON.stringify(data.config)); setRevision(data.revision);
      setItems(data.items.filter((item: GalleryMediaItem) => item.type === "photo" && item.blobUrl));
    }).catch(error => { if (!cancelled) setStatus(error.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    if (dirty) window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function save() {
    setStatus("");
    let normalized;
    try { normalized = parsePresentation(config); } catch (error) { setStatus((error as Error).message); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/presentation", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: normalized, revision }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save.");
      setRevision(result.revision); setSaved(JSON.stringify(normalized)); setConfig(normalized);
      setStatus("Saved. Your presentation is updated.");
    } catch (error) { setStatus((error as Error).message); } finally { setSaving(false); }
  }

  const detailPhoto = items.find(item => String(item.id) === detailId);
  return <main id="main" className="curation-admin">
    <div className="curation-admin-header"><div><Link href="/admin" className="text-link">← Media library</Link><h1>Presentation<span>.</span></h1></div>
      <button type="button" className="curation-button curation-save" disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : "Save presentation"}</button>
    </div>
    <p className="curation-help">Choose the photographs and the order people see them in. Changes go live when you save. {dirty && "You have unsaved changes."}</p>
    <p role="status" className="curation-status">{status}</p>
    {!config ? <p>{status ? "Reload the page to try again." : "Loading your presentation…"}</p> : <fieldset disabled={saving} className="curation-form">
      <section className="curation-section"><h2>Editor’s Selection</h2><p className="curation-help">A short edit of up to 18 photographs. All photographs remains the default gallery view. Leave this empty to hide the option.</p>
        <PhotoPicker items={items} ids={config.editorPhotoIds} max={18} onChange={editorPhotoIds => setConfig({ ...config, editorPhotoIds })} />
      </section>
      <section className="curation-section"><h2>Photo stories</h2><p className="curation-help">Build a sequence of 6–10 frames. Unpublished stories stay out of the public site.</p>
        {config.stories.map((story, index) => {
          function update(patch: Partial<typeof story>) { setConfig({ ...config!, stories: config!.stories.map((value, i) => i === index ? { ...value, ...patch } : value) }); }
          function move(delta: number) { const stories = [...config!.stories]; [stories[index], stories[index + delta]] = [stories[index + delta], stories[index]]; setConfig({ ...config!, stories }); }
          return <details key={index} className="curation-story"><summary>{story.title || "Untitled story"} <span>{story.published ? "Published" : "Draft"} · {story.photoIds.length} frames</span></summary>
            <div className="curation-story-body"><div className="curation-fields">
              <label>Title<input value={story.title} maxLength={100} onChange={e => update({ title: e.target.value })} /></label>
              <label>Category<input value={story.category} maxLength={80} onChange={e => update({ category: e.target.value })} /></label>
              <label>Page address<input value={story.slug} maxLength={80} onChange={e => update({ slug: e.target.value })} /><small>/stories/{story.slug} — keep this stable after publishing.</small></label>
              <label className="curation-checkbox"><input type="checkbox" checked={story.published} onChange={e => update({ published: e.target.checked })} />Publish this story</label>
            </div>
            <label>Introduction<textarea value={story.description} maxLength={600} rows={3} onChange={e => update({ description: e.target.value })} /></label>
            <PhotoPicker items={items} ids={story.photoIds} max={10} onChange={photoIds => update({ photoIds })} />
            <div className="curation-actions"><button type="button" className="curation-button" disabled={index === 0} onClick={() => move(-1)}>Move story earlier</button><button type="button" className="curation-button" disabled={index === config.stories.length - 1} onClick={() => move(1)}>Move story later</button><button type="button" className="curation-button" onClick={() => { if (confirm(`Remove “${story.title}”? Its photographs remain in the library.`)) setConfig({ ...config, stories: config.stories.filter((_, i) => i !== index) }); }}>Remove story</button></div>
            </div>
          </details>;
        })}
        <button type="button" className="curation-button" disabled={config.stories.length >= 12} onClick={() => setConfig({ ...config, stories: [...config.stories, { slug: `new-story-${Date.now()}`, title: "New story", category: "", description: "", photoIds: [], published: false }] })}>Add a story</button>
      </section>
      <section className="curation-section"><h2>Photo information</h2><p className="curation-help">Optional details for the viewer’s Info panel. Only fill in what you know. Captions are managed in the media library.</p>
        <label>Photograph<select value={detailId} onChange={e => setDetailId(e.target.value)}><option value="">Choose a photograph</option>{items.map(item => <option value={item.id} key={item.id}>#{item.id} · {(item.caption || item.altText || item.fileName || "Untitled").slice(0, 110)}</option>)}</select></label>
        {detailPhoto && <div className="curation-detail-editor"><div className="curation-thumbnail"><Image src={getPhotoSource(detailPhoto)!} alt={detailPhoto.caption || detailPhoto.altText || "Selected photograph"} fill sizes="320px" quality={75} /></div>
          <div className="curation-fields">{(["event", "date", "location", "role"] as (keyof PhotoDetails)[]).map(key => <label key={key}>{key}<input value={config.photoDetails[detailId]?.[key] || ""} maxLength={180} onChange={e => setConfig({ ...config, photoDetails: { ...config.photoDetails, [detailId]: { ...config.photoDetails[detailId], [key]: e.target.value } } })} /></label>)}</div>
        </div>}
      </section>
    </fieldset>}
  </main>;
}
