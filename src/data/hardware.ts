export const GPUS = [
  // NVIDIA 50 Series
  { id: 'rtx-5090', name: 'NVIDIA GeForce RTX 5090', brand: 'NVIDIA', vram: 32, score: 410, rtScore: 470, tier: 'Flagship' },
  { id: 'rtx-5080', name: 'NVIDIA GeForce RTX 5080', brand: 'NVIDIA', vram: 16, score: 285, rtScore: 320, tier: 'Enthusiast' },
  { id: 'rtx-5070-ti', name: 'NVIDIA GeForce RTX 5070 Ti', brand: 'NVIDIA', vram: 16, score: 215, rtScore: 245, tier: 'High-End' },
  { id: 'rtx-5070', name: 'NVIDIA GeForce RTX 5070', brand: 'NVIDIA', vram: 12, score: 180, rtScore: 205, tier: 'Upper Mid-Range' },
  
  // NVIDIA 40 Series
  { id: 'rtx-4090', name: 'NVIDIA GeForce RTX 4090', brand: 'NVIDIA', vram: 24, score: 260, rtScore: 290, tier: 'Enthusiast' },
  { id: 'rtx-4080-super', name: 'NVIDIA GeForce RTX 4080 Super', brand: 'NVIDIA', vram: 16, score: 205, rtScore: 225, tier: 'High-End' },
  { id: 'rtx-4080', name: 'NVIDIA GeForce RTX 4080', brand: 'NVIDIA', vram: 16, score: 195, rtScore: 215, tier: 'High-End' },
  { id: 'rtx-4070-ti-super', name: 'NVIDIA GeForce RTX 4070 Ti Super', brand: 'NVIDIA', vram: 16, score: 175, rtScore: 190, tier: 'High-End' },
  { id: 'rtx-4070-ti', name: 'NVIDIA GeForce RTX 4070 Ti', brand: 'NVIDIA', vram: 12, score: 170, rtScore: 185, tier: 'High-End' },
  { id: 'rtx-4070-super', name: 'NVIDIA GeForce RTX 4070 Super', brand: 'NVIDIA', vram: 12, score: 155, rtScore: 165, tier: 'Upper Mid-Range' },
  { id: 'rtx-4070', name: 'NVIDIA GeForce RTX 4070', brand: 'NVIDIA', vram: 12, score: 135, rtScore: 145, tier: 'Upper Mid-Range' },
  { id: 'rtx-4060-ti-16', name: 'NVIDIA GeForce RTX 4060 Ti 16GB', brand: 'NVIDIA', vram: 16, score: 118, rtScore: 122, tier: 'Mid-Range' },
  { id: 'rtx-4060-ti', name: 'NVIDIA GeForce RTX 4060 Ti 8GB', brand: 'NVIDIA', vram: 8, score: 115, rtScore: 120, tier: 'Mid-Range' },
  { id: 'rtx-4060', name: 'NVIDIA GeForce RTX 4060', brand: 'NVIDIA', vram: 8, score: 100, rtScore: 100, tier: 'Mid-Range' }, // Baseline 100
  
  // NVIDIA 30 Series
  { id: 'rtx-3090-ti', name: 'NVIDIA GeForce RTX 3090 Ti', brand: 'NVIDIA', vram: 24, score: 180, rtScore: 175, tier: 'High-End' },
  { id: 'rtx-3090', name: 'NVIDIA GeForce RTX 3090', brand: 'NVIDIA', vram: 24, score: 165, rtScore: 160, tier: 'High-End' },
  { id: 'rtx-3080-ti', name: 'NVIDIA GeForce RTX 3080 Ti', brand: 'NVIDIA', vram: 12, score: 160, rtScore: 150, tier: 'High-End' },
  { id: 'rtx-3080-12', name: 'NVIDIA GeForce RTX 3080 12GB', brand: 'NVIDIA', vram: 12, score: 152, rtScore: 144, tier: 'High-End' },
  { id: 'rtx-3080-10', name: 'NVIDIA GeForce RTX 3080 10GB', brand: 'NVIDIA', vram: 10, score: 148, rtScore: 140, tier: 'Upper Mid-Range' },
  { id: 'rtx-3070-ti', name: 'NVIDIA GeForce RTX 3070 Ti', brand: 'NVIDIA', vram: 8, score: 132, rtScore: 125, tier: 'Upper Mid-Range' },
  { id: 'rtx-3070', name: 'NVIDIA GeForce RTX 3070', brand: 'NVIDIA', vram: 8, score: 124, rtScore: 115, tier: 'Mid-Range' },
  { id: 'rtx-3060-ti', name: 'NVIDIA GeForce RTX 3060 Ti', brand: 'NVIDIA', vram: 8, score: 114, rtScore: 105, tier: 'Mid-Range' },
  { id: 'rtx-3060', name: 'NVIDIA GeForce RTX 3060 12GB', brand: 'NVIDIA', vram: 12, score: 85, rtScore: 72, tier: 'Mainstream' },
  { id: 'rtx-3060-8gb', name: 'NVIDIA GeForce RTX 3060 8GB', brand: 'NVIDIA', vram: 8, score: 76, rtScore: 64, tier: 'Mainstream' },
  { id: 'rtx-3050', name: 'NVIDIA GeForce RTX 3050 8GB', brand: 'NVIDIA', vram: 8, score: 55, rtScore: 42, tier: 'Entry' },
  { id: 'rtx-3050-6gb', name: 'NVIDIA GeForce RTX 3050 6GB', brand: 'NVIDIA', vram: 6, score: 44, rtScore: 32, tier: 'Budget' },
  
  // NVIDIA 20 Series
  { id: 'rtx-2080-ti', name: 'NVIDIA GeForce RTX 2080 Ti', brand: 'NVIDIA', vram: 11, score: 120, rtScore: 90, tier: 'Mid-Range' },
  { id: 'rtx-2080-super', name: 'NVIDIA GeForce RTX 2080 Super', brand: 'NVIDIA', vram: 8, score: 108, rtScore: 82, tier: 'Mid-Range' },
  { id: 'rtx-2080', name: 'NVIDIA GeForce RTX 2080', brand: 'NVIDIA', vram: 8, score: 102, rtScore: 76, tier: 'Mid-Range' },
  { id: 'rtx-2070-super', name: 'NVIDIA GeForce RTX 2070 Super', brand: 'NVIDIA', vram: 8, score: 96, rtScore: 70, tier: 'Mainstream' },
  { id: 'rtx-2070', name: 'NVIDIA GeForce RTX 2070', brand: 'NVIDIA', vram: 8, score: 88, rtScore: 62, tier: 'Mainstream' },
  { id: 'rtx-2060-super', name: 'NVIDIA GeForce RTX 2060 Super', brand: 'NVIDIA', vram: 8, score: 82, rtScore: 56, tier: 'Mainstream' },
  { id: 'rtx-2060', name: 'NVIDIA GeForce RTX 2060 6GB', brand: 'NVIDIA', vram: 6, score: 70, rtScore: 45, tier: 'Entry' },
  
  // NVIDIA GTX Legacy (No Hardware RT)
  { id: 'gtx-1080-ti', name: 'NVIDIA GeForce GTX 1080 Ti', brand: 'NVIDIA', vram: 11, score: 92, rtScore: 0, tier: 'Mainstream' },
  { id: 'gtx-1080', name: 'NVIDIA GeForce GTX 1080', brand: 'NVIDIA', vram: 8, score: 80, rtScore: 0, tier: 'Mainstream' },
  { id: 'gtx-1070-ti', name: 'NVIDIA GeForce GTX 1070 Ti', brand: 'NVIDIA', vram: 8, score: 74, rtScore: 0, tier: 'Entry' },
  { id: 'gtx-1070', name: 'NVIDIA GeForce GTX 1070', brand: 'NVIDIA', vram: 8, score: 65, rtScore: 0, tier: 'Entry' },
  { id: 'gtx-1660-ti', name: 'NVIDIA GeForce GTX 1660 Ti', brand: 'NVIDIA', vram: 6, score: 62, rtScore: 0, tier: 'Entry' },
  { id: 'gtx-1660-super', name: 'NVIDIA GeForce GTX 1660 Super', brand: 'NVIDIA', vram: 6, score: 58, rtScore: 0, tier: 'Entry' },
  { id: 'gtx-1660', name: 'NVIDIA GeForce GTX 1660', brand: 'NVIDIA', vram: 6, score: 52, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-1650-super', name: 'NVIDIA GeForce GTX 1650 Super', brand: 'NVIDIA', vram: 4, score: 48, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-1650-g6', name: 'NVIDIA GeForce GTX 1650 GDDR6', brand: 'NVIDIA', vram: 4, score: 39, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-1650', name: 'NVIDIA GeForce GTX 1650', brand: 'NVIDIA', vram: 4, score: 35, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-1060-6gb', name: 'NVIDIA GeForce GTX 1060 6GB', brand: 'NVIDIA', vram: 6, score: 42, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-1060-3gb', name: 'NVIDIA GeForce GTX 1060 3GB', brand: 'NVIDIA', vram: 3, score: 36, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-1050-ti', name: 'NVIDIA GeForce GTX 1050 Ti', brand: 'NVIDIA', vram: 4, score: 24, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-980-ti', name: 'NVIDIA GeForce GTX 980 Ti', brand: 'NVIDIA', vram: 6, score: 50, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-970', name: 'NVIDIA GeForce GTX 970', brand: 'NVIDIA', vram: 4, score: 38, rtScore: 0, tier: 'Budget' },
  { id: 'gtx-750-ti', name: 'NVIDIA GeForce GTX 750 Ti', brand: 'NVIDIA', vram: 2, score: 14, rtScore: 0, tier: 'Legacy' },
  
  // AMD RX 7000 Series
  { id: 'rx-7900-xtx', name: 'AMD Radeon RX 7900 XTX', brand: 'AMD', vram: 24, score: 228, rtScore: 165, tier: 'High-End' },
  { id: 'rx-7900-xt', name: 'AMD Radeon RX 7900 XT', brand: 'AMD', vram: 20, score: 188, rtScore: 135, tier: 'High-End' },
  { id: 'rx-7900-gre', name: 'AMD Radeon RX 7900 GRE', brand: 'AMD', vram: 16, score: 162, rtScore: 112, tier: 'Upper Mid-Range' },
  { id: 'rx-7800-xt', name: 'AMD Radeon RX 7800 XT', brand: 'AMD', vram: 16, score: 149, rtScore: 104, tier: 'Upper Mid-Range' },
  { id: 'rx-7700-xt', name: 'AMD Radeon RX 7700 XT', brand: 'AMD', vram: 12, score: 128, rtScore: 88, tier: 'Mid-Range' },
  { id: 'rx-7600-xt', name: 'AMD Radeon RX 7600 XT 16GB', brand: 'AMD', vram: 16, score: 102, rtScore: 68, tier: 'Mid-Range' },
  { id: 'rx-7600', name: 'AMD Radeon RX 7600 8GB', brand: 'AMD', vram: 8, score: 96, rtScore: 62, tier: 'Mainstream' },
  
  // AMD RX 6000 Series
  { id: 'rx-6950-xt', name: 'AMD Radeon RX 6950 XT', brand: 'AMD', vram: 16, score: 175, rtScore: 98, tier: 'High-End' },
  { id: 'rx-6900-xt', name: 'AMD Radeon RX 6900 XT', brand: 'AMD', vram: 16, score: 168, rtScore: 94, tier: 'High-End' },
  { id: 'rx-6800-xt', name: 'AMD Radeon RX 6800 XT', brand: 'AMD', vram: 16, score: 152, rtScore: 86, tier: 'Upper Mid-Range' },
  { id: 'rx-6800', name: 'AMD Radeon RX 6800', brand: 'AMD', vram: 16, score: 138, rtScore: 78, tier: 'Upper Mid-Range' },
  { id: 'rx-6750-xt', name: 'AMD Radeon RX 6750 XT', brand: 'AMD', vram: 12, score: 122, rtScore: 70, tier: 'Mid-Range' },
  { id: 'rx-6700-xt', name: 'AMD Radeon RX 6700 XT', brand: 'AMD', vram: 12, score: 115, rtScore: 65, tier: 'Mid-Range' },
  { id: 'rx-6700-10gb', name: 'AMD Radeon RX 6700 10GB', brand: 'AMD', vram: 10, score: 105, rtScore: 56, tier: 'Mid-Range' },
  { id: 'rx-6650-xt', name: 'AMD Radeon RX 6650 XT', brand: 'AMD', vram: 8, score: 95, rtScore: 48, tier: 'Mainstream' },
  { id: 'rx-6600-xt', name: 'AMD Radeon RX 6600 XT', brand: 'AMD', vram: 8, score: 92, rtScore: 46, tier: 'Mainstream' },
  { id: 'rx-6600', name: 'AMD Radeon RX 6600', brand: 'AMD', vram: 8, score: 80, rtScore: 38, tier: 'Mainstream' },
  { id: 'rx-6500-xt', name: 'AMD Radeon RX 6500 XT', brand: 'AMD', vram: 4, score: 46, rtScore: 14, tier: 'Budget' },
  { id: 'rx-6400', name: 'AMD Radeon RX 6400', brand: 'AMD', vram: 4, score: 36, rtScore: 10, tier: 'Budget' },
  
  // AMD RX 5000 & Legacy (No Hardware RT)
  { id: 'rx-5700-xt', name: 'AMD Radeon RX 5700 XT', brand: 'AMD', vram: 8, score: 74, rtScore: 0, tier: 'Entry' },
  { id: 'rx-5700', name: 'AMD Radeon RX 5700', brand: 'AMD', vram: 8, score: 66, rtScore: 0, tier: 'Entry' },
  { id: 'rx-5600-xt', name: 'AMD Radeon RX 5600 XT', brand: 'AMD', vram: 6, score: 60, rtScore: 0, tier: 'Entry' },
  { id: 'rx-5500-xt', name: 'AMD Radeon RX 5500 XT', brand: 'AMD', vram: 8, score: 44, rtScore: 0, tier: 'Budget' },
  { id: 'rx-590', name: 'AMD Radeon RX 590 8GB', brand: 'AMD', vram: 8, score: 37, rtScore: 0, tier: 'Budget' },
  { id: 'rx-580', name: 'AMD Radeon RX 580 8GB', brand: 'AMD', vram: 8, score: 33, rtScore: 0, tier: 'Budget' },
  { id: 'rx-570', name: 'AMD Radeon RX 570 4GB', brand: 'AMD', vram: 4, score: 29, rtScore: 0, tier: 'Budget' },
  { id: 'rx-550', name: 'AMD Radeon RX 550 4GB', brand: 'AMD', vram: 4, score: 12, rtScore: 0, tier: 'Legacy' },
  { id: 'rx-vega-64', name: 'AMD Radeon RX Vega 64', brand: 'AMD', vram: 8, score: 58, rtScore: 0, tier: 'Entry' },
  { id: 'rx-vega-56', name: 'AMD Radeon RX Vega 56', brand: 'AMD', vram: 8, score: 52, rtScore: 0, tier: 'Entry' },
  
  // Intel Arc Series
  { id: 'arc-b580', name: 'Intel Arc B580 12GB (Battlemage)', brand: 'Intel', vram: 12, score: 115, rtScore: 110, tier: 'Mid-Range' },
  { id: 'arc-b570', name: 'Intel Arc B570 10GB (Battlemage)', brand: 'Intel', vram: 10, score: 96, rtScore: 90, tier: 'Mainstream' },
  { id: 'arc-a770', name: 'Intel Arc A770 16GB', brand: 'Intel', vram: 16, score: 98, rtScore: 86, tier: 'Mainstream' },
  { id: 'arc-a750', name: 'Intel Arc A750 8GB', brand: 'Intel', vram: 8, score: 88, rtScore: 76, tier: 'Mainstream' },
  { id: 'arc-a580', name: 'Intel Arc A580 8GB', brand: 'Intel', vram: 8, score: 74, rtScore: 60, tier: 'Entry' },
  { id: 'arc-a380', name: 'Intel Arc A380 6GB', brand: 'Intel', vram: 6, score: 40, rtScore: 32, tier: 'Budget' },
  { id: 'arc-a310', name: 'Intel Arc A310 4GB', brand: 'Intel', vram: 4, score: 26, rtScore: 20, tier: 'Budget' },
  
  // Integrated & APU
  { id: 'radeon-890m', name: 'AMD Radeon 890M (RDNA 3.5 APU)', brand: 'AMD', vram: 4, score: 34, rtScore: 14, tier: 'Handheld / APU' },
  { id: 'radeon-780m', name: 'AMD Radeon 780M (Integrated APU)', brand: 'AMD', vram: 4, score: 25, rtScore: 8, tier: 'Handheld / APU' },
  { id: 'radeon-760m', name: 'AMD Radeon 760M (Integrated APU)', brand: 'AMD', vram: 3, score: 18, rtScore: 5, tier: 'Handheld / APU' },
  { id: 'radeon-680m', name: 'AMD Radeon 680M (Integrated APU)', brand: 'AMD', vram: 3, score: 20, rtScore: 6, tier: 'Handheld / APU' },
  { id: 'intel-arc-140v', name: 'Intel Arc 140V (Lunar Lake iGPU)', brand: 'Intel', vram: 4, score: 32, rtScore: 18, tier: 'Handheld / APU' },
  { id: 'intel-iris-xe', name: 'Intel Iris Xe Graphics G7', brand: 'Intel', vram: 2, score: 13, rtScore: 0, tier: 'Integrated' },
  { id: 'intel-uhd-770', name: 'Intel UHD Graphics 770', brand: 'Intel', vram: 1, score: 7, rtScore: 0, tier: 'Basic Display' },
  { id: 'intel-uhd-730', name: 'Intel UHD Graphics 730', brand: 'Intel', vram: 1, score: 5, rtScore: 0, tier: 'Basic Display' },
  { id: 'intel-uhd-630', name: 'Intel UHD Graphics 630', brand: 'Intel', vram: 1, score: 4, rtScore: 0, tier: 'Basic Display' }
];

