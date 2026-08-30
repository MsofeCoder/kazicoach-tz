import { oralQuestions as radiationOral, writtenQuestions as radiationWritten } from '../data';
import type { CandidateProfile, Material, OralQuestion, WrittenQuestion } from '../types';

const orgName = (profile: CandidateProfile) => profile.organization.trim() || 'the recruiting institution';

export function usesRadiationPack(profile: CandidateProfile) {
  return profile.sampleId === 'sample-radiation' || /radiation safety inspector|atomic energy|nuclear physics|\btaec\b/i.test(`${profile.jobPosition} ${profile.organization}`);
}

export function buildGenericOralQuestions(profile: CandidateProfile, materials: Material[]): OralQuestion[] {
  const role = profile.jobPosition;
  const organization = orgName(profile);
  const hasCV = materials.some(item => item.kind === 'cv' && item.status === 'ready');
  const hasLetter = materials.some(item => item.kind === 'letter' && item.status === 'ready');
  const sourceStatus = `${hasCV ? 'CV' : 'profile'} + ${hasLetter ? 'application letter' : 'job description'}`;

  return [
    {
      id: 'generic-01', category: 'personal', difficulty: 'Core', timeLimit: 90,
      question: `Tell us about yourself and explain why you fit the ${role} position.`,
      swHint: 'Use SEAT+: Skills, Experience, Achievement, Type of person, then value to the employer.',
      modelAnswer: `My name is ${profile.name}. I am applying for the ${role} position at ${organization}. I would briefly state my most relevant qualification, then one experience from my CV that proves I can perform the role. I would add one achievement or project without exaggerating my responsibility. I would describe two job-related qualities, such as integrity, accuracy, service or teamwork, and support them with evidence. I would finish by explaining the practical value I can bring to ${organization}. The final answer should use only facts confirmed in my CV and application letter and should take about 60 to 90 seconds.`,
      keyPoints: ['Relevant qualification', 'role-related experience', 'achievement or project', 'professional qualities', 'value to employer'],
      keywords: [['degree', 'diploma', 'qualification', 'training', 'education'], ['experience', 'attachment', 'work', 'volunteer'], ['achievement', 'project', 'result', 'improved'], ['integrity', 'accurate', 'teamwork', 'communication', 'reliable'], ['value', 'contribute', 'support', 'serve']],
      source: `Personalized locally from ${sourceStatus}`,
    },
    {
      id: 'generic-02', category: 'personal', difficulty: 'Core', timeLimit: 75,
      question: `Why do you want to work as ${role} at ${organization}?`,
      swHint: 'Connect institution, role, your evidence, public/customer value and long-term growth.',
      modelAnswer: `I am interested in the ${role} position because its responsibilities match the skills and experience I have deliberately developed. I would identify one specific duty from the job description, explain evidence from my CV that prepares me for it, and show that I understand the purpose of ${organization}. I would then connect the work to the people or service it supports. Finally, I would explain what I am ready to learn during induction and how I intend to grow through competent service. I would avoid saying only that I need employment or salary; my answer should show informed motivation and realistic value.`,
      keyPoints: ['Specific role duty', 'candidate evidence', 'knowledge of institution', 'service value', 'readiness to learn'],
      keywords: [['duty', 'responsibility', 'role'], ['experience', 'skill', 'training', 'project'], ['organization', 'institution', 'mandate', 'purpose'], ['service', 'public', 'customer', 'community'], ['learn', 'induction', 'develop', 'grow']],
      source: 'Job description + candidate profile',
    },
    {
      id: 'generic-03', category: 'role', difficulty: 'Core', timeLimit: 105,
      question: `What are the five most important duties of a ${role} according to this job description?`,
      swHint: 'Group similar duties. Do not recite every line. Explain purpose and expected result.',
      modelAnswer: `I would group the advertised responsibilities into five clear areas instead of reading the job description word for word. First, I would name the main technical or operational duty. Second, I would cover records, reports or information management. Third, I would explain coordination with colleagues, users or stakeholders. Fourth, I would mention quality, compliance, safety or service standards where relevant. Fifth, I would cover follow-up, improvement and other assigned duties. For each point, I would use the exact meaning of the advert and briefly explain why it matters to ${organization}.`,
      keyPoints: ['Main operational duty', 'records and reporting', 'coordination', 'quality/compliance', 'follow-up and improvement'],
      keywords: [['main', 'technical', 'operational', 'service'], ['record', 'report', 'document', 'data'], ['coordinate', 'team', 'stakeholder', 'communicate'], ['quality', 'compliance', 'standard', 'safety'], ['follow-up', 'improve', 'assigned', 'monitor']],
      source: 'Uploaded/pasted job description',
    },
    {
      id: 'generic-04', category: 'personal', difficulty: 'Core', timeLimit: 90,
      question: `Which experience in your CV best demonstrates that you can perform this ${role} job?`,
      swHint: 'Use STAR: Situation, Task, Action, Result. Say exactly what you did—do not use “we” for everything.',
      modelAnswer: `I would choose one genuine example from my CV that matches an advertised duty. Using STAR, I would explain the situation and my specific task in one or two sentences. I would spend most of the answer on the action I personally took, including the method, communication and judgment used. I would then state the result using a real outcome, lesson or completed deliverable. Finally, I would connect that evidence directly to the ${role} responsibility. If the example was academic or from field attachment, I would say so honestly rather than presenting it as employment.`,
      keyPoints: ['Relevant real example', 'situation and task', 'personal action', 'result or lesson', 'connection to role'],
      keywords: [['example', 'experience', 'project', 'attachment'], ['situation', 'task', 'responsible'], ['i did', 'i prepared', 'i analysed', 'i supported', 'action'], ['result', 'completed', 'learned', 'improved'], ['role', 'duty', 'relevant', 'apply']],
      source: hasCV ? 'Locally uploaded CV' : 'Candidate-provided evidence',
    },
    {
      id: 'generic-05', category: 'personal', difficulty: 'Foundation', timeLimit: 75,
      question: 'What are your main strengths and what professional area are you improving?',
      swHint: 'Give two strengths with evidence, then one real development area and a practical plan.',
      modelAnswer: `I would select two strengths that are directly relevant to the ${role} advert and prove each with a short example. I would not give a long list of unsupported adjectives. For my development area, I would choose something genuine that does not make me unsafe or unable to perform the basic role. I would explain the steps I am already taking—such as guided practice, training, checklists, feedback or supervised experience—and how I measure progress. The purpose is to show self-awareness, honesty and the ability to improve, not to disguise a strength as a weakness.`,
      keyPoints: ['Two relevant strengths', 'evidence for strengths', 'honest development area', 'improvement action', 'progress measure'],
      keywords: [['strength', 'relevant', 'skill'], ['example', 'evidence', 'experience'], ['improve', 'development', 'weakness'], ['training', 'feedback', 'practice', 'checklist', 'mentor'], ['measure', 'progress', 'review', 'result']],
      source: 'Candidate CV + competency coaching',
    },
    {
      id: 'generic-06', category: 'scenario', difficulty: 'Core', timeLimit: 105,
      question: `You receive two urgent assignments as ${role}, but both cannot be finished at the same time. What do you do?`,
      swHint: 'Assess impact and deadline, clarify priorities, communicate early, plan, document and follow through.',
      modelAnswer: `I would first confirm the real deadline, impact, dependencies and risk of each assignment instead of deciding from who spoke loudest. I would identify any safety, legal, financial or service-critical task that must come first. If priorities still conflict, I would explain the facts to my supervisor early and request a clear decision. I would break the work into steps, agree realistic completion times, communicate with affected colleagues and document important decisions. I would complete the highest-priority work carefully, monitor the second task and report any further risk. I would not stay silent until both deadlines fail.`,
      keyPoints: ['Assess urgency and impact', 'risk-based priority', 'clarify with supervisor', 'plan and communicate', 'monitor and document'],
      keywords: [['deadline', 'urgent', 'impact', 'dependency'], ['risk', 'safety', 'legal', 'service'], ['supervisor', 'clarify', 'priority', 'escalate'], ['plan', 'communicate', 'time'], ['monitor', 'document', 'report']],
      source: 'Generic Tanzanian public-service scenario',
    },
    {
      id: 'generic-07', category: 'scenario', difficulty: 'Core', timeLimit: 105,
      question: 'A senior colleague asks you to ignore an approved procedure to save time. How would you respond?',
      swHint: 'Stay respectful, clarify facts, explain risk, propose a safe option, escalate if necessary and document.',
      modelAnswer: `I would remain respectful and first confirm that I understood the request and the applicable procedure correctly. I would explain the specific risk or compliance problem created by skipping the approved step, without turning the discussion into a personal argument. I would suggest a lawful and safe alternative that meets the urgent need where possible. If the colleague still required an unsafe or unauthorized action, I would not proceed merely because of seniority; I would use the correct supervisory or reporting channel. I would document the material facts and continue to protect confidentiality. Professional respect does not remove my responsibility for my own actions.`,
      keyPoints: ['Clarify request/procedure', 'explain risk', 'safe alternative', 'refuse unsafe action/escalate', 'document professionally'],
      keywords: [['clarify', 'confirm', 'procedure'], ['risk', 'compliance', 'unsafe'], ['alternative', 'safe', 'lawful'], ['not proceed', 'refuse', 'supervisor', 'escalate'], ['document', 'record', 'professional', 'confidential']],
      source: 'Professional ethics scenario',
    },
    {
      id: 'generic-08', category: 'ethics', difficulty: 'Core', timeLimit: 90,
      question: `How will you demonstrate integrity and confidentiality in the ${role} position?`,
      swHint: 'Facts, authorised access, consistent rules, conflict disclosure and accurate reporting.',
      modelAnswer: `I would demonstrate integrity by giving accurate information, following approved procedures and applying the same standard regardless of personal relationships or pressure. I would protect confidential information by accessing only what I need for my duties, sharing it only with authorized people and using secure records and communication channels. I would disclose conflicts of interest early, refuse improper benefits and correct mistakes rather than hide them. My reports would distinguish facts, professional judgment and unresolved questions. When uncertain, I would seek guidance without transferring my responsibility to someone else.`,
      keyPoints: ['Accuracy and procedures', 'authorized access', 'fairness', 'conflict/improper benefit', 'honest reporting and guidance'],
      keywords: [['accurate', 'procedure', 'truth'], ['authorized', 'confidential', 'access', 'share'], ['same standard', 'fair', 'impartial'], ['conflict', 'benefit', 'bribe', 'disclose'], ['report', 'mistake', 'guidance', 'uncertain']],
      source: 'Professional ethics + role context',
    },
    {
      id: 'generic-09', category: 'scenario', difficulty: 'Stretch', timeLimit: 105,
      question: `You discover an error in work already submitted by your team. What would you do as ${role}?`,
      swHint: 'Verify, contain impact, inform the right person, correct, document, learn—do not hide or blame.',
      modelAnswer: `I would first verify the error and its possible impact so I do not create confusion from an assumption. If the error could cause immediate harm, loss or an incorrect decision, I would help contain the impact without delay. I would inform the responsible supervisor or owner with clear facts, accept my part if I contributed, and support a controlled correction. I would document the change and ensure affected people receive the corrected information. Afterward, I would help identify the cause and improve the checklist, review or communication step that failed. The objective is correction and prevention, not hiding the issue or blaming a colleague.`,
      keyPoints: ['Verify error', 'contain impact', 'inform and take responsibility', 'correct/document', 'prevent recurrence'],
      keywords: [['verify', 'confirm', 'error'], ['contain', 'impact', 'harm', 'stop'], ['inform', 'supervisor', 'responsibility'], ['correct', 'document', 'update'], ['cause', 'prevent', 'checklist', 'improve']],
      source: 'Generic quality and accountability scenario',
    },
    {
      id: 'generic-10', category: 'role', difficulty: 'Core', timeLimit: 90,
      question: `What would you aim to achieve in your first 90 days as ${role}?`,
      swHint: 'Learn, observe, perform safely, document, then improve—do not promise major changes before understanding the institution.',
      modelAnswer: `In the first 30 days, I would complete induction, understand ${organization}'s mandate, learn the approved procedures and clarify performance expectations. I would observe experienced colleagues, study the main records and identify the stakeholders connected to my duties. In days 31 to 60, I would perform assigned routine work carefully under the expected level of supervision, ask for feedback and correct gaps quickly. By 90 days, I would aim to handle core tasks more consistently, maintain accurate records and suggest only small evidence-based improvements through the proper channel. My first priority would be competent service and trust, not changing systems before I understand them.`,
      keyPoints: ['Induction and mandate', 'procedures/expectations', 'observe stakeholders', 'perform and seek feedback', 'evidence-based improvement'],
      keywords: [['induction', 'mandate', 'first 30'], ['procedure', 'expectation', 'standard'], ['observe', 'stakeholder', 'colleague'], ['routine', 'feedback', 'supervision', 'days 31'], ['90 days', 'improve', 'evidence', 'record']],
      source: 'Personalized first-90-days framework',
    },
  ];
}

