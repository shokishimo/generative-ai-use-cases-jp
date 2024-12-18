import { useMemo, useCallback } from 'react';
import useChatApi from './useChatApi';
import { findModelByModelId } from './useModel';
import { getPrompter } from '../prompts';
import useChat from '../hooks/useChat';
import { PredictRequest } from 'generative-ai-use-cases-jp';

const useDiagram = (id: string) => {
  const {
    loading,
    getModelId,
    setModelId,
    setLoading,
    loadingMessages,
    init,
    clear,
    updateSystemContext,
    updateSystemContextByModel,
    getCurrentSystemContext,
    pushMessage,
    popMessage,
    rawMessages,
    messages,
    isEmpty,
    postChat,
    continueGeneration,
    sendFeedback,
    getStopReason,
  } = useChat(id);

  const modelId = useMemo(() => getModelId(), [getModelId]);
  const model = useMemo(() => {
    const mid = getModelId();
    return findModelByModelId(mid);
  }, [getModelId]);
  const prompter = useMemo(() => {
    return getPrompter(modelId);
  }, [modelId]);
  const { predict } = useChatApi();
  const validTypes = [
    'flowchart',
    'sequencediagram',
    'classdiagram',
    'statediagram',
    'erdiagram',
    'userjourney',
    'ganttchart',
    'piechart',
    'quadrantchart',
    'requirementdiagram',
    'gitgraph',
    'c4diagram',
    'mindmap',
    'sankeychart',
    'xychart',
    'blockdiagram',
    'networkpacket',
    'kanbandiagram',
    'architecture'
  ];

  // ユーザーのinputに対して最適なダイアグラムの選定
  const selectDiagram = useCallback(async (content: string) => {
    try {
      if (!model) {
        throw 'Model not found';
      }
      const payload: PredictRequest = {
        model: model,
        messages: [
          {
            role: 'system',
            content: prompter.diagramPrompt({
              determinType: true,
            }),
          },
          {
            role: 'user',
            content: `<content>${content}</content>`,
          },
        ],
        id: id,
      };
      const res = await predict(payload);

      const type = extractDiagramType(res, validTypes);
      console.log('Extracted Type:', type); // debug用
      return type;
    } catch (error: unknown) {
      throw `${error}`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, model, predict, prompter]);

  // bedrockの出力からダイアグラムタイプの抽出
  function extractDiagramType(targetText: string, allowedTypes: string[]): string {
    const defaultType = 'flowchart';
    const match = targetText.match(/<output>(.*?)<\/output>/i);
    if (!match) return defaultType;
  
    const content = match[1].toLowerCase();
    
    // 完全一致チェック
    if (allowedTypes.includes(content)) {
      return content;
    }
    
    // 部分一致チェック
    const matchingType = allowedTypes.find(type => 
      content.includes(type) || type.includes(content)
    );
    
    return matchingType || defaultType;
  }

  const postDiagram = useCallback(async (content: string) => {
    try {
      // 1. ダイアグラムタイプを決定
      const diagramType = await selectDiagram(content);

      // 2. メッセージの過去の履歴をクリア
      clear();

      // 3. 決定したダイアグラムタイプのシステムプロンプトを設定
      const systemPrompt = prompter.diagramPrompt({
        determinType: false,
        diagramType: diagramType,
      });
      updateSystemContext(systemPrompt);
      
      // 4. ダイアグラム生成
      await postChat(content, true);
    } catch (error: unknown) {
      setLoading(false); // エラー時にもloadingを終了する
      throw `${error}`;
    }
  }, [selectDiagram, clear, prompter, updateSystemContext, postChat, setLoading]);

  return {
    loading,
    getModelId,
    setModelId,
    setLoading,
    loadingMessages,
    init,
    clear,
    updateSystemContext,
    updateSystemContextByModel,
    getCurrentSystemContext,
    pushMessage,
    popMessage,
    rawMessages,
    messages,
    isEmpty,
    postChat,
    continueGeneration,
    sendFeedback,
    getStopReason,
    postDiagram,
  };
};

export default useDiagram;
