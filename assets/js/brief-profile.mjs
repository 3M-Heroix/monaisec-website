// Match explicit deployment statements. Legal classifications remain manual.
const signals = {
  jurisdiction: [
    ['European Union', /^(?:(?:primary jurisdiction|deployment (?:market|location))\s*[:–-]\s*|(?:the )?(?:ai )?(?:agent|system) is deployed in )(?:the )?(?:eu|european union|france|germany|italy|spain)$/i],
    ['United Kingdom', /^(?:(?:primary jurisdiction|deployment (?:market|location))\s*[:–-]\s*|(?:the )?(?:ai )?(?:agent|system) is deployed in )(?:the )?(?:uk|united kingdom)$/i],
    ['United States', /^(?:(?:primary jurisdiction|deployment (?:market|location))\s*[:–-]\s*|(?:the )?(?:ai )?(?:agent|system) is deployed in )(?:the )?(?:us|usa|united states)$/i],
    ['Singapore', /^(?:(?:primary jurisdiction|deployment (?:market|location))\s*[:–-]\s*|(?:the )?(?:ai )?(?:agent|system) is deployed in )singapore$/i],
    ['China', /^(?:(?:primary jurisdiction|deployment (?:market|location))\s*[:–-]\s*|(?:the )?(?:ai )?(?:agent|system) is deployed in )china$/i],
    ['Morocco', /^(?:(?:primary jurisdiction|deployment (?:market|location))\s*[:–-]\s*|(?:the )?(?:ai )?(?:agent|system) is deployed in )morocco$/i],
  ],
  activity: [
    ['payments', /^(?:(?:use case|financial activity)\s*[:–-]\s*payments?|(?:the )?(?:ai )?(?:agent|system) (?:drafts|prepares|executes|recommends) (?:payment instructions|payments|money transfers)(?:[ ,].*)?)$/i],
    ['trading', /^(?:use case|financial activity)\s*[:–-]\s*(?:trading|investment services)$/i],
    ['credit', /^(?:use case|financial activity)\s*[:–-]\s*(?:credit|lending|credit scoring)$/i],
    ['insurance', /^(?:use case|financial activity)\s*[:–-]\s*(?:insurance|underwriting)$/i],
    ['aml', /^(?:use case|financial activity)\s*[:–-]\s*(?:aml|kyc|fraud detection)$/i],
    ['customer-service', /^(?:use case|financial activity)\s*[:–-]\s*customer service$/i],
    ['asset-management', /^(?:use case|financial activity)\s*[:–-]\s*asset management$/i],
    ['internal-operations', /^(?:use case|financial activity)\s*[:–-]\s*internal operations$/i],
  ],
  autonomy: [
    ['approval', /^(?:(?:agent )?autonomy\s*[:–-]\s*human approval|(?:a |the )?(?:treasury analyst|human operator|human reviewer|human analyst) (?:must approve|approves and submits)\b.*)$/i],
    ['assistant', /^(?:agent )?autonomy\s*[:–-]\s*(?:assistant|information only)$/i],
    ['bounded', /^(?:agent )?autonomy\s*[:–-]\s*bounded execution$/i],
    ['high', /^(?:agent )?autonomy\s*[:–-]\s*high autonomy$/i],
  ],
  authority: [
    ['read', /^(?:system authority|agent permissions)\s*[:–-]\s*read[- ]only$/i],
    ['recommend', /^(?:(?:system authority|agent permissions)\s*[:–-]\s*recommend(?:ation)?(?:s)? only|(?:the )?(?:ai )?(?:agent|system) (?:drafts|prepares) payment instructions)$/i],
    ['modify', /^(?:system authority|agent permissions)\s*[:–-]\s*modify records$/i],
    ['transact', /^(?:(?:system authority|agent permissions)\s*[:–-]\s*execute (?:payments|trades|transactions)|(?:the )?(?:ai )?(?:agent|system) executes (?:payments|trades|money transfers))$/i],
  ],
  personal: [
    ['yes', /^(?:(?:personal data\s*[:–-]\s*(?:yes|processed))|(?:the )?(?:ai )?(?:agent|system) processes personal data)$/i],
    ['no', /^(?:(?:personal data\s*[:–-]\s*(?:no|none))|(?:the )?(?:ai )?(?:agent|system) does not process personal data)$/i],
  ],
  thirdparty: [
    ['yes', /^(?:(?:third-party ai|hosting)\s*[:–-]\s*(?:external model|external cloud provider)|(?:the )?(?:ai )?(?:agent|system) uses (?:an external model|a third-party cloud provider))$/i],
    ['no', /^(?:third-party ai|hosting)\s*[:–-]\s*(?:no|self-hosted only)$/i],
  ],
};

export function suggestProfile(pages) {
  const evidenceByField = new Map();
  for (const {text, page} of pages) {
    for (const part of text.split(/(?<=[.!?])\s+|[\r\n;]+/u)) {
      const excerpt = part.trim().replace(/^[-•]\s*/, '');
      const statement = excerpt.replace(/[.!?]+$/, '');
      for (const [field, options] of Object.entries(signals)) {
        for (const [value, pattern] of options) {
          if (!pattern.test(statement)) continue;
          if (!evidenceByField.has(field)) evidenceByField.set(field, new Map());
          const matches = evidenceByField.get(field);
          if (!matches.has(value)) matches.set(value, {value, page, excerpt: excerpt.slice(0, 200)});
        }
      }
    }
  }
  return [...evidenceByField].map(([field, matches]) => ({field, matches: [...matches.values()]}));
}
