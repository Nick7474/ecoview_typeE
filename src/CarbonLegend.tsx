/**
 * CarbonLegend — 탄소 배출 농도 범례 패널
 *
 * 피그마 출처: node-id 608:1471 (ao400sPQKEonTFv1LKcuWM)
 * 컬러값은 App.tsx의 getGradientColor() 함수와 100% 동기화
 *
 * ─ 피그마 원본 수치 ─
 *   width : 137px
 *   height: 212px
 *   padding: 11px 19px 23px
 *   gradient: 103.29deg, rgba(255,255,255,0.09→0.03→0.09)
 *   border : 1.6px solid rgba(255,255,255,0.4)
 *   shadow : 0px 0px 10px 0px rgba(36,40,37,0.15)
 *   blur   : backdrop-filter: blur(10px)
 *   radius : 16px
 *
 * ─ 컬러 동기화 (getGradientColor stops) ─
 *   v=0.9  → [255,  0,   0 ] → #FF0000  (매우 높음)
 *   v=0.72 → [237, 125, 49 ] → #ED7D31  (높음)
 *   v=0.55 → [255, 192,  0 ] → #FFC000  (보통)
 *   v=0.3  → [146, 208, 80 ] → #92D050  (낮음)
 *   v=0.0  → [  0, 176, 80 ] → #00B050  (매우 낮음)
 */

import React, { useState, useEffect } from 'react';

const LEGEND_ITEMS = [
  { color: '#FF0000', label: '매우 높음' },
  { color: '#ED7D31', label: '높음'     },
  { color: '#FFC000', label: '보통'     },
  { color: '#92D050', label: '낮음'     },
  { color: '#00B050', label: '매우 낮음'},
] as const;

const CarbonLegend: React.FC<{ isUIOpen?: boolean }> = ({ isUIOpen = true }) => {
  const [footerOffset, setFooterOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      // 풋터 영역 높이 92px
      const footerHeight = 92;
      
      const distanceToBottom = docHeight - (scrollTop + windowHeight);
      if (distanceToBottom < footerHeight) {
        setFooterOffset(footerHeight - distanceToBottom);
      } else {
        setFooterOffset(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll(); // 초기 강제 측정

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div
      style={{
        /* ── 피그마 608:1471 글래스모피즘 수치 ── */
        position: 'fixed',
        bottom: 18 + footerOffset,
        right: isUIOpen ? 490 : 90,
        zIndex: 40,
        width: 137,
        height: 212,
        borderRadius: 16,
        border: '1.6px solid rgba(255, 255, 255, 0.20)',
        background: 'rgba(255, 255, 255, 0.08)',
        boxShadow: '0px 0px 10px 0px rgba(36, 40, 37, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 11,
        paddingBottom: 23,
        paddingLeft: 19,
        paddingRight: 19,
        pointerEvents: 'none',     // 맵 인터랙션 방해 없음
        transform: 'scale(0.8)',
        transformOrigin: 'bottom right',
        transition: 'right 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
    {/* ── 제목 (피그마 608:1469) ── */}
    <div
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 10,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        marginBottom: 14,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: 'white',
          letterSpacing: '-0.28px',
          whiteSpace: 'nowrap',
        }}
      >
        탄소 배출 농도
      </span>
    </div>

    {/* ── 5단계 컬러 아이템 (피그마 608:1470) ── */}
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: 81,
      }}
    >
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          {/* 컬러 칩 — 복셀 컬러와 100% 동일 */}
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: color,
              flexShrink: 0,
            }}
          />
          {/* 레이블 */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: '#c4c8cf',
              letterSpacing: '-0.24px',
              whiteSpace: 'nowrap',
              textAlign: 'right',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  </div>
  );
};

export default CarbonLegend;
