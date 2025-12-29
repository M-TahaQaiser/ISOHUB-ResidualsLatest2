import { Button } from "@/components/ui/button";

interface TimeRangeSelectorProps {
  value: string;
  onChange: (range: string) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '3M', value: '3m' },
    { label: '6M', value: '6m' },
    { label: '1Y', value: '1y' },
  ];

  return (
    <div className="flex gap-2" data-testid="time-range-selector">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(range.value)}
          className={value === range.value 
            ? "bg-[#FFD700] text-black hover:bg-[#FFD700]/90" 
            : "border-gray-600 text-gray-300 hover:text-white hover:bg-zinc-800 hover:border-gray-500"
          }
          data-testid={`button-range-${range.value}`}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
