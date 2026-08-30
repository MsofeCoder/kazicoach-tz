import type { OralQuestion, QuestionCategory, WrittenQuestion } from './types';

export const panelMembers = [
  { id: 'chair', name: 'Dr. Asha M.', role: 'Chairperson', style: 'Firm & welcoming', speciality: 'Opening, judgement and ethics' },
  { id: 'secretary', name: 'Mr. Joseph K.', role: 'Panel Secretary', style: 'Clear & precise', speciality: 'Role duties and records' },
  { id: 'technical-1', name: 'Eng. Baraka N.', role: 'Technical Member I', style: 'Deep & analytical', speciality: 'Nuclear physics and instruments' },
  { id: 'technical-2', name: 'Ms. Neema P.', role: 'Technical Member II', style: 'Calm & detailed', speciality: 'Inspection, QC and QA' },
  { id: 'hr', name: 'Mrs. Rehema S.', role: 'Public Service Member', style: 'Soft but probing', speciality: 'Competency and integrity' },
] as const;

export function panelMemberForQuestion(category: QuestionCategory, index: number) {
  const preferred: Record<QuestionCategory, number[]> = {
    personal: [0, 4],
    role: [1, 0],
    technical: [2, 3],
    scenario: [3, 0],
    ethics: [4, 0],
  };
  const choices = preferred[category];
  return panelMembers[choices[index % choices.length]];
}

export const categoryLabels = {
  personal: 'Personal fit',
  role: 'Role & law',
  technical: 'Technical',
  scenario: 'Scenarios',
  ethics: 'Ethics',
} as const;

export const memoryAids: Record<string, { code: string; phrase: string; points: string[] }> = {
  'oral-01': { code: 'SEAT+', phrase: 'Skills · Experience · Achievement · Type · Employer value', points: ['State the most relevant qualification from your CV.', 'Mention one experience that matches the advertised duties.', 'Use one real project or achievement as evidence.', 'Name inspector-ready qualities: analytical, disciplined and honest.', 'Finish with how you will help the regulator protect people and the environment.'] },
  'oral-05': { code: 'LICAR', phrase: 'Licence · Inspect · Correct · Assess · Report', points: ['Conduct inspection and licensing work.', 'Plan risk-informed regulatory inspections.', 'Follow up corrective and remedial actions.', 'Perform surveillance plus QC/QA assessment.', 'Report findings, maintain violation records and coordinate zones.'] },
  'oral-07': { code: 'PEARF', phrase: 'Prepare · Enter · Assess · Report · Follow up', points: ['Prepare scope, licence history, risks and instruments.', 'Enter professionally: identify yourself and hold an opening meeting.', 'Assess documents, people, premises and measurements objectively.', 'Report and explain evidence-based findings at close-out.', 'Follow up until corrective actions are verified.'] },
  'oral-08': { code: 'P-SAFE', phrase: 'Practice · Source · Ability · Facility · Emergency', points: ['Identify the applicant, proposed practice and purpose.', 'Record source/equipment specifications and inventory.', 'Confirm qualified staff and a radiation protection programme.', 'Assess premises, shielding, calibration and QC/QA arrangements.', 'Verify emergency, security, waste and exposure-control plans.'] },
  'oral-10': { code: 'TDS-V', phrase: 'Time · Distance · Shielding · Verify', points: ['Define ALARA as optimization, not simply a dose limit.', 'Reduce time near a source through planning.', 'Increase distance and apply the inverse-square principle appropriately.', 'Use suitable structural or portable shielding.', 'Verify staff actually follow procedures and monitoring controls.'] },
  'oral-12': { code: 'B-FACT', phrase: 'Baseline · Frequency · Action · Calibration · Trend', points: ['Separate equipment QC tests from the wider QA system.', 'Check baselines, test frequency, tolerance and action levels.', 'Confirm staff competence and clear responsibilities.', 'Verify instrument calibration, maintenance and traceability.', 'Follow trends and prove failures led to correction and retesting.'] },
  'oral-13': { code: '3C-TI', phrase: 'Consignor · Carrier · Consignee · Transport Index', points: ['Define TI using the prescribed radiation level at one metre.', 'Explain that TI supports segregation, stowage and accumulation control.', 'Consignor classifies, packages, labels and documents.', 'Carrier transports securely and follows emergency controls.', 'Consignee inspects, reports abnormalities and stores safely.'] },
  'oral-14': { code: 'SCPTS', phrase: 'Segregate · Contain · Protect · Track · Send safely', points: ['Minimize and characterize waste at generation.', 'Segregate by radionuclide, activity, half-life and form.', 'Package, label and shield in approved containers.', 'Store securely with inventory, monitoring and records.', 'Use only authorized treatment, transport and disposal routes.'] },
  'oral-16': { code: 'SCAN-D', phrase: 'Stop · Control · Assess · Notify · Document', points: ['Stop activity and protect people first.', 'Control access; do not touch or move the container.', 'Assess from a safe distance with calibrated instruments.', 'Notify the RSO, management and TAEC emergency chain.', 'Document readings, actions and authorized recovery.'] },
  'oral-17': { code: 'RISK-D', phrase: 'Risk · Inspect · Stop · Keep service safe · Document', points: ['Let verified risk and law—not pressure—drive the decision.', 'Inspect and confirm the severity objectively.', 'Stop or restrict dangerous equipment through lawful channels.', 'Support safe alternatives for urgent patients where feasible.', 'Document the decision, corrective actions and follow-up.'] },
  'oral-19': { code: 'RROC', phrase: 'Refuse · Record · Officially report · Continue objectively', points: ['Refuse the offer clearly and immediately.', 'Do not negotiate or make unsafe accusations.', 'Record facts and preserve available evidence.', 'Report through official integrity and TAEC channels.', 'Continue the technical finding objectively with due process.'] },
  'oral-20': { code: 'DRCS', phrase: 'Disclose · Recuse · Confidentiality · Safeguards', points: ['Disclose the relationship before the inspection.', 'Explain the actual or perceived conflict.', 'Request recusal and reassignment.', 'Protect confidential information and avoid private discussion.', 'If urgent, work only under documented independent safeguards.'] },
  'oral-21': { code: 'DANGER', phrase: 'Don’t touch · Area · Notify · Gauge · Extract · Review', points: ['Tell the public not to touch or move the suspected source.', 'Isolate the area and identify potentially exposed people.', 'Notify TAEC and coordinate police/local responders.', 'Gauge radiation safely using trained staff and calibrated meters.', 'Recover securely, document custody and investigate the source.'] },
  'oral-22': { code: 'FACTS', phrase: 'Facts · Actions · Clarity · Trust · Schedule', points: ['Use an authorized spokesperson and verified facts.', 'Say what happened and what action authorities are taking.', 'Use clear, empathetic language with specific public instructions.', 'State what is known and unknown without false reassurance.', 'Give the time and channel for the next update.'] },
  'oral-23': { code: 'REACT', phrase: 'Requirement · Evidence · Assessment · Correction · Trace', points: ['Cite the exact applicable requirement.', 'State objective, traceable evidence.', 'Assess the compliance gap and safety significance.', 'Specify the corrective outcome and timeframe.', 'Trace the finding through documented follow-up verification.'] },
  'oral-25': { code: 'DEUCE', phrase: 'Define · Examples · Uses · Consequences · Examine controls', points: ['Define ionizing radiation as energy that produces ions.', 'Give examples: alpha, beta, gamma, X-rays and neutrons.', 'Mention beneficial medical, industrial or research uses.', 'Explain that uncontrolled exposure can damage tissue.', 'Link to risk-based authorization, monitoring and protection.'] },
  'oral-26': { code: 'TS-PE', phrase: 'Threshold/Severity · Probability/Examples', points: ['Tissue reactions generally have a dose threshold.', 'Their severity increases above that threshold.', 'Stochastic effect probability increases with dose.', 'Use a tissue injury and cancer as clear examples.', 'Link both to prevention, optimization and monitoring.'] },
  'oral-27': { code: 'FIELD', phrase: 'Field · Irradiation stops · Element/material · Limit spread · Different controls', points: ['Exposure means being in a radiation field.', 'Exposure does not automatically make a person radioactive.', 'Contamination means radioactive material is on or inside.', 'Contamination may continue and spread.', 'Choose monitoring, PPE and decontamination to match the event.'] },
  'oral-28': { code: 'ABGN', phrase: 'Alpha · Beta · Gamma · Neutron', points: ['Alpha: short range; paper/skin stops it; intake is important.', 'Beta: moderate range; use suitable low-Z material first.', 'Gamma: penetrating photons; use lead or adequate concrete.', 'Neutrons: use hydrogen-rich shielding and absorbers.', 'Base the final design on energy, source and approved calculation.'] },
  'oral-29': { code: 'S-CUBA', phrase: 'Suitable · Calibration · Units · Background · Action', points: ['Select a meter and probe suitable for the radiation.', 'Check physical condition, battery, display and alarms.', 'Confirm valid calibration and correction factors.', 'Check units/range, background and check-source response.', 'Use dosimetry, record the meter and act on abnormal readings.'] },
  'oral-30': { code: 'DOCES', phrase: 'Documents · Operators · Controls · Equipment · Survey', points: ['Review authorization, programme, inventory and records.', 'Confirm qualified operators, training and monitoring.', 'Inspect shielding, signs, access, indicators and local rules.', 'Check equipment condition and applicable QC tests.', 'Survey safely, report findings and schedule follow-up.'] },
  'oral-31': { code: 'SIN-CER', phrase: 'Stop · Isolate · Notify · Clean · Evaluate · Report', points: ['Stop work and isolate the spill area.', 'Assess radionuclide, activity, people and spread.', 'Notify the RSO, management and TAEC as required.', 'Decontaminate people gently under the approved plan.', 'Resurvey, package waste, document and investigate.'] },
  'oral-32': { code: 'HALF', phrase: 'Halves · Activity · Logs · Fallout/decay · Fixed', points: ['Define the time for activity to reduce by half.', 'Give the 50 percent then 25 percent example.', 'Use it when checking current source activity and records.', 'Apply it to authorized decay storage and waste decisions.', 'Remember it is a fixed nuclear property of the radionuclide.'] },
  'oral-33': { code: 'STAR-I', phrase: 'Situation · Task · Action · Result/lesson · Inspector link', points: ['Name one relevant research project from your own CV.', 'State the objective without inventing a result.', 'Explain your measurement, checking or analysis approach.', 'Give the safety, quality and teamwork lesson.', 'Link the lesson to calibrated, evidence-based inspection.'] },
};

