import { Currency, useCurrency } from '@/contexts/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Explain } from '@/components/Explain';


const currencies: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'EUR', label: 'EUR', symbol: '€' },
  { value: 'GBP', label: 'GBP', symbol: '£' },
  { value: 'JPY', label: 'JPY', symbol: '¥' },
];

export const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center">
      <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
        <Explain text="Change the currency prices are shown in across ARIGI.">
          <SelectTrigger className="w-[100px]" aria-label="Display currency">
            <SelectValue />
          </SelectTrigger>
        </Explain>
        <SelectContent>
          {currencies.map((curr) => (
            <SelectItem key={curr.value} value={curr.value}>
              {curr.symbol} {curr.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
