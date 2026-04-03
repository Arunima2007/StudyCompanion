import { useState } from "react";
import type { HeatmapDay } from "../types";

const tones = [
  "bg-slate-100",
  "bg-emerald-200",
  "bg-emerald-400",
  "bg-emerald-500",
  "bg-green-600"
];

const cellSize = 13;
const cellGap = 3;

function formatLocalDateKey(input: Date) {
  const year = input.getFullYear();
  const month = String(input.getMonth() + 1).padStart(2, "0");
  const day = String(input.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(input: Date) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfWeek(input: Date) {
  const date = startOfDay(input);
  const weekday = date.getDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  date.setDate(date.getDate() - offset);
  return date;
}

export function Heatmap({ data }: { data: HeatmapDay[] }) {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
    placement: "above" | "below";
  } | null>(null);
  const valuesByDate = new Map(
    data.map((day) => [
      day.date,
      {
        value: Math.max(0, Math.min(4, day.value)),
        count: Math.max(0, day.count ?? day.value)
      }
    ])
  );
  const today = startOfDay(new Date());
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);

  const firstWeekStart = startOfWeek(startDate);
  const totalDays = Math.ceil((today.getTime() - firstWeekStart.getTime()) / 86400000) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  const todayKey = formatLocalDateKey(today);

  const weeks = Array.from({ length: totalWeeks }, (_, weekIndex) => {
    const weekStart = new Date(firstWeekStart);
    weekStart.setDate(firstWeekStart.getDate() + weekIndex * 7);

    return {
      start: weekStart,
      days: Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + dayIndex);
        const dateKey = formatLocalDateKey(date);
        const inRange = date >= startDate && date <= today;

        return {
          date,
          dateKey,
          inRange,
          value: inRange ? valuesByDate.get(dateKey)?.value ?? 0 : 0,
          count: inRange ? valuesByDate.get(dateKey)?.count ?? 0 : 0
        };
      })
    };
  });

  const monthMarkers = weeks
    .map((week, index) => {
      const inRangeDay = week.days.find((day) => day.inRange);
      if (!inRangeDay) {
        return null;
      }

      const label = inRangeDay.date.toLocaleDateString("en-US", { month: "short" });
      const previous = index > 0 ? weeks[index - 1].days.find((day) => day.inRange) : null;
      const previousLabel = previous
        ? previous.date.toLocaleDateString("en-US", { month: "short" })
        : "";

      if (label === previousLabel) {
        return null;
      }

      return { label, index };
    })
    .filter(Boolean) as Array<{ label: string; index: number }>;

  const spacedMonthMarkers = monthMarkers.filter((marker, index, list) => {
    if (index === 0) {
      return true;
    }

    const previous = list[index - 1];
    return marker.index - previous.index >= 3;
  });

  const endPadding = 32;
  const totalWidth = totalWeeks * cellSize + (totalWeeks - 1) * cellGap + endPadding;
  const tooltipWidth = 220;

  return (
    <div className="max-w-full overflow-x-auto">
      <div className="relative inline-flex flex-col pr-3" style={{ minWidth: `${totalWidth}px` }}>
        {tooltip ? (
          <div
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs font-medium text-white shadow-lg"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform:
                tooltip.placement === "above"
                  ? "translate(-50%, calc(-100% - 10px))"
                  : "translate(-50%, 10px)"
            }}
          >
            {tooltip.text}
          </div>
        ) : null}
        <div className="flex items-start" style={{ gap: `${cellGap}px` }}>
          {weeks.map((week, weekIndex) => (
            <div
              key={`week-${weekIndex}`}
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                rowGap: `${cellGap}px`,
                width: `${cellSize}px`,
                minWidth: `${cellSize}px`
              }}
            >
              {week.days.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}-${day.dateKey}`}
                  className={[
                    "rounded-[5px] transition",
                    day.inRange ? tones[day.value] : "bg-transparent",
                    day.dateKey === todayKey ? "ring-2 ring-sky-300" : ""
                  ].join(" ")}
                  style={{ width: `${cellSize}px`, height: `${cellSize}px` }}
                  onMouseEnter={(event) => {
                    if (!day.inRange) {
                      return;
                    }

                    const rawX = event.currentTarget.offsetLeft + cellSize / 2;
                    const clampedX = Math.min(
                      Math.max(rawX, tooltipWidth / 2),
                      totalWidth - tooltipWidth / 2
                    );
                    const placement = event.currentTarget.offsetTop < 40 ? "below" : "above";

                    setTooltip({
                      text: `${day.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}: ${day.count} card${day.count === 1 ? "" : "s"} reviewed`,
                      x: clampedX,
                      y: event.currentTarget.offsetTop,
                      placement
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="relative mt-3" style={{ height: "24px", width: `${totalWidth}px` }}>
          {spacedMonthMarkers.map((marker) => (
            <div
              key={`${marker.label}-${marker.index}`}
              className="absolute text-sm font-medium text-slate-400"
              style={{ left: `${marker.index * (cellSize + cellGap)}px` }}
            >
              {marker.label}
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
          <span>Less</span>
          <div className="flex gap-1">
            {tones.map((tone) => (
              <div key={tone} className={`h-3 w-3 rounded-[4px] ${tone}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
