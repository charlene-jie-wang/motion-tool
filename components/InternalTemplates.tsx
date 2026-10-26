import React, { useState, useCallback, useEffect } from 'react';
import { Download, Code, FileVideo, Zap, ArrowLeft, Copy, Check, RotateCcw } from 'lucide-react';

// ─── Template catalogue ───────────────────────────────────────────────────────
interface TemplateCard {
  id: string;
  name: string;
  number: string;
  editable: boolean;
}

const TEMPLATES: TemplateCard[] = [
  { id: '001', name: 'CodePen Card',     number: '#001', editable: true  },
  { id: '002', name: 'Error 404',        number: '#002', editable: false },
  { id: '003', name: 'Loading',           number: '#003', editable: false },
  { id: '004', name: 'Falling Coins',    number: '#004', editable: false },
  { id: '005', name: 'Talent Search',    number: '#005', editable: false },
  { id: '006', name: 'Success Confetti', number: '#006', editable: false },
  { id: '007', name: 'Search',           number: '#007', editable: false },
  { id: '008', name: 'Rocket Launch',    number: '#008', editable: false },
];

const TEMPLATE_PREVIEWS: Record<string, string> = {};

const TEMPLATE_VIDEOS: Record<string, string> = {
  '002': '/error-404-preview.mp4',
  '003': '/visa-card-preview.mp4',
  '004': '/falling-coins-preview.mp4',
  '005': '/talent-search-preview.mp4',
  '006': '/success-confetti-preview.mp4',
  '007': '/search-preview.mp4',
  '008': '/rocket-launch-preview.mp4',
};

// ─── Parameter types ──────────────────────────────────────────────────────────
interface ColorParam {
  id: string;
  label: string;
  matchContext: string;
  propName: string;
  originalValue: string;
  value: string;
  textValue: string;
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
  matchContext: string;
  originalValue: string;
  value: string;
}

type ParamSnapshot = {
  colors: ColorParam[];
  sliders: SliderParam[];
  fonts: FontParam[];
  texts: TextParam[];
};

