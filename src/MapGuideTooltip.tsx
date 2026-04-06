import React, { useState, useEffect, useRef } from 'react';

const MapGuideTooltip: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const isDismissedRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem('mapGuideDismissed') === 'true') {
      isDismissedRef.current = true;
      return;
    }

    // 초기 로딩 후 2초 뒤 등장
    const initTimer = setTimeout(() => {
      showTooltip();
    }, 2000);

    // 자동 소멸 대신 1분(60초)마다 다시 페이드 인 시도
    // (이미 닫기 버튼으로 해제되었으면 동작 안 함)
    const interval = setInterval(() => {
      if (!isDismissedRef.current && !isVisible) {
        showTooltip();
      }
    }, 60000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [isVisible]);

  const showTooltip = () => {
    if (isDismissedRef.current) return;
    setIsRendered(true);
    requestAnimationFrame(() => {
      setTimeout(() => setIsVisible(true), 50);
    });
  };

  const hideTooltip = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsRendered(false);
    }, 500); // 페이드아웃 후 컴포넌트 언마운트 대기
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation(); // 툴팁 배경 클릭 이벤트 버블링 차단
    sessionStorage.setItem('mapGuideDismissed', 'true');
    isDismissedRef.current = true;
    hideTooltip();
  };

  // 툴팁 외부 영역(3D맵) 클릭 및 스크롤 시 임시 소멸 감지 로직
  useEffect(() => {
    const handleInteract = (e: Event) => {
      if (isVisible) {
        hideTooltip();
      }
    };

    window.addEventListener('mousedown', handleInteract);
    window.addEventListener('wheel', handleInteract);
    window.addEventListener('touchstart', handleInteract);

    return () => {
      window.removeEventListener('mousedown', handleInteract);
      window.removeEventListener('wheel', handleInteract);
      window.removeEventListener('touchstart', handleInteract);
    };
  }, [isVisible]);

  if (isDismissedRef.current && !isRendered) return null;
  if (!isRendered) return null;

  return (
    <div 
      // 완벽한 정중앙 정렬을 위해 left: 50% & translateX(-50%)를 absolute position에서 사용
      className={`fixed z-[100] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        left: '50%',
        bottom: '60px',
        transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        pointerEvents: 'auto', // 내부에 마우스 오버 및 클릭이 가능하도록 활성화
      }}
    >
      <style>{`
        @keyframes float-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .kbd-ui {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-bottom-width: 2px;
          border-radius: 4px;
          padding: 2px 6px;
          margin: 0 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.85em;
          color: #ffffff;
          font-weight: 600;
          display: inline-block;
          line-height: 1;
        }
      `}</style>

      {/* 평소 50% 투명도 유지 / 호버 시 100% opacity */}
      <div 
        className="flex items-center pl-6 pr-2 py-2 rounded-full cursor-default transition-all duration-300 opacity-50 hover:opacity-100"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          animation: 'float-bounce 4s ease-in-out infinite',
        }}
        // 툴팁 내부를 만지거나 드래그할 때는 맵 인터랙션(소멸)이 일어나는 것을 방지
        onMouseDown={(e) => e.stopPropagation()} 
        onWheel={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* 마우스 왼쪽 버튼 아이콘 */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md mr-3">
          <rect x="5" y="2" width="14" height="20" rx="7" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
          <path d="M5 9C5 5.13401 8.13401 2 12 2V9H5Z" fill="white" fillOpacity="0.8"/>
          <line x1="12" y1="2" x2="12" y2="10" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
          <line x1="5" y1="9" x2="19" y2="9" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"/>
          <line x1="12" y1="5" x2="12" y2="7" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>

        <span className="text-white/95 text-sm font-medium tracking-wide drop-shadow-sm whitespace-nowrap">
          3D 앵글 조절: <kbd className="kbd-ui">Alt</kbd> <kbd className="kbd-ui">Shift</kbd> <kbd className="kbd-ui">Ctrl</kbd> 중 하나를 누른 채 마우스 드래그
        </span>

        {/* 닫기 버튼 [X]: 넓은 Hit Area 제공 */}
        <button 
          onClick={handleDismiss}
          className="ml-5 w-9 h-9 flex justify-center items-center rounded-full bg-white/10 hover:bg-white/30 transition-colors cursor-pointer group-hover:bg-white/20"
          title="안내창 영구 닫기"
          aria-label="닫기"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/90 group-hover:text-white">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MapGuideTooltip;
