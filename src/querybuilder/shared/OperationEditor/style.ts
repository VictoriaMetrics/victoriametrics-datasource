import { css } from "@emotion/css";

import { GrafanaTheme2 } from "@grafana/data";

export default (theme: GrafanaTheme2) => ({
  card: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.medium}`,
    display: "flex",
    flexDirection: "column",
    cursor: "grab",
    borderRadius: theme.shape.borderRadius(1),
    marginBottom: theme.spacing(1),
    position: "relative",
    transition: "all 0.5s ease-in 0s",
  }),
  cardHighlight: css({
    boxShadow: `0px 0px 4px 0px ${theme.colors.primary.border}`,
    border: `1px solid ${theme.colors.primary.border}`,
  }),
  infoIcon: css({
    marginLeft: theme.spacing(0.5),
    color: theme.colors.text.secondary,
    ":hover": {
      color: theme.colors.text.primary,
    },
  }),
  body: css({
    margin: theme.spacing(1, 1, 1, 1),
    display: "grid",
    gap: theme.spacing(0.5),
  }),
  paramRow: css({
    label: "paramRow",
    display: "table-row",
    verticalAlign: "middle",
  }),
  paramName: css({
    display: "table-cell",
    padding: theme.spacing(0, 1, 0, 0),
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    verticalAlign: "middle",
    height: "32px",
  }),
  paramValue: css({
    label: "paramValue",
    display: "table-cell",
    verticalAlign: "middle",
  }),
  restParam: css({
    padding: theme.spacing(0, 1, 1, 1),
  }),
  arrow: css({
    position: "absolute",
    top: "0",
    right: "-18px",
    display: "flex",
  }),
  arrowLine: css({
    height: "2px",
    width: "8px",
    backgroundColor: theme.colors.border.strong,
    position: "relative",
    top: "14px",
  }),
  arrowArrow: css({
    width: 0,
    height: 0,
    borderTop: "5px solid transparent",
    borderBottom: "5px solid transparent",
    borderLeft: `7px solid ${theme.colors.border.strong}`,
    position: "relative",
    top: "10px",
  }),
});
