import * as React from 'react';
import { cn } from '@/lib/utils';

interface MoneyInputProps {
  /** Valor em centavos (ex: 15000 = R$ 150,00) */
  value: number;
  /** Callback com o novo valor em centavos */
  onChange: (centavos: number) => void;
  className?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * Input de dinheiro estilo ATM/caixa eletrônico.
 * A digitação começa pelos centavos e cresce da direita para a esquerda.
 * Ex: digitar 1 → 0,01 | 5 → 0,15 | 0 → 1,50 | 0 → 15,00
 */
export function MoneyInput({ value, onChange, className, autoFocus, placeholder = '0,00' }: MoneyInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formatarValor = (centavos: number): string => {
    if (centavos === 0) return '';
    const reais = centavos / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.key === 'Backspace' || e.key === 'Delete') {
      // Remove o último dígito (shift right = divide por 10)
      const novoValor = Math.floor(value / 10);
      onChange(novoValor);
      return;
    }

    // Aceita apenas dígitos 0-9
    if (/^[0-9]$/.test(e.key)) {
      const digito = parseInt(e.key, 10);
      // Limitar a um valor razoável (R$ 999.999,99 = 99999999 centavos)
      if (value > 9999999) return;
      const novoValor = value * 10 + digito;
      onChange(novoValor);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Previne o onChange nativo — toda lógica é feita no onKeyDown
    e.preventDefault();
  };

  // Foca no input ao montar se autoFocus
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const valorFormatado = formatarValor(value);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={valorFormatado}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      autoFocus={autoFocus}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
    />
  );
}
