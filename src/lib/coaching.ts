export function realisticCoachNote(score: number, missed: string[]) {
  if (score >= 85) return {
    title: 'Keep the content; improve delivery now.',
    message: 'This answer covers the panel’s likely marking points. Do not add more facts. Practise a calm opening, brief pauses and a firm final sentence.',
    swahili: 'Usiongeze mengi—sema kwa utulivu na kujiamini.',
  };
  if (score >= 70) return {
    title: 'A panel can follow this answer.',
    message: `You are close. Add ${missed[0] || 'one concrete example'}, then repeat the answer once without reading. Aim for five clear points, not a perfect speech.`,
    swahili: 'Uko karibu—ongeza pointi moja muhimu, kisha rudia.',
  };
  if (score >= 50) return {
    title: 'The direction is right; the evidence is still thin.',
    message: `Do not start again from zero. Keep your strongest sentence and add these two anchors: ${missed.slice(0, 2).join(' and ') || 'a specific example and the inspector action'}.`,
    swahili: 'Hii si kushindwa; jenga juu ya ulichojibu vizuri.',
  };
  return {
    title: 'A difficult answer has shown you exactly what to study.',
    message: `Pause and learn only the first two missing points: ${missed.slice(0, 2).join(' and ') || 'definition and inspector relevance'}. Say them aloud, then retry. One weak attempt is useful evidence—not a prediction of your interview result.`,
    swahili: 'Polepole ndiyo mwendo—pointi mbili kwanza, halafu jaribu tena.',
  };
}
