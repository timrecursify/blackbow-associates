# Pipedrive to Database Field Mapping

**Purpose:** Exact field mapping from Pipedrive to our wedding vendor lead marketplace database

---

## 📊 DEAL FIELDS MAPPING

| Our Database Field | Pipedrive Field Name | Pipedrive Field Key | Type | Hidden Pre-Purchase |
|-------------------|---------------------|---------------------|------|---------------------|
| `id` | - | Auto-generated UUID | String | ❌ No |
| `firstName` | Person.first_name | `first_name` | String | ✅ **YES** |
| `lastName` | Person.last_name | `last_name` | String | ✅ **YES** |
| `weddingDate` | [E] Wedding Date | `48d02678bc42b89d4899408183ca63194a968a2f` | DateTime | ❌ No |
| `city` | [E] City | `bb1b06f9856098ab1fff967789d2a34cf8c32071` | String | ❌ No |
| `state` | [E] State | `ab8da96fa06f5bba3ed7a744abd1808bca457c2a` | String | ❌ No |
| `description` | [S] Package Description | `3edd86479b253c3d1974945fead02517ec2cce2c` | Text | ❌ No |
| `ethnicReligious` | Ethnic/Religious | `137b84c97a24ee17c40306b80ad3ec87ad8b4057` | String | ❌ No |
| `expectedValue` | - | Calculated by AI (not from PD) | Decimal | ❌ No |
| `pipedriveDealId` | Deal ID | `id` | Integer | ❌ No |

**Additional Deal Fields for Context:**
- `value` - Deal monetary value (use for budget range)
- `status` - Deal status (filter for "open" only)
- `add_time` - Deal created timestamp
- `title` - Deal title (format: "MM/DD/YY | Name | Location")

---

## 👤 PERSON FIELDS MAPPING

| Our Database Field | Pipedrive Field Name | Pipedrive Field Key | Type | Shown on Frontend |
|-------------------|---------------------|---------------------|------|-------------------|
| `firstName` | First Name | `first_name` | String | ❌ No |
| `lastName` | Last Name | `last_name` | String | ❌ No |
| `personName` | Name (Full) | `name` | String | ❌ No |
| `city` | City | Use Deal City or parse from address | String | ❌ No |
| `source` | Source | `b2be79ec6d74810f141ff0c10950d09a251841d5` | String | ❌ No |
| `gclid` | GCLID | `9aad4a1b8a9bcd93dc31ec8c4efea5f2d3123c58` | String | ❌ No |
| `fbclid` | Facebook Click ID | `6d9fa7cac69ac961197fe160a6e0303cc103db3c` | String | ❌ No |
| `utmTerm` | UTM_Term | `69ce2c893d7c87679967b12727805d693463a5fe` | String | ❌ No |
| `spUtmCampaign` | SP UTM Campaign | `0c0266c6a8ca36806465ba11d0a0b7cd01401107` | String | ❌ No |
| `utmContent` | UTM_Content | `8f230578a37b1f6cc9735b2659d00f69a407cedd` | String | ❌ No |
| `utmMedium` | UTM_Medium | `793eed228dab55f371b7a463d6272c25c10d2592` | String | ❌ No |
| `eventId` | Event ID | `8cf49560ecaa68f90d3e4e103a8267ca5d4dc621` | String | ❌ No |
| `sessionId` | Session ID | `b0067e0f4c9d31fe12a9067ea0c2f728079ada9e` | String | ❌ No |
| `pixelId` | Pixel ID | `5365d081bd139123cdac311b49c9b207f6a2ff7b` | String | ❌ No |
| `projectId` | Project ID | `7aea416f749df1c9b88bbf3a75d0377475b771e4` | String | ❌ No |
| `conversionPageUrl` | Page URL | `a5fda325cf12108a3156d8572d3e5df1b1157c8f` | Text | ❌ No |
| `active` | - | Internal database flag | Boolean | ❌ No |
| `comment` | - | Internal free-text field | Text | ❌ No |

**Additional Person Fields for Contact:**
- `email` - Email array (use primary: `email[0].value`)
- `phone` - Phone array (use primary: `phone[0].value`)

---

## 🗂️ DATABASE SCHEMA RECOMMENDATION

### Leads Table (Main)

```prisma
model Lead {
  // Primary identification
  id                String    @id @default(uuid())
  pipedriveDealId   Int?      @unique
  
  // Deal fields (visible on marketplace)
  weddingDate       DateTime?
  city              String?
  state             String?
  description       String?   // Package description
  ethnicReligious   String?   // Yes/No or specific value
  
  // Person fields (hidden until purchase)
  firstName         String?   // Hidden pre-purchase
  lastName          String?   // Hidden pre-purchase
  personName        String?   // Full name from PD
  
  // Marketing/Tracking fields (not shown on frontend)
  source            String?
  gclid             String?
  fbclid            String?
  utmTerm           String?
  spUtmCampaign     String?
  utmContent        String?
  utmMedium         String?
  eventId           String?
  sessionId         String?
  pixelId           String?
  projectId         String?
  conversionPageUrl String?   @db.Text
  
  // Internal fields
  expectedValue     Decimal?  @db.Decimal(10,2) // AI-calculated score
  active            Boolean   @default(true)
  comment           String?   @db.Text
  
  // Marketplace fields (existing)
  price             Decimal   @default(20.00) @db.Decimal(10,2)
  status            LeadStatus @default(AVAILABLE)
  
  // Contact info (full - revealed after purchase)
  email             String?
  phone             String?
  
  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  purchases         LeadPurchase[]
  
  @@index([weddingDate])
  @@index([state])
  @@index([status])
  @@index([active])
  @@index([pipedriveDealId])
}
```

