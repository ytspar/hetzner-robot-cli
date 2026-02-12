export interface AuctionServer {
  id: number;
  name: string;
  cpu: string;
  cpu_benchmark: number;
  cpu_count: number;
  ram_size: number;
  ram: string[];
  hdd_count: number;
  hdd_size: number;
  hdd_text: string;
  disk_type: string;
  datacenter: string;
  price: number;
  setup_price: number;
  fixed_price: boolean;
  next_reduce: number;
  next_reduce_timestamp: number;
  ecc: boolean;
  gpu: boolean;
  inic: boolean;
  ipv4: boolean;
  specials: string[];
  traffic: string;
  bandwidth: number;
}

function futureTimestamp(hoursFromNow: number): number {
  return Math.floor(Date.now() / 1000) + hoursFromNow * 3600;
}

const servers: AuctionServer[] = [
  // Intel Core i7 budget range
  {
    id: 1942861, name: "SB71", cpu: "Intel Core i7-6700", cpu_benchmark: 9276, cpu_count: 4,
    ram_size: 32, ram: ["2x16GB DDR4"], hdd_count: 2, hdd_size: 512, hdd_text: "2x 512GB SATA SSD",
    disk_type: "SATA SSD", datacenter: "FSN1-DC14", price: 30, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1942862, name: "SB72", cpu: "Intel Core i7-6700", cpu_benchmark: 9312, cpu_count: 4,
    ram_size: 32, ram: ["2x16GB DDR4"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB HDD",
    disk_type: "HDD", datacenter: "FSN1-DC18", price: 31, setup_price: 0, fixed_price: false,
    next_reduce: 3, next_reduce_timestamp: futureTimestamp(3), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1943001, name: "SB73", cpu: "Intel Core i7-8700", cpu_benchmark: 13045, cpu_count: 6,
    ram_size: 64, ram: ["2x32GB DDR4"], hdd_count: 2, hdd_size: 512, hdd_text: "2x 512GB NVMe SSD",
    disk_type: "NVMe", datacenter: "NBG1-DC3", price: 38, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // AMD Ryzen 5 mid range
  {
    id: 1943101, name: "SB81", cpu: "AMD Ryzen 5 3600", cpu_benchmark: 13421, cpu_count: 6,
    ram_size: 64, ram: ["2x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 42, setup_price: 0, fixed_price: false,
    next_reduce: 5, next_reduce_timestamp: futureTimestamp(5), ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1943102, name: "SB82", cpu: "AMD Ryzen 5 3600", cpu_benchmark: 13398, cpu_count: 6,
    ram_size: 64, ram: ["4x16GB DDR4"], hdd_count: 4, hdd_size: 2048, hdd_text: "4x 2TB HDD",
    disk_type: "HDD", datacenter: "HEL1-DC2", price: 39, setup_price: 0, fixed_price: false,
    next_reduce: 7, next_reduce_timestamp: futureTimestamp(7), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1943201, name: "SB83", cpu: "AMD Ryzen 5 5600G", cpu_benchmark: 17923, cpu_count: 6,
    ram_size: 64, ram: ["2x32GB DDR4"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 44, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // Intel Xeon E3 mid range
  {
    id: 1944001, name: "SB91", cpu: "Intel Xeon E3-1271V3", cpu_benchmark: 9876, cpu_count: 4,
    ram_size: 32, ram: ["4x8GB DDR3 ECC"], hdd_count: 2, hdd_size: 480, hdd_text: "2x 480GB SATA SSD",
    disk_type: "SATA SSD", datacenter: "FSN1-DC14", price: 34, setup_price: 0, fixed_price: false,
    next_reduce: 2, next_reduce_timestamp: futureTimestamp(2), ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1944002, name: "SB92", cpu: "Intel Xeon E3-1275V5", cpu_benchmark: 11234, cpu_count: 4,
    ram_size: 64, ram: ["4x16GB DDR4 ECC"], hdd_count: 2, hdd_size: 512, hdd_text: "2x 512GB SATA SSD",
    disk_type: "SATA SSD", datacenter: "NBG1-DC3", price: 38, setup_price: 27.17, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1944003, name: "SB93", cpu: "Intel Xeon E3-1246V3", cpu_benchmark: 9544, cpu_count: 4,
    ram_size: 32, ram: ["4x8GB DDR3 ECC"], hdd_count: 3, hdd_size: 4096, hdd_text: "3x 4TB HDD",
    disk_type: "HDD", datacenter: "HEL1-DC4", price: 35, setup_price: 0, fixed_price: false,
    next_reduce: 9, next_reduce_timestamp: futureTimestamp(9), ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // AMD Ryzen 7/9 higher range
  {
    id: 1945001, name: "SB101", cpu: "AMD Ryzen 7 3700X", cpu_benchmark: 19876, cpu_count: 8,
    ram_size: 64, ram: ["2x32GB DDR4"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 48, setup_price: 0, fixed_price: false,
    next_reduce: 4, next_reduce_timestamp: futureTimestamp(4), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1945002, name: "SB102", cpu: "AMD Ryzen 9 3900", cpu_benchmark: 28234, cpu_count: 12,
    ram_size: 128, ram: ["4x32GB DDR4"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "HEL1-DC2", price: 62, setup_price: 0, fixed_price: false,
    next_reduce: 6, next_reduce_timestamp: futureTimestamp(6), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1945003, name: "SB103", cpu: "AMD Ryzen 9 5950X", cpu_benchmark: 38945, cpu_count: 16,
    ram_size: 128, ram: ["4x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC18", price: 78, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // Intel Xeon E5 dual CPU
  {
    id: 1946001, name: "SB111", cpu: "Intel Xeon E5-2680V4", cpu_benchmark: 21456, cpu_count: 28,
    ram_size: 256, ram: ["8x32GB DDR4 ECC"], hdd_count: 4, hdd_size: 480, hdd_text: "4x 480GB SATA SSD",
    disk_type: "SATA SSD", datacenter: "FSN1-DC14", price: 72, setup_price: 27.17, fixed_price: false,
    next_reduce: 8, next_reduce_timestamp: futureTimestamp(8), ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1946002, name: "SB112", cpu: "Intel Xeon E5-2690V4", cpu_benchmark: 23678, cpu_count: 28,
    ram_size: 256, ram: ["16x16GB DDR4 ECC"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "NBG1-DC3", price: 82, setup_price: 0, fixed_price: false,
    next_reduce: 1, next_reduce_timestamp: futureTimestamp(1), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1946003, name: "SB113", cpu: "Intel Xeon E5-2680V3", cpu_benchmark: 18234, cpu_count: 24,
    ram_size: 128, ram: ["4x32GB DDR4 ECC"], hdd_count: 6, hdd_size: 8192, hdd_text: "6x 8TB HDD",
    disk_type: "HDD", datacenter: "HEL1-DC2", price: 65, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // Intel Xeon Gold / Scalable
  {
    id: 1947001, name: "SB121", cpu: "Intel Xeon Gold 5218", cpu_benchmark: 26789, cpu_count: 32,
    ram_size: 256, ram: ["8x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 105, setup_price: 0, fixed_price: false,
    next_reduce: 10, next_reduce_timestamp: futureTimestamp(10), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1947002, name: "SB122", cpu: "Intel Xeon Gold 5412U", cpu_benchmark: 42567, cpu_count: 48,
    ram_size: 512, ram: ["16x32GB DDR5 ECC"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 195, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1947003, name: "SB123", cpu: "Intel Xeon Gold 6226R", cpu_benchmark: 30234, cpu_count: 32,
    ram_size: 256, ram: ["8x32GB DDR4 ECC"], hdd_count: 4, hdd_size: 1920, hdd_text: "4x 1.92TB NVMe SSD",
    disk_type: "NVMe", datacenter: "NBG1-DC3", price: 148, setup_price: 0, fixed_price: false,
    next_reduce: 12, next_reduce_timestamp: futureTimestamp(12), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // AMD EPYC
  {
    id: 1948001, name: "SB131", cpu: "AMD EPYC 7502P", cpu_benchmark: 47234, cpu_count: 32,
    ram_size: 256, ram: ["8x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 135, setup_price: 0, fixed_price: false,
    next_reduce: 4, next_reduce_timestamp: futureTimestamp(4), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1948002, name: "SB132", cpu: "AMD EPYC 7502P", cpu_benchmark: 47198, cpu_count: 32,
    ram_size: 512, ram: ["16x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "HEL1-DC4", price: 165, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1948003, name: "SB133", cpu: "AMD EPYC 7443P", cpu_benchmark: 52345, cpu_count: 24,
    ram_size: 256, ram: ["8x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1920, hdd_text: "2x 1.92TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC18", price: 145, setup_price: 0, fixed_price: false,
    next_reduce: 6, next_reduce_timestamp: futureTimestamp(6), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1948004, name: "SB134", cpu: "AMD EPYC 7543P", cpu_benchmark: 56789, cpu_count: 32,
    ram_size: 512, ram: ["16x32GB DDR4 ECC"], hdd_count: 4, hdd_size: 3840, hdd_text: "4x 3.84TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 215, setup_price: 0, fixed_price: false,
    next_reduce: 11, next_reduce_timestamp: futureTimestamp(11), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1948005, name: "SB135", cpu: "AMD EPYC 9354P", cpu_benchmark: 72345, cpu_count: 32,
    ram_size: 512, ram: ["16x32GB DDR5 ECC"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 295, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // GPU servers
  {
    id: 1949001, name: "GPU1", cpu: "AMD Ryzen 9 5950X", cpu_benchmark: 38876, cpu_count: 16,
    ram_size: 128, ram: ["4x32GB DDR4"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 185, setup_price: 0, fixed_price: false,
    next_reduce: 3, next_reduce_timestamp: futureTimestamp(3), ecc: false, gpu: true, inic: false, ipv4: true,
    specials: ["GPU", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1949002, name: "GPU2", cpu: "Intel Xeon Gold 6226R", cpu_benchmark: 30345, cpu_count: 32,
    ram_size: 256, ram: ["8x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC18", price: 345, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: true, inic: true, ipv4: true,
    specials: ["ECC", "GPU", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1949003, name: "GPU3", cpu: "AMD EPYC 7543P", cpu_benchmark: 56234, cpu_count: 32,
    ram_size: 512, ram: ["16x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 575, setup_price: 0, fixed_price: false,
    next_reduce: 8, next_reduce_timestamp: futureTimestamp(8), ecc: true, gpu: true, inic: true, ipv4: true,
    specials: ["ECC", "GPU", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1949004, name: "GPU4", cpu: "AMD EPYC 9354P", cpu_benchmark: 71234, cpu_count: 32,
    ram_size: 768, ram: ["24x32GB DDR5 ECC"], hdd_count: 4, hdd_size: 3840, hdd_text: "4x 3.84TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 855, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: true, inic: true, ipv4: true,
    specials: ["ECC", "GPU", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // Storage servers (lots of HDD)
  {
    id: 1950001, name: "SX291", cpu: "Intel Core i7-6700", cpu_benchmark: 9198, cpu_count: 4,
    ram_size: 32, ram: ["2x16GB DDR4"], hdd_count: 8, hdd_size: 8192, hdd_text: "8x 8TB HDD",
    disk_type: "HDD", datacenter: "FSN1-DC14", price: 48, setup_price: 0, fixed_price: false,
    next_reduce: 5, next_reduce_timestamp: futureTimestamp(5), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1950002, name: "SX292", cpu: "Intel Core i7-8700", cpu_benchmark: 12987, cpu_count: 6,
    ram_size: 64, ram: ["2x32GB DDR4"], hdd_count: 10, hdd_size: 16384, hdd_text: "10x 16TB HDD",
    disk_type: "HDD", datacenter: "HEL1-DC2", price: 85, setup_price: 0, fixed_price: false,
    next_reduce: 2, next_reduce_timestamp: futureTimestamp(2), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1950003, name: "SX293", cpu: "AMD Ryzen 5 3600", cpu_benchmark: 13456, cpu_count: 6,
    ram_size: 64, ram: ["2x32GB DDR4 ECC"], hdd_count: 12, hdd_size: 18432, hdd_text: "12x 18TB HDD",
    disk_type: "HDD", datacenter: "FSN1-DC18", price: 115, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // More variety
  {
    id: 1951001, name: "SB141", cpu: "Intel Xeon W-2145", cpu_benchmark: 17654, cpu_count: 8,
    ram_size: 128, ram: ["8x16GB DDR4 ECC"], hdd_count: 2, hdd_size: 512, hdd_text: "2x 512GB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 58, setup_price: 0, fixed_price: false,
    next_reduce: 7, next_reduce_timestamp: futureTimestamp(7), ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1951002, name: "SB142", cpu: "Intel Xeon W-2295", cpu_benchmark: 28765, cpu_count: 18,
    ram_size: 256, ram: ["8x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1920, hdd_text: "2x 1.92TB NVMe SSD",
    disk_type: "NVMe", datacenter: "NBG1-DC3", price: 95, setup_price: 27.17, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1951003, name: "SB143", cpu: "AMD Ryzen 7 5800X", cpu_benchmark: 25678, cpu_count: 8,
    ram_size: 64, ram: ["2x32GB DDR4"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "HEL1-DC2", price: 52, setup_price: 0, fixed_price: false,
    next_reduce: 3, next_reduce_timestamp: futureTimestamp(3), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1951004, name: "SB144", cpu: "Intel Xeon E-2388G", cpu_benchmark: 21234, cpu_count: 8,
    ram_size: 128, ram: ["4x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD + 2x 4TB HDD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 68, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1951005, name: "SB145", cpu: "AMD Ryzen 9 7950X", cpu_benchmark: 52345, cpu_count: 16,
    ram_size: 128, ram: ["2x64GB DDR5"], hdd_count: 2, hdd_size: 2048, hdd_text: "2x 2TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 98, setup_price: 0, fixed_price: false,
    next_reduce: 9, next_reduce_timestamp: futureTimestamp(9), ecc: false, gpu: false, inic: false, ipv4: true,
    specials: ["IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // High-end EPYC
  {
    id: 1952001, name: "SB151", cpu: "AMD EPYC 7702P", cpu_benchmark: 62345, cpu_count: 64,
    ram_size: 512, ram: ["16x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 3840, hdd_text: "2x 3.84TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 245, setup_price: 0, fixed_price: false,
    next_reduce: 5, next_reduce_timestamp: futureTimestamp(5), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1952002, name: "SB152", cpu: "AMD EPYC 7763", cpu_benchmark: 78901, cpu_count: 64,
    ram_size: 512, ram: ["16x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 3840, hdd_text: "2x 3.84TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC18", price: 325, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1952003, name: "SB153", cpu: "AMD EPYC 9654P", cpu_benchmark: 95678, cpu_count: 96,
    ram_size: 768, ram: ["24x32GB DDR5 ECC"], hdd_count: 4, hdd_size: 3840, hdd_text: "4x 3.84TB NVMe SSD",
    disk_type: "NVMe", datacenter: "FSN1-DC14", price: 495, setup_price: 0, fixed_price: false,
    next_reduce: 14, next_reduce_timestamp: futureTimestamp(14), ecc: true, gpu: false, inic: true, ipv4: true,
    specials: ["ECC", "iNIC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  // Mixed / edge cases
  {
    id: 1953001, name: "SB161", cpu: "Intel Xeon E-2136", cpu_benchmark: 12789, cpu_count: 6,
    ram_size: 64, ram: ["4x16GB DDR4 ECC"], hdd_count: 2, hdd_size: 512, hdd_text: "2x 512GB SATA SSD",
    disk_type: "SATA SSD", datacenter: "HEL1-DC4", price: 40, setup_price: 0, fixed_price: false,
    next_reduce: 1, next_reduce_timestamp: futureTimestamp(1), ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
  {
    id: 1953002, name: "SB162", cpu: "Intel Xeon E-2288G", cpu_benchmark: 18234, cpu_count: 8,
    ram_size: 128, ram: ["4x32GB DDR4 ECC"], hdd_count: 2, hdd_size: 1024, hdd_text: "2x 1TB NVMe SSD",
    disk_type: "NVMe", datacenter: "NBG1-DC3", price: 72, setup_price: 0, fixed_price: true,
    next_reduce: 0, next_reduce_timestamp: 0, ecc: true, gpu: false, inic: false, ipv4: true,
    specials: ["ECC", "IPv4"], traffic: "unlimited", bandwidth: 1000,
  },
];

export function getAuctionServers(): AuctionServer[] {
  return servers;
}

export function getAuctionServerById(id: number): AuctionServer | undefined {
  return servers.find((s) => s.id === id);
}
