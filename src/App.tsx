import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { GridCellLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl/maplibre';
import { LightingEffect, AmbientLight, DirectionalLight, MapView, WebMercatorViewport } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { X, ChevronRight, Activity, Building2, TreePine, Zap, Bell } from 'lucide-react';
import logoE from './img/logo_e.svg';
import footerLogo from './img/fooer_logo2_e.png';
import CarbonLegend from './CarbonLegend';
import MapGuideTooltip from './MapGuideTooltip';

// ============================================================
// [1] 정밀 광명시 경계 — 절대 수정 금지
// ============================================================
const BOUNDARY = [
  [126.830, 37.480], [126.840, 37.490], [126.870, 37.485], [126.885, 37.480],
  [126.890, 37.460], [126.895, 37.445],
  [126.890, 37.425], [126.885, 37.410],
  [126.870, 37.410], [126.860, 37.420],
  [126.875, 37.435], [126.880, 37.450], [126.870, 37.465],
  [126.850, 37.470], [126.840, 37.475],
  [126.830, 37.480]
];

// [2] 수치 오차 없는 정밀 Ray-casting 알고리즘 — 절대 수정 금지
const isInside = (point: number[], vs: number[][]) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1], xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export interface CarbonDataPoint {
  position: [number, number];
  color: [number, number, number, number];
  elev: number;
  concentration: number;
  region: string;
  isBoundary?: boolean;
}

// [3] 건물 높이 난수 생성기 — 절대 수정 금지
const pseudoRandom = (x: number, y: number) => {
  const sin = Math.sin(x * 12.9898 + y * 78.233);
  return (sin * 43758.5453) - Math.floor(sin * 43758.5453);
};

// [4] 색상 보간 함수 (무광 뮤트 톤) — 절대 수정 금지
const getGradientColor = (flow: number): [number, number, number, number] => {
  const stops = [
    { v: 0.0, c: [0, 176, 80, 255] },
    { v: 0.3, c: [146, 208, 80, 255] },
    { v: 0.55, c: [255, 192, 0, 255] },
    { v: 0.72, c: [237, 125, 49, 255] },
    { v: 0.9, c: [255, 0, 0, 255] }
  ];
  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (flow >= stops[i].v && flow <= stops[i + 1].v) {
      lower = stops[i]; upper = stops[i + 1]; break;
    }
  }
  const range = upper.v - lower.v;
  const t = range === 0 ? 0 : (flow - lower.v) / range;
  return [
    Math.round(lower.c[0] + (upper.c[0] - lower.c[0]) * t),
    Math.round(lower.c[1] + (upper.c[1] - lower.c[1]) * t),
    Math.round(lower.c[2] + (upper.c[2] - lower.c[2]) * t),
    255
  ];
};

// [5] 탄소 데이터 생성 엔진 — 절대 수정 금지
const fetchCarbonData = async (): Promise<CarbonDataPoint[]> => {
  return new Promise((resolve) => {
    const data: CarbonDataPoint[] = [];
    const res = 0.00045;
    const urbanCenters = [
      { name: '광명/철산권역', pos: [126.865, 37.480], intensity: 1.17 },
      { name: '하안권역', pos: [126.875, 37.460], intensity: 0.81 },
      { name: '소하권역', pos: [126.885, 37.440], intensity: 0.72 },
      { name: '일직/KTX권역', pos: [126.880, 37.425], intensity: 1.08 }
    ];
    for (let lng = 126.81; lng <= 126.92; lng += res) {
      for (let lat = 37.39; lat <= 37.50; lat += res) {
        if (isInside([lng, lat], BOUNDARY)) {
          let maxFlow = 0, minDist = 1, nearestRegion = '기타';
          for (const center of urbanCenters) {
            const dist = Math.hypot(lng - center.pos[0], lat - center.pos[1]);
            if (dist < minDist) { minDist = dist; nearestRegion = center.name; }
            const sigma = 0.016;
            const flow = center.intensity * Math.exp(-(dist * dist) / (2 * sigma * sigma));
            maxFlow = Math.max(maxFlow, flow);
          }
          const noise = (pseudoRandom(lng, lat) - 0.5) * 0.1;
          let carbonFlow = Math.max(0, Math.min(1, maxFlow + noise - 0.05));
          let maxBuildingHeight = 30;
          if (minDist < 0.01) maxBuildingHeight = 150;
          else if (minDist < 0.02) maxBuildingHeight = 80;
          let elev = 10 + pseudoRandom(lng + 1, lat + 1) * maxBuildingHeight;
          elev = Math.floor(elev / 10) * 10;
          if (elev < 10) elev = 10;
          data.push({ position: [lng, lat], color: getGradientColor(carbonFlow), elev, concentration: carbonFlow, region: nearestRegion });
        }
      }
    }
    const grid: Record<string, string> = {};
    data.forEach(d => {
      const px = Math.round(d.position[0] * 100000);
      const py = Math.round(d.position[1] * 100000);
      grid[`${px}_${py}`] = d.region;
    });
    const step = Math.round(res * 100000);
    data.forEach(d => {
      let isBoundary = false;
      const px = Math.round(d.position[0] * 100000);
      const py = Math.round(d.position[1] * 100000);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          if (grid[`${px + dx * step}_${py + dy * step}`] !== d.region) { isBoundary = true; break; }
        }
        if (isBoundary) break;
      }
      d.isBoundary = isBoundary;
    });
    resolve(data);
  });
};

// [6] 조명 설정 — 절대 수정 금지
const ambientLight = new AmbientLight({ color: [255, 255, 255], intensity: 0.85 });
const directionalLight = new DirectionalLight({ color: [255, 255, 255], intensity: 1.2, direction: [-1, -1, -2] });
const lightingEffect = new LightingEffect({ ambientLight, directionalLight });

// ... (하단 UI 컴포넌트 생략 - 기존 구조 유지)
// App 컴포넌트 내부 로직도 동일하게 '<<<<<<<' 마커만 제거하여 사용하세요.