---

## 📝 FIELD EXTRACTION LOGIC

### From Pipedrive Deal API Response

```javascript
// Extract deal fields
const dealData = {
  id: deal.id,
  weddingDate: deal['48d02678bc42b89d4899408183ca63194a968a2f'],
  city: deal['bb1b06f9856098ab1fff967789d2a34cf8c32071'],
  state: deal['ab8da96fa06f5bba3ed7a744abd1808bca457c2a'],
  description: deal['3edd86479b253c3d1974945fead02517ec2cce2c'],
  ethnicReligious: deal['137b84c97a24ee17c40306b80ad3ec87ad8b4057'],
  status: mapPipedriveStatus(deal.status),
  value: deal.value || deal['33038301b72d27037bfe4a71394126dfd58f1753']
};
```

### From Pipedrive Person API Response

```javascript
// Extract person fields
const personData = {
  firstName: person.first_name,
  lastName: person.last_name,
  personName: person.name,
  email: person.email?.[0]?.value,
  phone: person.phone?.[0]?.value,
  
  // Marketing fields
  source: person['b2be79ec6d74810f141ff0c10950d09a251841d5'],
  gclid: person['9aad4a1b8a9bcd93dc31ec8c4efea5f2d3123c58'],
  fbclid: person['6d9fa7cac69ac961197fe160a6e0303cc103db3c'],
  utmTerm: person['69ce2c893d7c87679967b12727805d693463a5fe'],
  spUtmCampaign: person['0c0266c6a8ca36806465ba11d0a0b7cd01401107'],
  utmContent: person['8f230578a37b1f6cc9735b2659d00f69a407cedd'],
  utmMedium: person['793eed228dab55f371b7a463d6272c25c10d2592'],
  eventId: person['8cf49560ecaa68f90d3e4e103a8267ca5d4dc621'],
  sessionId: person['b0067e0f4c9d31fe12a9067ea0c2f728079ada9e'],
  pixelId: person['5365d081bd139123cdac311b49c9b207f6a2ff7b'],
  projectId: person['7aea416f749df1c9b88bbf3a75d0377475b771e4'],
  conversionPageUrl: person['a5fda325cf12108a3156d8572d3e5df1b1157c8f']
};
```

---

## 🔐 MASKING STRATEGY

### Pre-Purchase (Masked Info)
```javascript
maskedInfo: {
  // Show on marketplace
  weddingDate: lead.weddingDate,
  city: lead.city,
  state: lead.state,
  description: lead.description,
  ethnicReligious: lead.ethnicReligious ? 'Yes' : 'No',
  
  // Hide contact details
  firstName: '***',
  lastName: '***',
  email: '***@***.***',
  phone: '***-***-****'
}
```

### Post-Purchase (Full Info)
```javascript
fullInfo: {
  // Reveal everything
  firstName: lead.firstName,
  lastName: lead.lastName,
  personName: lead.personName,
  email: lead.email,
  phone: lead.phone,
  
  // All deal details
  weddingDate: lead.weddingDate,
  city: lead.city,
  state: lead.state,
  description: lead.description,
  ethnicReligious: lead.ethnicReligious,
  
  // Marketing data (for vendor's internal use)
  source: lead.source,
  utmCampaign: lead.spUtmCampaign
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Update Prisma schema with all required fields
- [ ] Create migration for new fields
- [ ] Update Pipedrive service to fetch correct field keys
- [ ] Implement masking logic for pre/post purchase
- [ ] Add AI expected value calculation endpoint
- [ ] Test with actual Pipedrive data since Aug 1, 2025
- [ ] Ensure marketing fields are never shown on frontend
- [ ] Add admin interface for `comment` field and `active` toggle

---

## 🎯 NOTES

1. **Ethnic/Religious field:** In Pipedrive, this is a free-text field. You may want to normalize to Yes/No in your database.

2. **Expected Value (EV):** This will be calculated by AI later - not from Pipedrive. You'll need to build a separate service for this.

3. **City field:** Person city should fallback to Deal city if not available on person record.

4. **Marketing fields:** All UTM, click ID, and tracking fields should NEVER be shown on the frontend marketplace - they're for internal analytics only.

5. **Active flag:** Internal database field to enable/disable leads without deleting them.

6. **Comment field:** Free-text field for internal notes about the lead (not from Pipedrive).