export const oralQuestions: OralQuestion[] = [
  {
    id: 'oral-01', category: 'personal', difficulty: 'Core', timeLimit: 90,
    question: 'Tell us about yourself and why your background fits the Radiation Safety Inspector II role.',
    swHint: 'Anza na elimu, ushahidi wa uzoefu, ujuzi unaohamishika, halafu malizia na thamani utakayoleta TAEC.',
    modelAnswer: 'I would begin with my most relevant Physics or Nuclear Physics qualification, then name one genuine experience from my CV that developed technical observation, measurement or communication. I would add one real project, attachment or achievement and explain the specific lesson it gave me about safety, quality or evidence. I would then connect my analytical ability, integrity and documentation habits to regulatory inspection. I would finish by explaining that I want to support safe and peaceful use of radiation while protecting workers, patients, the public and the environment. Every claim must match my own uploaded CV; I would not copy another candidate’s background.',
    keyPoints: ['Relevant Physics qualification', 'role-related experience', 'real project or attachment', 'inspection-relevant skills', 'public protection'],
    keywords: [['physics', 'nuclear physics', 'qualification', 'degree'], ['experience', 'teaching', 'communication', 'measurement'], ['project', 'attachment', 'achievement', 'research'], ['inspect', 'evidence', 'document', 'integrity'], ['workers', 'patients', 'public', 'environment']],
    source: 'Candidate sample + TAEC role pack', followUp: 'What is the strongest skill you would bring in your first six months?'
  },
  {
    id: 'oral-02', category: 'personal', difficulty: 'Core', timeLimit: 75,
    question: 'You have worked as a Physics teacher. Why do you now want to become a radiation safety inspector?',
    swHint: 'Usidharau ualimu. Uonyeshe kuwa ni msingi wa mawasiliano, uwajibikaji na kujifunza kwa makini.',
    modelAnswer: 'Teaching has been valuable preparation, not a detour. It kept my Physics fundamentals active and trained me to communicate difficult ideas to people with different levels of knowledge. Regulatory inspection needs the same clarity when explaining a finding, a safety requirement, or a corrective action to a licensee. I am now ready to apply my degree more directly to radiation protection. The inspector role combines technical analysis, field observation, impartial decision-making, and public service. That combination matches both my training and my motivation. I would enter the role ready to learn TAEC procedures under supervision, prepare accurate reports, and contribute to consistent compliance across facilities.',
    keyPoints: ['Teaching as an asset', 'transferable communication', 'radiation protection motivation', 'public service', 'readiness to learn'],
    keywords: [['teaching', 'teacher'], ['communicat', 'explain'], ['radiation protection', 'safety'], ['public service', 'protect the public'], ['learn', 'supervision', 'procedure']],
    source: 'Candidate sample + coaching synthesis'
  },
  {
    id: 'oral-03', category: 'personal', difficulty: 'Core', timeLimit: 75,
    question: 'Why do you want to work for TAEC, and what does public service mean to you?',
    swHint: 'Unganisha mamlaka ya TAEC na uadilifu, usawa, uwajibikaji na ulinzi wa wananchi.',
    modelAnswer: 'I want to work for TAEC because its mandate connects Physics with direct national benefit. TAEC regulates the safe and peaceful use of atomic energy and radiation sources, including licensing, inspections, emergency preparedness, and protection of workers, patients, the public, and the environment. Public service means applying the same lawful standard to every facility, making decisions from evidence rather than personal influence, and being accountable for both action and inaction. As an inspector, I would represent the Commission professionally, protect confidential information, document findings accurately, and follow through until corrective actions are verified. That responsibility and national impact are the main reasons the role appeals to me.',
    keyPoints: ['TAEC mandate', 'national/public benefit', 'impartiality', 'evidence and accountability', 'follow-up'],
    keywords: [['taec', 'commission'], ['safe', 'protect', 'protection'], ['impartial', 'same standard', 'fair'], ['evidence', 'accountab', 'document'], ['follow-up', 'corrective action']],
    source: 'TAEC functions + coaching synthesis'
  },
  {
    id: 'oral-04', category: 'personal', difficulty: 'Foundation', timeLimit: 75,
    question: 'What are your main strengths, and what professional area are you actively improving?',
    swHint: 'Taja nguvu 2–3 zenye ushahidi. Udhaifu uwe wa kweli lakini uonyeshe mpango wa kuuboresha.',
    modelAnswer: 'My first strength is analytical discipline: Physics trained me to check assumptions, units, measurements, and conclusions before reporting. My second is communication: teaching helped me explain technical ideas clearly and listen for misunderstanding. My third is documentation and preparation, which are essential for defensible inspection reports. One area I am actively improving is the depth of my direct regulatory field experience. I would address it through TAEC induction, studying inspection procedures and applicable regulations, observing experienced inspectors, using approved checklists, and asking for review of my early reports. I will never hide a knowledge gap; I will seek guidance while remaining accountable for learning quickly.',
    keyPoints: ['Relevant strengths', 'evidence', 'honest development area', 'specific improvement plan', 'safe humility'],
    keywords: [['analytical', 'detail', 'check'], ['communication', 'teaching'], ['document', 'report'], ['field experience', 'regulatory experience'], ['training', 'mentor', 'guidance', 'learn']],
    source: 'Candidate sample + coaching synthesis'
  },
  {
    id: 'oral-05', category: 'role', difficulty: 'Core', timeLimit: 120,
    question: 'What are the main duties of a Radiation Safety Inspector II in the vacancy you applied for?',
    swHint: 'Panga majukumu kwa vikundi: leseni, ukaguzi, ufuatiliaji, QC/QA, taarifa na compliance.',
    modelAnswer: 'The advertised duties fall into six connected groups. First, conduct inspection and licensing activities and collect the technical data needed to process applications. Second, prepare programmes for regulatory inspections of ionizing-radiation practices. Third, arrange follow-up inspections to verify implementation of required remedial measures. Fourth, conduct radiation surveillance and quality-control tests on premises and equipment. Fifth, prepare inspection and surveillance reports for the relevant committees and maintain a register of violations. Sixth, coordinate with designated zonal personnel to monitor compliance and help prepare and implement QC and QA programmes for diagnostic radiography, medical imaging, and therapy. I would also perform related duties assigned by my seniors.',
    keyPoints: ['Inspection and licensing', 'inspection programmes', 'follow-up', 'surveillance and QC', 'reports/violations', 'zonal coordination and QA'],
    keywords: [['inspection', 'licensing'], ['programme', 'program'], ['follow-up', 'remedial', 'corrective'], ['surveillance', 'quality control', 'qc'], ['report', 'violations', 'register'], ['zones', 'zonal', 'quality assurance', 'qa']],
    source: 'PSRS vacancy announcement, 7 Dec 2025'
  },
  {
    id: 'oral-06', category: 'role', difficulty: 'Core', timeLimit: 90,
    question: 'What is TAEC’s regulatory mandate under the Atomic Energy Act No. 7 of 2003?',
    swHint: 'Eleza authorization/licensing, inspections, enforcement, dharura, taka za mionzi na ushauri kwa Serikali.',
    modelAnswer: 'The Atomic Energy Act No. 7 of 2003 establishes TAEC as Tanzania’s body for controlling and promoting the safe and peaceful use of atomic energy and radiation sources and advising the Government on related international obligations. Its regulatory mandate includes notification and authorization through registration and licensing, reviewing safety submissions, inspecting radiation practices and premises, requiring corrective action, controlling ionizing and non-ionizing radiation, supporting control of radioactivity in food and the environment, managing radioactive-waste controls, and operating national radiological emergency preparedness. Where safety standards are breached, the Commission has enforcement powers, including ordering closure in serious circumstances. An inspector exercises delegated powers lawfully, proportionately, and with proper records.',
    keyPoints: ['Act No. 7 of 2003', 'authorization/licensing', 'inspection/corrective action', 'waste/environment', 'emergency preparedness', 'lawful enforcement'],
    keywords: [['atomic energy act', 'act no. 7', '2003'], ['registration', 'licensing', 'authorization'], ['inspect', 'corrective action'], ['waste', 'environment'], ['emergency', 'preparedness'], ['enforcement', 'closure', 'lawful']],
    source: 'TAEC official functions + Atomic Energy Act'
  },
  {
    id: 'oral-07', category: 'role', difficulty: 'Core', timeLimit: 105,
    question: 'Walk the panel through how you would conduct a risk-informed regulatory inspection.',
    swHint: 'Kabla, wakati, baada: scope na historia; opening; ushahidi; close-out; report; follow-up.',
    modelAnswer: 'Before the visit, I would confirm the legal authority, inspection scope, facility licence and conditions, previous findings, source inventory, and risk priorities. On arrival I would identify myself, hold an opening meeting, confirm responsible personnel, and explain the scope. I would then gather objective evidence through observation, document review, interviews, radiation measurements with calibrated instruments, and appropriate QC checks. I would compare evidence with the Act, regulations, licence conditions, and approved procedures. Immediate danger would be escalated without delay. At close-out I would explain factual findings and required next steps without arguing or making promises outside my authority. I would then prepare a clear report, classify findings, preserve evidence, recommend proportionate action, and schedule follow-up verification.',
    keyPoints: ['Pre-inspection review', 'opening and authority', 'objective evidence', 'measurement/calibration', 'close-out/report', 'risk-based follow-up'],
    keywords: [['scope', 'licence', 'previous'], ['opening meeting', 'identify'], ['evidence', 'observation', 'interview', 'document'], ['calibrated', 'measurement', 'qc'], ['close-out', 'report', 'finding'], ['risk', 'follow-up', 'verify']],
    source: 'Role duties + regulatory inspection practice'
  },
  {
    id: 'oral-08', category: 'role', difficulty: 'Core', timeLimit: 90,
    question: 'What information would you expect in an application for authorization to use a radiation source?',
    swHint: 'Applicant, practice/source, competent staff, protection programme, usalama, dharura, taka na security.',
    modelAnswer: 'I would expect the applicant’s legal identity and addresses; the proposed practice and purpose; the type, model, activity or output, and technical specifications of each source or device; the premises and shielding design; qualified personnel and the appointed radiation safety function; a radiation protection programme including monitoring and local rules; equipment acceptance, maintenance, calibration, QC and QA arrangements; source security and inventory controls; emergency preparedness and reporting arrangements; radioactive-waste plans where applicable; transport arrangements where relevant; and evidence that occupational, patient, public, and environmental exposures will be controlled. I would assess completeness against the applicable regulations and licence category rather than rely on a generic checklist alone.',
    keyPoints: ['Applicant/practice/source', 'qualified staff', 'radiation protection', 'QC/calibration', 'security/emergency', 'waste/exposure control'],
    keywords: [['applicant', 'practice', 'source'], ['qualified', 'personnel', 'radiation safety officer'], ['radiation protection', 'monitoring', 'local rules'], ['calibration', 'quality control', 'qa', 'maintenance'], ['security', 'emergency'], ['waste', 'public', 'environment']],
    source: 'Supplied role context; verify against applicable TAEC forms'
  },
  {
    id: 'oral-09', category: 'role', difficulty: 'Core', timeLimit: 90,
    question: 'Explain the difference between a facility Radiation Safety Officer and a TAEC Radiation Safety Inspector.',
    swHint: 'RSO yuko ndani ya licensee na anatekeleza. Inspector ni regulator huru anayethibitisha na kutekeleza sheria.',
    modelAnswer: 'A facility Radiation Safety Officer is appointed within the licensee’s organisation. The RSO advises the user, supports implementation of the local radiation protection programme, monitors day-to-day compliance, and liaises with TAEC. A TAEC Radiation Safety Inspector acts on behalf of the independent regulator. The inspector examines whether the licensee, including its management and RSO arrangements, complies with the Act, regulations, licence conditions, and safety requirements. The inspector gathers objective evidence, records findings, and supports enforcement and follow-up. The RSO owns internal implementation; the inspector provides external regulatory oversight. They should cooperate professionally, but the inspector must preserve independence and cannot transfer the licensee’s primary safety responsibility to TAEC.',
    keyPoints: ['RSO employed/appointed by licensee', 'daily internal implementation', 'inspector is regulator', 'external verification', 'independence', 'licensee retains responsibility'],
    keywords: [['licensee', 'facility'], ['daily', 'implement', 'radiation protection programme'], ['regulator', 'taec'], ['inspect', 'verify', 'oversight'], ['independent', 'impartial'], ['responsibility', 'licensee remains']],
    source: 'Atomic Energy Act + supplied context'
  },
  {
    id: 'oral-10', category: 'technical', difficulty: 'Foundation', timeLimit: 75,
    question: 'Explain ALARA and give practical inspection examples of time, distance, and shielding.',
    swHint: 'Taja maana, kisha mfano mmoja wa time, distance na shielding; usisahau optimization na dose limits.',
    modelAnswer: 'ALARA means keeping radiation exposure as low as reasonably achievable, taking social and economic factors into account. It is an optimization principle and does not replace justification or compliance with dose limits. During inspection I would look for practical control of time, distance, and shielding. Time can be reduced through planning and rehearsing source-handling tasks. Distance can be increased with remote tools, controlled-area boundaries, and appropriate positioning, remembering the inverse-square relationship for a point source. Shielding can include structural barriers, source containers, mobile screens, or suitable personal protection for the practice. I would also verify procedures, training, monitoring results, and whether controls are actually used—not merely written down.',
    keyPoints: ['ALARA meaning', 'optimization/dose limits', 'time', 'distance', 'shielding', 'verify implementation'],
    keywords: [['as low as reasonably achievable', 'alara'], ['optim', 'dose limit', 'justif'], ['time'], ['distance', 'inverse square'], ['shield', 'barrier', 'container'], ['procedure', 'monitor', 'verify']],
    source: 'TAEC radiation-protection context + international principle'
  },
  {
    id: 'oral-11', category: 'technical', difficulty: 'Foundation', timeLimit: 90,
    question: 'Differentiate absorbed dose, equivalent dose, and effective dose, including their SI units.',
    swHint: 'Absorbed = energy/mass in Gy. Equivalent = radiation weighting in Sv. Effective = tissue weighting in Sv.',
    modelAnswer: 'Absorbed dose is the energy deposited by ionizing radiation per unit mass. Its SI unit is the gray, where one gray equals one joule per kilogram. Equivalent dose applies a radiation weighting factor to absorbed dose to reflect the different biological effectiveness of radiation types; its unit is the sievert. Effective dose further applies tissue weighting factors and sums contributions across organs to provide a protection quantity representing overall stochastic risk; it is also measured in sieverts. Absorbed dose is a physical quantity used directly in applications such as radiotherapy, while equivalent and effective dose are radiation-protection quantities. During inspection I would verify that the right quantity and unit are used for the relevant record and decision.',
    keyPoints: ['Absorbed dose definition', 'gray/J per kg', 'radiation weighting', 'equivalent dose/sievert', 'tissue weighting/effective dose', 'correct application'],
    keywords: [['energy', 'mass', 'absorbed'], ['gray', 'gy', 'joule per kilogram', 'j/kg'], ['radiation weighting', 'wr'], ['equivalent', 'sievert', 'sv'], ['tissue weighting', 'effective'], ['protection', 'quantity', 'unit']],
    source: 'Radiation-protection fundamentals'
  },
  {
    id: 'oral-12', category: 'technical', difficulty: 'Core', timeLimit: 105,
    question: 'How would you assess a facility’s quality control and quality assurance programme?',
    swHint: 'QC ni vipimo; QA ni mfumo mzima. Angalia baseline, frequency, tolerance, calibration, records na corrective action.',
    modelAnswer: 'I would first distinguish QC from QA. Quality control consists of operational techniques and measurements used to confirm equipment performance. Quality assurance is the wider management system that ensures the service consistently meets requirements. I would review equipment inventory, acceptance and commissioning records, baseline values, test procedures, frequencies, tolerances and action levels, responsibilities, staff competence, calibration traceability, preventive maintenance, and trend records. I would observe selected tests and verify that the correct instruments and conditions are used. Most importantly, I would trace an out-of-tolerance result: whether use was restricted when necessary, the cause was investigated, corrective action was authorized, performance was retested, and the event was documented. A complete folder without effective action is not a functioning QA programme.',
    keyPoints: ['QC vs QA', 'baseline/frequency/tolerance', 'competence/calibration', 'observe tests', 'trend records', 'corrective action and retest'],
    keywords: [['quality control', 'qc', 'measurement'], ['quality assurance', 'qa', 'system'], ['baseline', 'frequency', 'tolerance', 'action level'], ['calibration', 'competence', 'maintenance'], ['observe', 'test'], ['corrective action', 'retest', 'record']],
    source: 'PSRS role duties + QA practice'
  },
  {
    id: 'oral-13', category: 'technical', difficulty: 'Core', timeLimit: 90,
    question: 'Explain the purpose of the Transport Index and the main responsibilities in transporting radioactive material.',
    swHint: 'TI inahusiana na dose rate mita 1 na hutumika kwa segregation/control. Taja consignor, carrier, consignee.',
    modelAnswer: 'The Transport Index is a number assigned to certain radioactive-material packages based on the radiation level at one metre from the package, using the prescribed calculation and rounding rules. It helps control package categories, segregation, stowage, and accumulation during transport; it is not a complete description of package risk. The consignor must correctly classify the material, select and prepare the package, mark and label it, and provide accurate transport documents. The carrier must follow handling, stowage, access-control, route, and emergency requirements and protect the package from damage. The consignee should receive and inspect the package, identify damage or abnormal radiation/contamination, secure it, and report as required. The inspector verifies the full chain against applicable transport regulations.',
    keyPoints: ['One-metre radiation level', 'control/segregation', 'consignor', 'carrier', 'consignee', 'regulatory verification'],
    keywords: [['one metre', '1 metre', 'one meter', '1 meter'], ['segregation', 'stowage', 'transport index', 'ti'], ['consignor', 'shipper'], ['carrier', 'transport'], ['consignee', 'receiver'], ['package', 'label', 'document', 'regulation']],
    source: 'Supplied context + IAEA transport principles; verify exact rules'
  },
  {
    id: 'oral-14', category: 'technical', difficulty: 'Core', timeLimit: 105,
    question: 'Describe the radioactive-waste management lifecycle and what you would inspect at each stage.',
    swHint: 'Minimize, characterize, segregate, collect/package, label, store, treat, transport, dispose, records.',
    modelAnswer: 'The lifecycle begins with minimizing waste generation and characterizing it by radionuclide, activity, half-life, physical and chemical form. Waste should then be segregated so incompatible or different categories are not mixed. I would inspect collection containers, packaging integrity, labels, shielding, contamination controls, and records linking each item to its origin. Storage must have controlled access, inventories, monitoring, suitable surfaces and conditions, and arrangements for decay storage where authorized. Treatment and conditioning must follow approved methods. Any transfer or transport requires authorization, compliant packages, documents, and traceability. Final release, return, or disposal must meet approved criteria and be recorded. I would verify the entire chain, including security, emergency arrangements, staff competence, and whether radioactive waste is kept out of ordinary waste streams.',
    keyPoints: ['Minimize/characterize', 'segregate', 'package/label', 'secure storage/inventory', 'authorized treatment/transport/disposal', 'records and no ordinary mixing'],
    keywords: [['minimi', 'characteri'], ['segregat'], ['package', 'container', 'label'], ['storage', 'inventory', 'access'], ['treatment', 'transport', 'disposal', 'authorized'], ['record', 'ordinary waste', 'traceab']],
    source: 'Supplied role context + radioactive-waste principles'
  },
  {
    id: 'oral-15', category: 'technical', difficulty: 'Core', timeLimit: 90,
    question: 'What is the difference between nuclear safety and nuclear security?',
    swHint: 'Safety: ajali na makosa. Security: vitendo vya makusudi. Vyote vina prevention, detection/controls na response lakini threats tofauti.',
    modelAnswer: 'Nuclear and radiation safety focuses mainly on preventing and mitigating accidental exposure or release arising from equipment failure, human error, poor procedures, or natural events. Nuclear security focuses on preventing, detecting, and responding to intentional unauthorized acts such as theft, sabotage, malicious use, or trafficking of nuclear or other radioactive material. The two areas overlap—for example, source inventory, access control, emergency planning, and safety culture support both—but their threat assumptions differ. During inspection I would avoid treating them as competing objectives. Strong security must not obstruct safe emergency access, and safety arrangements must not expose sensitive source information. Findings should be assessed under the correct legal and technical requirements.',
    keyPoints: ['Safety/accidental', 'security/intentional', 'prevention-detection-response', 'overlap', 'balanced controls', 'correct requirements'],
    keywords: [['safety', 'accident', 'error', 'failure'], ['security', 'intentional', 'theft', 'sabotage'], ['prevent', 'detect', 'respond'], ['inventory', 'access control', 'emergency'], ['balance', 'overlap'], ['legal', 'requirement']],
    source: 'Supplied context + nuclear safety/security principles'
  },
  {
    id: 'oral-16', category: 'scenario', difficulty: 'Core', timeLimit: 120,
    question: 'During an inspection you find a damaged source container and unusually high radiation readings. What do you do first?',
    swHint: 'Protect people first. Usiguse. Control area, measure safely, notify, activate emergency plan, preserve facts.',
    modelAnswer: 'I would treat the reading as a potential radiological emergency and protect people before continuing routine inspection. I would stop unnecessary activity, prevent entry, move people to a safe location without spreading possible contamination, and avoid touching or moving the container. Using appropriate calibrated instruments and personal monitoring, trained personnel would assess radiation and contamination from a safe distance. I would immediately notify the facility RSO and management and activate the approved emergency plan, while informing TAEC command channels and other responders as required. Time, distance, and shielding would guide every action. Source recovery would only be attempted by authorized, equipped personnel under a plan. I would record times, readings, people present, actions and dosimetry, preserve evidence, and support later investigation and corrective action.',
    keyPoints: ['Stop/control access', 'do not touch', 'safe measurement', 'notify/activate plan', 'authorized recovery', 'document and investigate'],
    keywords: [['stop', 'restrict', 'control access', 'evacu'], ['do not touch', 'not touch', 'not move'], ['calibrated', 'survey', 'measure', 'distance'], ['notify', 'rso', 'emergency plan', 'taec'], ['authorized', 'recovery', 'trained'], ['record', 'investigat', 'dosimetry']],
    source: 'Supplied emergency context + response principles'
  },
  {
    id: 'oral-17', category: 'scenario', difficulty: 'Stretch', timeLimit: 105,
    question: 'A busy hospital has a serious safety violation but asks you not to interrupt services because patients are waiting. How would you respond?',
    swHint: 'Risk determines action—not pressure. Protect patients, use lawful proportionate control, communicate, document, escalate.',
    modelAnswer: 'I would acknowledge the service pressure but base the decision on radiation risk and legal requirements, not the number of waiting patients. I would verify the facts and determine whether continued operation creates immediate or significant danger. If it does, I would use the lawful escalation process to stop or restrict the affected practice or equipment and inform TAEC management promptly. I would explain the finding and required controls clearly to hospital leadership, while encouraging safe alternatives such as using unaffected equipment or referring urgent patients where feasible. If the violation does not require immediate shutdown, I would set proportionate corrective actions and deadlines with monitoring. In either case I would document the evidence, decision, communication, and follow-up. Protecting patients includes preventing unsafe treatment.',
    keyPoints: ['Risk and law over pressure', 'verify severity', 'restrict/stop if dangerous', 'safe alternatives', 'proportionate action', 'document/follow-up'],
    keywords: [['risk', 'legal', 'law'], ['verify', 'severity', 'evidence'], ['stop', 'restrict', 'suspend', 'danger'], ['alternative', 'refer', 'unaffected'], ['proportionate', 'deadline', 'corrective'], ['document', 'follow-up']],
    source: 'Tanzanian hospital scenario + regulatory principles'
  },
  {
    id: 'oral-18', category: 'scenario', difficulty: 'Core', timeLimit: 105,
    question: 'A facility manager refuses to give you access to a controlled area and says you need the owner’s permission. What do you do?',
    swHint: 'Remain calm; identify and explain authority; avoid force; record refusal; escalate through lawful TAEC channels.',
    modelAnswer: 'I would remain calm and professional, present my official identification, state the inspection purpose, and explain the inspector’s legal authority and the facility’s obligation to cooperate. I would confirm whether there is a genuine immediate safety or security condition requiring a controlled entry procedure, because inspector access should still respect appropriate protective controls. I would not force entry or create a confrontation. If access remained refused, I would record the names, time, area, reasons given, witnesses, and any relevant evidence; inform my supervisor or authorized TAEC management; and follow the prescribed legal and enforcement process. I would also assess whether the refusal itself creates or conceals an urgent hazard requiring immediate coordinated action. Every step must remain within my authority and be defensible in the report.',
    keyPoints: ['Professional explanation/ID', 'legal authority', 'respect safety controls', 'do not force entry', 'document refusal', 'escalate lawfully'],
    keywords: [['calm', 'professional', 'identification', 'id'], ['authority', 'legal', 'obligation'], ['safety', 'security', 'entry procedure'], ['not force', 'do not force', 'confront'], ['record', 'document', 'witness'], ['supervisor', 'escalate', 'enforcement']],
    source: 'Atomic Energy Act inspector powers + coaching scenario'
  },
  {
    id: 'oral-19', category: 'ethics', difficulty: 'Core', timeLimit: 90,
    question: 'A licensee offers you money to ignore a violation. How do you respond?',
    swHint: 'Kataa wazi, usibishane, hifadhi ushahidi, report kupitia channels, endelea objectively ikiwa salama.',
    modelAnswer: 'I would refuse the offer clearly and immediately and avoid any discussion that could imply negotiation. I would preserve my personal safety and, as soon as practicable, make a factual record of the date, time, place, people present, words or conduct, and any available evidence. I would report the attempted bribery through the official TAEC and applicable integrity channels and follow instructions on evidence handling. The inspection finding would still be assessed objectively against legal requirements, ideally with appropriate supervisory support or another inspector if needed. I would maintain confidentiality and avoid public accusations. The offer must not weaken or exaggerate the technical finding; both the corruption matter and the safety violation require accurate, independent documentation and due process.',
    keyPoints: ['Refuse', 'no negotiation', 'record evidence', 'official report', 'objective inspection', 'confidentiality/due process'],
    keywords: [['refuse', 'decline', 'reject'], ['not negotiate', 'no discussion'], ['record', 'evidence', 'date', 'time'], ['report', 'official', 'integrity', 'supervisor'], ['objective', 'independent', 'finding'], ['confidential', 'due process']],
    source: 'Professional ethics scenario'
  },
  {
    id: 'oral-20', category: 'ethics', difficulty: 'Core', timeLimit: 90,
    question: 'You are assigned to inspect a facility managed by a close relative. What should you do?',
    swHint: 'Disclose early, recuse, request reassignment, preserve confidentiality. Usijaribu kuonekana “more strict” ili kuficha conflict.',
    modelAnswer: 'I would disclose the relationship to my supervisor before taking part in the inspection and request a conflict-of-interest assessment and reassignment. Even if I believe I could be fair, the relationship creates an actual or perceived risk to impartiality and public confidence. I would not try to compensate by being unusually strict, because that would also be unfair. I would share only the information needed for the official decision, protect confidential facility and family information, and avoid discussing the inspection privately with my relative. If reassignment were impossible in an urgent situation, I would act only under documented management direction with safeguards such as a second inspector and independent review. Transparency and recusal protect both TAEC and the licensee.',
    keyPoints: ['Early disclosure', 'actual/perceived conflict', 'recusal/reassignment', 'not overcompensate', 'confidentiality', 'documented safeguards'],
    keywords: [['disclose', 'declare'], ['conflict of interest', 'perceived', 'impartial'], ['recuse', 'reassign'], ['not strict', 'not overcompensate', 'fair'], ['confidential'], ['second inspector', 'independent review', 'documented']],
    source: 'Professional ethics scenario'
  },
  {
    id: 'oral-21', category: 'scenario', difficulty: 'Stretch', timeLimit: 105,
    question: 'Residents report a metal object with a radiation symbol near a scrap yard. How would you support the response?',
    swHint: 'Treat as possible orphan source: do not touch, isolate, notify, assess remotely, coordinate responders, inform public calmly.',
    modelAnswer: 'I would treat it as a suspected orphan source until qualified assessment shows otherwise. The immediate public message is simple: do not touch, move, open, or take the object; keep people away and report anyone who may have handled it. I would coordinate through TAEC emergency arrangements with police, local authorities, fire or medical services as needed. Trained responders would establish a safe perimeter, use calibrated survey instruments and dosimetry, identify contamination or exposure concerns, and plan secure recovery with suitable tools and shielding. Potentially exposed people would be identified for assessment without causing panic. I would ensure source security, chain of custody, notifications, readings, actions, and public communications are documented, followed by investigation of origin and corrective measures for the scrap chain.',
    keyPoints: ['Suspected orphan source', 'do not touch/isolate', 'TAEC coordination', 'trained remote assessment', 'public communication/medical assessment', 'recovery and investigation'],
    keywords: [['orphan source', 'suspected source'], ['do not touch', 'keep away', 'isolate', 'perimeter'], ['taec', 'police', 'coordinate'], ['calibrated', 'survey', 'dosimetry', 'trained'], ['public', 'panic', 'medical', 'exposed'], ['recovery', 'chain of custody', 'investigat']],
    source: 'Tanzanian scrap-yard emergency scenario'
  },
  {
    id: 'oral-22', category: 'scenario', difficulty: 'Stretch', timeLimit: 90,
    question: 'How would you explain a radiation incident to worried members of the public without causing panic?',
    swHint: 'Be early, accurate and empathetic. Say what is known/unknown, actions, simple instructions, next update. No false reassurance.',
    modelAnswer: 'I would communicate early through the authorized spokesperson, using plain language, empathy, and only verified facts. I would state what happened, the area affected, what is known about risk, what remains unknown, and what authorities are doing. I would give specific actions people should take—or state clearly if no action is required—and explain where exposed or concerned people can obtain help. I would avoid technical jargon, comparisons that trivialize concern, and promises of zero risk before assessment is complete. I would correct rumours respectfully, protect personal information, and give a time and channel for the next update. Consistency among TAEC, local authorities, health services, and media helps maintain trust while the technical response continues.',
    keyPoints: ['Authorized/verified communication', 'empathy/plain language', 'known and unknown', 'clear public actions', 'no false reassurance', 'updates and coordination'],
    keywords: [['authorized', 'verified', 'facts'], ['empathy', 'plain language', 'simple'], ['known', 'unknown', 'risk'], ['action', 'instruction', 'help'], ['not promise', 'no false reassurance', 'zero risk'], ['update', 'coordinate', 'trust']],
    source: 'Risk-communication coaching scenario'
  },
  {
    id: 'oral-23', category: 'role', difficulty: 'Stretch', timeLimit: 90,
    question: 'How should an inspector write a strong inspection finding?',
    swHint: 'Requirement + objective evidence + gap + risk/significance + required action/timeframe. Epuka hisia na lugha isiyoeleweka.',
    modelAnswer: 'A strong finding is factual, traceable, and linked to a requirement. I would identify the applicable Act provision, regulation, licence condition, standard, or approved procedure; state the objective evidence observed, including records, measurements, dates, equipment, and people interviewed where relevant; and describe clearly how the evidence fails to meet the requirement. I would classify the safety significance using TAEC procedures, distinguish an observation from a non-compliance, and avoid emotional or speculative language. The report should identify the required corrective outcome and timeframe without prescribing an unsafe shortcut. It should also preserve supporting evidence and explain follow-up verification. Another competent reviewer should be able to understand and reproduce the reasoning from the record.',
    keyPoints: ['Applicable requirement', 'objective evidence', 'clear gap', 'significance/classification', 'corrective outcome/time', 'traceable follow-up'],
    keywords: [['requirement', 'regulation', 'licence condition'], ['evidence', 'measurement', 'record'], ['gap', 'non-compliance', 'fails'], ['significance', 'classif', 'risk'], ['corrective', 'timeframe', 'deadline'], ['trace', 'follow-up', 'verify']],
    source: 'Regulatory inspection practice'
  },
  {
    id: 'oral-24', category: 'personal', difficulty: 'Foundation', timeLimit: 75,
    question: 'Where do you want to be professionally in five years, and how will that benefit TAEC?',
    swHint: 'Be ambitious but loyal to the role: competence, training, inspections, reporting, specialist growth, mentoring—not title only.',
    modelAnswer: 'In five years I want to be a trusted and technically stronger radiation-safety professional who can conduct routine inspections and follow-up work consistently, prepare defensible reports, and contribute to QC and QA oversight under TAEC procedures. My first priority would be mastering the Commission’s legal framework, inspection methods, instruments, documentation, and professional standards. I would then pursue relevant continuing education in radiation protection, regulatory practice, emergency response, and specialized inspection areas. The benefit to TAEC would be reliable field work, clear communication with licensees, accurate compliance records, and growing capacity to support junior colleagues when qualified to do so. I measure progress by competence and public-protection outcomes, not only by job title.',
    keyPoints: ['Competence before title', 'legal/inspection mastery', 'continuing education', 'reliable reports/compliance', 'future capacity building'],
    keywords: [['competent', 'trusted', 'master'], ['legal', 'inspection', 'instrument', 'procedure'], ['training', 'education', 'professional development'], ['report', 'compliance', 'reliable'], ['mentor', 'capacity', 'junior', 'public protection']],
    source: 'Career coaching synthesis'
  },
  {
    id: 'oral-25', category: 'technical', difficulty: 'Foundation', timeLimit: 75,
    question: 'What is ionizing radiation? Give common examples and explain why it must be controlled.',
    swHint: 'Definition first, examples second, risk and inspector relevance last. Jibu kwa pointi tano.',
    modelAnswer: 'Ionizing radiation is radiation with enough energy to remove electrons from atoms or molecules and produce ions. Common examples are alpha particles, beta particles, gamma rays, X-rays and neutrons. It is useful in medicine, industry, research and agriculture, but uncontrolled exposure can damage tissue and increase health risk. The correct control depends on the radiation type, energy, activity, exposure pathway and practice. As an inspector, I would not treat all radiation sources as equal. I would verify justification and authorization, time-distance-shielding controls, controlled access, monitoring, competent staff, source security and accurate records. The goal is safe and peaceful use while protecting workers, patients, the public and the environment.',
    keyPoints: ['Energy removes electrons', 'examples', 'beneficial uses', 'health risk', 'risk-based controls'],
    keywords: [['remove electrons', 'detach electrons', 'produce ions', 'ionization'], ['alpha', 'beta', 'gamma', 'x-ray', 'neutron'], ['medicine', 'industry', 'research', 'agriculture'], ['damage', 'health risk', 'tissue'], ['time', 'distance', 'shield', 'monitor', 'control']],
    source: 'Uploaded technical research + radiation-protection fundamentals'
  },
  {
    id: 'oral-26', category: 'technical', difficulty: 'Core', timeLimit: 90,
    question: 'Differentiate deterministic tissue reactions from stochastic radiation effects.',
    swHint: 'Deterministic: threshold and severity. Stochastic: probability. Give one example of each and inspector relevance.',
    modelAnswer: 'Deterministic effects, now commonly called tissue reactions, generally have a threshold dose. Below the threshold the effect is not expected; above it, severity increases as dose increases. Examples include skin injury, cataract and acute radiation syndrome. Stochastic effects are expressed as probability: the chance of an effect increases with dose, while its severity does not depend on the dose that caused it. Cancer is the main example. In regulatory work, preventing high doses avoids tissue reactions, while justification and optimization reduce stochastic risk even at lower doses. I would therefore verify dose control, monitoring, investigation levels, training and corrective action rather than waiting for a visible injury before acting.',
    keyPoints: ['Deterministic threshold', 'severity increases', 'stochastic probability', 'examples', 'regulatory prevention'],
    keywords: [['deterministic', 'tissue reaction', 'threshold'], ['severity', 'dose increases'], ['stochastic', 'probability', 'chance'], ['skin', 'cataract', 'cancer', 'acute radiation syndrome'], ['justification', 'optimization', 'monitor', 'prevent']],
    source: 'Uploaded technical research + radiation-protection fundamentals'
  },
  {
    id: 'oral-27', category: 'technical', difficulty: 'Core', timeLimit: 75,
    question: 'What is the difference between radiation exposure and radioactive contamination?',
    swHint: 'Exposure ni kuwa kwenye radiation field. Contamination ni radioactive material on or inside. Then explain control.',
    modelAnswer: 'Radiation exposure means a person is in a radiation field and receives energy from a source. The person does not automatically become radioactive—for example, a normal diagnostic X-ray causes exposure but not contamination. Radioactive contamination means radioactive material is where it should not be, such as on skin, clothing, equipment or inside the body after inhalation or ingestion. Exposure stops when the source is removed, shielded or the person leaves the field. Contamination may continue to irradiate and may spread until it is controlled and removed. An inspector should distinguish the two because monitoring, PPE, boundaries, decontamination, medical assessment and waste controls differ.',
    keyPoints: ['Exposure is a radiation field', 'not automatically radioactive', 'contamination is material', 'contamination can spread', 'different controls'],
    keywords: [['exposure', 'radiation field', 'irradiation'], ['not radioactive', 'does not become radioactive'], ['contamination', 'radioactive material', 'on skin', 'inside body'], ['spread', 'continue to irradiate'], ['decontamination', 'ppe', 'monitor', 'control']],
    source: 'Uploaded technical research + contamination principles'
  },
  {
    id: 'oral-28', category: 'technical', difficulty: 'Core', timeLimit: 90,
    question: 'Compare alpha, beta, gamma and neutron radiation, including suitable shielding.',
    swHint: 'For each: nature, penetration, hazard, shielding. Do not say one shield works for all.',
    modelAnswer: 'Alpha radiation consists of heavy, positively charged helium nuclei. It has high ionizing power but short range and is stopped by paper or skin; the main concern is intake into the body. Beta radiation consists mainly of energetic electrons, has moderate penetration, and is commonly shielded first with low atomic-number material such as plastic to limit bremsstrahlung. Gamma radiation is uncharged electromagnetic radiation and is highly penetrating, so dense material such as lead or sufficient concrete is used. Neutrons are uncharged particles best reduced with hydrogen-rich material such as water or polyethylene, often with neutron-absorbing material. Shield design must use the radiation energy, source strength and approved calculation—not a memorized material alone.',
    keyPoints: ['Alpha properties/control', 'beta properties/control', 'gamma properties/control', 'neutron properties/control', 'energy-based design'],
    keywords: [['alpha', 'paper', 'internal', 'helium'], ['beta', 'plastic', 'electron', 'bremsstrahlung'], ['gamma', 'lead', 'concrete', 'photon'], ['neutron', 'water', 'polyethylene', 'hydrogen'], ['energy', 'calculation', 'source strength', 'design']],
    source: 'Uploaded technical research + shielding fundamentals'
  },
  {
    id: 'oral-29', category: 'technical', difficulty: 'Core', timeLimit: 105,
    question: 'Before using a radiation survey meter during an inspection, what checks would you perform?',
    swHint: 'Right instrument, physical/battery, calibration, background, check source, units/range, response and record.',
    modelAnswer: 'First, I would confirm that the instrument and probe are suitable for the radiation type, energy and quantity I need to measure. I would inspect the meter and cable for damage, check the battery, display, alarm, zero and selected units and range. I would verify the instrument identity, calibration status and any correction factor. In a known low-background area I would check that the reading is reasonable, then perform the approved functional response check with a check source where available and compare it with the acceptable range. I would confirm my personal dosimeter and safe survey approach before entering. Finally, I would record the meter details and avoid relying on a reading that is unstable, off-scale or inconsistent.',
    keyPoints: ['Suitable instrument/probe', 'physical and battery check', 'valid calibration', 'background/response check', 'safe use and records'],
    keywords: [['suitable', 'radiation type', 'probe', 'energy'], ['battery', 'damage', 'display', 'alarm', 'units', 'range'], ['calibration', 'correction factor'], ['background', 'check source', 'functional', 'response'], ['dosimeter', 'record', 'off-scale', 'safe']],
    source: 'Uploaded technical research + field instrumentation practice'
  },
  {
    id: 'oral-30', category: 'scenario', difficulty: 'Core', timeLimit: 120,
    question: 'You are sent to inspect a diagnostic X-ray facility. Give your field inspection checklist in order.',
    swHint: 'Use DOCES: Documents, Operators, Controls, Equipment, Survey/report. List, usisimulie sana.',
    modelAnswer: 'I would use a structured checklist. First, documents: authorization and conditions, radiation protection programme, previous findings, equipment inventory, maintenance, calibration, QC/QA, staff dose and incident records. Second, operators: qualifications, training, responsibilities and use of personal monitoring where required. Third, controls: room layout, shielding, warning signs, controlled access, door and exposure indicators, protective devices and local rules. Fourth, equipment: identity, condition, exposure controls, collimation, filtration and the applicable QC tests using suitable calibrated instruments. Fifth, survey and close-out: observe practice, measure relevant leakage or area radiation safely, compare evidence with requirements, explain findings, document significance and arrange corrective follow-up. Patient and worker protection guide the whole inspection.',
    keyPoints: ['Documents/licence', 'qualified operators', 'room protection controls', 'equipment/QC checks', 'survey-report-follow-up'],
    keywords: [['document', 'licence', 'authorization', 'records'], ['operator', 'qualified', 'training', 'dosimeter'], ['shield', 'warning', 'access', 'door', 'indicator'], ['equipment', 'collimation', 'filtration', 'quality control', 'qc'], ['survey', 'measure', 'report', 'follow-up', 'finding']],
    source: 'Uploaded regulation notes + field inspection synthesis'
  },
  {
    id: 'oral-31', category: 'scenario', difficulty: 'Stretch', timeLimit: 120,
    question: 'A radioactive liquid is spilled in a laboratory and may have contaminated a worker. Explain your response.',
    swHint: 'People first, stop spread, isolate, notify, survey, remove clothing/wash gently, collect waste, document. Follow approved plan.',
    modelAnswer: 'I would stop work, warn people and restrict the area so the spill is not spread. I would not rush into cleanup without identifying the radionuclide, activity, exposure pathway and approved emergency procedure. I would notify the facility RSO and management and escalate to TAEC as required. Potentially contaminated workers should avoid spreading material; urgent injury receives medical care first. Under trained supervision, contaminated outer clothing can be removed and bagged, and affected skin washed gently with soap and water without damaging it. Suitable instruments would survey people and the area. Authorized staff would contain and clean the spill with appropriate PPE, collect waste as radioactive material, resurvey, document doses/readings and investigate the cause before release.',
    keyPoints: ['Stop and isolate', 'identify/assess', 'notify emergency chain', 'controlled decontamination', 'resurvey-waste-report'],
    keywords: [['stop', 'restrict', 'isolate', 'cordon'], ['radionuclide', 'activity', 'assess', 'pathway'], ['notify', 'rso', 'taec', 'management'], ['remove clothing', 'soap', 'water', 'decontamination'], ['resurvey', 'waste', 'document', 'investigate']],
    source: 'Uploaded technical research + emergency regulation notes'
  },
  {
    id: 'oral-32', category: 'technical', difficulty: 'Foundation', timeLimit: 75,
    question: 'Explain radioactive half-life and give two ways it matters in regulatory inspection.',
    swHint: 'Definition, one simple example, then activity/decay storage and source replacement or records.',
    modelAnswer: 'Radioactive half-life is the time required for the number of undecayed nuclei—or the activity—to reduce to half its initial value through radioactive decay. After one half-life, 50 percent remains; after two, 25 percent remains, assuming no new material is added. It matters in inspection because source activity changes with time and must be correctly recorded when assessing shielding, transport, calibration or safe use. It also supports authorized decay storage for suitable short-lived waste before clearance or disposal, subject to measured results and regulatory criteria. Half-life is a property of the radionuclide; it is not changed by ordinary temperature, pressure or chemical form.',
    keyPoints: ['Time for activity to halve', '50% then 25%', 'activity/source records', 'decay storage', 'fixed nuclear property'],
    keywords: [['half-life', 'activity', 'half', '50 percent', '50%'], ['25 percent', '25%', 'two half'], ['source', 'record', 'shield', 'transport', 'calibration'], ['decay storage', 'waste', 'clearance'], ['not changed', 'nuclear property', 'temperature', 'pressure']],
    source: 'Uploaded technical research + nuclear physics fundamentals'
  },
  {
    id: 'oral-33', category: 'personal', difficulty: 'Core', timeLimit: 105,
    question: 'Tell the panel about one research project or technical assignment in your CV and what it taught you for inspection work.',
    swHint: 'Use STAR, but do not invent results. State objective, your method/role, safety lesson and inspector connection.',
    modelAnswer: 'I would choose one genuine research project or technical assignment from my own CV. I would state the objective and context briefly, then explain the specific task and analysis or measurement that I personally performed. I would give the real result or lesson without exaggerating it. The strongest inspector connection may include careful measurement, correct units, quality assurance, complete records, teamwork with qualified professionals and checking a result before accepting it. I would finish by explaining how I will transfer those habits to inspections: use suitable calibrated instruments, follow approved methods, record objective evidence and investigate unusual results.',
    keyPoints: ['Relevant real project', 'objective and personal task', 'measurement/quality lesson', 'work within competence', 'inspection transfer'],
    keywords: [['project', 'research', 'assignment', 'technical'], ['objective', 'task', 'i did', 'role'], ['measurement', 'quality assurance', 'records', 'units', 'analysis'], ['qualified', 'competence', 'professional', 'team'], ['calibrated', 'evidence', 'investigate', 'inspection']],
    source: 'Candidate’s locally provided CV · personalized prompt'
  }
];

