// Comprehensive city/airport name → IATA code mapping
const AIRPORT_MAP = {
  // US Cities
  "los angeles": "LAX", "lax": "LAX",
  "new york": "JFK", "new york city": "JFK", "nyc": "JFK", "jfk": "JFK",
  "new york newark": "EWR", "newark": "EWR",
  "chicago": "ORD", "ord": "ORD",
  "houston": "IAH", "iah": "IAH",
  "phoenix": "PHX", "phx": "PHX",
  "philadelphia": "PHL", "phl": "PHL",
  "san antonio": "SAT", "sat": "SAT",
  "san diego": "SAN", "san": "SAN",
  "dallas": "DFW", "dfw": "DFW", "dallas fort worth": "DFW",
  "san jose": "SJC", "sjc": "SJC",
  "san francisco": "SFO", "sfo": "SFO",
  "austin": "AUS", "aus": "AUS",
  "seattle": "SEA", "sea": "SEA",
  "denver": "DEN", "den": "DEN",
  "boston": "BOS", "bos": "BOS",
  "miami": "MIA", "mia": "MIA",
  "atlanta": "ATL", "atl": "ATL",
  "las vegas": "LAS", "las": "LAS",
  "portland": "PDX", "pdx": "PDX",
  "minneapolis": "MSP", "msp": "MSP",
  "detroit": "DTW", "dtw": "DTW",
  "baltimore": "BWI", "bwi": "BWI",
  "washington": "DCA", "dc": "DCA", "washington dc": "DCA", "dca": "DCA",
  "orlando": "MCO", "mco": "MCO",
  "charlotte": "CLT", "clt": "CLT",
  "nashville": "BNA", "bna": "BNA",
  "raleigh": "RDU", "rdu": "RDU",
  "salt lake city": "SLC", "slc": "SLC",
  "pittsburgh": "PIT", "pit": "PIT",
  "cleveland": "CLE", "cle": "CLE",
  "cincinnati": "CVG", "cvg": "CVG",
  "kansas city": "MCI", "mci": "MCI",
  "tampa": "TPA", "tpa": "TPA",
  "new orleans": "MSY", "msy": "MSY",
  "st louis": "STL", "stl": "STL",
  "indianapolis": "IND", "ind": "IND",
  "columbus": "CMH", "cmh": "CMH",
  "memphis": "MEM", "mem": "MEM",
  "jacksonville": "JAX", "jax": "JAX",
  "albuquerque": "ABQ", "abq": "ABQ",
  "tucson": "TUS", "tus": "TUS",
  "fresno": "FAT", "fat": "FAT",
  "sacramento": "SMF", "smf": "SMF",
  "honolulu": "HNL", "hnl": "HNL",
  "anchorage": "ANC", "anc": "ANC",

  // Canada
  "toronto": "YYZ", "yyz": "YYZ",
  "vancouver": "YVR", "yvr": "YVR",
  "montreal": "YUL", "yul": "YUL",
  "calgary": "YYC", "yyc": "YYC",
  "edmonton": "YEG", "yeg": "YEG",
  "ottawa": "YOW", "yow": "YOW",

  // Europe
  "london": "LHR", "lhr": "LHR", "london heathrow": "LHR",
  "london gatwick": "LGW", "lgw": "LGW",
  "paris": "CDG", "cdg": "CDG",
  "amsterdam": "AMS", "ams": "AMS",
  "frankfurt": "FRA", "fra": "FRA",
  "madrid": "MAD", "mad": "MAD",
  "barcelona": "BCN", "bcn": "BCN",
  "rome": "FCO", "fco": "FCO",
  "milan": "MXP", "mxp": "MXP",
  "zurich": "ZRH", "zrh": "ZRH",
  "vienna": "VIE", "vie": "VIE",
  "berlin": "BER", "ber": "BER",
  "istanbul": "IST", "ist": "IST",
  "dublin": "DUB", "dub": "DUB",
  "lisbon": "LIS", "lis": "LIS",
  "athens": "ATH", "ath": "ATH",
  "brussels": "BRU", "bru": "BRU",
  "copenhagen": "CPH", "cph": "CPH",
  "stockholm": "ARN", "arn": "ARN",
  "oslo": "OSL", "osl": "OSL",
  "helsinki": "HEL", "hel": "HEL",
  "warsaw": "WAW", "waw": "WAW",
  "prague": "PRG", "prg": "PRG",
  "budapest": "BUD", "bud": "BUD",

  // Asia
  "tokyo": "NRT", "nrt": "NRT",
  "osaka": "KIX", "kix": "KIX",
  "beijing": "PEK", "pek": "PEK",
  "shanghai": "PVG", "pvg": "PVG",
  "hong kong": "HKG", "hkg": "HKG",
  "singapore": "SIN", "sin": "SIN",
  "seoul": "ICN", "icn": "ICN",
  "bangkok": "BKK", "bkk": "BKK",
  "dubai": "DXB", "dxb": "DXB",
  "mumbai": "BOM", "bom": "BOM",
  "delhi": "DEL", "del": "DEL",
  "kuala lumpur": "KUL", "kul": "KUL",
  "jakarta": "CGK", "cgk": "CGK",
  "manila": "MNL", "mnl": "MNL",
  "taipei": "TPE", "tpe": "TPE",

  // Australia / Oceania
  "sydney": "SYD", "syd": "SYD",
  "melbourne": "MEL", "mel": "MEL",
  "brisbane": "BNE", "bne": "BNE",
  "auckland": "AKL", "akl": "AKL",

  // Latin America
  "mexico city": "MEX", "mex": "MEX",
  "cancun": "CUN", "cun": "CUN",
  "sao paulo": "GRU", "gru": "GRU",
  "rio de janeiro": "GIG", "gig": "GIG",
  "bogota": "BOG", "bog": "BOG",
  "lima": "LIM", "lim": "LIM",
  "santiago": "SCL", "scl": "SCL",
  "buenos aires": "EZE", "eze": "EZE",

  // Africa / Middle East
  "cairo": "CAI", "cai": "CAI",
  "johannesburg": "JNB", "jnb": "JNB",
  "nairobi": "NBO", "nbo": "NBO",
  "tel aviv": "TLV", "tlv": "TLV",
  "doha": "DOH", "doh": "DOH",
  "abu dhabi": "AUH", "auh": "AUH",

  // Special test case from the task
  "aal": "AAL", // Aalborg airport (used in 404 test case)
  "aalborg": "AAL",
};

/**
 * Resolve airport name/city to IATA code
 * @param {string} input - City name, airport name, or IATA code
 * @returns {{ iata: string, found: boolean }}
 */
function resolveAirport(input) {
  if (!input) return { iata: null, found: false };
  const key = input.trim().toLowerCase();
  const iata = AIRPORT_MAP[key] || null;
  return { iata, found: !!iata };
}

module.exports = { resolveAirport, AIRPORT_MAP };