import { useState, useEffect } from 'react';
import { Combobox } from '@headlessui/react';

interface ComboBoxOption {
  value: string;
  label: string;
}

interface ComboBoxProps {
  value: string; // O valor atualmente selecionado
  onChange: (value: string) => void; // Chamado quando o valor é alterado/selecionado
  options: ComboBoxOption[];
  placeholder?: string;
  disabled?: boolean;
  allowCustomValue?: boolean;
  isLoading?: boolean;
  className?: string;
  onInputChange?: (query: string) => void; // Callback para a mudança no input
}

export function ComboBox({
  value,
  onChange,
  options,
  placeholder = "Selecione ou digite...",
  disabled = false,
  allowCustomValue = true,
  isLoading = false,
  className = "",
  onInputChange,
}: ComboBoxProps) {
  const [query, setQuery] = useState(''); // O texto atual no input, usado para filtrar
  const [filteredOptions, setFilteredOptions] = useState<ComboBoxOption[]>(options);

  useEffect(() => {
    // Quando as opções principais mudam, reinicia as opções filtradas
    // e tenta definir o query inicial com base no valor selecionado (se houver)
    const currentOption = options.find(opt => opt.value === value);
    if (currentOption) {
      // Não defina query aqui para não interferir na digitação inicial.
      // displayValue cuidará da exibição inicial.
      // setQuery(currentOption.label); // Comentado para evitar sobrescrever a digitação
    } else if (allowCustomValue && value) {
      // setQuery(value); // Comentado
    }
    // Sempre atualize filteredOptions se as opções de entrada mudarem
    // A filtragem real acontecerá com base no `query` atual.
    setFilteredOptions(
        query === ''
        ? options
        : options.filter(option =>
            option.label.toLowerCase().includes(query.toLowerCase())
          )
    );
  }, [options]); // Dependa apenas de `options` para esta re-inicialização.

  // Filtra as opções quando `query` ou `options` mudam.
  useEffect(() => {
    if (query === '') {
      setFilteredOptions(options);
    } else {
      const newFilteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOptions(newFilteredOptions);
    }
  }, [query, options]);


  const handleInputChangeInternal = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setQuery(inputValue); // Atualiza o query para filtrar

    if (onInputChange) {
      onInputChange(inputValue);
    }

    // Se valores customizados são permitidos, atualiza o valor principal do Combobox
    // em tempo real conforme o usuário digita.
    if (allowCustomValue) {
      onChange(inputValue); // Chama o onChange externo para atualizar o `value` principal
    }
  };

  // Chamado pelo Combobox do Headless UI quando uma opção é selecionada
  // ou um valor customizado é "commitado" (ex: Enter ou blur).
  const handleComboboxChange = (selectedValue: string) => {
    onChange(selectedValue); // Chama o onChange externo para atualizar o `value` principal

    // Após uma seleção ou commit, atualiza o texto do input (query)
    // para refletir o item selecionado (seu label) ou o valor customizado.
    const matchedOption = options.find(opt => opt.value === selectedValue);
    if (matchedOption) {
      setQuery(matchedOption.label);
    } else if (allowCustomValue) {
      setQuery(selectedValue);
    } else {
      // Se não permite valor customizado e o valor não está nas opções,
      // limpa o query. (Este caso é menos comum se bem configurado).
      setQuery('');
    }
  };

  // Determina o que é exibido no input.
  // Baseia-se no `value` (valor selecionado/commitado) do Combobox.
  const displayValueFn = (currentPropValue: string) => {
    if (value === null || value === undefined) return ''; // Se o valor for nulo/indefinido

    // Se o input está focado e o usuário está digitando (controlado pelo query),
    // o Headless UI geralmente mostra o texto digitado.
    // Esta função é mais para como um `value` já selecionado/commitado deve ser mostrado.
    const option = options.find(opt => opt.value === currentPropValue);
    if (option) {
      return option.label; // Mostra o label da opção selecionada
    }
    // Se for um valor customizado (ou se `value` não corresponder a um `option.value`),
    // mostra o próprio `value`.
    if (allowCustomValue) {
        return currentPropValue;
    }
    // Se não permitir valor customizado e o valor não foi encontrado, pode retornar string vazia
    // ou o query atual se o input estiver focado.
    // Para simplificar, se não for um valor customizado permitido e não encontrado, retorna vazio.
    // O Headless UI deve lidar com a exibição do `query` durante a digitação.
    return '';
  };

  return (
    <Combobox value={value} onChange={handleComboboxChange} disabled={disabled}>
      <div className="relative">
        <Combobox.Input
          className={`w-full text-gray-700 border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${className}`}
          displayValue={displayValueFn} // Como exibir o `value` selecionado
          onChange={handleInputChangeInternal} // O que fazer quando o usuário digita
          placeholder={placeholder}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
          </div>
        )}

        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
          {filteredOptions.length === 0 && query !== '' && !allowCustomValue ? (
            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
              Nenhuma opção encontrada.
            </div>
          ) : (
            filteredOptions.map((option) => (
              <Combobox.Option
                key={option.value}
                value={option.value} // Este é o valor que `handleComboboxChange` recebe
                className={({ active }) =>
                  `relative cursor-default select-none py-2 px-4 ${
                    active ? 'bg-yellow-100 text-black' : 'text-gray-900'
                  }`
                }
              >
                {option.label}
              </Combobox.Option>
            ))
          )}
          {/* Opcional: Mostrar uma opção para adicionar o valor customizado digitado */}
          {allowCustomValue && query !== '' && !options.some(opt => opt.label.toLowerCase() === query.toLowerCase()) && !filteredOptions.some(opt => opt.value === query) && (
             <Combobox.Option
                value={query} // O valor será o próprio texto digitado
                className={({ active }) =>
                  `relative cursor-default select-none py-2 px-4 ${
                    active ? 'bg-yellow-100 text-black' : 'text-gray-900'
                  }`
                }
              >
                Adicionar: "{query}"
             </Combobox.Option>
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
}