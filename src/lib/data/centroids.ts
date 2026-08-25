// Approximate country centroids (longitude, latitude) for the schematic
// network map. Positions are approximate — intended for a stylised node map,
// not precise cartography. Labelled as schematic in the UI.
export const CENTROIDS: Record<string, [number, number]> = {
  DZA: [2.6, 28.0], EGY: [30.0, 26.8], LBY: [17.0, 27.0], MAR: [-6.0, 31.8],
  SDN: [30.0, 15.5], TUN: [9.5, 34.0],
  BEN: [2.3, 9.5], BFA: [-1.7, 12.2], CPV: [-23.5, 16.0], CIV: [-5.5, 7.5],
  GMB: [-15.4, 13.4], GHA: [-1.0, 7.9], GIN: [-10.9, 9.9], GNB: [-15.0, 12.0],
  LBR: [-9.4, 6.4], MLI: [-3.5, 17.0], MRT: [-10.5, 20.2], NER: [8.0, 17.6],
  NGA: [8.0, 9.6], SEN: [-14.5, 14.5], SLE: [-11.8, 8.5], TGO: [0.8, 8.6],
  BDI: [29.9, -3.4], COM: [43.3, -11.6], DJI: [42.6, 11.6], ERI: [39.0, 15.4],
  ETH: [39.6, 8.6], KEN: [37.9, 0.2], MDG: [46.7, -19.0], MWI: [34.3, -13.2],
  MUS: [57.5, -20.3], MOZ: [35.5, -18.7], RWA: [29.9, -1.9], SYC: [55.5, -4.7],
  SOM: [46.2, 5.2], SSD: [30.7, 7.9], TZA: [34.9, -6.4], UGA: [32.4, 1.4],
  ZMB: [27.8, -13.1], ZWE: [29.2, -19.0],
  AGO: [17.5, -12.3], CMR: [12.4, 5.7], CAF: [20.9, 6.6], TCD: [18.7, 15.4],
  COG: [15.2, -0.7], COD: [23.6, -2.9], GNQ: [10.3, 1.6], GAB: [11.6, -0.8],
  STP: [6.6, 0.2],
  BWA: [24.7, -22.3], SWZ: [31.5, -26.5], LSO: [28.2, -29.6], NAM: [17.2, -22.5],
  ZAF: [24.7, -29.0],
};
