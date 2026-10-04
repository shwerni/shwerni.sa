// the public page of a consultant: a center consultant lives under its center's route
// (centers spec §10), a platform consultant under /consultants
export const consultantPath = (cid: number, centerSlug?: string | null) =>
  centerSlug
    ? `/centers/${centerSlug}/consultants/${cid}`
    : `/consultants/${cid}`;
