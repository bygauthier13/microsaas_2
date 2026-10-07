/**
 * FICTIONAL demo watchlist. Every person and company below is invented for product
 * demonstrations; any resemblance to real persons is coincidental. In production,
 * screening runs against OpenSanctions (official sanctions lists, PEPs, crime lists).
 */
export const DEMO_DATASETS: Record<string, string> = {
  demo_eu_fsf: "DEMO · EU financial sanctions (fictional)",
  demo_us_ofac: "DEMO · US OFAC SDN (fictional)",
  demo_gb_ofsi: "DEMO · UK OFSI consolidated (fictional)",
  demo_peps: "DEMO · PEP register (fictional)",
  demo_crime: "DEMO · Wanted persons (fictional)",
};

export type DemoEntry = {
  id: string;
  name: string;
  aliases?: string[];
  schema: "Person" | "Company";
  birthDate?: string;
  countries: string[];
  datasets: (keyof typeof DEMO_DATASETS)[];
  topics: string[];
  note: string;
};

export const DEMO_WATCHLIST: DemoEntry[] = [
  { id: "demo-p-001", name: "Dmitri Valerievich Orlansky", aliases: ["Dmitry Orlansky"], schema: "Person", birthDate: "1968-03-14", countries: ["RU"], datasets: ["demo_eu_fsf", "demo_gb_ofsi", "demo_us_ofac"], topics: ["sanction"], note: "Fictional businessman; asset freeze (demo)." },
  { id: "demo-p-002", name: "Arkady Semyonovich Belozersky", schema: "Person", birthDate: "1959-11-02", countries: ["RU"], datasets: ["demo_eu_fsf", "demo_us_ofac"], topics: ["sanction"], note: "Fictional; asset freeze (demo)." },
  { id: "demo-p-003", name: "Ruslan Tagirovich Khamzaev", schema: "Person", birthDate: "1974-06-21", countries: ["RU"], datasets: ["demo_us_ofac"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-p-004", name: "Viktor Pavlovich Lebedinsky", schema: "Person", birthDate: "1962-01-30", countries: ["BY"], datasets: ["demo_eu_fsf"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-p-005", name: "Oleg Borisovich Varshavin", schema: "Person", birthDate: "1971-09-09", countries: ["RU"], datasets: ["demo_gb_ofsi"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-p-006", name: "Farid Nasser Al-Qudsi", schema: "Person", birthDate: "1966-05-17", countries: ["SY"], datasets: ["demo_eu_fsf", "demo_us_ofac"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-p-007", name: "Hossein Rahmanzadeh Tabrizi", schema: "Person", birthDate: "1958-12-01", countries: ["IR"], datasets: ["demo_us_ofac"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-p-008", name: "Marat Ilyasovich Zhelkovsky", schema: "Person", birthDate: "1980-04-04", countries: ["RU"], datasets: ["demo_eu_fsf"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-c-001", name: "Novaya Zarya Holding Limited", aliases: ["Novaya Zarya Holdings"], schema: "Company", countries: ["CY", "RU"], datasets: ["demo_eu_fsf", "demo_us_ofac"], topics: ["sanction"], note: "Fictional holding company (demo)." },
  { id: "demo-c-002", name: "Baltic Crest Shipping LLC", schema: "Company", countries: ["RU"], datasets: ["demo_eu_fsf"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-c-003", name: "Polar Meridian Trading FZE", schema: "Company", countries: ["AE"], datasets: ["demo_us_ofac"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-c-004", name: "Aurum Steppe Capital AG", schema: "Company", countries: ["CH"], datasets: ["demo_gb_ofsi"], topics: ["sanction"], note: "Fictional (demo)." },
  { id: "demo-c-005", name: "Kestrel Bay Ventures Inc", schema: "Company", countries: ["PA"], datasets: ["demo_crime"], topics: ["crime"], note: "Fictional (demo)." },
  { id: "demo-pep-001", name: "Tomasz Wierzbicki-Lange", schema: "Person", birthDate: "1975-03-03", countries: ["PL"], datasets: ["demo_peps"], topics: ["role.pep"], note: "Fictional: CEO of a state-owned energy company." },
  { id: "demo-pep-002", name: "Amara Okonkwo-Bello", schema: "Person", birthDate: "1965-02-11", countries: ["NG"], datasets: ["demo_peps"], topics: ["role.pep"], note: "Fictional: former minister." },
  { id: "demo-pep-003", name: "Kwesi Mensah-Darko", schema: "Person", birthDate: "1972-08-08", countries: ["GH"], datasets: ["demo_peps"], topics: ["role.pep"], note: "Fictional: member of parliament." },
  { id: "demo-pep-004", name: "Elena Vasquez-Moreira", schema: "Person", birthDate: "1969-10-23", countries: ["VE"], datasets: ["demo_peps"], topics: ["role.pep"], note: "Fictional: central bank board member." },
  { id: "demo-pep-005", name: "Omar Haddad Al-Sayegh", schema: "Person", birthDate: "1961-06-30", countries: ["LB"], datasets: ["demo_peps"], topics: ["role.pep"], note: "Fictional: former deputy prime minister." },
  { id: "demo-pep-006", name: "Natalia Chernova-Voss", schema: "Person", birthDate: "1977-01-19", countries: ["KZ"], datasets: ["demo_peps"], topics: ["role.pep"], note: "Fictional: deputy minister of finance." },
  { id: "demo-pep-007", name: "Giorgos Antoniadis-Kral", schema: "Person", birthDate: "1960-09-14", countries: ["CY"], datasets: ["demo_peps"], topics: ["role.pep"], note: "Fictional: former minister." },
  { id: "demo-x-001", name: "Marco Sabatini-Rocca", schema: "Person", birthDate: "1979-05-25", countries: ["IT"], datasets: ["demo_crime"], topics: ["crime"], note: "Fictional: wanted for fraud (demo)." },
  { id: "demo-x-002", name: "Juan Esteban Calderón Ruiz", schema: "Person", birthDate: "1976-02-02", countries: ["CO"], datasets: ["demo_crime"], topics: ["crime"], note: "Fictional (demo)." },
];
