const shades = ["#EEEDFE", "#D8D2FF", "#B3A6FF", "#7A67F0", "#3C3489"];

export default function Heatmap({ data }) {
  const padded = Array.from({ length: 364 }, (_, index) => data[index] ?? null);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[860px] grid-flow-col grid-rows-7 gap-2">
        {padded.map((item, index) => (
          <div
            key={`${item?.date ?? "empty"}-${index}`}
            title={item ? `${item.date}: ${item.count} cards studied` : "No study activity"}
            className="h-4 w-4 rounded-[4px]"
            style={{ backgroundColor: shades[item ? Math.min(item.value, 4) : 0] }}
          />
        ))}
      </div>
    </div>
  );
}
