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
      "/uploads/iigproject/ortachala/1.jpg",
      "/uploads/iigproject/ortachala/2.jpg",
      "/uploads/iigproject/ortachala/3.jpg",
      "/uploads/iigproject/ortachala/4.jpg",
      "/uploads/iigproject/ortachala/5.jpg",
      "/uploads/iigproject/ortachala/6.jpg"
    ],
    thumbnail: "/uploads/iigproject/ortachala/thumb.jpg"
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
      "/uploads/iigproject/lisi/1.jpg",
      "/uploads/iigproject/lisi/2.jpg",
      "/uploads/iigproject/lisi/3.jpg"
    ],
    thumbnail: "/uploads/iigproject/lisi/thumb.jpg"
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
      "/uploads/iigproject/shindisi/1.jpg"
    ],
    thumbnail: "/uploads/iigproject/shindisi/thumb.jpg"
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
      "/uploads/iigproject/oval/1.jpg",
      "/uploads/iigproject/oval/2.jpg",
      "/uploads/iigproject/oval/3.jpg",
      "/uploads/iigproject/oval/4.jpg",
      "/uploads/iigproject/oval/5.jpg",
      "/uploads/iigproject/oval/6.jpg"
    ],
    thumbnail: "/uploads/iigproject/oval/thumb.jpg"
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
      "/uploads/iigproject/parallel/1.jpg",
      "/uploads/iigproject/parallel/2.jpg",
      "/uploads/iigproject/parallel/3.jpg",
      "/uploads/iigproject/parallel/4.jpg",
      "/uploads/iigproject/parallel/5.jpg",
      "/uploads/iigproject/parallel/6.jpg",
      "/uploads/iigproject/parallel/7.jpg",
      "/uploads/iigproject/parallel/8.jpg"
    ],
    thumbnail: "/uploads/iigproject/parallel/thumb.jpg"
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
      "/uploads/iigproject/cube/1.jpg",
      "/uploads/iigproject/cube/2.jpg",
      "/uploads/iigproject/cube/3.jpg",
      "/uploads/iigproject/cube/4.jpg",
      "/uploads/iigproject/cube/5.jpg",
      "/uploads/iigproject/cube/6.jpg",
      "/uploads/iigproject/cube/7.jpg",
      "/uploads/iigproject/cube/8.jpg",
      "/uploads/iigproject/cube/9.jpg"
    ],
    thumbnail: "/uploads/iigproject/cube/thumb.jpg"
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
      "/uploads/iigproject/forest-beach/1.jpg",
      "/uploads/iigproject/forest-beach/2.jpg",
      "/uploads/iigproject/forest-beach/4.jpg",
      "/uploads/iigproject/forest-beach/5.jpg",
      "/uploads/iigproject/forest-beach/6.jpg",
      "/uploads/iigproject/forest-beach/7.jpg",
      "/uploads/iigproject/forest-beach/8.jpg",
      "/uploads/iigproject/forest-beach/9.jpg",
      "/uploads/iigproject/forest-beach/10.jpg",
      "/uploads/iigproject/forest-beach/11.jpg",
      "/uploads/iigproject/forest-beach/12.jpg",
      "/uploads/iigproject/forest-beach/13.jpg",
      "/uploads/iigproject/forest-beach/14.jpg"
    ],
    thumbnail: "/uploads/iigproject/forest-beach/thumb.jpg"
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
      "/uploads/iigproject/krtsanisi-resort/1.jpg",
      "/uploads/iigproject/krtsanisi-resort/2.jpg",
      "/uploads/iigproject/krtsanisi-resort/3.jpg",
      "/uploads/iigproject/krtsanisi-resort/4.jpg",
      "/uploads/iigproject/krtsanisi-resort/5.jpg",
      "/uploads/iigproject/krtsanisi-resort/6.jpg"
    ],
    thumbnail: "/uploads/iigproject/krtsanisi-resort/thumb.jpg"
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
      "/uploads/iigproject/hisni/1.jpg",
      "/uploads/iigproject/hisni/2.jpg",
      "/uploads/iigproject/hisni/3.jpg",
      "/uploads/iigproject/hisni/4.jpg",
      "/uploads/iigproject/hisni/5.jpg",
      "/uploads/iigproject/hisni/6.jpg",
      "/uploads/iigproject/hisni/7.jpg"
    ],
    thumbnail: "/uploads/iigproject/hisni/thumb.jpg"
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
      "/uploads/iigproject/sakeni/1.jpg",
      "/uploads/iigproject/sakeni/2.jpg",
      "/uploads/iigproject/sakeni/3.jpg",
      "/uploads/iigproject/sakeni/4.jpg",
      "/uploads/iigproject/sakeni/5.jpg",
      "/uploads/iigproject/sakeni/6.jpg",
      "/uploads/iigproject/sakeni/7.jpg",
      "/uploads/iigproject/sakeni/8.jpg",
      "/uploads/iigproject/sakeni/9.jpg",
      "/uploads/iigproject/sakeni/10.jpg",
      "/uploads/iigproject/sakeni/11.jpg",
      "/uploads/iigproject/sakeni/12.jpg"
    ],
    thumbnail: "/uploads/iigproject/sakeni/thumb.jpg"
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
      "/uploads/iigproject/gardani/1.jpg",
      "/uploads/iigproject/gardani/2.jpg",
      "/uploads/iigproject/gardani/3.jpg",
      "/uploads/iigproject/gardani/4.jpg",
      "/uploads/iigproject/gardani/5.jpg",
      "/uploads/iigproject/gardani/6.jpg"
    ],
    thumbnail: "/uploads/iigproject/gardani/thumb.jpg"
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
      "/uploads/iigproject/neo/1.jpg",
      "/uploads/iigproject/neo/2.jpg",
      "/uploads/iigproject/neo/3.jpg",
      "/uploads/iigproject/neo/4.jpg",
      "/uploads/iigproject/neo/5.jpg",
      "/uploads/iigproject/neo/6.jpg",
      "/uploads/iigproject/neo/7.jpg"
    ],
    thumbnail: "/uploads/iigproject/neo/thumb.jpg"
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
      "/uploads/iigproject/marina-club/1.jpg",
      "/uploads/iigproject/marina-club/2.jpg",
      "/uploads/iigproject/marina-club/3.jpg",
      "/uploads/iigproject/marina-club/4.jpg",
      "/uploads/iigproject/marina-club/5.jpg",
      "/uploads/iigproject/marina-club/6.jpg",
      "/uploads/iigproject/marina-club/7.jpg",
      "/uploads/iigproject/marina-club/8.jpg",
      "/uploads/iigproject/marina-club/9.jpg",
      "/uploads/iigproject/marina-club/10.jpg",
      "/uploads/iigproject/marina-club/11.jpg",
      "/uploads/iigproject/marina-club/12.jpg",
      "/uploads/iigproject/marina-club/13.jpg",
      "/uploads/iigproject/marina-club/14.jpg",
      "/uploads/iigproject/marina-club/15.jpg"
    ],
    thumbnail: "/uploads/iigproject/marina-club/thumb.jpg"
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
      "/uploads/iigproject/green-gardens/1.jpg",
      "/uploads/iigproject/green-gardens/2.jpg",
      "/uploads/iigproject/green-gardens/3.jpg",
      "/uploads/iigproject/green-gardens/4.jpg",
      "/uploads/iigproject/green-gardens/5.jpg",
      "/uploads/iigproject/green-gardens/7.jpg",
      "/uploads/iigproject/green-gardens/8.jpg",
      "/uploads/iigproject/green-gardens/9.jpg",
      "/uploads/iigproject/green-gardens/10.jpg",
      "/uploads/iigproject/green-gardens/11.jpg",
      "/uploads/iigproject/green-gardens/12.jpg",
      "/uploads/iigproject/green-gardens/13.jpg",
      "/uploads/iigproject/green-gardens/14.jpg",
      "/uploads/iigproject/green-gardens/15.jpg",
      "/uploads/iigproject/green-gardens/16.jpg",
      "/uploads/iigproject/green-gardens/17.jpg",
      "/uploads/iigproject/green-gardens/18.jpg",
      "/uploads/iigproject/green-gardens/19.jpg",
      "/uploads/iigproject/green-gardens/20.jpg",
      "/uploads/iigproject/green-gardens/21.jpg",
      "/uploads/iigproject/green-gardens/22.jpg",
      "/uploads/iigproject/green-gardens/23.jpg",
      "/uploads/iigproject/green-gardens/24.jpg",
      "/uploads/iigproject/green-gardens/25.jpg",
      "/uploads/iigproject/green-gardens/26.jpg",
      "/uploads/iigproject/green-gardens/27.jpg",
      "/uploads/iigproject/green-gardens/28.jpg",
      "/uploads/iigproject/green-gardens/29.jpg",
      "/uploads/iigproject/green-gardens/30.jpg"
    ],
    thumbnail: "/uploads/iigproject/green-gardens/thumb.jpg"
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
      "/uploads/iigproject/oxy/1.jpg",
      "/uploads/iigproject/oxy/2.jpg",
      "/uploads/iigproject/oxy/3.jpg",
      "/uploads/iigproject/oxy/4.jpg",
      "/uploads/iigproject/oxy/5.jpg",
      "/uploads/iigproject/oxy/6.jpg"
    ],
    thumbnail: "/uploads/iigproject/oxy/thumb.jpg"
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
      "/uploads/iigproject/kavtaradze/1.jpg",
      "/uploads/iigproject/kavtaradze/2.jpg",
      "/uploads/iigproject/kavtaradze/3.jpg",
      "/uploads/iigproject/kavtaradze/4.jpg",
      "/uploads/iigproject/kavtaradze/5.jpg",
      "/uploads/iigproject/kavtaradze/6.jpg",
      "/uploads/iigproject/kavtaradze/7.jpg",
      "/uploads/iigproject/kavtaradze/8.jpg",
      "/uploads/iigproject/kavtaradze/9.jpg",
      "/uploads/iigproject/kavtaradze/10.jpg",
      "/uploads/iigproject/kavtaradze/11.jpg",
      "/uploads/iigproject/kavtaradze/12.jpg",
      "/uploads/iigproject/kavtaradze/13.jpg",
      "/uploads/iigproject/kavtaradze/14.jpg",
      "/uploads/iigproject/kavtaradze/15.jpg"
    ],
    thumbnail: "/uploads/iigproject/kavtaradze/thumb.jpg"
  }
];

