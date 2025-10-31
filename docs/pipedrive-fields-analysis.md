# Pipedrive Fields Analysis for Wedding Vendor Lead Marketplace

**Generated:** 2025-10-29  
**Purpose:** Analyze Pipedrive fields to determine which are useful for the wedding vendor lead marketplace

---

## ✅ RECOMMENDED FIELDS FOR MARKETPLACE

### Deal Fields (Primary Data Source)

| Field Name | Field Type | Key/ID | Population Rate | Marketplace Value |
|------------|------------|--------|-----------------|-------------------|
| **Wedding Date** | Date | `48d02678bc42b89d4899408183ca63194a968a2f` | ✅ High | **CRITICAL** - Core filter criterion |
| **Location/State** | Enum | `ab8da96fa06f5bba3ed7a744abd1808bca457c2a` | ✅ High | **CRITICAL** - Geographic targeting |
| **City** | Text | `bb1b06f9856098ab1fff967789d2a34cf8c32071` | ✅ High | **CRITICAL** - Precise location |
| **Budget/Value** | Monetary | `33038301b72d27037bfe4a71394126dfd58f1753` + `value` | ✅ High | **HIGH** - Budget range for vendors |
| **Services Needed** | Text | `3edd86479b253c3d1974945fead02517ec2cce2c` | ✅ High | **CRITICAL** - Match vendors to needs |
| **Guest Count** | Number | `3f49a1ed0a63f63cc8a5a6661b0443072ba30309` | ⚠️ Medium | **MEDIUM** - Event size indicator |
| **Service Level** | Enum | `16b4d2d7ca3d7659d827eff3492adb723f846875` | ✅ High | **MEDIUM** - Quality tier (A-Team, White Glove, RAW Only) |
| **Comments/Notes** | Text | `a81743f0fbba22cfbe4af307bdba520923dd6d4f` | ✅ High | **HIGH** - Venue, religious preferences, special requests |
| **Ethnic/Religious** | Text | `137b84c97a24ee17c40306b80ad3ec87ad8b4057` | ⚠️ Low | **LOW** - Cultural considerations |
| **Lead Source** | Text | `507d960d2d9196bb30ba883bf6d3a120862723a7` | ✅ High | **LOW** - Internal tracking (e.g., "Website PPP") |
| **Deal Created Date** | Date | `add_time` | ✅ Always | **MEDIUM** - Lead freshness |
| **Deal Status** | Enum | `status` | ✅ Always | **CRITICAL** - Filter active leads |
| **Deal Title** | Text | `title` | ✅ Always | **HIGH** - Quick reference (format: "MM/DD/YY \| Name \| Location") |

### Person Fields (Contact Information)

| Field Name | Field Type | Key/ID | Population Rate | Marketplace Value |
|------------|------------|--------|-----------------|-------------------|
| **Couple Name** | Text | `name` | ✅ Always | **CRITICAL** - Primary contact |
| **Email** | Email Array | `email` | ✅ High | **CRITICAL** - Contact method |
| **Phone** | Phone Array | `phone` | ✅ High | **CRITICAL** - Contact method |
| **Fiance Name** | Text | `397616ea48d95b6d31cc1495c624b13732c71177` | ⚠️ Medium | **MEDIUM** - Full couple info |
| **Fiance Email** | Text | `65f109cab86516bff9f7334a797407ec4c3be770` | ⚠️ Low | **LOW** - Secondary contact |
| **Fiance Phone** | Text | `59089d8232c99758da631f0a4b5d7cb4695d30cd` | ⚠️ Low | **LOW** - Secondary contact |
| **Wedding Date (Person)** | Date | `72dd57d8373a9cfeb5f5be94294a566b8dff656c` | ⚠️ Medium | **BACKUP** - Duplicate of deal field |

### Venue/Location Fields (Event Details)

| Field Name | Field Type | Key/ID | Population Rate | Marketplace Value |
|------------|------------|--------|-----------------|-------------------|
| **Ceremony Location** | Text | `c5933200de7481df279b20110cb7838dcad7db7a` | ⚠️ Low | **MEDIUM** - Venue details |
| **Ceremony Time** | Text | `181411fda4bc6b8b62ea943a95d1633d644496bd` | ⚠️ Low | **LOW** - Timing details |
| **Cocktails Location** | Text | `56b96a1775cae731649c2237c3312ce293d85347` | ⚠️ Low | **LOW** - Venue details |
| **Cocktails Time** | Text | `eb9289630aca816dc7d467b7ba0ac17103865b83` | ⚠️ Low | **LOW** - Timing details |
| **Reception Location** | Text | `ffdbcf015006905b749adabe2665c85061459877` | ⚠️ Low | **LOW** - Venue details |
| **Reception Time** | Text | `c4762bdbbdf9f74d4edede22f248f79132612348` | ⚠️ Low | **LOW** - Timing details |