export const writtenQuestions: WrittenQuestion[] = [
  {
    id: 'written-01', category: 'role',
    question: 'Which statement best describes TAEC’s regulatory function?',
    options: ['It operates every radiation facility in Tanzania', 'It authorizes and inspects practices and can require corrective action', 'It only trains radiation workers', 'It only advises private hospitals'],
    correctIndex: 1,
    explanation: 'TAEC’s regulatory role includes authorization through registration/licensing, safety review, inspection, enforcement, and follow-up. Primary responsibility for safe operation remains with the licensee.',
    source: 'TAEC official functions'
  },
  {
    id: 'written-02', category: 'technical',
    question: 'The SI unit of absorbed dose is:',
    options: ['Becquerel', 'Sievert', 'Gray', 'Coulomb per kilogram'],
    correctIndex: 2,
    explanation: 'Absorbed dose is energy deposited per unit mass and is measured in gray (Gy), where 1 Gy = 1 J/kg.',
    source: 'Radiation-protection fundamentals'
  },
  {
    id: 'written-03', category: 'technical',
    question: 'Which option is the best distinction between QC and QA?',
    options: ['QC is for hospitals; QA is for industry', 'QC is equipment testing; QA is the wider system ensuring consistent quality', 'QC is voluntary; QA is always criminal enforcement', 'There is no practical difference'],
    correctIndex: 1,
    explanation: 'QC includes measurements and operational techniques. QA is the wider planned management system covering responsibilities, procedures, competence, records, review, and corrective action.',
    source: 'PSRS role duties + QA practice'
  },
  {
    id: 'written-04', category: 'scenario',
    question: 'What is the best first response to unexpectedly high radiation readings near a damaged source container?',
    options: ['Move the container into a cupboard', 'Finish the routine inspection before reporting', 'Control access, protect people, and activate the emergency chain', 'Ask an unmonitored worker to inspect it closely'],
    correctIndex: 2,
    explanation: 'Life and exposure control come first. Restrict access, avoid handling, assess safely with suitable monitoring, and activate authorized emergency arrangements.',
    source: 'Emergency response principles'
  },
  {
    id: 'written-05', category: 'ethics',
    question: 'A close relative manages the facility assigned to you. The most appropriate action is to:',
    options: ['Inspect more strictly than usual', 'Say nothing because you can be objective', 'Disclose the conflict and request reassignment', 'Privately ask the relative to correct everything before arrival'],
    correctIndex: 2,
    explanation: 'Actual and perceived conflicts should be disclosed early and managed through recusal/reassignment or documented safeguards.',
    source: 'Professional ethics'
  },
  {
    id: 'written-06', category: 'technical',
    question: 'Which combination represents the three classic practical exposure controls?',
    options: ['Time, distance, shielding', 'Training, licensing, reporting', 'Dose, activity, contamination', 'Warning, suspension, closure'],
    correctIndex: 0,
    explanation: 'Time, distance, and shielding are the classic practical controls used to optimize radiation exposure under ALARA.',
    source: 'Radiation-protection fundamentals'
  },
  {
    id: 'written-07', category: 'role',
    question: 'Which item is explicitly part of the advertised Radiation Safety Inspector II duties?',
    options: ['Prescribing radiotherapy treatment', 'Maintaining a register of violations by licensees', 'Approving national budgets', 'Manufacturing all radiation detectors'],
    correctIndex: 1,
    explanation: 'The vacancy specifically includes establishing and maintaining a register or inventory of violations by licensees.',
    source: 'PSRS vacancy announcement, 7 Dec 2025'
  },
  {
    id: 'written-08', category: 'scenario',
    question: 'If a facility refuses lawful access during an inspection, the inspector should first:',
    options: ['Force the door open', 'Remain professional, explain authority, record the refusal, and escalate lawfully', 'Delete the inspection from the schedule', 'Threaten staff publicly'],
    correctIndex: 1,
    explanation: 'The response must stay within legal authority: explain, document, evaluate urgency, and follow TAEC supervisory/enforcement procedures rather than use force.',
    source: 'Atomic Energy Act powers + coaching scenario'
  },
  {
    id: 'written-09', category: 'technical',
    question: 'Nuclear security is primarily concerned with:',
    options: ['Only accidental equipment failure', 'Intentional unauthorized acts such as theft or sabotage', 'Calculating patient absorbed dose', 'Routine staff scheduling'],
    correctIndex: 1,
    explanation: 'Security addresses intentional malicious or unauthorized acts. Safety mainly addresses accidental events, failures, and errors, although controls can overlap.',
    source: 'Nuclear safety/security principles'
  },
  {
    id: 'written-10', category: 'role',
    question: 'The strongest inspection finding links objective evidence to:',
    options: ['The inspector’s personal preference', 'A legal or authorized requirement and its safety significance', 'A rumour from another facility', 'The licensee’s ability to pay'],
    correctIndex: 1,
    explanation: 'A defensible finding identifies the requirement, objective evidence, the compliance gap, safety significance, corrective outcome, and follow-up.',
    source: 'Regulatory inspection practice'
  },
  {
    id: 'written-11', category: 'technical',
    question: 'Which statement correctly compares deterministic tissue reactions and stochastic effects?',
    options: ['Both always have a threshold', 'Tissue-reaction severity can increase above a threshold; stochastic probability increases with dose', 'Stochastic severity always increases with dose', 'Neither is relevant to optimization'],
    correctIndex: 1,
    explanation: 'Tissue reactions generally have thresholds and increasing severity above them. For stochastic effects such as cancer, probability—not severity—increases with dose.',
    source: 'Uploaded technical research'
  },
  {
    id: 'written-12', category: 'technical',
    question: 'Which situation is radioactive contamination rather than exposure only?',
    options: ['Standing outside an X-ray room during an exposure', 'Radioactive powder is present on a worker’s sleeve', 'Viewing a radiation warning sign', 'Reading a completed dose report'],
    correctIndex: 1,
    explanation: 'Contamination means radioactive material is on or inside a person, object or place. Exposure means being in a radiation field and does not automatically cause contamination.',
    source: 'Uploaded technical research'
  },
  {
    id: 'written-13', category: 'technical',
    question: 'Before relying on a survey-meter reading, the inspector should:',
    options: ['Use any available probe without checking its range', 'Confirm suitability, calibration, battery, units, background and functional response', 'Ignore an off-scale display', 'Change the calibration label'],
    correctIndex: 1,
    explanation: 'A defensible field measurement requires a suitable instrument, valid calibration and successful pre-use checks, plus correct units/range and safe technique.',
    source: 'Field instrumentation practice'
  },
  {
    id: 'written-14', category: 'scenario',
    question: 'Which sequence best summarizes a diagnostic X-ray facility inspection?',
    options: ['Equipment, gossip, payment, closure', 'Documents, operators, controls, equipment, survey/report', 'Patients, diagnosis, prescription, treatment', 'Enter, measure once, leave'],
    correctIndex: 1,
    explanation: 'DOCES is a useful memory sequence: Documents, Operators, Controls, Equipment, then Survey/report and follow-up.',
    source: 'Uploaded regulation notes + field synthesis'
  },
  {
    id: 'written-15', category: 'technical',
    question: 'A source starts at 100 units of activity. Approximately what remains after two half-lives?',
    options: ['75 units', '50 units', '25 units', '0 units'],
    correctIndex: 2,
    explanation: 'After one half-life, 50 units remain; after the second, half of 50 remains, which is 25 units.',
    source: 'Nuclear physics fundamentals'
  }
];

export const encouragements = [
  'You do not need perfect English. You need five clear, correct points.',
  'A hard question is useful—it shows what to revise before the panel.',
  'Calm mind. Simple structure. Evidence before confidence.',
  'Uko kwenye mstari—fix one missing point, then answer again.',
  'The panel cannot see your preparation; let your structure show it.',
];