// ─── The embedded React code for template #001 ────────────────────────────────
const CARD_CODE = `import React from 'react';
import styled from 'styled-components';

const Card = () => {
  return (
    <StyledWrapper>
      <div className="main">
        <div className="card">
          <div className="fl">
            <div className="fullscreen">
              <svg className="fullscreen_svg" viewBox="0 0 100 100"><path d="M3.563-.004a3.573 3.573 0 0 0-3.527 4.09l-.004-.02v28.141c0 1.973 1.602 3.57 3.57 3.57s3.57-1.598 3.57-3.57V12.218v.004l22.461 22.461a3.571 3.571 0 0 0 6.093-2.527c0-.988-.398-1.879-1.047-2.523L12.218 7.172h19.989c1.973 0 3.57-1.602 3.57-3.57s-1.598-3.57-3.57-3.57H4.035a3.008 3.008 0 0 0-.473-.035zM96.333 0l-.398.035.02-.004h-28.16a3.569 3.569 0 0 0-3.57 3.57 3.569 3.569 0 0 0 3.57 3.57h19.989L65.323 29.632a3.555 3.555 0 0 0-1.047 2.523 3.571 3.571 0 0 0 6.093 2.527L92.83 12.221v19.985a3.569 3.569 0 0 0 3.57 3.57 3.569 3.569 0 0 0 3.57-3.57V4.034v.004a3.569 3.569 0 0 0-3.539-4.043l-.105.004zM3.548 64.23A3.573 3.573 0 0 0 .029 67.8v28.626-.004l.016.305-.004-.016.004.059v-.012l.039.289-.004-.023.023.121-.004-.023c.074.348.191.656.34.938l-.008-.02.055.098-.008-.02.148.242-.008-.012.055.082-.008-.012c.199.285.43.531.688.742l.008.008.031.027.004.004c.582.461 1.32.742 2.121.762h.004l.078.004h28.61a3.569 3.569 0 0 0 3.57-3.57 3.569 3.569 0 0 0-3.57-3.57H12.224l22.461-22.461a3.569 3.569 0 0 0-2.492-6.125l-.105.004h.008a3.562 3.562 0 0 0-2.453 1.074L7.182 87.778V67.793a3.571 3.571 0 0 0-3.57-3.57h-.055.004zm92.805 0a3.573 3.573 0 0 0-3.519 3.57v19.993-.004L70.373 65.328a3.553 3.553 0 0 0-2.559-1.082h-.004a3.573 3.573 0 0 0-3.566 3.57c0 1.004.414 1.91 1.082 2.555l22.461 22.461H67.802a3.57 3.57 0 1 0 0 7.14h28.606c.375 0 .742-.059 1.082-.168l-.023.008.027-.012-.02.008.352-.129-.023.008.039-.02-.02.008.32-.156-.02.008.023-.016-.008.008c.184-.102.34-.207.488-.32l-.008.008.137-.113-.008.004.223-.211.008-.008c.156-.164.301-.34.422-.535l.008-.016-.008.016.008-.02.164-.285.008-.02-.008.016.008-.02c.098-.188.184-.406.246-.633l.008-.023-.004.008.008-.023a3.44 3.44 0 0 0 .121-.852v-.004l.004-.078V67.804a3.569 3.569 0 0 0-3.57-3.57h-.055.004z" /></svg>
            </div>
          </div>
          <div className="card_content">
            <button>Code to Infinity!</button>
          </div>
          <div className="card_back" />
        </div>
        <div className="data">
          <div className="img">
            <svg viewBox="0 0 80 80" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <g strokeLinecap="butt" fill="none" strokeWidth={2.00}>
                <path d="M 14.06 0.00 Q 13.33 4.09 13.93 7.52 A 1.04 1.02 -78.7 0 0 14.37 8.19 L 32.87 20.19" stroke="#59afb1" />
                <path d="M 32.87 20.19 L 42.25 26.79" stroke="#4fa6a8" />
                <path d="M 42.25 26.79 C 41.40 28.26 24.14 34.92 21.32 36.20" stroke="#69cbc0" />
                <path d="M 21.32 36.20 Q 15.81 38.21 11.00 41.21" stroke="#6fcdbb" />
                <path d="M 11.00 41.21 L 9.75 40.96" stroke="#5ec8ab" />
                <path d="M 9.75 40.96 Q 5.99 37.71 1.71 35.19 A 1.00 1.00 0.0 0 0 0.22 35.85 L 0.00 36.94" stroke="#5cae9e" />
                <path d="M 79.95 6.12 L 62.46 11.32" stroke="#3190a6" />
                <path d="M 62.46 11.32 Q 47.42 14.67 32.87 20.19" stroke="#3a96a3" />
                <path d="M 80.00 11.06 L 64.50 17.46" stroke="#22a3be" />
                <path d="M 64.50 17.46 L 62.46 11.32" stroke="#28879d" />
                <path d="M 64.50 17.46 L 43.00 26.96" stroke="#2ba9bb" />
                <path d="M 43.00 26.96 L 42.25 26.79" stroke="#4ab2b2" />
              </g>
            </svg>
          </div>
          <div className="text">
            <div className="text_m">CSS Gradient Button</div>
            <div className="text_s">Praashoo7</div>
          </div>
        </div>
        <div className="btns">
          <div className="likes">
            <svg viewBox="-2 0 105 92" className="likes_svg"><path d="M85.24 2.67C72.29-3.08 55.75 2.67 50 14.9 44.25 2 27-3.8 14.76 2.67 1.1 9.14-5.37 25 5.42 44.38 13.33 58 27 68.11 50 86.81 73.73 68.11 87.39 58 94.58 44.38c10.79-18.7 4.32-35.24-9.34-41.71Z" /></svg>
            <span className="likes_text">22</span>
          </div>
          <div className="comments">
            <svg viewBox="-405.9 238 56.3 54.8" className="comments_svg"><path d="M-391 291.4c0 1.5 1.2 1.7 1.9 1.2 1.8-1.6 15.9-14.6 15.9-14.6h19.3c3.8 0 4.4-.8 4.4-4.5v-31.1c0-3.7-.8-4.5-4.4-4.5h-47.4c-3.6 0-4.4.9-4.4 4.5v31.1c0 3.7.7 4.4 4.4 4.4h10.4v13.5z" /></svg>
            <span className="comments_text">12</span>
          </div>
          <div className="views">
            <svg viewBox="0 0 30.5 16.5" className="views_svg"><path d="M15.3 0C8.9 0 3.3 3.3 0 8.3c3.3 5 8.9 8.3 15.3 8.3s12-3.3 15.3-8.3C27.3 3.3 21.7 0 15.3 0zm0 14.5c-3.4 0-6.2-2.8-6.2-6.2C9 4.8 11.8 2 15.3 2c3.4 0 6.2 2.8 6.2 6.2 0 3.5-2.8 6.3-6.2 6.3z" /></svg>
            <span className="views_text">332</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div\`
  .card {
    width: 15em;
    height: 10em;
    background: linear-gradient(270deg, #ce68d9, #45c6db, #45db79);
    background-size: 800% 800%;
    -webkit-animation: AnimationName 3s ease infinite;
    -moz-animation: AnimationName 3s ease infinite;
    animation: AnimationName 3s ease infinite;
    transition: .4s ease-in-out;
    border-radius: 7px;
    cursor: pointer;
  }
  .fl {
    display: flex;
    justify-content: flex-end;
    opacity: 0;
    transition: .2s ease-in-out;
  }
  .fl:hover .fullscreen { scale: 1.2; }
  .fl:hover .fullscreen_svg { fill: white; }
  .fullscreen {
    width: 1.5em;
    height: 1.5em;
    border-radius: 5px;
    background-color: #727890;
    margin: 1em;
    margin-right: 0.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: .2s ease-in-out;
    box-shadow: 2px 2px 6px rgba(0,0,0,.4);
  }
  .fullscreen_svg {
    width: 15px;
    height: 15px;
    fill: rgb(177, 176, 176);
    transition: .2s ease-in-out;
  }
  .card_back {
    position: absolute;
    width: 15em;
    height: 13em;
    background-color: rgba(30, 31, 38, 0.575);
    border-radius: 7px;
    margin-top: -4.7em;
    margin-left: 0.7em;
    transition: .2s ease-in-out;
    z-index: -1;
  }
  .main:hover .card_back {
    margin-top: -5.9em;
    margin-left: 0em;
    scale: 1.1;
    height: 15.25em;
    cursor: pointer;
  }
  .main:hover .fl {
    opacity: 1;
    cursor: pointer;
    margin-right: 0.5em;
  }
  .data {
    display: flex;
    flex-direction: row;
    margin-top: 1em;
  }
  .img {
    width: 2.25em;
    height: 2.25em;
    background-color: #252525;
    border-radius: 5px;
    overflow: hidden;
  }
  .text {
    display: flex;
    justify-content: center;
    flex-direction: column;
    margin-left: 0.5em;
    font-family: Montserrat;
    color: white;
  }
  .text_m { font-weight: bold; font-size: 0.9em; }
  .text_s { font-size: 0.7em; }
  .btns { display: flex; gap: 0.5em; transition: .2s ease-in-out; }
  .likes {
    display: flex; align-items: center; justify-content: center;
    width: 2.5em; height: 1.4em; border-radius: 4px;
    margin-top: -0.5em; opacity: 0;
    background-color: #444857; transition: .2s ease-in-out;
  }
  .likes_text { font-family: Montserrat; font-size: 0.8em; margin-left: 0.25em; color: white; }
  .likes_svg { width: 12px; height: 12px; fill: white; }
  .likes:hover { background-color: #5A5F73; cursor: pointer; }
  .comments {
    display: flex; align-items: center; justify-content: center;
    width: 2.5em; height: 1.4em; border-radius: 4px;
    margin-top: -0.5em; opacity: 0;
    background-color: #444857; transition: .24s ease-in-out;
  }
  .comments_text { font-family: Montserrat; font-size: 0.8em; margin-left: 0.25em; color: white; }
  .comments_svg { width: 12px; height: 12px; fill: white; }
  .comments:hover { background-color: #5A5F73; cursor: pointer; }
  .views {
    display: flex; align-items: center; justify-content: center;
    width: 3em; height: 1.4em; border-radius: 4px;
    margin-top: -0.5em; opacity: 0;
    background-color: #444857; transition: .28s ease-in-out;
  }
  .views_text { font-family: Montserrat; font-size: 0.8em; margin-left: 0.25em; color: white; }
  .views_svg { width: 12px; height: 12px; fill: white; }
  .views:hover { background-color: #5A5F73; cursor: pointer; }
  .main:hover .likes { margin-top: 0.5em; opacity: 1; }
  .main:hover .comments { margin-top: 0.5em; opacity: 1; }
  .main:hover .views { margin-top: 0.5em; opacity: 1; }
  .card_content { display: flex; align-items: center; justify-content: center; }
  button {
    padding: 0.8em; width: 14em; border-radius: 10px;
    font-family: Montserrat; font-size: 0.8em;
    align-self: center; outline: none; font-weight: bold;
    border: 1px solid white; background-color: transparent;
    color: white; transition: .4s ease-in-out;
  }
  button:hover {
    cursor: pointer; color: black;
    background: rgba(255, 255, 255, 0.2); border-radius: 15px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  button:active {
    scale: 1.1; opacity: 1; color: transparent;
    background: linear-gradient(90deg, #ce68d9, #45c6db, #45db79, #9f45b0, #e54ed0, #ffe4f2);
    background-size: 800% 800%;
    -webkit-animation: AnimationName 1s ease infinite;
    -moz-animation: AnimationName 1s ease infinite;
    animation: AnimationName 1s ease infinite;
  }
  @keyframes AnimationName {
    0% { background-position: 0% 50% }
    50% { background-position: 100% 50% }
    100% { background-position: 0% 50% }
  }
\`;

export default Card;`;