---

## 📋 ALL AVAILABLE FIELDS (COMPREHENSIVE LIST)

### Standard Deal Fields

| Field Name | Type | Description | Editable | Filterable |
|------------|------|-------------|----------|------------|
| `id` | int | Deal ID | ❌ | ✅ |
| `title` | varchar | Deal Title | ✅ | ✅ |
| `value` | monetary | Deal Value | ✅ | ✅ |
| `currency` | varchar | Currency Code | ✅ | ✅ |
| `status` | status | Deal Status (open/won/lost/deleted) | ✅ | ✅ |
| `stage_id` | stage | Pipeline Stage | ✅ | ✅ |
| `pipeline_id` | double | Pipeline ID | ✅ | ✅ |
| `person_id` | people | Contact Person | ✅ | ✅ |
| `org_id` | org | Organization | ✅ | ✅ |
| `user_id` | user | Owner | ✅ | ✅ |
| `creator_user_id` | user | Creator | ❌ | ✅ |
| `add_time` | date | Deal Created | ❌ | ✅ |
| `update_time` | date | Last Updated | ❌ | ✅ |
| `close_time` | date | Close Time | ❌ | ✅ |
| `won_time` | datetime | Won Time | ❌ | ✅ |
| `lost_time` | datetime | Lost Time | ❌ | ✅ |
| `expected_close_date` | date | Expected Close Date | ✅ | ✅ |
| `probability` | int | Win Probability | ✅ | ✅ |
| `weighted_value` | monetary | Weighted Value | ❌ | ✅ |
| `lost_reason` | varchar | Lost Reason | ✅ | ✅ |
| `visible_to` | visible_to | Visibility | ✅ | ✅ |

### Custom Deal Fields (Wedding-Specific)

| Field Name | Hash Key | Type | Group | Populated |
|------------|----------|------|-------|-----------|
| Wedding Date | `48d02678bc42b89d4899408183ca63194a968a2f` | date | Event | ✅✅✅ |
| Guest Count | `3f49a1ed0a63f63cc8a5a6661b0443072ba30309` | varchar | Event | ✅✅ |
| Services/Coverage Details | `3edd86479b253c3d1974945fead02517ec2cce2c` | varchar | Event | ✅✅✅ |
| City | `bb1b06f9856098ab1fff967789d2a34cf8c32071` | varchar | Location | ✅✅✅ |
| State | `ab8da96fa06f5bba3ed7a744abd1808bca457c2a` | enum | Location | ✅✅✅ |
| Comments/Notes | `a81743f0fbba22cfbe4af307bdba520923dd6d4f` | text | Details | ✅✅✅ |
| Service Level | `16b4d2d7ca3d7659d827eff3492adb723f846875` | enum | Service | ✅✅✅ |
| Budget Amount | `33038301b72d27037bfe4a71394126dfd58f1753` | monetary | Financial | ✅✅ |
| Lead Source | `507d960d2d9196bb30ba883bf6d3a120862723a7` | varchar | Marketing | ✅✅✅ |
| Ethnic/Religious | `137b84c97a24ee17c40306b80ad3ec87ad8b4057` | varchar | Preferences | ✅ |
| Ceremony Location | `c5933200de7481df279b20110cb7838dcad7db7a` | varchar | Venue | ✅ |
| Ceremony Time | `181411fda4bc6b8b62ea943a95d1633d644496bd` | varchar | Timing | ✅ |
| Cocktails Location | `56b96a1775cae731649c2237c3312ce293d85347` | varchar | Venue | ✅ |
| Cocktails Time | `eb9289630aca816dc7d467b7ba0ac17103865b83` | varchar | Timing | ✅ |
| Reception Location | `ffdbcf015006905b749adabe2665c85061459877` | varchar | Venue | ✅ |
| Reception Time | `c4762bdbbdf9f74d4edede22f248f79132612348` | varchar | Timing | ✅ |
| GGR Address | `94543dc56ec3672c2fdb62593839cd1b34dc3f66` | varchar | Venue | ❌ |
| BGR Address | `5d5a659cf4f49f5121af1999f219a14813d68d92` | varchar | Venue | ❌ |
| Wedding Planner Info | `731a00cbe1877ded4104aafd474de400bb8a69ae` | varchar | Vendors | ❌ |
| Start Coverage Time | `1efb969a2b02a19f982d6b77edec420ffef62746` | varchar | Timing | ❌ |
| End Coverage Time | `4b5dc8aa2d4076a5a86ae8f90dc51f9aac8b33d5` | varchar | Timing | ❌ |
| Arrival Location | `fd0752f103d6433cc1440beeb0f0670bab63275f` | varchar | Logistics | ❌ |
| Sharing Preferences | `3c5bf91c554c2f9aef02394a8bab0f8f7ea64ee3` | varchar | Preferences | ❌ |

