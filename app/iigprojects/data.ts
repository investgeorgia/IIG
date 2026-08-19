export interface Project {
  id: number;
  name: string;
  location: string;
  startingPrice: string;
  type: string;
  paymentPlan: string;
  size: string;
  roi: string;
  completion: string;
  images: string[];
  thumbnail: string;
}

export const projectsData: Project[] = [
  {
    id: 1,
    name: "Ortachala",
    location: "Tbilisi",
    startingPrice: "$112,000",
    type: "1, 2 & 3 BR Apartments",
    paymentPlan: "15 / 10 / 75",
    size: "From 48.2 m²",
    roi: "10%",
    completion: "Q2 2028",
    images: [
      "media/ortachala/1.jpg",
      "media/ortachala/2.jpg",
      "media/ortachala/3.jpg",
      "media/ortachala/4.jpg",
      "media/ortachala/5.jpg",
      "media/ortachala/6.jpg"
    ],
    thumbnail: "media/ortachala/thumb.jpg"
  },
  {
    id: 2,
    name: "Lisi",
    location: "Tbilisi",
    startingPrice: "$108,000",
    type: "Villa & Land Plots",
    paymentPlan: "25 / 25 / 50",
    size: "From 600+ m²",
    roi: "10",
    completion: "Q4 2026",
    images: [
      "media/lisi/1.jpg",
      "media/lisi/2.jpg",
      "media/lisi/3.jpg"
    ],
    thumbnail: "media/lisi/thumb.jpg"
  },
  {
    id: 3,
    name: "Shindisi",
    location: "Tbilisi",
    startingPrice: "$139,200",
    type: "Villa & Land Plots",
    paymentPlan: "25 / 25 / 50",
    size: "From 600+ m²",
    roi: "10",
    completion: "Q4 2026",
    images: [
      "media/shindisi/1.jpg"
    ],
    thumbnail: "media/shindisi/thumb.jpg"
  },
  {
    id: 4,
    name: "Oval",
    location: "Batumi",
    startingPrice: "$115,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "15/ 20 / 65",
    size: "From 36 m²",
    roi: "12%",
    completion: "Q4 2027",
    images: [
      "media/oval/1.jpg",
      "media/oval/2.jpg",
      "media/oval/3.jpg",
      "media/oval/4.jpg",
      "media/oval/5.jpg",
      "media/oval/6.jpg"
    ],
    thumbnail: "media/oval/thumb.jpg"
  },
  {
    id: 5,
    name: "Parallel",
    location: "Batumi",
    startingPrice: "$63,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "15 / 20 / 65",
    size: "From 32 m²",
    roi: "10%",
    completion: "Q2 2028",
    images: [
      "media/parallel/1.jpg",
      "media/parallel/2.jpg",
      "media/parallel/3.jpg",
      "media/parallel/4.jpg",
      "media/parallel/5.jpg",
      "media/parallel/6.jpg",
      "media/parallel/7.jpg",
      "media/parallel/8.jpg"
    ],
    thumbnail: "media/parallel/thumb.jpg"
  },
  {
    id: 6,
    name: "Cube",
    location: "Batumi",
    startingPrice: "$154,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "15 / 65 / 20",
    size: "From 51 m²",
    roi: "12%",
    completion: "Q4 2027",
    images: [
      "media/cube/1.jpg",
      "media/cube/2.jpg",
      "media/cube/3.jpg",
      "media/cube/4.jpg",
      "media/cube/5.jpg",
      "media/cube/6.jpg",
      "media/cube/7.jpg",
      "media/cube/8.jpg",
      "media/cube/9.jpg"
    ],
    thumbnail: "media/cube/thumb.jpg"
  },
  {
    id: 7,
    name: "Forest Beach",
    location: "Shekvetili",
    startingPrice: "$84,000",
    type: "Studio, 1, 2 & 3 BR Apartments",
    paymentPlan: "20% / 80",
    size: "From 27.5 m²",
    roi: "14%",
    completion: "Q3 2028",
    images: [
      "media/forest-beach/1.jpg",
      "media/forest-beach/2.jpg",
      "media/forest-beach/4.jpg",
      "media/forest-beach/5.jpg",
      "media/forest-beach/6.jpg",
      "media/forest-beach/7.jpg",
      "media/forest-beach/8.jpg",
      "media/forest-beach/9.jpg",
      "media/forest-beach/10.jpg",
      "media/forest-beach/11.jpg",
      "media/forest-beach/12.jpg",
      "media/forest-beach/13.jpg",
      "media/forest-beach/14.jpg"
    ],
    thumbnail: "media/forest-beach/thumb.jpg"
  },
  {
    id: 8,
    name: "Krtsanisi Resort",
    location: "Tbilisi",
    startingPrice: "$138,000",
    type: "1, 2 & 3 BR Apartments",
    paymentPlan: "20/ 80",
    size: "From 43.7 m²",
    roi: "12%",
    completion: "Q1 2027",
    images: [
      "media/krtsanisi-resort/1.jpg",
      "media/krtsanisi-resort/2.jpg",
      "media/krtsanisi-resort/3.jpg",
      "media/krtsanisi-resort/4.jpg",
      "media/krtsanisi-resort/5.jpg",
      "media/krtsanisi-resort/6.jpg"
    ],
    thumbnail: "media/krtsanisi-resort/thumb.jpg"
  },
  {
    id: 9,
    name: "Hisni",
    location: "Tbilisi",
    startingPrice: "$82,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "15/ 5 / 80",
    size: "From 34.11 m²",
    roi: "12%",
    completion: "Q4 2028",
    images: [
      "media/hisni/1.jpg",
      "media/hisni/2.jpg",
      "media/hisni/3.jpg",
      "media/hisni/4.jpg",
      "media/hisni/5.jpg",
      "media/hisni/6.jpg",
      "media/hisni/7.jpg"
    ],
    thumbnail: "media/hisni/thumb.jpg"
  },
  {
    id: 10,
    name: "Sakeni",
    location: "Tbilisi",
    startingPrice: "$125,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "15 / 5 / 80",
    size: "From 34.11 m²",
    roi: "12%",
    completion: "Q4 2026",
    images: [
      "media/sakeni/1.jpg",
      "media/sakeni/2.jpg",
      "media/sakeni/3.jpg",
      "media/sakeni/4.jpg",
      "media/sakeni/5.jpg",
      "media/sakeni/6.jpg",
      "media/sakeni/7.jpg",
      "media/sakeni/8.jpg",
      "media/sakeni/9.jpg",
      "media/sakeni/10.jpg",
      "media/sakeni/11.jpg",
      "media/sakeni/12.jpg"
    ],
    thumbnail: "media/sakeni/thumb.jpg"
  },
  {
    id: 11,
    name: "Gardani",
    location: "Tbilisi",
    startingPrice: "$80,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "15/ 25 / 60",
    size: "From 38.26 m²",
    roi: "12%",
    completion: "Q4 2029",
    images: [
      "media/gardani/1.jpg",
      "media/gardani/2.jpg",
      "media/gardani/3.jpg",
      "media/gardani/4.jpg",
      "media/gardani/5.jpg",
      "media/gardani/6.jpg"
    ],
    thumbnail: "media/gardani/thumb.jpg"
  },
  {
    id: 12,
    name: "NEO – New Gudauri Ski Resort",
    location: "Gudauri",
    startingPrice: "$80,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "30 / 70",
    size: "From 31.1 m²",
    roi: "14%",
    completion: "Ready",
    images: [
      "media/neo/1.jpg",
      "media/neo/2.jpg",
      "media/neo/3.jpg",
      "media/neo/4.jpg",
      "media/neo/5.jpg",
      "media/neo/6.jpg",
      "media/neo/7.jpg"
    ],
    thumbnail: "media/neo/thumb.jpg"
  },
  {
    id: 13,
    name: "Marina Club",
    location: "Batumi",
    startingPrice: "$80,100",
    type: "1 & 2 BR Apartments",
    paymentPlan: "Not specified",
    size: "From 49.10 m²",
    roi: "10%",
    completion: "Ready",
    images: [
      "media/marina-club/1.jpg",
      "media/marina-club/2.jpg",
      "media/marina-club/3.jpg",
      "media/marina-club/4.jpg",
      "media/marina-club/5.jpg",
      "media/marina-club/6.jpg",
      "media/marina-club/7.jpg",
      "media/marina-club/8.jpg",
      "media/marina-club/9.jpg",
      "media/marina-club/10.jpg",
      "media/marina-club/11.jpg",
      "media/marina-club/12.jpg",
      "media/marina-club/13.jpg",
      "media/marina-club/14.jpg",
      "media/marina-club/15.jpg"
    ],
    thumbnail: "media/marina-club/thumb.jpg"
  },
  {
    id: 14,
    name: "Green Gardens",
    location: "Batumi",
    startingPrice: "$280,000",
    type: "Villas",
    paymentPlan: "Not specified",
    size: "From 218 m²",
    roi: "10%",
    completion: "Ready",
    images: [
      "media/green-gardens/1.jpg",
      "media/green-gardens/2.jpg",
      "media/green-gardens/3.jpg",
      "media/green-gardens/4.jpg",
      "media/green-gardens/5.jpg",
      "media/green-gardens/7.jpg",
      "media/green-gardens/8.jpg",
      "media/green-gardens/9.jpg",
      "media/green-gardens/10.jpg",
      "media/green-gardens/11.jpg",
      "media/green-gardens/12.jpg",
      "media/green-gardens/13.jpg",
      "media/green-gardens/14.jpg",
      "media/green-gardens/15.jpg",
      "media/green-gardens/16.jpg",
      "media/green-gardens/17.jpg",
      "media/green-gardens/18.jpg",
      "media/green-gardens/19.jpg",
      "media/green-gardens/20.jpg",
      "media/green-gardens/21.jpg",
      "media/green-gardens/22.jpg",
      "media/green-gardens/23.jpg",
      "media/green-gardens/24.jpg",
      "media/green-gardens/25.jpg",
      "media/green-gardens/26.jpg",
      "media/green-gardens/27.jpg",
      "media/green-gardens/28.jpg",
      "media/green-gardens/29.jpg",
      "media/green-gardens/30.jpg"
    ],
    thumbnail: "media/green-gardens/thumb.jpg"
  },
  {
    id: 15,
    name: "Oxy",
    location: "Batumi",
    startingPrice: "$43,000",
    type: "Studio, 1 & 2 BR Apartments",
    paymentPlan: "20 / 80",
    size: "From 30.08 m²",
    roi: "10%",
    completion: "December 2028",
    images: [
      "media/oxy/1.jpg",
      "media/oxy/2.jpg",
      "media/oxy/3.jpg",
      "media/oxy/4.jpg",
      "media/oxy/5.jpg",
      "media/oxy/6.jpg"
    ],
    thumbnail: "media/oxy/thumb.jpg"
  },
  {
    id: 16,
    name: "Kavataradze",
    location: "Tbilisi",
    startingPrice: "$140,000",
    type: "2-4 Bedroom Apartments",
    paymentPlan: "-",
    size: "From 54.2 m²",
    roi: "12%",
    completion: "Q2 2027",
    images: [
      "media/kavtaradze/1.jpg",
      "media/kavtaradze/2.jpg",
      "media/kavtaradze/3.jpg",
      "media/kavtaradze/4.jpg",
      "media/kavtaradze/5.jpg",
      "media/kavtaradze/6.jpg",
      "media/kavtaradze/7.jpg",
      "media/kavtaradze/8.jpg",
      "media/kavtaradze/9.jpg",
      "media/kavtaradze/10.jpg",
      "media/kavtaradze/11.jpg",
      "media/kavtaradze/12.jpg",
      "media/kavtaradze/13.jpg",
      "media/kavtaradze/14.jpg",
      "media/kavtaradze/15.jpg"
    ],
    thumbnail: "media/kavtaradze/thumb.jpg"
  }
];