export const CPUS = [
  // AMD Ryzen 9000 & 7000 Series
  { id: 'r7-9800x3d', name: 'AMD Ryzen 7 9800X3D (8C/16T)', brand: 'AMD', score: 182, fpsCap: 330, tier: 'Flagship' },
  { id: 'r9-7950x3d', name: 'AMD Ryzen 9 7950X3D (16C/32T)', brand: 'AMD', score: 168, fpsCap: 300, tier: 'Enthusiast' },
  { id: 'r7-7800x3d', name: 'AMD Ryzen 7 7800X3D (8C/16T)', brand: 'AMD', score: 172, fpsCap: 310, tier: 'Flagship' },
  { id: 'r9-7900x', name: 'AMD Ryzen 9 7900X (12C/24T)', brand: 'AMD', score: 145, fpsCap: 260, tier: 'High-End' },
  { id: 'r7-7700x', name: 'AMD Ryzen 7 7700X (8C/16T)', brand: 'AMD', score: 142, fpsCap: 255, tier: 'High-End' },
  { id: 'r5-7600x', name: 'AMD Ryzen 5 7600X (6C/12T)', brand: 'AMD', score: 136, fpsCap: 245, tier: 'Upper Mid-Range' },
  { id: 'r5-7600', name: 'AMD Ryzen 5 7600 (6C/12T)', brand: 'AMD', score: 130, fpsCap: 235, tier: 'Upper Mid-Range' },
  
  // AMD Ryzen 5000 Series
  { id: 'r7-5800x3d', name: 'AMD Ryzen 7 5800X3D (8C/16T)', brand: 'AMD', score: 146, fpsCap: 260, tier: 'High-End' },
  { id: 'r7-5700x3d', name: 'AMD Ryzen 7 5700X3D (8C/16T)', brand: 'AMD', score: 136, fpsCap: 245, tier: 'Upper Mid-Range' },
  { id: 'r7-5700x', name: 'AMD Ryzen 7 5700X (8C/16T)', brand: 'AMD', score: 108, fpsCap: 195, tier: 'Mid-Range' },
  { id: 'r5-5600x', name: 'AMD Ryzen 5 5600X (6C/12T)', brand: 'AMD', score: 100, fpsCap: 180, tier: 'Mid-Range' }, // Baseline 100
  { id: 'r5-5600', name: 'AMD Ryzen 5 5600 (6C/12T)', brand: 'AMD', score: 96, fpsCap: 175, tier: 'Mid-Range' },
  { id: 'r5-3600', name: 'AMD Ryzen 5 3600 (6C/12T)', brand: 'AMD', score: 75, fpsCap: 135, tier: 'Mainstream' },
  { id: 'r7-2700x', name: 'AMD Ryzen 7 2700X (8C/16T)', brand: 'AMD', score: 62, fpsCap: 110, tier: 'Entry' },
  
  // Intel Core 14th & 13th Gen
  { id: 'i9-14900k', name: 'Intel Core i9-14900K (24C/32T)', brand: 'Intel', score: 165, fpsCap: 295, tier: 'Enthusiast' },
  { id: 'i7-14700k', name: 'Intel Core i7-14700K (20C/28T)', brand: 'Intel', score: 154, fpsCap: 275, tier: 'High-End' },
  { id: 'i5-14600k', name: 'Intel Core i5-14600K (14C/20T)', brand: 'Intel', score: 145, fpsCap: 260, tier: 'High-End' },
  { id: 'i9-13900k', name: 'Intel Core i9-13900K (24C/32T)', brand: 'Intel', score: 160, fpsCap: 285, tier: 'Enthusiast' },
  { id: 'i7-13700k', name: 'Intel Core i7-13700K (16C/24T)', brand: 'Intel', score: 150, fpsCap: 270, tier: 'High-End' },
  { id: 'i5-13600k', name: 'Intel Core i5-13600K (14C/20T)', brand: 'Intel', score: 142, fpsCap: 255, tier: 'High-End' },
  { id: 'i5-13400f', name: 'Intel Core i5-13400F (10C/16T)', brand: 'Intel', score: 116, fpsCap: 205, tier: 'Mid-Range' },
  
  // Intel Core 12th & 11th / 10th / 8th Gen
  { id: 'i7-12700k', name: 'Intel Core i7-12700K (12C/20T)', brand: 'Intel', score: 135, fpsCap: 240, tier: 'Upper Mid-Range' },
  { id: 'i5-12600k', name: 'Intel Core i5-12600K (10C/16T)', brand: 'Intel', score: 126, fpsCap: 225, tier: 'Mid-Range' },
  { id: 'i5-12400f', name: 'Intel Core i5-12400F (6C/12T)', brand: 'Intel', score: 108, fpsCap: 190, tier: 'Mid-Range' },
  { id: 'i3-12100f', name: 'Intel Core i3-12100F (4C/8T)', brand: 'Intel', score: 94, fpsCap: 160, tier: 'Mainstream' },
  { id: 'i9-10900k', name: 'Intel Core i9-10900K (10C/20T)', brand: 'Intel', score: 114, fpsCap: 205, tier: 'Mid-Range' },
  { id: 'i7-10700k', name: 'Intel Core i7-10700K (8C/16T)', brand: 'Intel', score: 104, fpsCap: 185, tier: 'Mid-Range' },
  { id: 'i5-10400f', name: 'Intel Core i5-10400F (6C/12T)', brand: 'Intel', score: 82, fpsCap: 145, tier: 'Mainstream' },
  { id: 'i7-8700k', name: 'Intel Core i7-8700K (6C/12T)', brand: 'Intel', score: 78, fpsCap: 140, tier: 'Entry' },
  { id: 'i5-8400', name: 'Intel Core i5-8400 (6C/6T)', brand: 'Intel', score: 62, fpsCap: 112, tier: 'Budget' }
];

