import React, { useEffect, useState, useRef } from 'react';
import { IoIosClose } from 'react-icons/io';
import mermaid, { MermaidConfig } from 'mermaid';

const defaultConfig: MermaidConfig = {
  theme: 'default',
  startOnLoad: true,
  suppressErrorRendering: true,
};
mermaid.initialize(defaultConfig);

mermaid.registerIconPacks([
  {
    name: 'logos',
    loader: () => import('@iconify-json/logos').then((module) => module.icons),
  },
]);

interface MermaidProps {
  chart: string;
  isGenerating: boolean;
  handler?: () => void;
}

const Mermaid: React.FC<MermaidProps> = ({ chart, isGenerating, handler }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const updateDiagram = async () => {
      if (isGenerating) {
        // 生成中は更新して描画（レンダリング間でエラー表示はしない）
        elementRef.current!.removeAttribute('data-processed');
        mermaid.contentLoaded();
      } else {
        // 生成完了後、エラー表示を有効化
        mermaid.initialize({ ...defaultConfig, suppressErrorRendering: true });
        elementRef.current!.innerHTML = chart;
        elementRef.current!.removeAttribute('data-processed');
        mermaid.contentLoaded();
      }
    };

    updateDiagram();

    // クリーンアップ時に設定を戻す
    return () => {
      mermaid.initialize(defaultConfig);
    };
  }, [chart, isGenerating]);

  return (
    <div
      className="mermaid w-full cursor-pointer bg-gray-100 dark:bg-gray-900 flex justify-center content-center h-full hover:shadow-lg duration-700 rounded-lg p-8"
      ref={elementRef}
      onClick={handler}
    >
      {chart}
    </div>
  );
};

interface DiagramRendererProps {
  chart: string;
  isGenerating: boolean;
}

const DiagramRenderer: React.FC<DiagramRendererProps> = ({ chart, isGenerating }) => {
  const [zoom, setZoom] = useState<boolean>(false);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoom(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <>
      <Mermaid chart={chart} isGenerating={isGenerating} handler={() => setZoom(true)} />

      {zoom && (
        <div
          className="fixed left-1/2 top-1/2 z-[110] -translate-x-1/2 -translate-y-1/2 w-screen h-screen"
          onClick={() => setZoom(false)}
        >
          <div className="absolute top-0 right-0 z-[111] p-4" onClick={() => setZoom(false)}>
            <IoIosClose className="text-lg flex justify-center content-center w-8 h-8 dark:hover:bg-gray-400 hover:bg-gray-200 rounded cursor-pointer" />
          </div>
          <Mermaid chart={chart} isGenerating={isGenerating}/>
        </div>
      )}
    </>
  );
};

export default DiagramRenderer;