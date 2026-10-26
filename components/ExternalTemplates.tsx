import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Code, Download, Upload, Copy, Check, FileVideo, Zap, RotateCcw } from 'lucide-react';

type SubTab = 'react' | 'rive' | 'lottie';
type AnimType = 'loop' | 'interactive';

// ─── Parameter types ──────────────────────────────────────────────────────────
interface ColorParam {
  id: string;
  label: string;        // e.g. "Loader · Border Bottom Color"
  matchContext: string; // exact substring to find/replace
  propName: string;
  originalValue: string; // original color string in code
  value: string;          // current hex for the color-picker
  textValue: string;      // what the text input shows (editable)
}

interface SliderParam {
  id: string;
  label: string;
  matchContext: string;
  propName: string;
  originalValue: number;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

interface FontParam {
  id: string;
  label: string;
  matchContext: string;
  propName: string;
  originalValue: string;
  value: string;
}

interface TextParam {
  id: string;
  label: string;
  matchContext: string; // ">raw text<"
  originalValue: string; // raw text (may have surrounding whitespace)
  value: string;         // trimmed, shown in input
}

// ─── Utility: load a CDN script once ─────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function escRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ─── Extract the default-exported component name from raw code ───────────────
function extractComponentName(raw: string): string {
  // `export default function Foo` or `export default class Foo`
  let m = raw.match(/export\s+default\s+(?:function|class)\s+([A-Z][A-Za-z0-9_]*)/);
  if (m) return m[1];
  // `export default Foo` (standalone, capital letter = component)
  m = raw.match(/export\s+default\s+([A-Z][A-Za-z0-9_]*)\s*[;\n]/);
  if (m) return m[1];
  // Fallback: first capital-letter function/class/const in the file
  m = raw.match(/(?:function|class)\s+([A-Z][A-Za-z0-9_]*)\b/);
  if (m) return m[1];
  m = raw.match(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=/);
  if (m) return m[1];
  return 'App';
}

// ─── Strip imports / exports so code runs as a plain browser script ───────────
function preprocessCode(raw: string): string {
  return raw
    // multi-line imports: `import {\n  a,\n  b\n} from '...'`
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]*['"]\s*;?\s*$/gm, '')
    // side-effect imports: `import '...'`
    .replace(/^\s*import\s+['"][^'"]*['"]\s*;?\s*$/gm, '')
    // `export default function Foo` → `function Foo`  (allow leading whitespace)
    .replace(/^\s*export\s+default\s+function\b/gm, 'function')
    // `export default class Foo` → `class Foo`
    .replace(/^\s*export\s+default\s+class\b/gm, 'class')
    // `export default Foo;` standalone → remove
    .replace(/^\s*export\s+default\s+[\w.]+\s*;?\s*$/gm, '')
    // `export async function` / `export const` / etc → keep declaration
    .replace(/^\s*export\s+((?:async\s+)?(?:function|class|const|let|var)\b)/gm, '$1')
    // `export { a, b }` / `export { a } from '...'` → remove
    .replace(/^\s*export\s*\{[^}]*\}[^;]*;?\s*$/gm, '')
    .trim();
}

