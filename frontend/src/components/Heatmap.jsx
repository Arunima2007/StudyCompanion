import { useEffect, useMemo, useRef, useState } from "react";

const shades = ["#EEEDFE", "#D8D2FF", "#B3A6FF", "#7A67F0", "#3C3489"];
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MIN_CELL_SIZE = 12;
const MAX_CELL_SIZE = 18;
const MIN_CELL_GAP = 4;
const MAX_CELL_GAP = 8;
const LEFT_LABEL_WIDTH = 48;

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - value.getDay());
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}

function getMonthLabelDate(weekStart) {
  const middleOfWeek = addDays(weekStart, 3);
  return new Date(middleOfWeek.getFullYear(), middleOfWeek.getMonth(), 1);
}

export default function Heatmap({ data, year }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  const { weeks, monthLabels } = useMemo(() => {
    const allEntries = (data ?? [])
      .slice()
      .sort((left, right) => new Date(left.date) - new Date(right.date));

    const activityByDate = new Map(allEntries.map((item) => [item.date, item]));
    const now = new Date();
    const isCurrentYear = year === now.getFullYear();
    const windowEnd = isCurrentYear ? new Date(now) : new Date(year, 11, 31);
    windowEnd.setHours(0, 0, 0, 0);
    const endWeek = startOfWeek(windowEnd);
    const startWeek = addWeeks(endWeek, -51);

    const builtWeeks = [];
    const builtMonthLabels = [];
    let currentWeek = new Date(startWeek);
    let weekIndex = 0;
    let previousMonthKey = "";

    while (currentWeek <= endWeek) {
      const days = Array.from({ length: 7 }, (_, dayOffset) => {
        const day = addDays(currentWeek, dayOffset);
        const key = formatDateKey(day);
        const entry = activityByDate.get(key);

        if (isCurrentYear && day > windowEnd) {
          return { date: key, count: 0, value: 0, isFuture: true };
        }

        return entry ?? { date: key, count: 0, value: 0 };
      });

      const monthDate = getMonthLabelDate(currentWeek);
      const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;

      if (monthKey !== previousMonthKey) {
        builtMonthLabels.push({
          index: weekIndex,
          label: monthDate.toLocaleDateString("en-US", { month: "short" })
        });
        previousMonthKey = monthKey;
      }

      builtWeeks.push(days);
      currentWeek = addWeeks(currentWeek, 1);
      weekIndex += 1;
    }

    return {
      weeks: builtWeeks,
      monthLabels: builtMonthLabels
    };
  }, [data, year]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const element = containerRef.current;
    const updateWidth = () => {
      setContainerWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    const totalWeeks = Math.max(weeks.length, 1);
    const availableWidth = Math.max(containerWidth - LEFT_LABEL_WIDTH, 0);
    const preferredWeekWidth = availableWidth > 0 ? availableWidth / totalWeeks : MAX_CELL_SIZE + MAX_CELL_GAP;
    const cellGap = Math.max(MIN_CELL_GAP, Math.min(MAX_CELL_GAP, Math.round(preferredWeekWidth * 0.25)));
    const cellSize = Math.max(
      MIN_CELL_SIZE,
      Math.min(MAX_CELL_SIZE, Math.floor(preferredWeekWidth - cellGap))
    );
    const weekWidth = cellSize + cellGap;

    return {
      cellSize,
      cellGap,
      weekWidth,
      width: LEFT_LABEL_WIDTH + totalWeeks * weekWidth
    };
  }, [containerWidth, weeks.length]);

  const tooltipLabel = useMemo(() => {
    if (!hoveredCell) {
      return "";
    }

    const formattedDate = new Date(hoveredCell.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    return `${formattedDate} • ${hoveredCell.count} card${hoveredCell.count === 1 ? "" : "s"} studied`;
  }, [hoveredCell]);

  return (
    <div ref={containerRef} className="space-y-4 overflow-visible">
      <div
        className="relative overflow-visible"
        style={{ width: `${layout.width}px`, maxWidth: "100%" }}
      >
        <div className="relative mb-5 h-5 text-xs font-medium text-muted">
          {monthLabels.map((month) => (
            <div
              key={`${month.label}-${month.index}`}
              className="absolute whitespace-nowrap"
              style={{ left: `${LEFT_LABEL_WIDTH + month.index * layout.weekWidth}px` }}
            >
              {month.label}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <div
            className="grid grid-rows-7 pt-[1px] text-[11px] font-medium text-muted"
            style={{ rowGap: `${layout.cellGap}px` }}
          >
            {weekdayLabels.map((label, index) => (
              <div key={label} className="flex items-center" style={{ height: `${layout.cellSize}px` }}>
                {index % 2 === 0 ? label : ""}
              </div>
            ))}
          </div>

          <div className="flex" style={{ columnGap: `${layout.cellGap}px` }}>
            {weeks.map((week, weekIndex) => (
              <div
                key={`week-${weekIndex}`}
                className="grid grid-rows-7"
                style={{ rowGap: `${layout.cellGap}px` }}
              >
                {week.map((item, dayIndex) => (
                  <div key={`${item.date}-${dayIndex}`} className="relative flex items-center justify-center overflow-visible">
                    <button
                      type="button"
                      onMouseEnter={() => setHoveredCell(item)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onFocus={() => setHoveredCell(item)}
                      onBlur={() => setHoveredCell(null)}
                      aria-label={`${item.date}: ${item.count} cards studied`}
                      className="rounded-[4px] transition hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-brand"
                      style={{
                        width: `${layout.cellSize}px`,
                        height: `${layout.cellSize}px`,
                        backgroundColor: item.isFuture ? "transparent" : shades[Math.min(item.value ?? 0, 4)],
                        opacity: item.isFuture ? 0 : 1
                      }}
                    />

                    {hoveredCell?.date === item.date && !item.isFuture ? (
                      <div
                        className={`pointer-events-none absolute bottom-full z-20 mb-2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs font-medium text-white shadow-lg ${
                          weekIndex >= weeks.length - 3
                            ? "right-0"
                            : weekIndex <= 1
                              ? "left-0"
                              : "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        {tooltipLabel}
                        <div
                          className={`absolute top-full h-2 w-2 rotate-45 bg-ink ${
                            weekIndex >= weeks.length - 3
                              ? "right-2"
                              : weekIndex <= 1
                                ? "left-2"
                                : "left-1/2 -translate-x-1/2"
                          }`}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 text-xs text-muted">
          <span>Less</span>
          {shades.map((shade) => (
            <div
              key={shade}
              className="rounded-[4px]"
              style={{ width: `${layout.cellSize}px`, height: `${layout.cellSize}px`, backgroundColor: shade }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
