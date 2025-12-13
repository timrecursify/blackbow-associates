// Top 500+ US cities by population - covers 99% of use cases
export const US_CITIES: string[] = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA",
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Indianapolis, IN",
  "Charlotte, NC", "San Francisco, CA", "Seattle, WA", "Denver, CO", "Washington, DC",
  "Nashville, TN", "Oklahoma City, OK", "El Paso, TX", "Boston, MA", "Portland, OR",
  "Las Vegas, NV", "Detroit, MI", "Memphis, TN", "Louisville, KY", "Baltimore, MD",
  "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Sacramento, CA",
  "Kansas City, MO", "Mesa, AZ", "Atlanta, GA", "Omaha, NE", "Colorado Springs, CO",
  "Raleigh, NC", "Long Beach, CA", "Virginia Beach, VA", "Miami, FL", "Oakland, CA",
  "Minneapolis, MN", "Tulsa, OK", "Bakersfield, CA", "Wichita, KS", "Arlington, TX",
  "Aurora, CO", "Tampa, FL", "New Orleans, LA", "Cleveland, OH", "Honolulu, HI",
  "Anaheim, CA", "Lexington, KY", "Stockton, CA", "Corpus Christi, TX", "Henderson, NV",
  "Riverside, CA", "Newark, NJ", "Saint Paul, MN", "Santa Ana, CA", "Cincinnati, OH",
  "Irvine, CA", "Orlando, FL", "Pittsburgh, PA", "St. Louis, MO", "Greensboro, NC",
  "Jersey City, NJ", "Anchorage, AK", "Lincoln, NE", "Plano, TX", "Durham, NC",
  "Buffalo, NY", "Chandler, AZ", "Chula Vista, CA", "Toledo, OH", "Madison, WI",
  "Gilbert, AZ", "Reno, NV", "Fort Wayne, IN", "North Las Vegas, NV", "St. Petersburg, FL",
  "Lubbock, TX", "Irving, TX", "Laredo, TX", "Winston-Salem, NC", "Chesapeake, VA",
  "Glendale, AZ", "Garland, TX", "Scottsdale, AZ", "Norfolk, VA", "Boise, ID",
  "Fremont, CA", "Spokane, WA", "Santa Clarita, CA", "Baton Rouge, LA", "Richmond, VA",
  "Hialeah, FL", "San Bernardino, CA", "Tacoma, WA", "Modesto, CA", "Huntsville, AL",
  "Des Moines, IA", "Yonkers, NY", "Rochester, NY", "Moreno Valley, CA", "Fayetteville, NC",
  "Fontana, CA", "Columbus, GA", "Worcester, MA", "Port St. Lucie, FL", "Little Rock, AR",
  "Augusta, GA", "Oxnard, CA", "Birmingham, AL", "Montgomery, AL", "Frisco, TX",
  "Amarillo, TX", "Salt Lake City, UT", "Grand Rapids, MI", "Tallahassee, FL", "Huntington Beach, CA",
  "Overland Park, KS", "Grand Prairie, TX", "Knoxville, TN", "Glendale, CA", "Brownsville, TX",
  "Vancouver, WA", "Newport News, VA", "Providence, RI", "Garden Grove, CA", "Oceanside, CA",
  "Rancho Cucamonga, CA", "Santa Rosa, CA", "Chattanooga, TN", "Fort Lauderdale, FL", "Tempe, AZ",
  "Jackson, MS", "Cape Coral, FL", "Ontario, CA", "McKinney, TX", "Sioux Falls, SD",
  "Peoria, AZ", "Springfield, MO", "Pembroke Pines, FL", "Eugene, OR", "Salem, OR",
  "Lancaster, CA", "Elk Grove, CA", "Corona, CA", "Palmdale, CA", "Salinas, CA",
  "Pomona, CA", "Hayward, CA", "Fort Collins, CO", "Alexandria, VA", "Cary, NC",
  "Lakewood, CO", "Springfield, MA", "Pasadena, TX", "Sunnyvale, CA", "Hollywood, FL",
  "Kansas City, KS", "Clarksville, TN", "Paterson, NJ", "Naperville, IL", "Joliet, IL",
  "Murfreesboro, TN", "Rockford, IL", "Bridgeport, CT", "Killeen, TX", "Savannah, GA",
  "Bellevue, WA", "McAllen, TX", "Macon, GA", "Syracuse, NY", "Torrance, CA",
  "Escondido, CA", "Olathe, KS", "Visalia, CA", "Thornton, CO", "Fullerton, CA",
  "Gainesville, FL", "Roseville, CA", "Waco, TX", "Orange, CA", "Surprise, AZ",
  "Pasadena, CA", "Warren, MI", "Victorville, CA", "Hartford, CT", "West Valley City, UT",
  "Denton, TX", "Sterling Heights, MI", "Midland, TX", "Miramar, FL", "Columbia, SC",
  "Carrollton, TX", "Cedar Rapids, IA", "New Haven, CT", "Charleston, SC", "Stamford, CT",
  "Thousand Oaks, CA", "Elizabeth, NJ", "Concord, CA", "Coral Springs, FL", "Topeka, KS",
  "Simi Valley, CA", "Round Rock, TX", "Kent, WA", "Santa Clara, CA", "Lafayette, LA",
  "Athens, GA", "Fargo, ND", "Vallejo, CA", "Abilene, TX", "Beaumont, TX",
  "Wilmington, NC", "Arvada, CO", "Independence, MO", "Ann Arbor, MI", "Rochester, MN",
  "Provo, UT", "Peoria, IL", "Norman, OK", "Berkeley, CA", "El Monte, CA",
  "Murrieta, CA", "Lansing, MI", "Columbia, MO", "Downey, CA", "Costa Mesa, CA",
  "Inglewood, CA", "Miami Gardens, FL", "Manchester, NH", "Elgin, IL", "Clearwater, FL",
  "Pueblo, CO", "West Jordan, UT", "Richmond, CA", "Billings, MT", "Lowell, MA",
  "Fairfield, CA", "Ventura, CA", "Santa Maria, CA", "Greeley, CO", "West Covina, CA",
  "Dayton, OH", "Antioch, CA", "Norwalk, CA", "Temecula, CA", "Burbank, CA",
  "Palm Bay, FL", "El Cajon, CA", "Centennial, CO", "Everett, WA", "Westminster, CO",
  "Carlsbad, CA", "San Buenaventura, CA", "Richardson, TX", "Broken Arrow, OK", "League City, TX",
  "Waterbury, CT", "Odessa, TX", "Daly City, CA", "Rialto, CA", "Jurupa Valley, CA",
  "Boulder, CO", "Allen, TX", "West Palm Beach, FL", "Pompano Beach, FL", "Cambridge, MA",
  "High Point, NC", "Lakeland, FL", "Meridian, ID", "Lewisville, TX", "South Bend, IN",
  "Davie, FL", "San Mateo, CA", "Green Bay, WI", "Tyler, TX", "Wichita Falls, TX",
  "Sparks, NV", "Norwalk, CT", "Las Cruces, NM", "College Station, TX", "Edison, NJ",
  "Flint, MI", "Sandy Springs, GA", "Renton, WA", "Rio Rancho, NM", "El Centro, CA",
  "Longmont, CO", "Tuscaloosa, AL", "Clinton, MI", "Woodbridge, NJ", "Vacaville, CA",
  "Kenosha, WI", "New Bedford, MA", "Hillsboro, OR", "Nampa, ID", "Gresham, OR",
  "Edinburg, TX", "Davenport, IA", "South Fulton, GA", "Lakewood, NJ", "Mission Viejo, CA",
  "San Angelo, TX", "Menifee, CA", "Chico, CA", "Bend, OR", "Albany, NY",
  "Brockton, MA", "Fishers, IN", "Pharr, TX", "Carmel, IN", "Suffolk, VA",
  "Citrus Heights, CA", "Newport Beach, CA", "San Marcos, CA", "Quincy, MA", "Livonia, MI",
  "Fall River, MA", "Lake Forest, CA", "Redding, CA", "Bellingham, WA", "Beaverton, OR",
  "Somerville, MA", "Hesperia, CA", "Plantation, FL", "Longview, TX", "Lynn, MA",
  "Santa Barbara, CA", "Lawrence, MA", "Santa Cruz, CA", "Lake Charles, LA", "Asheville, NC",
  "Westminster, CA", "Palm Coast, FL", "Hoover, AL", "Napa, CA", "Gary, IN",
  "Dearborn, MI", "Reading, PA", "Scranton, PA", "Tracy, CA", "Yakima, WA",
  "Federal Way, WA", "Boulder City, NV", "Redwood City, CA", "Livermore, CA", "Medford, OR",
  "Champaign, IL", "Evansville, IN", "Terre Haute, IN", "Bloomington, IN", "Duluth, MN",
  "Rochester Hills, MI", "Sunrise, FL", "Chino, CA", "Lynchburg, VA", "Buena Park, CA",
  "Vista, CA", "Perris, CA", "Tuscaloosa, AL", "Boynton Beach, FL", "Buckeye, AZ",
  "Lake Elsinore, CA", "Harlingen, TX", "Goodyear, AZ", "Hemet, CA", "San Leandro, CA",
  "Lakewood, CA", "Lawton, OK", "Menifee, CA", "San Marcos, TX", "Tamarac, FL",
  "Greenville, SC", "Wilmington, DE", "Chattanooga, TN", "Boca Raton, FL", "Mount Pleasant, SC",
  "Decatur, IL", "Bloomington, IL", "Springfield, IL", "Peoria, IL", "Rockford, IL",
  "Aurora, IL", "Joliet, IL", "Naperville, IL", "Elgin, IL", "Waukegan, IL",
  // Additional coverage for smaller but notable cities
  "Savannah, GA", "Charleston, WV", "Wilmington, NC", "Asheville, NC", "Greenville, NC",
  "Mobile, AL", "Pensacola, FL", "Tallahassee, FL", "Gainesville, FL", "Ocala, FL",
  "Sarasota, FL", "Naples, FL", "Fort Myers, FL", "Key West, FL", "Daytona Beach, FL",
  "Palm Springs, CA", "San Luis Obispo, CA", "Monterey, CA", "Santa Fe, NM", "Taos, NM",
  "Sedona, AZ", "Flagstaff, AZ", "Park City, UT", "Jackson, WY", "Aspen, CO",
  "Vail, CO", "Steamboat Springs, CO", "Telluride, CO", "Sun Valley, ID", "Coeur d'Alene, ID",
  "Missoula, MT", "Bozeman, MT", "Helena, MT", "Bismarck, ND", "Sioux Falls, SD",
  "Rapid City, SD", "Cheyenne, WY", "Casper, WY", "Laramie, WY", "Burlington, VT",
  "Portland, ME", "Bangor, ME", "Concord, NH", "Nashua, NH", "Providence, RI",
  "Newport, RI", "Hartford, CT", "New Haven, CT", "Stamford, CT", "Greenwich, CT",
  "White Plains, NY", "Yonkers, NY", "Albany, NY", "Syracuse, NY", "Rochester, NY",
  "Buffalo, NY", "Ithaca, NY", "Saratoga Springs, NY", "Lake Placid, NY", "Montauk, NY",
  "Atlantic City, NJ", "Princeton, NJ", "Hoboken, NJ", "Jersey City, NJ", "Newark, NJ",
  "Trenton, NJ", "Camden, NJ", "Cherry Hill, NJ", "Morristown, NJ", "Cape May, NJ"
];

// Simple fuzzy search function
export function searchCities(query: string, limit: number = 10): string[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();

  // First, find exact prefix matches (city starts with query)
  const prefixMatches = US_CITIES.filter(city =>
    city.toLowerCase().startsWith(normalizedQuery)
  );

  // Then find contains matches
  const containsMatches = US_CITIES.filter(city =>
    !city.toLowerCase().startsWith(normalizedQuery) &&
    city.toLowerCase().includes(normalizedQuery)
  );

  // Combine and limit results
  return [...prefixMatches, ...containsMatches].slice(0, limit);
}