// ─── Label helpers ────────────────────────────────────────────────────────────
function humanize(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatPropLabel(prop: string): string {
  // CSS kebab: background-color → Background Color
  if (prop.includes('-')) return humanize(prop);
  // camelCase: backgroundColor → Background Color
  return prop.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

// Look backwards from matchStart for a useful context label (CSS selector / comment)
function getContextLabel(code: string, matchStart: number): string {
  const lines = code.slice(0, matchStart).split('\n');
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i].trim();
    if (!line || /^[{},;]$/.test(line)) continue;
    // CSS class selector: `.card-front {`
    let m = line.match(/\.([\w-]+)/);
    if (m) return humanize(m[1]);
    // Pseudo / &:hover
    m = line.match(/&:+(\w[\w-]*)/);
    if (m) return humanize(m[1]);
    // Block comment: `/* card title */`
    m = line.match(/\/\*\s*(.+?)\s*\*\//);
    if (m) return m[1].trim();
    // Line comment: `// card title`
    m = line.match(/\/\/\s*(.+)/);
    if (m) return m[1].trim();
    // Plain tag selector: `button {`
    m = line.match(/^([a-zA-Z][\w-]*)\s*[{,]/);
    const reserved = new Set(['const','let','var','function','class','return','export','import','if','else']);
    if (m && !reserved.has(m[1])) return humanize(m[1]);
    break;
  }
  return '';
}

// Properties that never carry color values — everything else is fair game.
const NON_COLOR_PROPS = new Set([
  // sizing / spacing
  'width','height','min-width','max-width','min-height','max-height',
  'margin','margin-top','margin-right','margin-bottom','margin-left',
  'padding','padding-top','padding-right','padding-bottom','padding-left',
  'top','right','bottom','left','gap','row-gap','column-gap',
  'border-width','border-radius','border-top-left-radius','border-top-right-radius',
  'border-bottom-left-radius','border-bottom-right-radius','outline-width',
  // typography (non-color)
  'font-size','font-weight','font-style','font-variant','font-stretch',
  'line-height','letter-spacing','word-spacing','text-indent',
  'font-family',                   // handled separately
  // animation / transition (timing values look like numbers, not colors)
  'animation','animation-duration','animation-delay','animation-iteration-count',
  'animation-timing-function','animation-fill-mode','animation-play-state',
  'transition','transition-duration','transition-delay','transition-timing-function',
  // transform / position
  'transform','transform-origin','perspective','z-index',
  // misc display
  'opacity','display','position','overflow','overflow-x','overflow-y',
  'visibility','cursor','pointer-events','user-select',
  'flex','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis',
  'align-items','align-self','align-content','justify-content','justify-self',
  'grid','grid-template','grid-template-columns','grid-template-rows',
  'white-space','word-break','word-wrap','text-overflow','text-transform',
  'text-decoration','content',
  // camelCase React equivalents of all the above
  'fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','wordSpacing',
  'fontFamily','textIndent','fontVariant','fontStretch',
  'animationDuration','animationDelay','animationIterationCount',
  'animationTimingFunction','animationFillMode','animationPlayState',
  'transitionDuration','transitionDelay','transitionTimingFunction',
  'borderRadius','borderWidth','borderTopLeftRadius','borderTopRightRadius',
  'borderBottomLeftRadius','borderBottomRightRadius','outlineWidth',
  'zIndex','opacity','pointerEvents','userSelect','cursor',
  'alignItems','alignSelf','alignContent','justifyContent','justifySelf',
  'flexDirection','flexWrap','flexGrow','flexShrink','flexBasis',
  'whiteSpace','wordBreak','textOverflow','textTransform','textDecoration',
]);

// ─── Parse React code for editable parameters ─────────────────────────────────
function parseReactCode(code: string): {
  colors: ColorParam[];
  sliders: SliderParam[];
  fonts: FontParam[];
  texts: TextParam[];
  animType: AnimType;
} {
  const colors: ColorParam[] = [];
  const sliders: SliderParam[] = [];
  const fonts: FontParam[] = [];
  const texts: TextParam[] = [];
  const seenCtx = new Set<string>();

  const animType: AnimType = /onMouseEnter|onMouseLeave|onClick|onHover|useHover/.test(code)
    ? 'interactive' : 'loop';

  let m: RegExpExecArray | null;

  // ── Colors — scan ALL color values in the file, look back for property name ──
  // This catches colors anywhere: line-start, mid-line in @keyframes, inside style={{}}, etc.
  const allColorsRe = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])|rgba?\([^)]+\)/g;
  while ((m = allColorsRe.exec(code)) !== null) {
    const rawColor = m[0];

    // Scan backwards on the same line to find `property:` that owns this color
    const lineStart = code.lastIndexOf('\n', m.index) + 1;
    const beforeColor = code.slice(lineStart, m.index);
    // Match the last `prop:` or `prop :` on this line before the color
    const propMatch = beforeColor.match(/([\w-]+)\s*:\s*(?:[^;{}]*?)?$/);
    if (!propMatch) continue;
    const prop = propMatch[1];
    if (NON_COLOR_PROPS.has(prop)) continue;

    // Build a matchContext: `prop: prefix color` — enough to be unique and replaceable
    // Use everything from the property name up to and including the color value
    const propStart = lineStart + beforeColor.lastIndexOf(prop);
    const matchContext = code.slice(propStart, m.index + rawColor.length);
    if (seenCtx.has(matchContext)) continue;
    seenCtx.add(matchContext);

    const hex = toHex(rawColor);
    const ctx = getContextLabel(code, propStart);
    const propLabel = formatPropLabel(prop);
    const label = ctx ? `${ctx} · ${propLabel}` : propLabel;
    colors.push({
      id: `c${colors.length}`, label, matchContext, propName: prop,
      originalValue: rawColor, value: hex, textValue: rawColor,
    });
  }

  // ── Fonts — CSS: `font-family: 'Arial', sans-serif` ─────────────────────────
  const cssFontRe = /font-family\s*:\s*([^;}\n]+)/g;
  while ((m = cssFontRe.exec(code)) !== null) {
    const fullMatch = m[0];
    if (seenCtx.has(fullMatch)) continue;
    seenCtx.add(fullMatch);
    const val = m[1].trim();
    const ctx = getContextLabel(code, m.index);
    const label = ctx ? `${ctx} · Font Family` : 'Font Family';
    fonts.push({ id: `f${fonts.length}`, label, matchContext: fullMatch, propName: 'font-family', originalValue: val, value: val });
  }

  // ── Fonts — React: `fontFamily: 'Arial'` ────────────────────────────────────
  const reactFontRe = /fontFamily\s*:\s*(['"])([^'"]+)\1/g;
  while ((m = reactFontRe.exec(code)) !== null) {
    const fullMatch = m[0];
    if (seenCtx.has(fullMatch)) continue;
    seenCtx.add(fullMatch);
    const val = m[2];
    const ctx = getContextLabel(code, m.index);
    const label = ctx ? `${ctx} · Font Family` : 'Font Family';
    fonts.push({ id: `f${fonts.length}`, label, matchContext: fullMatch, propName: 'fontFamily', originalValue: val, value: val });
  }

  // ── Font size — CSS: `font-size: 1.5rem` ────────────────────────────────────
  const cssFontSizeRe = /font-size\s*:\s*([^;}\n]+)/g;
  while ((m = cssFontSizeRe.exec(code)) !== null) {
    const fullMatch = m[0];
    if (seenCtx.has(fullMatch)) continue;
    seenCtx.add(fullMatch);
    const val = m[1].trim();
    const ctx = getContextLabel(code, m.index);
    const label = ctx ? `${ctx} · Font Size` : 'Font Size';
    fonts.push({ id: `f${fonts.length}`, label, matchContext: fullMatch, propName: 'font-size', originalValue: val, value: val });
  }

  // ── Font size — React: `fontSize: 24` or `fontSize: '1.5rem'` ───────────────
  const reactFontSizeRe = /fontSize\s*:\s*(['"]?)(\d+(?:\.\d+)?(?:px|rem|em|pt|%)?)\1/g;
  while ((m = reactFontSizeRe.exec(code)) !== null) {
    const fullMatch = m[0];
    if (seenCtx.has(fullMatch)) continue;
    seenCtx.add(fullMatch);
    const val = m[2];
    const ctx = getContextLabel(code, m.index);
    const label = ctx ? `${ctx} · Font Size` : 'Font Size';
    fonts.push({ id: `f${fonts.length}`, label, matchContext: fullMatch, propName: 'fontSize', originalValue: val, value: val });
  }

  // ── Size — one width + one height only ───────────────────────────────────────
  let seenWidth = false, seenHeight = false;
  const sizeRe = /\b(width|height)\s*:\s*(\d+(?:\.\d+)?)(px)?/g;
  while ((m = sizeRe.exec(code)) !== null) {
    const prop = m[1];
    if (prop === 'width' && seenWidth) continue;
    if (prop === 'height' && seenHeight) continue;
    const fullMatch = m[0];
    if (seenCtx.has(fullMatch)) continue;
    seenCtx.add(fullMatch);
    const rawNum = parseFloat(m[2]);
    const propLabel = prop.charAt(0).toUpperCase() + prop.slice(1);
    sliders.push({
      id: `s${sliders.length}`, label: `${propLabel} (px)`, matchContext: fullMatch, propName: prop,
      originalValue: rawNum, value: rawNum, min: 0, max: 800, step: 1, unit: 'px',
    });
    if (prop === 'width') seenWidth = true;
    if (prop === 'height') seenHeight = true;
  }

  // ── Animation speed ──────────────────────────────────────────────────────────
  const durRe = /(animationDuration|transitionDuration|duration)\s*:\s*(['"]?)(\d+(?:\.\d+)?)(s|ms)?['"]?/g;
  while ((m = durRe.exec(code)) !== null) {
    const fullMatch = m[0];
    if (seenCtx.has(fullMatch)) continue;
    seenCtx.add(fullMatch);
    const rawNum = parseFloat(m[3]);
    const unit = m[4] || 's';
    const secs = unit === 'ms' ? rawNum / 1000 : rawNum;
    sliders.push({
      id: `s${sliders.length}`, label: 'Animation Speed (s)',
      matchContext: fullMatch, propName: m[1],
      originalValue: rawNum, value: secs, min: 0.1, max: 10, step: 0.1, unit: 's',
    });
  }

  // ── Text content — literal JSX text nodes ────────────────────────────────────
  // Matches text sitting between > and < (not across lines, not containing expressions)
  const textRe = />([^<>{}\n\r]{2,})</g;
  while ((m = textRe.exec(code)) !== null) {
    const raw = m[1];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2) continue;
    // Skip anything that looks like code rather than display text
    if (/[{}()=;`]/.test(trimmed)) continue;
    // Skip pure-number strings (likely not user-facing labels)
    if (/^\d+$/.test(trimmed)) continue;
    const matchContext = `>${raw}<`;
    if (seenCtx.has(matchContext)) continue;
    seenCtx.add(matchContext);
    // Look back for the tag name to build a label
    const before = code.slice(Math.max(0, m.index - 60), m.index + 1);
    const tagM = before.match(/<([A-Za-z][A-Za-z0-9]*)(?:\s[^>]*)?>$/);
    const tagName = tagM ? tagM[1] : 'Element';
    const label = `${humanize(tagName)} Text`;
    texts.push({ id: `tx${texts.length}`, label, matchContext, originalValue: raw, value: trimmed });
  }

  return { colors, sliders, fonts, texts, animType };
}

// ─── Apply param overrides to original code ───────────────────────────────────
function applyParams(
  originalCode: string,
  colors: ColorParam[],
  sliders: SliderParam[],
  fonts: FontParam[],
  texts: TextParam[],
): string {
  let out = originalCode;
  for (const c of colors) {
    const newCtx = c.matchContext.replace(c.originalValue, c.value);
    out = out.split(c.matchContext).join(newCtx);
  }
  for (const s of sliders) {
    const newCtx = s.matchContext.replace(String(s.originalValue), String(s.value));
    out = out.split(s.matchContext).join(newCtx);
  }
  for (const f of fonts) {
    const newCtx = f.matchContext.replace(f.originalValue, f.value);
    out = out.split(f.matchContext).join(newCtx);
  }
  for (const t of texts) {
    const newCtx = `>${t.value}<`;
    out = out.split(t.matchContext).join(newCtx);
  }
  return out;
}

// ─── Convert any color to hex ─────────────────────────────────────────────────
function toHex(color: string): string {
  if (color.startsWith('#')) {
    if (color.length === 4) return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    return color;
  }
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    return '#' + [m[1], m[2], m[3]].map(n => Number(n).toString(16).padStart(2, '0')).join('');
  }
  return '#000000';
}

// ─── CDN library registry ─────────────────────────────────────────────────────
// cdn is optional — styled-components uses an inline polyfill instead.
// initScript: plain <script> block (sync, runs before Babel).
// globals: code injected at the top of the <script type="text/babel"> block.
interface LibEntry { pattern: RegExp; cdn?: string; initScript: string; globals: string; }

// Minimal styled-components polyfill — no CDN needed, works in any sandbox.
const SC_POLYFILL = `(function(){
  if(typeof React==='undefined')return;
  var _s=document.createElement('style');document.head.appendChild(_s);
  var _c=0,_k=0;
  function _tpl(str,vals){
    return Array.from(str).reduce(function(a,s,i){
      var v=i<vals.length?vals[i]:'';
      return a+s+(typeof v==='function'?'':v==null?'':String(v));
    },'');
  }
  // Scope each CSS rule with the generated class name.
  // Direct props (no selector) → .cls{props}; child selectors → .cls selector{...}
  function _scope(raw,cls){
    var result='',props='',i=0,len=raw.length;
    while(i<len){
      while(i<len&&/\\s/.test(raw[i]))i++;
      if(i>=len)break;
      var j=i;
      while(j<len&&raw[j]!=='{'&&raw[j]!==';')j++;
      if(j>=len||raw[j]===';'){
        props+=raw.slice(i,j<len?j+1:j);
        i=j+1;
      }else{
        var sel=raw.slice(i,j).trim();
        var depth=1,k=j+1;
        while(k<len&&depth>0){if(raw[k]==='{')depth++;else if(raw[k]==='}')depth--;k++;}
        var body=raw.slice(j+1,k-1);
        if(sel.charAt(0)==='@'){
          if(sel.indexOf('keyframes')!==-1||sel.indexOf('font-face')!==-1){
            result+=sel+'{'+body+'}\\n';
          }else{
            result+=sel+'{'+_scope(body,cls)+'}\\n';
          }
        }else if(sel){
          var scoped=sel.split(',').map(function(s){
            s=s.trim();if(!s)return'';
            return s.indexOf('&')!==-1?s.replace(/&/g,'.'+cls):'.'+cls+' '+s;
          }).filter(Boolean).join(',');
          result+=scoped+'{'+body+'}\\n';
        }else{
          props+=body;
        }
        i=k;
      }
    }
    if(props.trim())result='.'+cls+'{'+props+'}\\n'+result;
    return result;
  }
  function keyframes(){var a=arguments;var name='kf'+(++_k);
    _s.textContent+='@keyframes '+name+'{'+_tpl(a[0],Array.prototype.slice.call(a,1))+'}\\n';
    return name;}
  function css(){var a=arguments;return _tpl(a[0],Array.prototype.slice.call(a,1));}
  function createGlobalStyle(){var a=arguments;
    _s.textContent+=_tpl(a[0],Array.prototype.slice.call(a,1));return function(){return null;};}
  function make(tag){
    return function(){var a=arguments;
      var cls='sc'+(++_c);
      var rawCss=_tpl(a[0],Array.prototype.slice.call(a,1));
      _s.textContent+=_scope(rawCss,cls);
      return React.forwardRef(function(p,ref){
        var cn=cls+(p.className?' '+p.className:'');
        return React.createElement(tag,Object.assign({},p,{ref:ref,className:cn}));
      });
    };
  }
  var styled={css:css,keyframes:keyframes,createGlobalStyle:createGlobalStyle,
    ThemeProvider:function(p){return p.children;}};
  ['a','article','aside','button','div','figure','footer','form','h1','h2','h3',
   'h4','header','img','input','label','li','main','nav','ol','p','path','section',
   'span','svg','textarea','ul'].forEach(function(t){styled[t]=make(t);});
  window.__SC={default:styled,keyframes:keyframes,css:css,
    createGlobalStyle:createGlobalStyle,ThemeProvider:styled.ThemeProvider};
})();`;

const LIB_REGISTRY: LibEntry[] = [
  {
    pattern: /from\s+['"]styled-components['"]/,
    // No CDN — inline polyfill handles everything
    initScript: SC_POLYFILL,
    globals: `const styled=window.__SC.default;const keyframes=window.__SC.keyframes;
const css=window.__SC.css;const createGlobalStyle=window.__SC.createGlobalStyle;
const ThemeProvider=window.__SC.ThemeProvider;`,
  },
  {
    pattern: /from\s+['"]framer-motion['"]/,
    cdn: 'https://unpkg.com/framer-motion@10/dist/framer-motion.js',
    initScript: `window.__FM=window.FramerMotion||{};`,
    globals: `const{motion,AnimatePresence,useAnimation,useMotionValue,useTransform,useSpring,animate,LayoutGroup}=window.__FM;`,
  },
  {
    pattern: /from\s+['"]gsap['"]/,
    cdn: 'https://unpkg.com/gsap@3/dist/gsap.min.js',
    initScript: `window.__GSAP=window.gsap;`,
    globals: `const gsap=window.__GSAP;`,
  },
];

function detectLibraries(rawCode: string): LibEntry[] {
  return LIB_REGISTRY.filter(lib => lib.pattern.test(rawCode));
}

// ─── Build React iframe srcdoc ────────────────────────────────────────────────
const REACT_GLOBALS = `const {
  useState, useEffect, useRef, useMemo, useCallback,
  useContext, useReducer, createContext, forwardRef, memo, Fragment
} = React;`;

function buildIframe(rawCode: string, bg: string): string {
  const code = preprocessCode(rawCode);
  const compName = extractComponentName(rawCode);
  const bodyBg = bg === 'white' ? '#fff' : bg === 'black' ? '#000' : 'transparent';
  const libs = detectLibraries(rawCode);
  const libScripts = libs.map(l =>
    (l.cdn ? `<script src="${l.cdn}"></script>\n` : '') + `<script>${l.initScript}</script>`
  ).join('\n');
  const libGlobals = libs.map(l => l.globals).filter(Boolean).join('\n');

  const safeCode = code.replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;
  background:${bodyBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
#root{display:flex;align-items:center;justify-content:center;width:100%;min-height:100vh}
</style>
</head><body>
<div id="root"></div>
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>
${libScripts}
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
<script id="__src" type="text/plain">${safeCode}</script>
<script>
(function(){
  try {
    var src = document.getElementById('__src').textContent;
    var reactGlobals = 'const {useState,useEffect,useRef,useMemo,useCallback,useContext,useReducer,createContext,forwardRef,memo,Fragment}=React;';
    var libG = ${JSON.stringify(libGlobals)};
    var wrapped = '(function(){' + reactGlobals + libG + src +
      ';return (typeof ${compName}!=="undefined"&&${compName})||(typeof App!=="undefined"&&App)||null;})()';
    var result = Babel.transform(wrapped, {presets:[['react',{runtime:'classic'}]],filename:'c.jsx'});
    var Root = eval(result.code);
    if (!Root) throw new Error('Component not found: ${compName}');
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Root));
  } catch(e) {
    document.body.innerHTML = '<pre style="color:#ef4444;padding:20px;font-size:11px;white-space:pre-wrap">'+e.message+'</pre>';
  }
})();
</script>
</body></html>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ExternalTemplates() {
  const [subTab, setSubTab] = useState<SubTab>('react');
  const [previewBg, setPreviewBg] = useState<'checker' | 'white' | 'black'>('checker');

  // ── React state ───────────────────────────────────────────────────────────
  const [reactCode, setReactCode] = useState('');
  const [colorParams, setColorParams] = useState<ColorParam[]>([]);
  const [sliderParams, setSliderParams] = useState<SliderParam[]>([]);
  const [fontParams, setFontParams] = useState<FontParam[]>([]);
  const [textParams, setTextParams] = useState<TextParam[]>([]);
  const [reactAnimType, setReactAnimType] = useState<AnimType>('loop');

  type ParamSnapshot = { colors: ColorParam[]; sliders: SliderParam[]; fonts: FontParam[]; texts: TextParam[] };
  const [paramHistory, setParamHistory] = useState<ParamSnapshot[]>([]);
  const [originalParams, setOriginalParams] = useState<ParamSnapshot | null>(null);
  const [iframeSrc, setIframeSrc] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  // ── Rive state ────────────────────────────────────────────────────────────
  const [riveFileName, setRiveFileName] = useState('');
  const [riveBuffer, setRiveBuffer] = useState<ArrayBuffer | null>(null);
  const [riveReady, setRiveReady] = useState(false);
  const [riveAnimType, setRiveAnimType] = useState<AnimType>('loop');
  const [riveInputValues, setRiveInputValues] = useState<Record<string, number | boolean>>({});
  const riveCanvasRef = useRef<HTMLCanvasElement>(null);
  const riveRef = useRef<any>(null);
  const riveInputsRef = useRef<any[]>([]);

  // ── Lottie state ──────────────────────────────────────────────────────────
  const [lottieFileName, setLottieFileName] = useState('');
  const [lottieData, setLottieData] = useState<any>(null);
  const [lottieAnimType, setLottieAnimType] = useState<AnimType>('loop');
  const [lottieSpeed, setLottieSpeed] = useState(1);
  const [lottieSize, setLottieSize] = useState({ w: 300, h: 300 });
  const lottieContainerRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<any>(null);

  // ── Shared ────────────────────────────────────────────────────────────────
  const [isCopied, setIsCopied] = useState(false);

  // ────────────────────────────────────────────────────────────────────────
  // React: parse on paste
  // ────────────────────────────────────────────────────────────────────────
  const handleReactCodeChange = useCallback((code: string) => {
    setReactCode(code);
    if (!code.trim()) {
      setColorParams([]); setSliderParams([]); setFontParams([]); setTextParams([]);
      setOriginalParams(null); setParamHistory([]);
      setIframeSrc(''); setGeneratedCode(''); return;
    }
    const { colors, sliders, fonts, texts, animType } = parseReactCode(code);
    setColorParams(colors);
    setSliderParams(sliders);
    setFontParams(fonts);
    setTextParams(texts);
    setOriginalParams({ colors, sliders, fonts, texts });
    setParamHistory([]);
    setReactAnimType(animType);
    setGeneratedCode(code);
    setIframeSrc(buildIframe(code, previewBg));
  }, [previewBg]);

  // Rebuild iframe when bg changes
  useEffect(() => {
    if (subTab === 'react' && generatedCode) setIframeSrc(buildIframe(generatedCode, previewBg));
  }, [previewBg, subTab]); // eslint-disable-line

  const rebuildReact = useCallback((colors: ColorParam[], sliders: SliderParam[], fonts: FontParam[], texts: TextParam[]) => {
    if (!reactCode) return;
    const updated = applyParams(reactCode, colors, sliders, fonts, texts);
    setGeneratedCode(updated);
    setIframeSrc(buildIframe(updated, previewBg));
  }, [reactCode, previewBg]);

  function pushHistory() {
    setParamHistory(h => [...h, { colors: colorParams, sliders: sliderParams, fonts: fontParams, texts: textParams }]);
  }

  function handleUndo() {
    setParamHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setColorParams(prev.colors);
      setSliderParams(prev.sliders);
      setFontParams(prev.fonts);
      setTextParams(prev.texts);
      rebuildReact(prev.colors, prev.sliders, prev.fonts, prev.texts);
      return h.slice(0, -1);
    });
  }

  function handleResetAll() {
    if (!originalParams) return;
    setColorParams(originalParams.colors);
    setSliderParams(originalParams.sliders);
    setFontParams(originalParams.fonts);
    setTextParams(originalParams.texts);
    setParamHistory([]);
    rebuildReact(originalParams.colors, originalParams.sliders, originalParams.fonts, originalParams.texts);
  }

  function handleColorChange(id: string, hexVal: string) {
    pushHistory();
    const next = colorParams.map(c => c.id === id ? { ...c, value: hexVal, textValue: hexVal } : c);
    setColorParams(next);
    rebuildReact(next, sliderParams, fontParams, textParams);
  }

  function handleColorTextChange(id: string, text: string) {
    const next = colorParams.map(c => c.id === id ? { ...c, textValue: text } : c);
    setColorParams(next);
    if (/^#[0-9a-fA-F]{3,8}$/.test(text) || /^rgba?\(/.test(text)) {
      pushHistory();
      const withHex = next.map(c => c.id === id ? { ...c, value: toHex(text) } : c);
      setColorParams(withHex);
      rebuildReact(withHex, sliderParams, fontParams, textParams);
    }
  }

  function handleSliderChange(id: string, val: number) {
    pushHistory();
    const next = sliderParams.map(s => s.id === id ? { ...s, value: val } : s);
    setSliderParams(next);
    rebuildReact(colorParams, next, fontParams, textParams);
  }

  function handleFontChange(id: string, val: string) {
    pushHistory();
    const next = fontParams.map(f => f.id === id ? { ...f, value: val } : f);
    setFontParams(next);
    rebuildReact(colorParams, sliderParams, next, textParams);
  }

  function handleTextChange(id: string, val: string) {
    pushHistory();
    const next = textParams.map(t => t.id === id ? { ...t, value: val } : t);
    setTextParams(next);
    rebuildReact(colorParams, sliderParams, fontParams, next);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Rive: upload & init
  // ────────────────────────────────────────────────────────────────────────
  async function handleRiveUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRiveFileName(file.name);
    setRiveReady(false);
    setRiveInputValues({});
    setRiveBuffer(await file.arrayBuffer());
  }

  useEffect(() => {
    if (!riveBuffer || subTab !== 'rive') return;
    let live = true;
    loadScript('https://unpkg.com/@rive-app/canvas@2.21.6/rive.js').then(() => {
      if (!live || !riveCanvasRef.current) return;
      const R = (window as any).rive;
      if (!R) return;
      riveRef.current?.cleanup();
      riveRef.current = null;

      const r = new R.Rive({
        buffer: riveBuffer,
        canvas: riveCanvasRef.current,
        autoplay: true,
        onLoad: () => {
          if (!live) return;
          try {
            const smNames: string[] = r.stateMachineNames ?? [];
            if (smNames.length > 0) {
              const inputs: any[] = r.stateMachineInputs(smNames[0]) ?? [];
              riveInputsRef.current = inputs;
              const initVals: Record<string, number | boolean> = {};
              inputs.forEach((inp: any) => {
                if (inp.type === R.StateMachineInputType.Number) initVals[inp.name] = inp.value ?? 0;
                if (inp.type === R.StateMachineInputType.Boolean) initVals[inp.name] = inp.value ?? false;
              });
              setRiveInputValues(initVals);
              const hasInteractive = inputs.some((i: any) => /hover|click|press/i.test(i.name));
              setRiveAnimType(hasInteractive ? 'interactive' : 'loop');
            }
            setRiveReady(true);
          } catch (_) {}
        },
      });
      riveRef.current = r;
    });
    return () => { live = false; };
  }, [riveBuffer, subTab]);

  function fireRiveTrigger(name: string) {
    riveInputsRef.current.find((i: any) => i.name === name)?.fire();
  }

  function setRiveNumberInput(name: string, val: number) {
    const inp = riveInputsRef.current.find((i: any) => i.name === name);
    if (inp) inp.value = val;
    setRiveInputValues(prev => ({ ...prev, [name]: val }));
  }

  function setRiveBoolInput(name: string, val: boolean) {
    const inp = riveInputsRef.current.find((i: any) => i.name === name);
    if (inp) inp.value = val;
    setRiveInputValues(prev => ({ ...prev, [name]: val }));
  }

  // ────────────────────────────────────────────────────────────────────────
  // Lottie: upload & init
  // ────────────────────────────────────────────────────────────────────────
  async function handleLottieUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLottieFileName(file.name);
    try {
      const json = JSON.parse(await file.text());
      setLottieData(json);
      setLottieAnimType(json.loop ? 'loop' : 'interactive');
      setLottieSize({ w: json.w ?? 300, h: json.h ?? 300 });
    } catch { alert('Invalid Lottie JSON'); }
  }

  useEffect(() => {
    if (!lottieData || subTab !== 'lottie' || !lottieContainerRef.current) return;
    let live = true;
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js').then(() => {
      if (!live || !lottieContainerRef.current) return;
      const lottie = (window as any).lottie;
      if (!lottie) return;
      lottieRef.current?.destroy();
      lottieContainerRef.current.innerHTML = '';
      lottieRef.current = lottie.loadAnimation({
        container: lottieContainerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: lottieData,
      });
      lottieRef.current.setSpeed(lottieSpeed);
    });
    return () => { live = false; };
  }, [lottieData, subTab]); // eslint-disable-line

  useEffect(() => { lottieRef.current?.setSpeed(lottieSpeed); }, [lottieSpeed]);

  // ────────────────────────────────────────────────────────────────────────
  // Derived
  // ────────────────────────────────────────────────────────────────────────
  const hasPreview =
    (subTab === 'react' && !!iframeSrc) ||
    (subTab === 'rive' && riveReady) ||
    (subTab === 'lottie' && !!lottieData);

  const currentAnimType = subTab === 'react' ? reactAnimType : subTab === 'rive' ? riveAnimType : lottieAnimType;
  const canExport = hasPreview && currentAnimType === 'loop';

  const riveTypeName = (window as any).rive?.StateMachineInputType;

  function copyCode() {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }

  // ────────────────────────────────────────────────────────────────────────
  // Shared panel chrome helpers
  // ────────────────────────────────────────────────────────────────────────
  const PanelHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <h2 className="text-md font-semibold flex items-center gap-2 text-slate-300">
      <span className="text-indigo-400">{icon}</span>
      {title}
    </h2>
  );

  const UploadZone = ({
    hasFile, fileName, accept, onChange, label,
  }: { hasFile: boolean; fileName: string; accept: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; label: string }) => (
    <div className="relative group">
      <input type="file" accept={accept} onChange={onChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
        hasFile ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-400 hover:bg-slate-700/50'
      }`}>
        {hasFile
          ? <span className="font-medium text-indigo-300">{fileName}</span>
          : <span className="text-slate-400 text-sm">{label}</span>
        }
      </div>
    </div>
  );

  const ParamLabel = ({ left, right }: { left: string; right: string }) => (
    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
      <span>{left}</span>
      <span className="font-mono text-slate-500">{right}</span>
    </div>
  );

  const InteractiveBadge = () => (
    <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
      Interactive animation detected — Export disabled
    </div>
  );

  // ────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Description */}
      <p className="text-center text-slate-400 text-sm mb-6 max-w-xl mx-auto leading-relaxed">
        Import external motion templates, customize parameters, and export your own version.
      </p>

      {/* Sub-tab selector */}
      <div className="flex justify-center gap-2 mb-8">
        {(['react', 'rive', 'lottie'] as SubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all border ${
              subTab === tab
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-900/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 relative">
          <div className="sticky top-24 flex flex-col gap-6">

            {/* Live Preview card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
              <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                <PanelHeader icon={<FileVideo size={18} />} title="Live Preview" />
                {/* Background toggle */}
                <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
                  {([['checker','🏁'],['white','⚪'],['black','⚫']] as [typeof previewBg, string][]).map(([id, l]) => (
                    <button key={id} onClick={() => setPreviewBg(id)}
                      className={`px-2 py-1 rounded text-xs ${previewBg === id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview viewport */}
              <div className="relative w-full mx-auto bg-slate-900 max-w-[512px] aspect-square">
                <div className="absolute inset-0 overflow-hidden">
                  {/* Checkerboard */}
                  {previewBg === 'checker' && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                      backgroundImage: 'linear-gradient(45deg,#334155 25%,transparent 25%),linear-gradient(-45deg,#334155 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#334155 75%),linear-gradient(-45deg,transparent 75%,#334155 75%)',
                      backgroundSize: '20px 20px', backgroundPosition: '0 0,0 10px,10px -10px,-10px 0px'
                    }} />
                  )}
                  {previewBg === 'white' && <div className="absolute inset-0 bg-white" />}
                  {previewBg === 'black' && <div className="absolute inset-0 bg-black" />}

                  <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    <span className="bg-slate-900/70 text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-700">512 × 512px</span>
                  </div>

                  {/* ── React iframe ── */}
                  {subTab === 'react' && (
                    iframeSrc
                      ? <iframe
                          key={iframeSrc}
                          srcDoc={iframeSrc}
                          sandbox="allow-scripts"
                          title="React Preview"
                          className="absolute inset-0 w-full h-full border-0"
                        />
                      : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
                          <Code size={40} className="opacity-20" />
                          <p className="text-sm">Paste React code to preview</p>
                        </div>
                  )}

                  {/* ── Rive canvas ── */}
                  {subTab === 'rive' && (
                    riveBuffer
                      ? <canvas ref={riveCanvasRef} className="absolute inset-0 w-full h-full" />
                      : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
                          <Upload size={40} className="opacity-20" />
                          <p className="text-sm">Upload a .riv file to preview</p>
                        </div>
                  )}

                  {/* ── Lottie container ── */}
                  {subTab === 'lottie' && (
                    lottieData
                      ? <div ref={lottieContainerRef} className="absolute inset-0 flex items-center justify-center" />
                      : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
                          <Upload size={40} className="opacity-20" />
                          <p className="text-sm">Upload a Lottie .json file to preview</p>
                        </div>
                  )}
                </div>
              </div>

              {/* Export button */}
              <div className="p-4 border-t border-slate-700 bg-slate-800">
                <div className="relative group/export">
                  <button
                    disabled={!canExport}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      canExport
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Download size={18} />
                    Export GIF
                  </button>
                  {/* Tooltip for interactive */}
                  {!canExport && hasPreview && currentAnimType === 'interactive' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/export:flex z-20">
                      <div className="bg-slate-900 border border-slate-600 text-slate-300 text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                        Interactive animations cannot be exported as GIF
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-600" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generated Code card (React only) */}
            {subTab === 'react' && generatedCode && (
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col min-h-[150px]">
                <div className="flex justify-between items-center mb-3">
                  <PanelHeader icon={<Code size={18} />} title="Generated Code" />
                  <button onClick={copyCode} className="text-slate-400 hover:text-white flex items-center gap-1 transition-all" title="Copy">
                    {isCopied
                      ? <span className="text-green-400 text-xs flex items-center gap-1"><Check size={14} /> Copied</span>
                      : <Copy size={16} />
                    }
                  </button>
                </div>
                <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-green-400 overflow-auto border border-slate-900 whitespace-pre max-h-[300px]">
                  {generatedCode}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* ─ React right panel ─ */}
          {subTab === 'react' && (
            <>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <PanelHeader icon={<Code size={18} />} title="Paste React Code" />
                  {reactCode && (
                    <button
                      onClick={() => handleReactCodeChange('')}
                      className="text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <textarea
                  value={reactCode}
                  onChange={e => handleReactCodeChange(e.target.value)}
                  spellCheck={false}
                  placeholder="Paste your React component here…"
                  rows={13}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-xs font-mono px-3 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-y leading-relaxed"
                />
              </div>

              {(colorParams.length > 0 || sliderParams.length > 0 || fontParams.length > 0 || textParams.length > 0) && (
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <PanelHeader icon={<Zap size={18} />} title="Parameters" />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleUndo}
                        disabled={paramHistory.length === 0}
                        title="Undo"
                        className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={handleResetAll}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>
                  {reactAnimType === 'interactive' && <InteractiveBadge />}

                  <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
                    {/* Colors */}
                    {colorParams.map(cp => (
                      <div key={cp.id}>
                        <ParamLabel left={cp.label} right="" />
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="color"
                            value={cp.value}
                            onChange={e => handleColorChange(cp.id, e.target.value)}
                            className="w-8 h-8 rounded border border-slate-600 bg-slate-900 cursor-pointer p-0.5 flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={cp.textValue}
                            onChange={e => handleColorTextChange(cp.id, e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                            spellCheck={false}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Fonts */}
                    {fontParams.map(fp => (
                      <div key={fp.id}>
                        <ParamLabel left={fp.label} right="" />
                        <input
                          type="text"
                          value={fp.value}
                          onChange={e => handleFontChange(fp.id, e.target.value)}
                          className="w-full mt-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                          spellCheck={false}
                          placeholder="e.g. 'Arial', sans-serif"
                        />
                      </div>
                    ))}

                    {/* Text content */}
                    {textParams.map(tp => (
                      <div key={tp.id}>
                        <ParamLabel left={tp.label} right="" />
                        <input
                          type="text"
                          value={tp.value}
                          onChange={e => handleTextChange(tp.id, e.target.value)}
                          className="w-full mt-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}

                    {/* Width / Height sliders */}
                    {sliderParams.map(sp => (
                      <div key={sp.id}>
                        <ParamLabel left={sp.label} right={`${sp.value}${sp.unit}`} />
                        <input
                          type="range" min={sp.min} max={sp.max} step={sp.step} value={sp.value}
                          onChange={e => handleSliderChange(sp.id, parseFloat(e.target.value))}
                          className="w-full accent-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─ Rive right panel ─ */}
          {subTab === 'rive' && (
            <>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                <div className="mb-3">
                  <PanelHeader icon={<Upload size={18} />} title="Upload Rive File" />
                </div>
                <UploadZone
                  hasFile={!!riveBuffer} fileName={riveFileName}
                  accept=".riv" onChange={handleRiveUpload}
                  label="Click to upload .riv file"
                />
              </div>

              {riveReady && riveInputsRef.current.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                  <div className="mb-4">
                    <PanelHeader icon={<Zap size={18} />} title="Parameters" />
                  </div>
                  {riveAnimType === 'interactive' && <InteractiveBadge />}
                  <div className="space-y-5">
                    {riveInputsRef.current.map((inp: any, i: number) => {
                      if (!riveTypeName) return null;
                      const { Trigger, Number: Num, Boolean: Bool } = riveTypeName;

                      if (inp.type === Trigger) return (
                        <div key={i}>
                          <p className="text-xs text-slate-400 mb-1.5">{inp.name}</p>
                          <button
                            onClick={() => fireRiveTrigger(inp.name)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Fire: {inp.name}
                          </button>
                        </div>
                      );

                      if (inp.type === Num) return (
                        <div key={i}>
                          <ParamLabel left={inp.name} right={String(riveInputValues[inp.name] ?? inp.value ?? 0)} />
                          <input type="range" min={0} max={100} step={1}
                            value={(riveInputValues[inp.name] as number) ?? inp.value ?? 0}
                            onChange={e => setRiveNumberInput(inp.name, parseFloat(e.target.value))}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      );

                      if (inp.type === Bool) return (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">{inp.name}</span>
                          <button
                            onClick={() => setRiveBoolInput(inp.name, !(riveInputValues[inp.name] as boolean))}
                            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${riveInputValues[inp.name] ? 'bg-indigo-600' : 'bg-slate-600'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${riveInputValues[inp.name] ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      );

                      return null;
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─ Lottie right panel ─ */}
          {subTab === 'lottie' && (
            <>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                <div className="mb-3">
                  <PanelHeader icon={<Upload size={18} />} title="Upload Lottie File" />
                </div>
                <UploadZone
                  hasFile={!!lottieData} fileName={lottieFileName}
                  accept=".json" onChange={handleLottieUpload}
                  label="Click to upload .json Lottie file"
                />
              </div>

              {lottieData && (
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                  <div className="mb-4">
                    <PanelHeader icon={<Zap size={18} />} title="Parameters" />
                  </div>
                  {lottieAnimType === 'interactive' && (
                    <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
                      Non-looping animation (loop: false) — Export disabled
                    </div>
                  )}
                  <div className="space-y-5">
                    <div>
                      <ParamLabel left="Animation Speed" right={`${lottieSpeed.toFixed(1)}×`} />
                      <input type="range" min={0.1} max={5} step={0.1} value={lottieSpeed}
                        onChange={e => setLottieSpeed(parseFloat(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <ParamLabel left="Width" right={`${lottieSize.w}px`} />
                      <input type="range" min={50} max={800} step={10} value={lottieSize.w}
                        onChange={e => setLottieSize(s => ({ ...s, w: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                    <div>
                      <ParamLabel left="Height" right={`${lottieSize.h}px`} />
                      <input type="range" min={50} max={800} step={10} value={lottieSize.h}
                        onChange={e => setLottieSize(s => ({ ...s, h: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
