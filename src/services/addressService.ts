// Interface para resposta do CEP
export interface CepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

// Interface para Estados
export interface State {
  code: string
  name: string
}

// Estados brasileiros fallback
const fallbackStates: State[] = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
]

// Buscar endereço por CEP usando ViaCEP
export async function getAddressByCep(cep: string): Promise<CepResponse | null> {
  try {
    // Remove caracteres não numéricos do CEP
    const cleanCep = cep.replace(/\D/g, '')
    
    // Verifica se o CEP tem 8 dígitos
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos')
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
    
    if (!response.ok) {
      throw new Error('Erro na API ViaCEP')
    }

    const data = await response.json()
    
    // ViaCEP retorna erro: true quando CEP não existe
    if (data.erro) {
      throw new Error('CEP não encontrado')
    }

    return data
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return null
  }
}

// Buscar estados por país
export async function getStatesByCountryCode(countryCode: string): Promise<State[]> {
  try {
    // Para o Brasil, podemos usar uma API ou retornar os estados fixos
    if (countryCode === 'BR') {
      return fallbackStates
    }
    
    // Para outros países, você pode integrar com uma API como REST Countries
    // Por enquanto, retornamos array vazio para outros países
    return []
  } catch (error) {
    console.error('Erro ao buscar estados:', error)
    return countryCode === 'BR' ? fallbackStates : []
  }
}

// Buscar cidades por estado (para o Brasil)
export async function getCitiesByStateCode(stateCode: string): Promise<City[]> {
  try {
    // Aqui você pode integrar com IBGE API ou outra API
    // Por exemplo: https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios
    
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateCode}/municipios`)
    
    if (!response.ok) {
      throw new Error('Erro na API do IBGE')
    }

    const data = await response.json()
    return data.map((city: any) => ({ name: city.nome }))
  } catch (error) {
    console.error('Erro ao buscar cidades por estado:', error)
    // Fallback com algumas cidades principais por estado
    const fallbackCitiesByState: Record<string, string[]> = {
      'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
      'RJ': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu'],
      'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
      'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas'],
      'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
      'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'Caxias do Sul'],
      'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
      'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis'],
    }
    
    return (fallbackCitiesByState[stateCode] ?? []).map(name => ({ name }))
  }
}

// Interface City (já existe no seu código)
export interface City {
  name: string
}

export interface City {
  name: string
}

const fallbackCitiesByCountry: Record<string, string[]> = {
  BR: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Curitiba'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosário'],
  US: ['New York', 'Los Angeles', 'Chicago'],
  CL: ['Santiago', 'Valparaíso', 'Concepción'],
  CO: ['Bogotá', 'Medellín', 'Cali'],
  PE: ['Lima', 'Cusco', 'Arequipa'],
  UY: ['Montevidéu', 'Punta del Este'],
  VE: ['Caracas', 'Maracaibo'],
  PY: ['Assunção', 'Ciudad del Este'],
}


export async function getCitiesByCountryCode(code: string): Promise<City[]> {
  try {
    const response = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/countries/${code}/cities?limit=10&sort=-population`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'SUA_CHAVE_AQUI',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Erro na API GeoDB')
    }

    const data = await response.json()
    return data.data.map((city: any) => ({ name: city.name }))
  } catch (error) {
    return (fallbackCitiesByCountry[code] ?? []).map(name => ({ name }))
  }
}
