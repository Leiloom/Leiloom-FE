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