export function buildGenericWrittenQuestions(profile: CandidateProfile): WrittenQuestion[] {
  const role = profile.jobPosition;
  return [
    { id: 'generic-written-01', category: 'personal', question: 'Which structure is strongest for a competency example?', options: ['Opinion, apology, long background, promise', 'Situation, Task, Action, Result', 'Name, date, address, salary', 'Definition only'], correctIndex: 1, explanation: 'STAR keeps an example focused and gives the panel evidence of the candidate’s own action and result.', source: 'Competency interview framework' },
    { id: 'generic-written-02', category: 'role', question: `When asked about the duties of ${role}, the best approach is to:`, options: ['Guess from the title', 'Group the advertised duties and explain their purpose', 'Recite the whole CV', 'Discuss salary first'], correctIndex: 1, explanation: 'A strong answer is grounded in the job description, groups related duties, and briefly explains why they matter.', source: 'Uploaded job-description framework' },
    { id: 'generic-written-03', category: 'ethics', question: 'Confidential information should be shared with:', options: ['Anyone who asks politely', 'Friends in the same profession', 'Only authorized people for a legitimate work purpose', 'A public social-media group'], correctIndex: 2, explanation: 'Confidentiality requires legitimate purpose, authorization, minimum necessary access and secure handling.', source: 'Professional ethics' },
    { id: 'generic-written-04', category: 'scenario', question: 'When two urgent assignments conflict, the best first step is to:', options: ['Ignore the more difficult task', 'Assess deadlines, impact and risk, then clarify priority', 'Promise both immediately', 'Wait until one becomes overdue'], correctIndex: 1, explanation: 'Priorities should be based on verified urgency, impact, risk and supervisory direction—not pressure alone.', source: 'Work prioritization scenario' },
    { id: 'generic-written-05', category: 'scenario', question: 'If you discover a material error in submitted work, you should:', options: ['Hide it to protect the team', 'Verify it, contain impact, report and correct it', 'Delete the record without explanation', 'Blame the newest employee'], correctIndex: 1, explanation: 'Accountability requires verification, timely containment, transparent correction, documentation and prevention.', source: 'Quality and accountability scenario' },
    { id: 'generic-written-06', category: 'personal', question: 'Which answer best handles a professional development area?', options: ['I have no weaknesses', 'Name a genuine area and explain the improvement plan and progress', 'Choose a core safety failure', 'Criticize the previous employer'], correctIndex: 1, explanation: 'A credible answer shows self-awareness and evidence of practical improvement without making the candidate unfit for the core role.', source: 'Competency coaching' },
    { id: 'generic-written-07', category: 'ethics', question: 'A senior person asks you to skip an approved control. You should:', options: ['Comply because of seniority', 'Clarify, explain risk, suggest a safe option and escalate if needed', 'Argue publicly', 'Post the request online'], correctIndex: 1, explanation: 'Professional respect should be maintained, but it does not remove responsibility to follow lawful and safe procedures.', source: 'Professional ethics scenario' },
    { id: 'generic-written-08', category: 'role', question: 'The most credible answer about your first 90 days should begin with:', options: ['Major changes before induction', 'Learning the mandate, procedures and expectations', 'Requesting promotion', 'Working without feedback'], correctIndex: 1, explanation: 'A new officer should learn, observe, perform core duties competently, seek feedback and propose evidence-based improvements.', source: 'First-90-days framework' },
  ];
}

export function oralBankFor(profile: CandidateProfile, materials: Material[], customQuestions: OralQuestion[]) {
  const generic = buildGenericOralQuestions(profile, materials);
  const base = usesRadiationPack(profile)
    ? [...generic, ...radiationOral.filter(question => question.category !== 'personal')]
    : generic;
  return [...base, ...customQuestions];
}

export function writtenBankFor(profile: CandidateProfile) {
  return usesRadiationPack(profile) ? radiationWritten : buildGenericWrittenQuestions(profile);
}