// ─── Utility: convert any color to hex ───────────────────────────────────────
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

// ─── Label helpers ────────────────────────────────────────────────────────────
function humanize(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatPropLabel(prop: string): string {
  if (prop.includes('-')) return humanize(prop);
  return prop.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

function getContextLabel(code: string, matchStart: number): string {
  const lines = code.slice(0, matchStart).split('\n');
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    const line = lines[i].trim();
    if (!line || /^[{},;]$/.test(line)) continue;
    let m = line.match(/\.([\w-]+)/);
    if (m) return humanize(m[1]);
    m = line.match(/&:+(\w[\w-]*)/);
    if (m) return humanize(m[1]);
    m = line.match(/\/\*\s*(.+?)\s*\*\//);
    if (m) return m[1].trim();
    m = line.match(/\/\/\s*(.+)/);
    if (m) return m[1].trim();
    m = line.match(/^([a-zA-Z][\w-]*)\s*[{,]/);
    const reserved = new Set(['const','let','var','function','class','return','export','import','if','else']);
    if (m && !reserved.has(m[1])) return humanize(m[1]);
    break;
  }
  return '';
}

// ─── Non-color CSS properties ─────────────────────────────────────────────────
const NON_COLOR_PROPS = new Set([
  'width','height','min-width','max-width','min-height','max-height',
  'margin','margin-top','margin-right','margin-bottom','margin-left',
  'padding','padding-top','padding-right','padding-bottom','padding-left',
  'top','right','bottom','left','gap','row-gap','column-gap',
  'border-width','border-radius','border-top-left-radius','border-top-right-radius',
  'border-bottom-left-radius','border-bottom-right-radius','outline-width',
  'font-size','font-weight','font-style','font-variant','font-stretch',
  'line-height','letter-spacing','word-spacing','text-indent',
  'font-family',
  'animation','animation-duration','animation-delay','animation-iteration-count',
  'animation-timing-function','animation-fill-mode','animation-play-state',
  'transition','transition-duration','transition-delay','transition-timing-function',
  'transform','transform-origin','perspective','z-index',
  'opacity','display','position','overflow','overflow-x','overflow-y',
  'visibility','cursor','pointer-events','user-select',
  'flex','flex-direction','flex-wrap','flex-grow','flex-shrink','flex-basis',
  'align-items','align-self','align-content','justify-content','justify-self',
  'grid','grid-template','grid-template-columns','grid-template-rows',
  'white-space','word-break','word-wrap','text-overflow','text-transform',
  'text-decoration','content',
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
} {
  const colors: ColorParam[] = [];
  const sliders: SliderParam[] = [];
  const fonts: FontParam[] = [];
  const texts: TextParam[] = [];
  const seenCtx = new Set<string>();

  let m: RegExpExecArray | null;

  // ── Colors ────────────────────────────────────────────────────────────────
  const allColorsRe = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])|rgba?\([^)]+\)/g;
  while ((m = allColorsRe.exec(code)) !== null) {
    const rawColor = m[0];
    const lineStart = code.lastIndexOf('\n', m.index) + 1;
    const beforeColor = code.slice(lineStart, m.index);
    const propMatch = beforeColor.match(/([\w-]+)\s*:\s*(?:[^;{}]*?)?$/);
    if (!propMatch) continue;
    const prop = propMatch[1];
    if (NON_COLOR_PROPS.has(prop)) continue;
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

  // ── Fonts — CSS font-family ───────────────────────────────────────────────
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

  // ── Fonts — React fontFamily ──────────────────────────────────────────────
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

  // ── Fonts — CSS font-size ─────────────────────────────────────────────────
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

  // ── Fonts — React fontSize ────────────────────────────────────────────────
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

  // ── Size sliders (width + height, one each) ───────────────────────────────
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

  // ── Animation speed ───────────────────────────────────────────────────────
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

  // ── Text nodes ────────────────────────────────────────────────────────────
  const textRe = />([^<>{}\n\r]{2,})</g;
  while ((m = textRe.exec(code)) !== null) {
    const raw = m[1];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2) continue;
    if (/[{}()=;`]/.test(trimmed)) continue;
    if (/^\d+$/.test(trimmed)) continue;
    const matchContext = `>${raw}<`;
    if (seenCtx.has(matchContext)) continue;
    seenCtx.add(matchContext);
    const before = code.slice(Math.max(0, m.index - 60), m.index + 1);
    const tagM = before.match(/<([A-Za-z][A-Za-z0-9]*)(?:\s[^>]*)?>$/);
    const tagName = tagM ? tagM[1] : 'Element';
    const label = `${humanize(tagName)} Text`;
    texts.push({ id: `tx${texts.length}`, label, matchContext, originalValue: raw, value: trimmed });
  }

  return { colors, sliders, fonts, texts };
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

// ─── Extract the default-exported component name ──────────────────────────────
function extractComponentName(raw: string): string {
  let m = raw.match(/export\s+default\s+(?:function|class)\s+([A-Z][A-Za-z0-9_]*)/);
  if (m) return m[1];
  m = raw.match(/export\s+default\s+([A-Z][A-Za-z0-9_]*)\s*[;\n]/);
  if (m) return m[1];
  m = raw.match(/(?:function|class)\s+([A-Z][A-Za-z0-9_]*)\b/);
  if (m) return m[1];
  m = raw.match(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=/);
  if (m) return m[1];
  return 'App';
}

// ─── Strip imports / exports ──────────────────────────────────────────────────
function preprocessCode(raw: string): string {
  return raw
    .replace(/^import\s[\s\S]*?from\s+['"][^'"]*['"]\s*;?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]*['"]\s*;?\s*$/gm, '')
    .replace(/^\s*export\s+default\s+function\b/gm, 'function')
    .replace(/^\s*export\s+default\s+class\b/gm, 'class')
    .replace(/^\s*export\s+default\s+[\w.]+\s*;?\s*$/gm, '')
    .replace(/^\s*export\s+((?:async\s+)?(?:function|class|const|let|var)\b)/gm, '$1')
    .replace(/^\s*export\s*\{[^}]*\}[^;]*;?\s*$/gm, '')
    .trim();
}

// ─── Styled-components inline polyfill ────────────────────────────────────────
const SC_POLYFILL = `(function(){
  if(typeof React==='undefined')return;
  var _s=document.createElement('style');document.head.appendChild(_s);
  var _c=0,_k=0;
  function _tpl(str,vals){
    return Array.from(str).reduce(function(a,s,i){
      var v=i<vals.length?vals[i]:'';
      return a+s+(typeof v==='function'?'':v==null?'':v);
    },'');
  }
  function _split(css){
    var top='',inner='';
    var i=0,len=css.length;
    while(i<len){
      var at=css.indexOf('@',i);
      if(at===-1){inner+=css.slice(i);break;}
      inner+=css.slice(i,at);
      var depth=0,j=at;
      while(j<len){
        if(css[j]==='{')depth++;
        else if(css[j]==='}'){depth--;if(depth===0){j++;break;}}
        j++;
      }
      top+=css.slice(at,j)+'\\n';
      i=j;
    }
    return{top:top,inner:inner};
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
      var parts=_split(_tpl(a[0],Array.prototype.slice.call(a,1)));
      _s.textContent+=parts.top+'.'+cls+'{'+parts.inner+'}\\n';
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

const REACT_GLOBALS = `const {
  useState, useEffect, useRef, useMemo, useCallback,
  useContext, useReducer, createContext, forwardRef, memo, Fragment
} = React;`;

// ─── Build iframe srcdoc ──────────────────────────────────────────────────────
function buildIframe(rawCode: string, bg: string): string {
  const code = preprocessCode(rawCode);
  const compName = extractComponentName(rawCode);
  const bodyBg = bg === 'white' ? '#fff' : bg === 'black' ? '#000' : 'transparent';

  // Escape </script> inside the code block so it doesn't close the script tag early
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
<script>${SC_POLYFILL}</script>
<script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
<script id="__src" type="text/plain">${safeCode}</script>
<script>
(function(){
  try {
    var src = document.getElementById('__src').textContent;
    var globals = 'const {useState,useEffect,useRef,useMemo,useCallback,useContext,useReducer,createContext,forwardRef,memo,Fragment}=React;' +
      'const styled=window.__SC.default,keyframes=window.__SC.keyframes,css=window.__SC.css,' +
      'createGlobalStyle=window.__SC.createGlobalStyle,ThemeProvider=window.__SC.ThemeProvider;';
    var wrapped = '(function(){'+ globals + src +
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

// ─── Shared small UI components ───────────────────────────────────────────────
const PanelHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
    <span className="text-indigo-400">{icon}</span>
    {title}
  </h2>
);

const ParamLabel = ({ left, right }: { left: string; right: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-slate-400">{left}</span>
    {right && <span className="text-xs text-slate-500 font-mono">{right}</span>}
  </div>
);

// ─── Grid card ────────────────────────────────────────────────────────────────
function TemplateCardItem({ tpl, onClick }: { tpl: TemplateCard; onClick?: () => void }) {
  return (
    <div
      className={`bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col shadow-lg transition-all ${
        tpl.editable ? 'cursor-pointer hover:border-indigo-500 hover:shadow-indigo-500/20 hover:shadow-xl' : ''
      }`}
      onClick={tpl.editable ? onClick : undefined}
    >
      {/* Preview area */}
      <div className="relative w-full aspect-square bg-slate-700 flex items-center justify-center overflow-hidden">
        {TEMPLATE_PREVIEWS[tpl.id] ? (
          <div className="absolute inset-0 bg-white" />
        ) : !TEMPLATE_VIDEOS[tpl.id] && tpl.id !== '001' ? (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%)',
              backgroundSize: '24px 24px',
            }}
          />
        ) : null}
        {tpl.id === '001' || TEMPLATE_VIDEOS[tpl.id] ? (
          <video
            src={tpl.id === '001' ? '/card-001-preview.mp4' : TEMPLATE_VIDEOS[tpl.id]}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : TEMPLATE_PREVIEWS[tpl.id] ? (
          <img
            src={TEMPLATE_PREVIEWS[tpl.id]}
            alt={tpl.name}
            className="relative z-10 max-w-[80%] max-h-[80%] object-contain"
          />
        ) : (
          <span className="relative z-10 text-slate-500 text-xs font-mono">{tpl.number}</span>
        )}
        {tpl.editable && (
          <span className="absolute top-2 right-2 z-10 bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Editable
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">{tpl.name}</p>
          <p className="text-[10px] text-slate-500">{tpl.number}</p>
        </div>
        <button
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          onClick={e => { e.stopPropagation(); }}
          title="Download"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Detail page ──────────────────────────────────────────────────────────────
function DetailPage({ onBack }: { onBack: () => void }) {
  const [previewBg, setPreviewBg] = useState<'checker' | 'white' | 'black'>('checker');
  const [isCopied, setIsCopied] = useState(false);

  // Parse params once from CARD_CODE
  const initialParsed = parseReactCode(CARD_CODE);
  const [colors, setColors] = useState<ColorParam[]>(initialParsed.colors);
  const [sliders, setSliders] = useState<SliderParam[]>(initialParsed.sliders);
  const [fonts, setFonts] = useState<FontParam[]>(initialParsed.fonts);
  const [texts, setTexts] = useState<TextParam[]>(initialParsed.texts);
  const [originalParams] = useState<ParamSnapshot>({
    colors: initialParsed.colors,
    sliders: initialParsed.sliders,
    fonts: initialParsed.fonts,
    texts: initialParsed.texts,
  });
  const [paramHistory, setParamHistory] = useState<ParamSnapshot[]>([]);
  const [generatedCode, setGeneratedCode] = useState(CARD_CODE);
  const [iframeSrc, setIframeSrc] = useState(() => buildIframe(CARD_CODE, 'checker'));

  // Rebuild iframe when bg changes
  useEffect(() => {
    setIframeSrc(buildIframe(generatedCode, previewBg));
  }, [previewBg]); // eslint-disable-line

  const rebuildAll = useCallback((
    c: ColorParam[], s: SliderParam[], f: FontParam[], t: TextParam[], bg: string
  ) => {
    const updated = applyParams(CARD_CODE, c, s, f, t);
    setGeneratedCode(updated);
    setIframeSrc(buildIframe(updated, bg));
  }, []);

  function pushHistory() {
    setParamHistory(h => [...h, { colors, sliders, fonts, texts }]);
  }

  function handleUndo() {
    setParamHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setColors(prev.colors);
      setSliders(prev.sliders);
      setFonts(prev.fonts);
      setTexts(prev.texts);
      rebuildAll(prev.colors, prev.sliders, prev.fonts, prev.texts, previewBg);
      return h.slice(0, -1);
    });
  }

  function handleResetAll() {
    setColors(originalParams.colors);
    setSliders(originalParams.sliders);
    setFonts(originalParams.fonts);
    setTexts(originalParams.texts);
    setParamHistory([]);
    rebuildAll(originalParams.colors, originalParams.sliders, originalParams.fonts, originalParams.texts, previewBg);
  }

  function handleColorChange(id: string, hexVal: string) {
    pushHistory();
    const next = colors.map(c => c.id === id ? { ...c, value: hexVal, textValue: hexVal } : c);
    setColors(next);
    rebuildAll(next, sliders, fonts, texts, previewBg);
  }

  function handleColorTextChange(id: string, text: string) {
    const next = colors.map(c => c.id === id ? { ...c, textValue: text } : c);
    setColors(next);
    if (/^#[0-9a-fA-F]{3,8}$/.test(text) || /^rgba?\(/.test(text)) {
      pushHistory();
      const withHex = next.map(c => c.id === id ? { ...c, value: toHex(text) } : c);
      setColors(withHex);
      rebuildAll(withHex, sliders, fonts, texts, previewBg);
    }
  }

  function handleSliderChange(id: string, val: number) {
    pushHistory();
    const next = sliders.map(s => s.id === id ? { ...s, value: val } : s);
    setSliders(next);
    rebuildAll(colors, next, fonts, texts, previewBg);
  }

  function handleFontChange(id: string, val: string) {
    pushHistory();
    const next = fonts.map(f => f.id === id ? { ...f, value: val } : f);
    setFonts(next);
    rebuildAll(colors, sliders, next, texts, previewBg);
  }

  function handleTextChange(id: string, val: string) {
    pushHistory();
    const next = texts.map(t => t.id === id ? { ...t, value: val } : t);
    setTexts(next);
    rebuildAll(colors, sliders, fonts, next, previewBg);
  }

  function copyCode() {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => {});
  }

  const hasParams = colors.length > 0 || sliders.length > 0 || fonts.length > 0 || texts.length > 0;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        ← Back to Templates
      </button>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT COLUMN ───────────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Live Preview */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
              <PanelHeader icon={<FileVideo size={18} />} title="Live Preview" />
              {/* Background toggle */}
              <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
                {([['checker','🏁'],['white','⚪'],['black','⚫']] as [typeof previewBg, string][]).map(([id, l]) => (
                  <button
                    key={id}
                    onClick={() => setPreviewBg(id)}
                    className={`px-2 py-1 rounded text-xs ${previewBg === id ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
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

                <iframe
                  key={iframeSrc}
                  srcDoc={iframeSrc}
                  sandbox="allow-scripts allow-same-origin"
                  title="Live Preview"
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </div>

            {/* Download button */}
            <div className="p-4 border-t border-slate-700 bg-slate-800">
              <button className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
                <Download size={18} />
                Download
              </button>
            </div>
          </div>

          {/* Generated Code */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col min-h-[150px]">
            <div className="flex justify-between items-center mb-3">
              <PanelHeader icon={<Code size={18} />} title="Generated Code" />
              <button
                onClick={copyCode}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-all"
                title="Copy"
              >
                {isCopied
                  ? <span className="text-green-400 text-xs flex items-center gap-1"><Check size={14} /> Copied</span>
                  : <Copy size={16} />
                }
              </button>
            </div>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-green-400 overflow-auto border border-slate-900 whitespace-pre max-h-[300px] leading-relaxed">
              {generatedCode}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────── */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Info card */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-white">CodePen Card</h1>
              <p className="text-sm text-slate-500 mt-0.5">#001</p>
            </div>

            <div className="flex items-center justify-between py-2.5 border-t border-slate-700">
              <span className="text-xs text-slate-400">
                Original file: <span className="text-slate-300 font-mono">codepen-card.jsx</span>
              </span>
              <button
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Download original"
              >
                <Download size={14} />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              An interactive card with a looping gradient animation, hover-reveal social buttons,
              and an active button effect. Built with styled-components.
            </p>
          </div>

          {/* Parameters */}
          {hasParams && (
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

              <div className="space-y-5 max-h-[420px] overflow-y-auto pr-1">
                {/* Colors */}
                {colors.map(cp => (
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
                {fonts.map(fp => (
                  <div key={fp.id}>
                    <ParamLabel left={fp.label} right="" />
                    <input
                      type="text"
                      value={fp.value}
                      onChange={e => handleFontChange(fp.id, e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      spellCheck={false}
                    />
                  </div>
                ))}

                {/* Texts */}
                {texts.map(tp => (
                  <div key={tp.id}>
                    <ParamLabel left={tp.label} right="" />
                    <input
                      type="text"
                      value={tp.value}
                      onChange={e => handleTextChange(tp.id, e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                      spellCheck={false}
                    />
                  </div>
                ))}

                {/* Sliders */}
                {sliders.map(sp => (
                  <div key={sp.id}>
                    <ParamLabel left={sp.label} right={`${sp.value}${sp.unit}`} />
                    <input
                      type="range"
                      min={sp.min} max={sp.max} step={sp.step} value={sp.value}
                      onChange={e => handleSliderChange(sp.id, parseFloat(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InternalTemplates() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      {selectedId === '001' ? (
        <DetailPage onBack={() => setSelectedId(null)} />
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-200">Internal Templates</h2>
            <p className="text-sm text-slate-400 mt-1">
              Ready-made motion components. Click an <span className="text-indigo-400 font-medium">Editable</span> card to customise and export.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {TEMPLATES.map(tpl => (
              <React.Fragment key={tpl.id}>
                <TemplateCardItem
                  tpl={tpl}
                  onClick={() => { if (tpl.editable) setSelectedId(tpl.id); }}
                />
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
