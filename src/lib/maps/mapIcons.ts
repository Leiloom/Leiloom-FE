// src/lib/maps/mapIcons.ts
import L from 'leaflet'

// 🔹 Ícones para markers individuais (detalhe)
export function createCustomIcon(type: string, isSelected = false) {
  const colors: Record<string, string> = {
    IMOVEL: '#34383dff',
    VEICULO: '#10b981',
    OUTROS: '#8b5cf6'
  }

  const color = colors[type] || colors.OUTROS
  const size = isSelected ? 35 : 25

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
          background-color: ${color};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          ${isSelected ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        <div style="
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(45deg);
            color: white;
            font-size: ${size > 25 ? '16px' : '12px'};
            font-weight: bold;
        ">
            ${type === 'IMOVEL' ? '🏠' : type === 'VEICULO' ? '🚗' : '📦'}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: rotate(-45deg) scale(1); }
          50% { transform: rotate(-45deg) scale(1.1); }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  })
}

// 🔹 Estilo para clusters
export function clusterIcon(cluster: any) {
  const count = cluster.getChildCount()
  let size = 'small'
  if (count > 20) size = 'large'
  else if (count > 10) size = 'medium'

  return L.divIcon({
    html: `<div class="cluster-marker ${size}">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40, true)
  })
}
