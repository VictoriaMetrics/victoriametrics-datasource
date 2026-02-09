export interface WithTemplate {
  uid: string;
  expr: string;
}

export interface DashboardResponse {
  dashboard: DashboardType
  meta: {
    folderTitle: string;
    folderUid: string;
    canEdit: boolean;
  }
}


export interface DashboardType {
  id: number;
  uid: string;
  title: string;
  uri: string;
  url: string;
  slug: string;
  type: "dash-db";
  tags: string[];
  isStarred: boolean;
  sortMeta: number;
  folderId?: number;
  folderUid?: string;
  folderTitle?: string;
  folderUrl?: string;
}
