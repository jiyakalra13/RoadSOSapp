// Country data with phone codes and emergency numbers
export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
  emergency: {
    police: string
    ambulance: string
    fire: string
    general?: string
  }
}

export const countries: Country[] = [
  {
    code: "US",
    name: "United States",
    dialCode: "+1",
    flag: "🇺🇸",
    emergency: { police: "911", ambulance: "911", fire: "911", general: "911" }
  },
  {
    code: "GB",
    name: "United Kingdom",
    dialCode: "+44",
    flag: "🇬🇧",
    emergency: { police: "999", ambulance: "999", fire: "999", general: "112" }
  },
  {
    code: "IN",
    name: "India",
    dialCode: "+91",
    flag: "🇮🇳",
    emergency: { police: "100", ambulance: "102", fire: "101", general: "112" }
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    flag: "🇨🇦",
    emergency: { police: "911", ambulance: "911", fire: "911", general: "911" }
  },
  {
    code: "AU",
    name: "Australia",
    dialCode: "+61",
    flag: "🇦🇺",
    emergency: { police: "000", ambulance: "000", fire: "000", general: "112" }
  },
  {
    code: "DE",
    name: "Germany",
    dialCode: "+49",
    flag: "🇩🇪",
    emergency: { police: "110", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    flag: "🇫🇷",
    emergency: { police: "17", ambulance: "15", fire: "18", general: "112" }
  },
  {
    code: "JP",
    name: "Japan",
    dialCode: "+81",
    flag: "🇯🇵",
    emergency: { police: "110", ambulance: "119", fire: "119" }
  },
  {
    code: "CN",
    name: "China",
    dialCode: "+86",
    flag: "🇨🇳",
    emergency: { police: "110", ambulance: "120", fire: "119" }
  },
  {
    code: "BR",
    name: "Brazil",
    dialCode: "+55",
    flag: "🇧🇷",
    emergency: { police: "190", ambulance: "192", fire: "193" }
  },
  {
    code: "MX",
    name: "Mexico",
    dialCode: "+52",
    flag: "🇲🇽",
    emergency: { police: "911", ambulance: "911", fire: "911", general: "911" }
  },
  {
    code: "ES",
    name: "Spain",
    dialCode: "+34",
    flag: "🇪🇸",
    emergency: { police: "091", ambulance: "061", fire: "080", general: "112" }
  },
  {
    code: "IT",
    name: "Italy",
    dialCode: "+39",
    flag: "🇮🇹",
    emergency: { police: "113", ambulance: "118", fire: "115", general: "112" }
  },
  {
    code: "RU",
    name: "Russia",
    dialCode: "+7",
    flag: "🇷🇺",
    emergency: { police: "102", ambulance: "103", fire: "101", general: "112" }
  },
  {
    code: "KR",
    name: "South Korea",
    dialCode: "+82",
    flag: "🇰🇷",
    emergency: { police: "112", ambulance: "119", fire: "119" }
  },
  {
    code: "NL",
    name: "Netherlands",
    dialCode: "+31",
    flag: "🇳🇱",
    emergency: { police: "112", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    dialCode: "+966",
    flag: "🇸🇦",
    emergency: { police: "999", ambulance: "997", fire: "998" }
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    dialCode: "+971",
    flag: "🇦🇪",
    emergency: { police: "999", ambulance: "998", fire: "997" }
  },
  {
    code: "SG",
    name: "Singapore",
    dialCode: "+65",
    flag: "🇸🇬",
    emergency: { police: "999", ambulance: "995", fire: "995" }
  },
  {
    code: "ZA",
    name: "South Africa",
    dialCode: "+27",
    flag: "🇿🇦",
    emergency: { police: "10111", ambulance: "10177", fire: "10177" }
  },
  {
    code: "PH",
    name: "Philippines",
    dialCode: "+63",
    flag: "🇵🇭",
    emergency: { police: "117", ambulance: "911", fire: "911", general: "911" }
  },
  {
    code: "ID",
    name: "Indonesia",
    dialCode: "+62",
    flag: "🇮🇩",
    emergency: { police: "110", ambulance: "118", fire: "113", general: "112" }
  },
  {
    code: "MY",
    name: "Malaysia",
    dialCode: "+60",
    flag: "🇲🇾",
    emergency: { police: "999", ambulance: "999", fire: "994" }
  },
  {
    code: "TH",
    name: "Thailand",
    dialCode: "+66",
    flag: "🇹🇭",
    emergency: { police: "191", ambulance: "1669", fire: "199" }
  },
  {
    code: "VN",
    name: "Vietnam",
    dialCode: "+84",
    flag: "🇻🇳",
    emergency: { police: "113", ambulance: "115", fire: "114" }
  },
  {
    code: "PK",
    name: "Pakistan",
    dialCode: "+92",
    flag: "🇵🇰",
    emergency: { police: "15", ambulance: "115", fire: "16" }
  },
  {
    code: "BD",
    name: "Bangladesh",
    dialCode: "+880",
    flag: "🇧🇩",
    emergency: { police: "999", ambulance: "999", fire: "999", general: "999" }
  },
  {
    code: "NG",
    name: "Nigeria",
    dialCode: "+234",
    flag: "🇳🇬",
    emergency: { police: "112", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "EG",
    name: "Egypt",
    dialCode: "+20",
    flag: "🇪🇬",
    emergency: { police: "122", ambulance: "123", fire: "180" }
  },
  {
    code: "TR",
    name: "Turkey",
    dialCode: "+90",
    flag: "🇹🇷",
    emergency: { police: "155", ambulance: "112", fire: "110", general: "112" }
  },
  {
    code: "PL",
    name: "Poland",
    dialCode: "+48",
    flag: "🇵🇱",
    emergency: { police: "997", ambulance: "999", fire: "998", general: "112" }
  },
  {
    code: "SE",
    name: "Sweden",
    dialCode: "+46",
    flag: "🇸🇪",
    emergency: { police: "112", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "NO",
    name: "Norway",
    dialCode: "+47",
    flag: "🇳🇴",
    emergency: { police: "112", ambulance: "113", fire: "110" }
  },
  {
    code: "DK",
    name: "Denmark",
    dialCode: "+45",
    flag: "🇩🇰",
    emergency: { police: "112", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "FI",
    name: "Finland",
    dialCode: "+358",
    flag: "🇫🇮",
    emergency: { police: "112", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "CH",
    name: "Switzerland",
    dialCode: "+41",
    flag: "🇨🇭",
    emergency: { police: "117", ambulance: "144", fire: "118", general: "112" }
  },
  {
    code: "AT",
    name: "Austria",
    dialCode: "+43",
    flag: "🇦🇹",
    emergency: { police: "133", ambulance: "144", fire: "122", general: "112" }
  },
  {
    code: "BE",
    name: "Belgium",
    dialCode: "+32",
    flag: "🇧🇪",
    emergency: { police: "101", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "PT",
    name: "Portugal",
    dialCode: "+351",
    flag: "🇵🇹",
    emergency: { police: "112", ambulance: "112", fire: "112", general: "112" }
  },
  {
    code: "GR",
    name: "Greece",
    dialCode: "+30",
    flag: "🇬🇷",
    emergency: { police: "100", ambulance: "166", fire: "199", general: "112" }
  },
  {
    code: "NZ",
    name: "New Zealand",
    dialCode: "+64",
    flag: "🇳🇿",
    emergency: { police: "111", ambulance: "111", fire: "111" }
  },
  {
    code: "IE",
    name: "Ireland",
    dialCode: "+353",
    flag: "🇮🇪",
    emergency: { police: "999", ambulance: "999", fire: "999", general: "112" }
  },
  {
    code: "IL",
    name: "Israel",
    dialCode: "+972",
    flag: "🇮🇱",
    emergency: { police: "100", ambulance: "101", fire: "102" }
  },
  {
    code: "AR",
    name: "Argentina",
    dialCode: "+54",
    flag: "🇦🇷",
    emergency: { police: "101", ambulance: "107", fire: "100" }
  },
  {
    code: "CL",
    name: "Chile",
    dialCode: "+56",
    flag: "🇨🇱",
    emergency: { police: "133", ambulance: "131", fire: "132" }
  },
  {
    code: "CO",
    name: "Colombia",
    dialCode: "+57",
    flag: "🇨🇴",
    emergency: { police: "123", ambulance: "123", fire: "123", general: "123" }
  },
  {
    code: "PE",
    name: "Peru",
    dialCode: "+51",
    flag: "🇵🇪",
    emergency: { police: "105", ambulance: "117", fire: "116" }
  },
  {
    code: "HK",
    name: "Hong Kong",
    dialCode: "+852",
    flag: "🇭🇰",
    emergency: { police: "999", ambulance: "999", fire: "999" }
  },
  {
    code: "TW",
    name: "Taiwan",
    dialCode: "+886",
    flag: "🇹🇼",
    emergency: { police: "110", ambulance: "119", fire: "119" }
  }
]

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code)
}

export function searchCountries(query: string): Country[] {
  const lowerQuery = query.toLowerCase()
  return countries.filter(
    c => c.name.toLowerCase().includes(lowerQuery) || 
         c.dialCode.includes(query) ||
         c.code.toLowerCase().includes(lowerQuery)
  )
}
