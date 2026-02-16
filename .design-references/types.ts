
export interface Project {
  id: string;
  name: string;
  itemCount: number;
  lastUpdated: string;
  isSelected: boolean;
}

export interface ImageAsset {
  id: string;
  projectId: string;
  projectName: string;
  fieldName: string;
  thumbnailUrl: string;
  currentAlt: string;
  newAlt: string;
  isOptedIn: boolean;
  status: 'idle' | 'processing' | 'success' | 'error';
}

export interface AppState {
  projects: Project[];
  images: ImageAsset[];
  isJobRunning: boolean;
  searchQuery: string;
}
