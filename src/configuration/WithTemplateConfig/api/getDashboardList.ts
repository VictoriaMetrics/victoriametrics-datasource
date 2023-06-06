import { lastValueFrom } from "rxjs";

import { getBackendSrv } from "@grafana/runtime";

import { generalFolderTitle } from "../constants";
import { DashboardType, DashTypes } from "../types";

const getDashboardList = async (): Promise<DashboardType[]> => {
  const response = await lastValueFrom(await getBackendSrv().fetch({
    url: `/api/search?type=${DashTypes.DASHBOARD}&query=&`,
    method: 'GET',
  }));

  return ((response?.data || []) as DashboardType[])
    .sort((a, b) => (a.folderTitle || "").localeCompare(b.folderTitle || ""))
    .map(d => ({ ...d, folderTitle: d.folderTitle || generalFolderTitle }))
}

export default getDashboardList
