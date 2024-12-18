import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import { create } from 'zustand';
import { MODELS } from '../hooks/useModel';
import queryString from 'query-string';
import useDiagram from "../hooks/useDiagram";
import { DiagramPageQueryParams } from '../@types/navigate';
import DiagramRenderer from '../components/DiagramRenderer';

type StateType = {
  content: string;
  setContent: (s: string) => void;
  diagramCode: string;
  setDiagramCode: (s: string) => void;
  clear: () => void;
}

const useChatPageState = create<StateType>((set) => {
  const INIT_STATE = {
    content: '',
    diagramCode: '',
  };
  return {
    ...INIT_STATE,
    setContent: (s: string) => set({ content: s }),
    setDiagramCode: (s: string) => set({ diagramCode: s }),
    clear: () => set(INIT_STATE),
  };
});

const GenerateDiagramPage: React.FC = () => {
  const {
    content,
    setContent,
    diagramCode,
    setDiagramCode,
    clear,
  } = useChatPageState();
  const { pathname, search } = useLocation();
  const {
    loading,
    getModelId,
    setModelId,
    clear: clearChat,
    setLoading,
    messages,
    isEmpty,
    postDiagram,
  } = useDiagram(pathname);
  const [diagramGenerationError, setDiagramGenerationError] = useState<Error | null>(null);

  const { modelIds: availableModels } = MODELS;
  const modelId = getModelId();

  const disabledExec = useMemo(() => {
    return content === '' || loading;
  }, [content, loading]);

  useEffect(() => {
    (() => {
      if (search) {
        const params = queryString.parse(search) as DiagramPageQueryParams;
        const modelIdFromParams = params.modelId;
        
        if (params.content) {
          setContent(params.content);
        }

        if (modelIdFromParams && availableModels.includes(modelIdFromParams)) {
          setModelId(modelIdFromParams);
        } else {
          setModelId(availableModels[0]);
        }
      } else {
        setModelId(availableModels[0]);
      }
    })();
  // searchのみを依存配列に含める
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // メッセージの処理
  useEffect(() => {
    if (messages.length === 0) return;
    console.log(messages); // debug用
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const currentMessage = lastMessage.content;
    if (currentMessage.includes("<Mermaid>")) {
      const mermaidContent = currentMessage
        .split("<Mermaid>")[1]
        .split("</Mermaid>")[0]
        .trim();
        
      setDiagramCode(mermaidContent);
    }
  }, [messages, setDiagramCode]);

  // ダイアグラム生成処理を実行
  const onClickExec = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setDiagramGenerationError(null);
    setDiagramCode('');
    
    try {
      await postDiagram(content);
    } catch (error: unknown) {
      if (error instanceof Error) setDiagramGenerationError(error);
      else setDiagramGenerationError(new Error(`${error}`));
    }
  }, [content, loading, postDiagram, setDiagramCode, setLoading]);

  // リセット
  const onClickClear = useCallback(() => {
    clear();
    clearChat();
    setDiagramGenerationError(null);
  }, [clear, clearChat, setDiagramGenerationError]);

  return (
    <div className="grid grid-cols-12">
      <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold lg:visible lg:my-5 lg:h-min print:visible print:my-5 print:h-min">
        ダイアグラム生成
      </div>
      <div className="col-span-12 col-start-1 mx-2 lg:col-span-10 lg:col-start-2 xl:col-span-10 xl:col-start-2">
        <Card label="ダイアグラム生成元の文章">
          <div className="mb-2 flex w-full">
            <Select
              value={modelId}
              onChange={setModelId}
              options={availableModels.map(m => ({ value: m, label: m }))}
              label='モデル'
            />
          </div>

          <Textarea
            placeholder="生成元の文章を入力してください"
            value={content}
            onChange={setContent}
            maxHeight={-1}
          />

          <div className="flex justify-end gap-3">
            <Button outlined onClick={onClickClear} disabled={disabledExec}>
              クリア
            </Button>
            <Button disabled={disabledExec} onClick={onClickExec}>
              実行
            </Button>
          </div>

          <div className="mt-5 rounded border border-black/30 p-1.5">
            {diagramCode.length > 0 && (
              <div className="w-full dark:text-white">
                <div className="flex justify-center">
                  <DiagramRenderer chart={diagramCode} isGenerating={loading}/>
                </div>
              </div>
            )}
            {!loading && isEmpty && (
              <div className="text-gray-500">
                ダイアグラムがここに表示されます
              </div>
            )}
            {loading && (
              <div className="flex justify-center items-center min-h-[40px]">
                <div className="border-aws-sky size-5 animate-spin rounded-full border-4 border-t-transparent"></div>
              </div>
            )}
            {diagramGenerationError && (
              <div className="text-red-500">
                {diagramGenerationError.message}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GenerateDiagramPage;
