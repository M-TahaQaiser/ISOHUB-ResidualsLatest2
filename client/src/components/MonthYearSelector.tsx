import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, ChevronDown } from 'lucide-react';

interface MonthYearSelectorProps {
  value: string;
  onChange: (value: string) => void;
  minYear?: number;
  maxYear?: number;
  showQuickSelects?: boolean;
  label?: string;
  className?: string;
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function MonthYearSelector({
  value,
  onChange,
  minYear = 1980,
  maxYear,
  showQuickSelects = true,
  label = 'Select Month',
  className = '',
}: MonthYearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const effectiveMaxYear = maxYear || currentYear + 1;
  
  const [selectedYear, selectedMonth] = useMemo(() => {
    if (!value) {
      return [currentYear.toString(), String(currentMonth).padStart(2, '0')];
    }
    const parts = value.split('-');
    return [parts[0] || currentYear.toString(), parts[1] || '01'];
  }, [value, currentYear, currentMonth]);

  const years = useMemo(() => {
    const yearList = [];
    for (let year = effectiveMaxYear; year >= minYear; year--) {
      yearList.push(year.toString());
    }
    return yearList;
  }, [minYear, effectiveMaxYear]);

  const handleMonthChange = (month: string) => {
    onChange(`${selectedYear}-${month}`);
  };

  const handleYearChange = (year: string) => {
    onChange(`${year}-${selectedMonth}`);
  };

  const getFormattedLabel = () => {
    const monthObj = MONTHS.find(m => m.value === selectedMonth);
    return `${monthObj?.label || 'Unknown'} ${selectedYear}`;
  };

  const handleQuickSelect = (type: 'current' | 'previous' | 'ytd') => {
    const now = new Date();
    if (type === 'current') {
      onChange(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    } else if (type === 'previous') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      onChange(`${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-yellow-500" />
          {label}
        </Label>
      )}
      
      <div className="flex gap-2 items-center">
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
          <SelectTrigger 
            className="w-[140px]" 
            data-testid="select-month-dropdown"
          >
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((month) => (
              <SelectItem 
                key={month.value} 
                value={month.value}
                data-testid={`month-option-${month.value}`}
              >
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger 
            className="w-[100px]" 
            data-testid="select-year-dropdown"
          >
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {years.map((year) => (
              <SelectItem 
                key={year} 
                value={year}
                data-testid={`year-option-${year}`}
              >
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showQuickSelects && (
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => handleQuickSelect('current')}
            className="text-xs text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 underline"
            data-testid="btn-current-month"
          >
            Current Month
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={() => handleQuickSelect('previous')}
            className="text-xs text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 underline"
            data-testid="btn-previous-month"
          >
            Previous Month
          </button>
        </div>
      )}
    </div>
  );
}

export function formatMonthYear(value: string): string {
  if (!value) return '';
  const [year, month] = value.split('-');
  const monthObj = MONTHS.find(m => m.value === month);
  return `${monthObj?.label || 'Unknown'} ${year}`;
}

export function getMonthYearFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
