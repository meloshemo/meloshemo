import { SCALE_LEGEND } from '@nabiz/core';

/**
 * Ölçek göstergesi.
 *
 * İki uçta seçenek adları yazar: renklerin neyi temsil ettiği yalnızca renkten
 * anlaşılmamalı. Ortadaki nötr bant "başa baş"tır — diverging bir ölçekte orta
 * noktanın kendi rengi olmaz.
 */
export function MapLegend({ aLabel, bLabel }: { aLabel: string; bLabel: string }) {
  return (
    <div className="legend">
      <span className="legend-end">{aLabel}</span>
      <span className="legend-scale" aria-hidden="true">
        {SCALE_LEGEND.map((step) => (
          <i key={step.fill} style={{ background: step.fill }} title={step.text} />
        ))}
      </span>
      <span className="legend-end">{bLabel}</span>
    </div>
  );
}
