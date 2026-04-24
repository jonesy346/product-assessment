import type { Address, EvidenceSource } from './types'

export function getMockSources(_address: Address): EvidenceSource[] {
  return [
    {
      id: 'prop-1',
      title: 'MLS Listing — 742 Evergreen Terrace',
      url: 'https://example-mls.com/listing/742-evergreen',
      content:
        'Beautiful 3 bedroom, 2 bathroom home at 742 Evergreen Terrace. 1,850 square feet of living space. Listed at $485,000. Built in 1998. Attached 2-car garage. Open floor plan with hardwood floors throughout.',
      sourceType: 'property',
    },
    {
      id: 'prop-2',
      title: 'County Tax Records',
      url: 'https://example-county.gov/tax/742-evergreen',
      content:
        'Property address: 742 Evergreen Terrace. Assessed value: $461,200. Recorded square footage: 1,900 sq ft. Bedrooms: 3. Bathrooms: 2. Lot size: 0.18 acres. Last sale date: 2019-06-12. Last sale price: $392,000.',
      sourceType: 'property',
    },
    {
      id: 'prop-3',
      title: 'Zillow Property Page',
      url: 'https://zillow.com/homes/742-evergreen',
      content:
        'This 3 bed, 2 bath home spans 1,850 sqft. Zestimate: $491,000. Year built: 1998. Heating: central air. Lot: 7,841 sq ft. HOA: none. Price per sqft: $265.',
      sourceType: 'property',
    },
    {
      id: 'prop-4',
      title: 'Redfin Property Detail',
      url: 'https://redfin.com/homes/742-evergreen',
      content:
        'Listed at $485,000. 3 bedrooms, 2 bathrooms. 1,900 square feet (per public records). Walk Score: 62. Bike Score: 44. Days on market: 18. Price reduced from $499,000.',
      sourceType: 'property',
    },
    {
      id: 'prop-5',
      title: 'Realtor.com Listing',
      url: 'https://realtor.com/realestateandhomes-detail/742-evergreen',
      content:
        'Single-family home, 3 beds, 2 baths. Square footage: 1,850. Asking price $485,000. Garage: 2 cars. Basement: none. Roof age: approximately 8 years. HVAC replaced 2021.',
      sourceType: 'property',
    },
    {
      id: 'prop-6',
      title: 'HomeLight Property Report',
      url: 'https://homelight.com/homes/742-evergreen',
      content:
        'Property at 742 Evergreen Terrace. 3 bedrooms, 2 full bathrooms. Price: $485,000. No year built information available. Estimated rental value: $2,400/month. Owner since 2019.',
      sourceType: 'property',
    },
    {
      id: 'nbhd-1',
      title: 'NeighborhoodScout — Area Profile',
      url: 'https://neighborhoodscout.com/evergreen',
      content:
        'Walk Score 62 (somewhat walkable). Transit Score 38. Top-rated elementary school within 0.4 miles (rated 8/10). Crime rate 12% below city average. Median household income: $84,000. Area is predominantly owner-occupied (74%).',
      sourceType: 'neighborhood',
    },
    {
      id: 'nbhd-2',
      title: 'Local Amenities & Schools — City Data',
      url: 'https://city-data.com/neighborhood/evergreen',
      content:
        'Evergreen district has 3 grocery stores within 1 mile, 2 coffee shops, and a community park. School district rated B+ overall. High school graduation rate: 91%. Restaurants and retail within 0.6 mile walkable corridor. No major highway noise impact.',
      sourceType: 'neighborhood',
    },
    {
      id: 'comps-1',
      title: 'Recent Sales — Comparable Homes (Last 90 Days)',
      url: 'https://example-mls.com/comps/evergreen',
      content:
        'Comp 1: 718 Evergreen Terrace — 3 bed / 2 bath / 1,820 sqft — sold $478,000 ($263/sqft). Comp 2: 801 Maple Ave — 3 bed / 2 bath / 1,910 sqft — sold $496,000 ($260/sqft). Comp 3: 655 Birch Ln — 3 bed / 2 bath / 1,780 sqft — sold $469,500 ($264/sqft). Median days on market: 22.',
      sourceType: 'comps',
    },
    {
      id: 'comps-2',
      title: 'Price Per Sqft Trends — Redfin Market Report',
      url: 'https://redfin.com/market/evergreen-district',
      content:
        'Median price per sqft in Evergreen district: $262 (up 4.1% YoY). Homes priced between $460K–$510K are selling in under 25 days. Inventory is tight with 1.8 months of supply. Seller market conditions persist. List-to-sale ratio: 98.6%.',
      sourceType: 'comps',
    },
  ]
}
