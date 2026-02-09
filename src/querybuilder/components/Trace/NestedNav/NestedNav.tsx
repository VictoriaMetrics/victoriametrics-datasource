import React, { FC, useState } from "react"

import { IconButton, useStyles2 } from "@grafana/ui";

import Trace from "../Trace";

import getStyles from "./style"

interface RecursiveProps {
  trace: Trace;
  totalMsec: number;
}

interface OpenLevels {
  [x: number]: boolean
}

const NestedNav: FC<RecursiveProps> = ({ trace, totalMsec }) => {
  const [openLevels, setOpenLevels] = useState({} as OpenLevels);
  const styles = useStyles2(getStyles);

  const handleListClick = (level: number) => () => {
    setOpenLevels((prevState: OpenLevels) => {
      return { ...prevState, [level]: !prevState[level] };
    });
  };
  const hasChildren = trace.children && !!trace.children.length;
  const progress = Math.round(trace.duration / totalMsec * 100);

  return (
    <div className={styles.wrapper}>
      <div className={styles.content} onClick={handleListClick(trace.idValue)}>
        <div className={styles.topRow}>
          <div className={styles.arrow}>
            {hasChildren && (
              <IconButton aria-label="" name={openLevels[trace.idValue] ? "angle-up" : "angle-down"} />
            )}
          </div>
          <div className={styles.progressWrapper}>
            <div className={styles.progressLine} style={{ width: `${progress}%`, }} />
            <div className={styles.progressNum}>{`${progress}%`}</div>
          </div>
        </div>
        <div className={styles.message}>{trace.message}</div>
        <div className={styles.duration}>{`duration: ${trace.duration} ms`}</div>
      </div>
      {openLevels[trace.idValue] && hasChildren && trace.children.map((trace) => (
        <NestedNav
          key={trace.duration}
          trace={trace}
          totalMsec={totalMsec}
        />
      ))}
    </div>
  );
};

export default NestedNav;
