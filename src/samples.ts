import type { CandidateProfile, Material } from './types';

export interface TestSample {
  id: string;
  label: string;
  sector: string;
  description: string;
  profile: Omit<CandidateProfile, 'id' | 'createdAt'>;
  jobDescription: string;
  cv: string;
  applicationLetter: string;
  notes: string;
}

export const testSamples: TestSample[] = [
  {
    id: 'sample-radiation',
    label: 'Radiation Safety Inspector II',
    sector: 'Science & regulation',
    description: 'Technical inspection, licensing, QC/QA and emergency scenarios.',
    profile: { name: 'Asha Mrema', jobPosition: 'Radiation Safety Inspector II', organization: 'Tanzania Atomic Energy Commission', interviewDate: '', sampleId: 'sample-radiation' },
    jobDescription: `The officer will conduct inspection and licensing activities, collect information required for licence applications, prepare programmes for regulatory inspections, and conduct follow-up inspections to verify remedial actions. The officer will perform radiation surveillance and quality-control tests on radiation premises and equipment, prepare inspection reports, maintain a register of violations, coordinate compliance monitoring with zonal personnel, and support QC and QA programmes for diagnostic radiography, medical imaging and therapy. The applicant should hold a Bachelor Degree in Physics, Nuclear Physics or an equivalent field.`,
    cv: `Asha Mrema is a fictional test candidate with a Bachelor of Science in Physics. Her university studies covered nuclear physics, radiation detection, electronics, research methods and data analysis. She completed a field attachment in a hospital imaging department where she observed radiation-protection procedures and equipment quality checks. She later worked as a science teacher, developing clear communication, planning, accurate record keeping and teamwork. Her final-year project assessed the response consistency of a radiation detector under controlled laboratory conditions.`,
    applicationLetter: `I am applying for the Radiation Safety Inspector II position because it combines my Physics training with public protection and professional regulatory work. My academic background gave me a foundation in radiation interactions, measurement and safety. Teaching strengthened my ability to explain technical requirements respectfully. I am prepared to learn TAEC procedures, conduct evidence-based inspections, document findings accurately and uphold integrity.`,
    notes: `ALARA means keeping exposure as low as reasonably achievable through optimization. Practical controls include time, distance and shielding. A structured inspection covers preparation, opening meeting, document review, observation, interviews, calibrated measurements, close-out, reporting and follow-up. In an emergency: stop unsafe work, control access, assess safely, notify responsible authorities and document actions. Quality control refers to tests and measurements; quality assurance is the wider management system.`,
  },
  {
    id: 'sample-hr',
    label: 'Human Resource Officer II',
    sector: 'Administration & people',
    description: 'Recruitment, records, employee relations and public-service ethics.',
    profile: { name: 'Neema John', jobPosition: 'Human Resource Officer II', organization: 'A Tanzanian Public Institution', interviewDate: '', sampleId: 'sample-hr' },
    jobDescription: `The Human Resource Officer II will assist with recruitment and selection, maintain accurate employee records, process staff changes, support performance-management activities, prepare human-resource reports and advise employees on approved procedures. The officer will help coordinate training, leave, confirmation, promotion and disciplinary documentation while protecting confidentiality. The applicant should have a Bachelor Degree in Human Resource Management, Public Administration or a related field and demonstrate integrity, communication, organization and knowledge of public-service procedures.`,
    cv: `Neema John is a fictional test candidate with a Bachelor Degree in Human Resource Management. During field practical training at a municipal office, she supported personnel-file reviews, prepared spreadsheet summaries and helped organize staff-training attendance. She served as secretary of a university professional club, where she scheduled meetings, recorded minutes and coordinated a career seminar. She is comfortable with Word, Excel and PowerPoint and communicates in English and Kiswahili.`,
    applicationLetter: `I wish to be considered for the Human Resource Officer II position. My Human Resource Management training and municipal field experience prepared me to handle records carefully, communicate procedures and support fair people-management processes. I value confidentiality, impartiality and accurate documentation. I would bring an organized learning mindset and commitment to respectful public service.`,
    notes: `A strong HR record must be accurate, complete, current, confidential and available only to authorized persons. Recruitment should follow approved criteria consistently and preserve an audit trail. When handling a complaint, listen without promising an outcome, record facts, explain the procedure, protect confidentiality and escalate through the correct channel. A competency answer can use STAR: Situation, Task, Action and Result.`,
  },
  {
    id: 'sample-ict',
    label: 'ICT Officer II',
    sector: 'Technology & support',
    description: 'Systems support, cybersecurity, users, networks and incident response.',
    profile: { name: 'Baraka Mushi', jobPosition: 'ICT Officer II', organization: 'A Tanzanian Government Agency', interviewDate: '', sampleId: 'sample-ict' },
    jobDescription: `The ICT Officer II will install, configure and support user computers, operating systems, approved applications and network devices. The officer will troubleshoot incidents, maintain an asset inventory, support backups, manage user access according to authorization, document resolutions and promote cybersecurity awareness. Responsibilities include monitoring service availability, escalating major incidents, supporting procurement specifications and protecting institutional information. The applicant should hold a Bachelor Degree in Information Technology, Computer Science, Computer Engineering or a related field.`,
    cv: `Baraka Mushi is a fictional test candidate with a Bachelor of Science in Information Technology. His field attachment involved first-line user support, computer imaging, printer troubleshooting, basic LAN checks and updating an ICT asset register. His final-year project was a web-based equipment fault-reporting system with role-based access. He volunteered to teach students password hygiene, phishing awareness and safe use of shared computers. He uses Windows, Linux, basic SQL, Git and network diagnostic tools.`,
    applicationLetter: `I am applying for the ICT Officer II role because I enjoy solving user problems while keeping systems reliable and secure. My degree, field attachment and fault-reporting project developed practical troubleshooting, documentation and access-control awareness. I communicate technical steps in simple language and know when to escalate. I would support the institution through disciplined service, accurate asset records and continuous learning.`,
    notes: `A good incident process is Identify, Contain, Resolve, Recover and Review. Before changing a production system, confirm authorization, backup or rollback, expected impact and communication. Least privilege means users receive only the access required for their duties. Backups must be monitored and restoration must be tested. A help-desk answer should clarify the problem, assess urgency and impact, document actions, resolve safely and confirm with the user.`,
  },
];

export function sampleToMaterials(sample: TestSample): Material[] {
  const now = new Date().toISOString();
  const make = (name: string, kind: Material['kind'], extractedText: string, mime = 'text/plain'): Material => ({
    id: crypto.randomUUID(), name, kind, mime, size: new Blob([extractedText]).size,
    extractedText, status: 'ready', addedAt: now,
  });
  return [
    make(`${sample.label} — Job Description.txt`, 'job', sample.jobDescription),
    make(`${sample.profile.name} — Sample CV.txt`, 'cv', sample.cv),
    make(`${sample.profile.name} — Application Letter.txt`, 'letter', sample.applicationLetter),
    make(`${sample.label} — Study Notes.md`, 'notes', sample.notes, 'text/markdown'),
  ];
}
