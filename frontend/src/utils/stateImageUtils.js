import imgAndhra from "../assets/states/andhra-pradesh-image.png";
import imgArunachal from "../assets/states/arunachal-pradesh-image.png";
import imgAssam from "../assets/states/assam-image.png";
import imgBihar from "../assets/states/bihar-image.png";
import imgChhattisgarh from "../assets/states/chhattisgarh-image.png";
import imgGoa from "../assets/states/goa-image.png";
import imgGujarat from "../assets/states/gujarat-image.png";
import imgHaryana from "../assets/states/haryana-image.png";
import imgHimachal from "../assets/states/himachal-pradesh-image.png";
import imgJharkhand from "../assets/states/jharkhand-image.png";
import imgKarnataka from "../assets/states/karnataka-image.png";
import imgKerala from "../assets/states/kerala-image.png";
import imgMP from "../assets/states/madhya-pradesh-image.png";
import imgMaharashtra from "../assets/states/maharashtra-image.png";
import imgManipur from "../assets/states/manipur-image.png";
import imgMeghalaya from "../assets/states/meghalaya-image.png";
import imgMizoram from "../assets/states/mizoram-image.png";
import imgNagaland from "../assets/states/nagaland-image.png";
import imgOdisha from "../assets/states/odisha-image.png";
import imgPunjab from "../assets/states/punjab-image.png";
import imgRajasthan from "../assets/states/rajasthan-image.png";
import imgSikkim from "../assets/states/sikkim-image.png";
import imgTamilNadu from "../assets/states/tamil-nadu-image.png";
import imgTelangana from "../assets/states/telangana-image.png";
import imgTripura from "../assets/states/tripura-image.png";
import imgUP from "../assets/states/uttar-pradesh-image.png";
import imgUttarakhand from "../assets/states/uttarakhand-image.png";
import imgWestBengal from "../assets/states/west-bengal-image.png";
import imgDelhi from "../assets/states/delhi-image.png";
import imgJK from "../assets/states/jammu-kashmir-image.png";
import imgLadakh from "../assets/states/ladakh-image.png";
import imgPuducherry from "../assets/states/puducherry-image.png";
import imgChandigarh from "../assets/states/chandigarh-image.png";
import imgLakshadweep from "../assets/states/lakshadweep-image.png";
import imgAndaman from "../assets/states/andaman-image.png";
import imgDnhDd from "../assets/states/dnh-dd-image.png";

/**
 * Authoritative mapping for all 28 States + 8 Union Territories image assets.
 * Keys support both standard slugs and common slug variations.
 */
export const STATE_IMAGE_MAP = {
  "andhra-pradesh": imgAndhra,
  "arunachal-pradesh": imgArunachal,
  "assam": imgAssam,
  "bihar": imgBihar,
  "chhattisgarh": imgChhattisgarh,
  "goa": imgGoa,
  "gujarat": imgGujarat,
  "haryana": imgHaryana,
  "himachal-pradesh": imgHimachal,
  "jharkhand": imgJharkhand,
  "karnataka": imgKarnataka,
  "kerala": imgKerala,
  "madhya-pradesh": imgMP,
  "maharashtra": imgMaharashtra,
  "manipur": imgManipur,
  "meghalaya": imgMeghalaya,
  "mizoram": imgMizoram,
  "nagaland": imgNagaland,
  "odisha": imgOdisha,
  "punjab": imgPunjab,
  "rajasthan": imgRajasthan,
  "sikkim": imgSikkim,
  "tamil-nadu": imgTamilNadu,
  "telangana": imgTelangana,
  "tripura": imgTripura,
  "uttar-pradesh": imgUP,
  "uttarakhand": imgUttarakhand,
  "west-bengal": imgWestBengal,
  "delhi": imgDelhi,
  "jammu-and-kashmir": imgJK,
  "jammu-kashmir": imgJK,
  "ladakh": imgLadakh,
  "puducherry": imgPuducherry,
  "chandigarh": imgChandigarh,
  "lakshadweep": imgLakshadweep,
  "andaman-and-nicobar-islands": imgAndaman,
  "andaman-nicobar": imgAndaman,
  "dnh-dd": imgDnhDd,
};

/**
 * Returns the canonical state/UT image based on state slug, state ID, or state object.
 * @param {string|object} slugOrId State slug, state ID, or state object (e.g. 'karnataka', { stateSlug: 'karnataka' })
 * @returns {string|null} The imported image asset or null if not found.
 */
export function getStateImage(slugOrId) {
  if (!slugOrId) return null;
  let key = slugOrId;
  if (typeof slugOrId === 'object' && slugOrId !== null) {
    key = slugOrId.stateSlug || slugOrId.slug || slugOrId.id;
  }
  if (!key || typeof key !== 'string') return null;
  const cleanKey = key.toLowerCase().trim().replace(/_/g, '-');
  return STATE_IMAGE_MAP[cleanKey] || null;
}
