// Copyright (c) 2022 Grafana Labs
// Modifications Copyright (c) 2022 VictoriaMetrics
// 2022-10-12: switch imports to @grafana/ui
// A detailed history of changes can be seen here - https://github.com/VictoriaMetrics/victoriametrics-datasource
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { css, cx } from "@emotion/css";
import React from "react";

import { GrafanaTheme2 } from "@grafana/data";
import { stylesFactory, useTheme2 } from "@grafana/ui";

export interface SpaceProps {
  v?: number;
  h?: number;
  layout?: "block" | "inline";
}

export const Space = (props: SpaceProps) => {
  const theme = useTheme2();
  const styles = getStyles(theme, props);

  return <span className={cx(styles.wrapper)} />;
};

Space.defaultProps = {
  v: 0,
  h: 0,
  layout: "block",
};

const getStyles = stylesFactory((theme: GrafanaTheme2, props: SpaceProps) => ({
  wrapper: css([
    {
      paddingRight: theme.spacing(props.h ?? 0),
      paddingBottom: theme.spacing(props.v ?? 0),
    },
    props.layout === "inline" && {
      display: "inline-block",
    },
    props.layout === "block" && {
      display: "block",
    },
  ]),
}));
