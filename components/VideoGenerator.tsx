import React, { useState, useRef } from 'react';

type ImgTab = 'url' | 'file';
type ModelType = 'kling-t2v' | 'kling-i2v' | 'seedance-t2v' | 'seedance-i2v';

interface ModelOption {
  value: string;
  label: string;
  type: ModelType;
}

const MODELS: ModelOption[] = [
  { value: 'kling-v3',                         label: 'Kling Text to Video',      type: 'kling-t2v'    },
  { value: 'kling-v2-6',                        label: 'Kling Image to Video',     type: 'kling-i2v'    },
  { value: 'dreamina-seedance-2-0-fast-260128', label: 'Seedance Text to Video',   type: 'seedance-t2v' },
  { value: 'dreamina-seedance-2-0-fast-260128', label: 'Seedance Image to Video',  type: 'seedance-i2v' },
];

type GenerationState = 'idle' | 'loading' | 'progress' | 'success' | 'error';

export default function VideoGenerator() {
  const [baseUrl, setBaseUrl] = useState('https://api.tokenrouter.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [modelIdx, setModelIdx] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [imgTab, setImgTab] = useState<ImgTab>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspect, setAspect] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [mode, setMode] = useState('std');

  const [genState, setGenState] = useState<GenerationState>('idle');
  const [progressStatus, setProgressStatus] = useState('Generating…');
  const [progressPct, setProgressPct] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const model = MODELS[modelIdx];
  const isI2V = model.type === 'kling-i2v' || model.type === 'seedance-i2v';
  const isKling = model.type === 'kling-t2v' || model.type === 'kling-i2v';

  function onModelChange(idx: number) {
    setModelIdx(idx);
    setUploadedDataUrl(null);
    setUploadedFileName('');
    setImgTab('url');
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedDataUrl(ev.target?.result as string);
      setUploadedFileName(file.name);
    };
    reader.readAsDataURL(file);
  }

  function switchImgTab(tab: ImgTab) {
    setImgTab(tab);
  }

  async function downloadVideo() {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch {
      window.open(videoUrl, '_blank');
    }
  }

  function reset() {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setGenState('idle');
    setVideoUrl(null);
    setProgressPct(0);
  }

  async function generate() {
    // Normalize: strip trailing slash and trailing /v1 so we control the full path
    const url = baseUrl.trim().replace(/\/$/, '').replace(/\/v1$/, '');
    const key = apiKey.trim();
    const p = prompt.trim();

    if (!url) { alert('Please enter a Base URL.'); return; }
    if (!key) { alert('Please enter an API Key.'); return; }
    if (!p) { alert('Please enter a prompt.'); return; }

    const body: Record<string, unknown> = { model: model.value, prompt: p };

    if (isKling) {
      body.mode = mode;
      body.duration = duration; // string: "5" or "10"
      body.metadata = { aspect_ratio: aspect, sound: 'off' };
    } else {
      // Seedance
      body.metadata = {
        duration: Number(duration),
        resolution,
        ratio: aspect,
        generate_audio: false,
      };
    }

    if (isI2V) {
      let imgVal: string;
      if (imgTab === 'url') {
        imgVal = imageUrl.trim();
        if (!imgVal) { alert('Please enter an Image URL.'); return; }
      } else {
        if (!uploadedDataUrl) { alert('Please upload an image.'); return; }
        imgVal = uploadedDataUrl;
      }
      if (model.type === 'kling-i2v') {
        body.image = imgVal;
      } else {
        body.images = [imgVal];
      }
    }

    if (pollingRef.current) clearInterval(pollingRef.current);
    setGenState('progress');
    setProgressStatus('Submitting task…');
    setProgressPct(0);

    const headers = {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    };

    let taskId: string;
    try {
      const res = await fetch(`${url}/v1/video/generations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.message || `HTTP ${res.status}`);
      taskId = data.task_id || data.id || data.data?.task_id;
      if (!taskId) throw new Error('No task_id in response.');
    } catch (err: unknown) {
      setErrorMsg(`Failed to submit: ${(err as Error).message}`);
      setGenState('error');
      return;
    }

    setProgressStatus('Processing…');
    setProgressPct(1);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${url}/v1/video/generations/${taskId}`, { headers });
        const text = await res.text();
        console.log('[Poll]', res.status, res.headers.get('content-type'), text.slice(0, 500));
        if (!text) return; // still processing, wait for next poll
        const json = JSON.parse(text);
        if (!res.ok) throw new Error(json.error?.message || json.message || `HTTP ${res.status}`);

        const item = json.data || json;
        const status = (item.status || '').toUpperCase();
        const progress = item.progress ?? (status === 'SUCCESS' ? 100 : 0);

        if (status === 'SUCCESS') {
          clearInterval(pollingRef.current!);
          const vUrl = item.result_url || item.video_url || item.url;
          if (!vUrl) throw new Error('No video URL in response.');
          setVideoUrl(vUrl);
          setGenState('success');
        } else if (status === 'FAILURE' || status === 'FAILED') {
          clearInterval(pollingRef.current!);
          throw new Error(item.error_message || item.message || 'Generation failed.');
        } else {
          const label =
            status === 'PROCESSING' ? 'Processing…' :
            status === 'PENDING'    ? 'Queued…'     : `${status}…`;
          setProgressStatus(label);
          setProgressPct(Math.max(progress, 1));
        }
      } catch (err: unknown) {
        clearInterval(pollingRef.current!);
        setErrorMsg((err as Error).message);
        setGenState('error');
      }
    }, 5000);
  }

  const PillGroup = ({
    options, value, onChange,
  }: { options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 min-w-0 px-3 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap
            ${value === opt
              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
              : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs text-slate-400 mb-1">{children}</label>
  );

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">{children}</div>
  );

  return (
    <div className="flex h-[calc(100vh-65px)] bg-slate-900">

      {/* Sidebar */}
      <aside className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden bg-slate-800 border-r border-slate-700">
        <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: 'thin' }}>

          {/* API Settings */}
          <div>
            <SectionTitle>API Settings</SectionTitle>
            <div className="space-y-2">
              <div>
                <Label>Base URL</Label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.tokenrouter.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <Label>API Key</Label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-••••••••••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Model */}
          <div>
            <SectionTitle>Model</SectionTitle>
            <select
              value={modelIdx}
              onChange={(e) => onModelChange(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            >
              {MODELS.map((m, i) => (
                <option key={m.value} value={i}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Prompt */}
          <div>
            <SectionTitle>Prompt</SectionTitle>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={"Describe your video in detail…\n\ne.g. A cinematic aerial shot flying over misty mountains at golden hour, slow dolly forward, photorealistic."}
              rows={5}
              className="w-full bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-y leading-relaxed"
            />

            {/* Image input (i2v only) */}
            {isI2V && (
              <div className="mt-3">
                <Label>Image</Label>
                <div className="flex gap-1 mb-2">
                  {(['url', 'file'] as ImgTab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => switchImgTab(t)}
                      className={`px-3 py-1 rounded text-[11px] border transition-colors
                        ${imgTab === t
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-400 hover:border-slate-600'
                        }`}
                    >
                      {t === 'url' ? 'URL' : 'Upload'}
                    </button>
                  ))}
                </div>

                {imgTab === 'url' ? (
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm px-3 py-2 outline-none focus:border-indigo-500"
                  />
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full min-h-[80px] border border-dashed rounded flex flex-col items-center justify-center gap-1.5 text-xs transition-colors
                        ${uploadedDataUrl
                          ? 'border-green-500 text-green-400'
                          : 'border-slate-700 text-slate-500 hover:border-indigo-500 hover:text-slate-400'
                        }`}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span>{uploadedFileName || 'Click or drag to upload'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800" />

          {/* Parameters */}
          <div>
            <SectionTitle>Parameters</SectionTitle>
            <div className="space-y-3">
              <div>
                <Label>Duration</Label>
                <PillGroup options={['5', '10']} value={duration} onChange={setDuration} />
              </div>
              <div>
                <Label>Aspect Ratio</Label>
                <PillGroup options={['16:9', '9:16', '1:1']} value={aspect} onChange={setAspect} />
              </div>
              <div>
                <Label>Resolution</Label>
                <PillGroup options={['720p', '1080p']} value={resolution} onChange={setResolution} />
              </div>
              {isKling && (
                <div>
                  <Label>Mode</Label>
                  <PillGroup options={['std', 'pro']} value={mode} onChange={setMode} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer / Generate button */}
        <div className="p-4 flex-shrink-0 border-t border-slate-700">
          <button
            onClick={generate}
            disabled={genState === 'progress' || genState === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded text-sm font-semibold text-white transition-colors"
          >
            {(genState === 'progress' || genState === 'loading') && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            {genState === 'progress' ? 'Generating…' : 'Generate Video'}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col items-center justify-center overflow-hidden p-10 gap-5 bg-slate-900">

        {genState === 'idle' && (
          <div className="flex flex-col items-center gap-4 opacity-30 select-none pointer-events-none">
            <div className="w-16 h-16 border-2 border-dashed border-slate-600 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 stroke-slate-500 fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            <p className="text-sm text-slate-500">Configure settings and generate your video</p>
          </div>
        )}

        {(genState === 'progress' || genState === 'loading') && (
          <div className="w-full max-width-[540px] flex flex-col gap-2.5" style={{ maxWidth: 540 }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                {progressStatus}
              </div>
              <span className="text-sm text-slate-300 tabular-nums">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-0.5 bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {genState === 'success' && videoUrl && (
          <>
            <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl" style={{ maxWidth: 760, background: '#000' }}>
              <video src={videoUrl} controls autoPlay loop className="w-full block" style={{ maxHeight: '60vh', objectFit: 'contain' }} />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={downloadVideo}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-medium text-white transition-colors"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M8 12L3 7h3V2h4v5h3L8 12z"/>
                  <rect x="2" y="13" width="12" height="1.5" rx=".75"/>
                </svg>
                Download
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-slate-700 hover:border-slate-500 rounded text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                New Generation
              </button>
            </div>
          </>
        )}

        {genState === 'error' && (
          <div className="w-full max-w-[500px] rounded-xl p-4 flex items-start gap-2.5 text-sm" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 mt-0.5 stroke-red-400 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="text-red-300 leading-relaxed">
              <p>{errorMsg}</p>
              <button onClick={reset} className="mt-2 text-xs text-red-400 hover:text-red-300 underline">Try again</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