### Standard Person Fields

| Field Name | Type | Description | Editable | Populated |
|------------|------|-------------|----------|-----------|
| `id` | int | Person ID | ❌ | ✅ |
| `name` | varchar | Full Name | ✅ | ✅✅✅ |
| `first_name` | varchar | First Name | ✅ | ✅✅✅ |
| `last_name` | varchar | Last Name | ✅ | ✅✅✅ |
| `email` | email | Email Array | ✅ | ✅✅✅ |
| `phone` | phone | Phone Array | ✅ | ✅✅✅ |
| `owner_id` | user | Owner | ✅ | ✅ |
| `org_id` | org | Organization | ✅ | ❌ |
| `add_time` | date | Person Created | ❌ | ✅ |
| `update_time` | date | Last Updated | ❌ | ✅ |
| `label` | enum | Label/Tag | ✅ | ⚠️ |
| `visible_to` | visible_to | Visibility | ✅ | ✅ |

### Custom Person Fields (Wedding-Specific)

| Field Name | Hash Key | Type | Populated |
|------------|----------|------|-----------|
| Wedding Date | `72dd57d8373a9cfeb5f5be94294a566b8dff656c` | date | ✅✅ |
| Fiance Name | `397616ea48d95b6d31cc1495c624b13732c71177` | varchar | ✅ |
| Fiance Email | `65f109cab86516bff9f7334a797407ec4c3be770` | varchar | ⚠️ |
| Fiance Phone | `59089d8232c99758da631f0a4b5d7cb4695d30cd` | varchar | ⚠️ |
| How Did You Hear About Us | `a262df6f5ea7fd296a8671719f0beb281a1ac2a4` | varchar | ✅ |
| Event ID | `8cf49560ecaa68f90d3e4e103a8267ca5d4dc621` | varchar | ❌ |
| Session ID | `b0067e0f4c9d31fe12a9067ea0c2f728079ada9e` | varchar | ❌ |
| Pixel ID | `5365d081bd139123cdac311b49c9b207f6a2ff7b` | varchar | ❌ |
| Project ID | `7aea416f749df1c9b88bbf3a75d0377475b771e4` | varchar | ❌ |
| Initial Landing Page | `cc72846a249d8224a22d3273887dac71137e01c1` | text | ❌ |
| Page URL | `a5fda325cf12108a3156d8572d3e5df1b1157c8f` | text | ❌ |
| Page Title | `82da01c675c40d01b47c044e88a43a2b840172b7` | varchar | ❌ |

### Internal/Marketing Fields (Low Priority)

These fields are primarily for internal tracking and marketing attribution:
- Various Click IDs (Facebook, Microsoft, TikTok, Instagram, Yahoo)
- Ad Group, Ad ID, Search Query
- UTM parameters and tracking codes
- Session and event tracking fields

---

## 🎯 FIELD MAPPING FOR MARKETPLACE DATABASE

### Lead Model Mapping (Recommended)

