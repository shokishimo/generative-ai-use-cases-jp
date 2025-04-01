// Define the type of Feature Flag
export type FeatureFlags = {
  // Model Feature Flags
  text?: boolean;
  doc?: boolean;
  image?: boolean;
  video?: boolean;
  reasoning?: boolean;

  image_gen?: boolean;
  video_gen?: boolean;

  embedding?: boolean;
  reranking?: boolean;
  // Additional Flags
  light?: boolean;
};

export type ModelConfiguration = {
  modelId: string;
  region: string;
};