export const RAM_OPTIONS = [
  { value: 8, label: '8 GB DDR4 / DDR5', factor: 0.88, low1PercentPenalty: 0.72, desc: 'Tight for modern AAA' },
  { value: 16, label: '16 GB DDR4 / DDR5', factor: 1.00, low1PercentPenalty: 0.96, desc: 'Standard gaming baseline' },
  { value: 32, label: '32 GB DDR4 / DDR5', factor: 1.04, low1PercentPenalty: 1.00, desc: 'Optimal sweet spot' },
  { value: 64, label: '64 GB DDR5', factor: 1.05, low1PercentPenalty: 1.02, desc: 'Enthusiast / Heavy multitasking' }
];

export const SYSTEM_PRESETS = [
  {
    id: 'budget',
    name: 'Budget 1080p',
    badge: 'Budget Friendly',
    gpuId: 'rtx-3060',
    cpuId: 'i5-12400f',
    ram: 16,
    resolution: '1080p',
    preset: 'medium',
    upscaling: 'off',
    rayTracing: false
  },
  {
    id: 'midrange',
    name: '1440p Sweet Spot',
    badge: 'Most Popular',
    gpuId: 'rtx-4070-super',
    cpuId: 'r5-7600x',
    ram: 32,
    resolution: '1440p',
    preset: 'high',
    upscaling: 'quality',
    rayTracing: false
  },
  {
    id: 'esports',
    name: 'eSports 240Hz',
    badge: 'Ultra High Refresh',
    gpuId: 'rtx-4060-ti',
    cpuId: 'r7-5700x3d',
    ram: 32,
    resolution: '1080p',
    preset: 'low',
    upscaling: 'off',
    rayTracing: false
  },
  {
    id: 'highend',
    name: 'High-End 4K RT',
    badge: 'Enthusiast',
    gpuId: 'rtx-4080-super',
    cpuId: 'r7-7800x3d',
    ram: 32,
    resolution: '4k',
    preset: 'ultra',
    upscaling: 'quality',
    rayTracing: true
  },
  {
    id: 'ultimate',
    name: 'RTX 5090 Enthusiast',
    badge: 'Flagship',
    gpuId: 'rtx-5090',
    cpuId: 'r7-9800x3d',
    ram: 64,
    resolution: '4k',
    preset: 'ultra',
    upscaling: 'off',
    rayTracing: true
  },
  {
    id: 'handheld',
    name: 'Handheld / APU',
    badge: 'Low Power',
    gpuId: 'radeon-780m',
    cpuId: 'r5-7600',
    ram: 16,
    resolution: '1080p',
    preset: 'low',
    upscaling: 'performance',
    rayTracing: false
  }
];