```javascript
{
  // Core identification
  pipedriveDealId: deal.id,
  
  // Event details
  weddingDate: deal["48d02678bc42b89d4899408183ca63194a968a2f"],
  location: `${deal["bb1b06f9856098ab1fff967789d2a34cf8c32071"]}, ${stateCodeToName(deal["ab8da96fa06f5bba3ed7a744abd1808bca457c2a"])}`,
  city: deal["bb1b06f9856098ab1fff967789d2a34cf8c32071"],
  state: deal["ab8da96fa06f5bba3ed7a744abd1808bca457c2a"],
  
  // Budget
  budgetMin: null, // Calculate from deal.value or deal["33038301b72d27037bfe4a71394126dfd58f1753"]
  budgetMax: deal["33038301b72d27037bfe4a71394126dfd58f1753"] || deal.value,
  
  // Services
  servicesNeeded: parseServicesFromText(deal["3edd86479b253c3d1974945fead02517ec2cce2c"]),
  
  // Pricing (marketplace)
  price: calculateLeadPrice(deal.value, serviceLevel),
  status: mapPipedriveStatus(deal.status),
  
  // Masked info (pre-purchase)
  maskedInfo: {
    coupleName: maskName(person.name),
    phone: "***-***-****",
    email: "***@***.***",
    guestCount: deal["3f49a1ed0a63f63cc8a5a6661b0443072ba30309"] || null
  },
  
  // Full info (post-purchase)
  fullInfo: {
    coupleName: person.name,
    email: person.email[0]?.value,
    phone: person.phone[0]?.value,
    fianceName: person["397616ea48d95b6d31cc1495c624b13732c71177"] || null,
    notes: deal["a81743f0fbba22cfbe4af307bdba520923dd6d4f"],
    serviceLevel: deal["16b4d2d7ca3d7659d827eff3492adb723f846875"],
    venueDetails: extractVenueFromNotes(deal["a81743f0fbba22cfbe4af307bdba520923dd6d4f"])
  },
  
  // Timestamps
  createdAt: deal.add_time,
  updatedAt: deal.update_time
}
```

---

## 📊 DATA QUALITY OBSERVATIONS

### Highly Populated Fields (✅✅✅)
- Deal Title (format: "MM/DD/YY | Client Name | State")
- Wedding Date
- City & State
- Services/Coverage Details
- Comments/Notes (includes venue, preferences, special requests)
- Service Level
- Person name, email, phone

### Moderately Populated Fields (✅✅)
- Guest Count
- Budget Amount
- Fiance Name

### Rarely Populated Fields (✅ or ❌)
- Detailed venue addresses (GGR, BGR)
- Specific timing fields (ceremony time, cocktails time, etc.)
- Fiance contact details (email, phone)
- Wedding planner info
- Ethnic/Religious preferences

### Empty/Tracking Fields (❌)
- Marketing attribution fields (UTM, Click IDs)
- Session tracking (Event ID, Session ID, Pixel ID)
- Analytics fields (Page URL, Landing Page)

---

## 🔍 NOTES FROM SAMPLE DATA

**Deal Titles Follow Pattern:**
- `"09/25/26 | Amelia Anzalone | W/Boston, Hartford, Providence"`
- `"06/27/26 | Ellery Capshaw | CT"`
- `"05.30.20|MD|Lauren Coberly"` (older format)

**Services Field Examples:**
- `"Length of coverage: 6 Hours, Type of Coverage: Photography & Videography"`
- `"6hrs-2ph,1vd, + 2 EXTRA HOURS OF COVERAGE, RAW, Drone, 10 min highlight, 1 min IG"`

**Comments Field Examples:**
- `"Venue Location: Boston, Hartford, Providence\nCoverage Type: Photography & Videography\nReligious: \nClient's Notes: "`
- `"Very excited to work with you!"`

**Service Level Values:**
- `354` = White Glove
- `557` = A-Team  
- `356` = RAW Only

**State Values:**
State codes use numeric IDs (e.g., `108` for CT, `282` for MA) that map to standard US state abbreviations

---

## 💡 RECOMMENDATIONS

1. **Primary fields to fetch and use:**
   - Wedding Date, Location (City + State), Budget, Services, Comments
   - Person name, email, phone
   - Deal status and creation date

2. **Parse intelligently:**
   - Services field needs parsing to extract individual services
   - Comments field contains structured data (venue, type, religious, notes)
   - Deal title can be parsed for date/name/location backup

3. **Data enrichment:**
   - Calculate lead pricing based on service level and budget
   - Parse services into array format
   - Extract venue details from notes field
   - Mask contact information appropriately

4. **Fields to ignore:**
   - Internal tracking IDs
   - Marketing attribution fields
   - Empty venue address fields
   - Session/pixel tracking data

5. **Data validation:**
   - Always prefer Deal's wedding date over Person's
   - Check both `value` and budget custom field
   - Handle missing guest counts gracefully
   - Default to deal title for location if state field is empty
