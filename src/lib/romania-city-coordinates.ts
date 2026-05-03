export interface TaskLocationPayload {
  x: number
  y: number
}

export const ROMANIA_DEFAULT_COORDINATES: TaskLocationPayload = {
  x: 24.96676,
  y: 45.943161,
}

export const ROMANIA_CITY_COORDINATES: Record<string, TaskLocationPayload> = {
  'Alba Iulia': { x: 23.5664761, y: 46.0682753 },
  Alexandria: { x: 25.3288462, y: 43.9702236 },
  Arad: { x: 21.3196342, y: 46.1753793 },
  Bacau: { x: 26.9153557, y: 46.5560493 },
  'Baia Mare': { x: 23.5719843, y: 47.6565584 },
  Bistrita: { x: 24.4963949, y: 47.1327012 },
  Botosani: { x: 26.6599858, y: 47.7450706 },
  Brasov: { x: 25.6105654, y: 45.6525105 },
  Braila: { x: 27.9742932, y: 45.2716092 },
  Bucuresti: { x: 26.102684, y: 44.4361414 },
  Buzau: { x: 26.8306557, y: 45.1490064 },
  Calarasi: { x: 27.3313233, y: 44.1961646 },
  'Cluj-Napoca': { x: 23.5899542, y: 46.769379 },
  Constanta: { x: 28.6507598, y: 44.1767161 },
  Craiova: { x: 23.7965614, y: 44.3190159 },
  Deva: { x: 22.9008611, y: 45.8817402 },
  'Drobeta-Turnu Severin': { x: 22.6531975, y: 44.6257835 },
  Focsani: { x: 27.1856921, y: 45.697274 },
  Galati: { x: 28.0549395, y: 45.4338215 },
  Giurgiu: { x: 25.9656448, y: 43.8961275 },
  Iasi: { x: 27.5837814, y: 47.1615598 },
  'Miercurea-Ciuc': { x: 25.8026675, y: 46.3614042 },
  Oradea: { x: 21.9285231, y: 47.0549163 },
  'Piatra-Neamt': { x: 26.3297689, y: 46.9301733 },
  Pitesti: { x: 24.8721156, y: 44.8572882 },
  Ploiesti: { x: 26.0236504, y: 44.9417468 },
  'Ramnicu Valcea': { x: 24.3647209, y: 45.1031731 },
  Resita: { x: 21.8877676, y: 45.2890106 },
  'Satu Mare': { x: 22.8725598, y: 47.7891763 },
  'Sfantu Gheorghe': { x: 25.7865367, y: 45.8659935 },
  Sibiu: { x: 24.1519202, y: 45.7973912 },
  Slatina: { x: 24.3631837, y: 44.4299971 },
  Slobozia: { x: 27.3618477, y: 44.5635999 },
  Suceava: { x: 25.8345939, y: 47.5326535 },
  'Targu Jiu': { x: 23.2728118, y: 45.0422947 },
  'Targu Mures': { x: 24.561196, y: 46.5446253 },
  Targoviste: { x: 25.462816, y: 44.9267709 },
  Timisoara: { x: 21.2257474, y: 45.7538355 },
  Tulcea: { x: 28.8016348, y: 45.177518 },
  Vaslui: { x: 27.8036751, y: 46.496847 },
  Zalau: { x: 23.0562143, y: 47.1819416 },
}
