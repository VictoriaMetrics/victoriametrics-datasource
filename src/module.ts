import { DataSourcePlugin } from '@grafana/data';

import PromQueryEditorByApp from './components/PromQueryEditorByApp';
import { ConfigEditor } from './configuration/ConfigEditor';
import { ANNOTATION_QUERY_STEP_DEFAULT } from "./consts";
import { PrometheusDatasource } from './datasource';

class VictoriaMetricsAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
  stepDefaultValuePlaceholder = ANNOTATION_QUERY_STEP_DEFAULT;
}

export const plugin = new DataSourcePlugin(PrometheusDatasource)
  .setQueryEditor(PromQueryEditorByApp)
  .setConfigEditor(ConfigEditor)
  .setAnnotationQueryCtrl(VictoriaMetricsAnnotationsQueryCtrl)
