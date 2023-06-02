import { groupBy } from 'lodash';
import React, { FC, useEffect, useMemo, useState } from 'react';

import { DataSourceApi, DataSourcePluginOptionsEditorProps } from "@grafana/data";
import { getDataSourceSrv } from "@grafana/runtime";
import { HorizontalGroup, Icon, Tab, TabContent, TabsBar, useStyles2 } from "@grafana/ui";

import { PromOptions } from "../../types";

import DashboardItem from "./DasboardItem/DashboardItem";
import WithTemplateTips from "./WithTemplateTips/WithTemplateTips";
import getDashboardList from "./api/getDashboardList";
import { generalFolderTitle, infoTab } from "./constants";
import getStyles from "./style";
import { DashboardType, WithTemplate } from "./types";

type Props = DataSourcePluginOptionsEditorProps<PromOptions>;
const WithTemplatesSettings: FC<Props> = (props) => {
  const { options, onOptionsChange } = props;

  const styles = useStyles2(getStyles);

  const templates = useMemo(() => options.jsonData.withTemplates || [], [options.jsonData])

  const [datasource, setDatasource] = useState<DataSourceApi>()
  const [dashboards, setDashboards] = useState<Record<string, DashboardType[]>>({})
  const [openFolder, setOpenFolder] = useState(generalFolderTitle)
  const [loading, setLoading] = useState(false)

  const handleSaveTemplate = (template: WithTemplate) => {
    const oldTemplates = templates.filter(t => t.uid !== template.uid)
    const withTemplates = [...oldTemplates, template]
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        withTemplates,
      },
    })
  }
  const handleChangeTab = (folderTitle: string) => (e?: React.MouseEvent<HTMLAnchorElement>) => {
    e?.preventDefault()
    setOpenFolder(folderTitle)
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const ds = await getDataSourceSrv().get(options.name)
        const dashboardsData = await getDashboardList()
        const groupByFolder = groupBy(dashboardsData, 'folderTitle')
        setDashboards(groupByFolder)
        setDatasource(ds)
      } catch (error) {
        console.error('Error fetching dashboards:', error);
      }
      setLoading(false)
    }

    fetchData()
  }, [options.name])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <HorizontalGroup spacing="xs">
          <h3 className="page-heading">WITH templates</h3>
          {loading && <Icon name="fa fa-spinner"/>}
        </HorizontalGroup>
      </div>
      <div>
        <TabsBar>
          <Tab
            label={infoTab.label}
            active={infoTab.id === openFolder}
            onChangeTab={handleChangeTab(infoTab.id)}
            icon={infoTab.icon}
          />
          {Object.keys(dashboards).map(folderTitle => (
            <Tab
              key={folderTitle}
              label={folderTitle}
              active={folderTitle === openFolder}
              onChangeTab={handleChangeTab(folderTitle)}
              icon={folderTitle === openFolder ? "folder-open" : "folder"}
            />
          ))}
        </TabsBar>
        <TabContent>
          <div>
            {dashboards[openFolder]?.map((dashboard, i) => (
              <DashboardItem
                index={i}
                key={dashboard.uid}
                dashboard={dashboard}
                templates={templates}
                datasource={datasource}
                onChange={handleSaveTemplate}
              />
            ))}
            {openFolder === infoTab.id && <WithTemplateTips/>}
          </div>
        </TabContent>
      </div>
    </div>
  );
}

export default WithTemplatesSettings

