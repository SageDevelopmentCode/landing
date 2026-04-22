"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  ClipboardList,
  DollarSign,
  GraduationCap,
  CreditCard,
  Mail,
  BookOpen,
  Megaphone,
  MessageSquare,
  CalendarDays,
  School,
  ChevronRight,
  BarChart2,
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  Send,
  X,
  LayoutGrid,
  Table,
  GitBranch,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";

// ─── Design tokens (hardcoded — no CSS vars, works outside ThemeProvider) ─────
const C = {
  bg:           '#0D0D0D',
  surface:      '#141414',
  elevated:     '#1A1A1A',
  border:       '#262626',
  borderStrong: '#333333',
  accent:       '#5E7C68',
  accentBright: '#6E9478',
  accentLight:  'rgba(94, 124, 104, 0.15)',
  accentGlow:   'rgba(94, 124, 104, 0.15)',
  accentMid:    '#BFD8C0',
  accentDark:   '#4A6354',
  textPrimary:    '#F5F5F5',
  textSecondary:  '#A3A3A3',
  textTertiary:   '#525252',
  textQuaternary: '#404040',
  success:       '#22C55E',
  successBg:     'rgba(34, 197, 94, 0.08)',
  successBorder: 'rgba(34, 197, 94, 0.25)',
  warning:       '#F59E0B',
  warningBg:     'rgba(245, 158, 11, 0.08)',
  warningBorder: 'rgba(245, 158, 11, 0.25)',
  error:         '#EF4444',
  errorBg:       'rgba(239, 68, 68, 0.08)',
  errorBorder:   'rgba(239, 68, 68, 0.25)',
  info:          '#38BDF8',
  infoBg:        'rgba(56, 189, 248, 0.08)',
  infoBorder:    'rgba(56, 189, 248, 0.25)',
  purple:        '#8B5CF6',
  purpleBg:      'rgba(139, 92, 246, 0.08)',
  purpleBorder:  'rgba(139, 92, 246, 0.25)',
  shadowCard:    '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
  shadowMedium:  '0 4px 16px rgba(0,0,0,0.5)',
  r: { sm: '6px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
};

// ─── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_MONTHLY_REVENUE = [
  { month: 'May', revenue: 3200,  expenses: 2800 },
  { month: 'Jun', revenue: 8400,  expenses: 4100 },
  { month: 'Jul', revenue: 9200,  expenses: 4300 },
  { month: 'Aug', revenue: 7100,  expenses: 5200 },
  { month: 'Sep', revenue: 9800,  expenses: 5400 },
  { month: 'Oct', revenue: 10200, expenses: 5500 },
  { month: 'Nov', revenue: 9600,  expenses: 5200 },
  { month: 'Dec', revenue: 5800,  expenses: 3200 },
  { month: 'Jan', revenue: 9400,  expenses: 5300 },
  { month: 'Feb', revenue: 9600,  expenses: 5400 },
  { month: 'Mar', revenue: 9800,  expenses: 5500 },
  { month: 'Apr', revenue: 4200,  expenses: 2600 },
];

const DEMO_ACTIVITY = [
  { id: 'ev1', type: 'application', text: 'New application from Emma R.',        time: '2m ago',  color: 'purple'  },
  { id: 'ev2', type: 'payment',     text: 'Payment received — $1,800 tuition',   time: '15m ago', color: 'success' },
  { id: 'ev3', type: 'lead',        text: 'New waitlist signup — Noah Foster',   time: '1h ago',  color: 'info'    },
  { id: 'ev4', type: 'approved',    text: 'Application approved — Isabelle C.',  time: '3h ago',  color: 'success' },
  { id: 'ev5', type: 'payment',     text: 'Payment received — $900 summer',      time: '4h ago',  color: 'success' },
  { id: 'ev6', type: 'lead',        text: 'Contact form — Brian Thornton',       time: '6h ago',  color: 'info'    },
  { id: 'ev7', type: 'tour',        text: 'Tour scheduled — Park family',        time: '1d ago',  color: 'warning' },
  { id: 'ev8', type: 'enrolled',    text: 'Enrolled — Tyler W. (both programs)', time: '2d ago',  color: 'success' },
];

const DEMO_EVENTS = [
  { id: 'c1', title: 'Summer Program Orientation',    date: '2026-05-20', type: 'event'    },
  { id: 'c2', title: 'Q2 Parent Newsletter Deadline', date: '2026-04-15', type: 'deadline' },
  { id: 'c3', title: 'Staff Planning Meeting',         date: '2026-04-11', type: 'internal' },
  { id: 'c4', title: 'School Year Enrollment Closes', date: '2026-04-30', type: 'deadline' },
  { id: 'c5', title: 'Campus Family Open Day',        date: '2026-04-18', type: 'event'    },
];

const FUNNEL_STAGES = [
  { label: 'Leads',     count: 37, color: C.accent },
  { label: 'Applied',   count: 22, color: C.accentBright },
  { label: 'In Review', count: 8,  color: C.info },
  { label: 'Enrolling', count: 5,  color: C.warning },
  { label: 'Enrolled',  count: 24, color: C.success },
];

const DEMO_LEADS = [
  { id: 'l1',  type: 'waitlist', name: 'Diana Foster',    email: 'diana@email.com',     phone: '(512) 555-0142', childName: 'Noah Foster',     childAge: 5,  status: 'new',              tags: ['Summer 2026'],                   date: 'Apr 7',  message: null },
  { id: 'l2',  type: 'contact',  name: 'Robert Kim',      email: 'rkim@gmail.com',       phone: '(737) 555-0218', childName: null,              childAge: null, status: 'contacted',        tags: ['School Year', 'Financial Aid'], date: 'Apr 1',  message: 'Interested in fall enrollment for my daughter in 3rd grade.' },
  { id: 'l3',  type: 'waitlist', name: 'Priya Patel',     email: 'ppatel@email.com',     phone: '(512) 555-0391', childName: 'Raj Patel',        childAge: 7,  status: 'emailed',          tags: ['School Year'],                   date: 'Mar 20', message: null },
  { id: 'l4',  type: 'contact',  name: 'Mark Sullivan',   email: 'msullivan@email.com',  phone: '(737) 555-0477', childName: null,              childAge: null, status: 'new',              tags: ['Summer 2026'],                   date: 'Apr 3',  message: 'Looking for summer options for twin boys, ages 7.' },
  { id: 'l5',  type: 'waitlist', name: 'Claire Beaumont', email: 'claire.b@email.com',   phone: '(512) 555-0563', childName: 'Lily Beaumont',    childAge: 6,  status: 'application_sent', tags: ['School Year'],                   date: 'Mar 15', message: null },
  { id: 'l6',  type: 'waitlist', name: 'Jerome Watkins',  email: 'jwatkins@email.com',   phone: '(737) 555-0649', childName: 'Tyler Watkins',    childAge: 9,  status: 'enrolled',         tags: ['Both'],                          date: 'Feb 10', message: null },
  { id: 'l7',  type: 'contact',  name: 'Sandra Cho',      email: 'sandcho@email.com',    phone: '(512) 555-0735', childName: null,              childAge: null, status: 'new',              tags: [],                                date: 'Apr 5',  message: 'Heard about your school from a friend. What are your rates?' },
  { id: 'l8',  type: 'waitlist', name: 'Luis Mendez',     email: 'lmendez@email.com',    phone: '(737) 555-0821', childName: 'Sofia Mendez',     childAge: 8,  status: 'contacted',        tags: ['School Year'],                   date: 'Mar 25', message: null },
];

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  new:              { bg: C.infoBg,    border: C.infoBorder,    text: C.info,    label: 'New'           },
  contacted:        { bg: C.accentLight, border: 'rgba(94,124,104,0.3)', text: C.accent, label: 'Contacted'  },
  emailed:          { bg: C.accentLight, border: 'rgba(94,124,104,0.3)', text: C.accent, label: 'Emailed'    },
  application_sent: { bg: C.purpleBg,  border: C.purpleBorder,  text: C.purple,  label: 'App Sent'      },
  enrolled:         { bg: C.successBg, border: C.successBorder, text: C.success, label: 'Enrolled'      },
  in_progress:      { bg: C.warningBg, border: C.warningBorder, text: C.warning, label: 'In Progress'   },
  in_review:        { bg: C.infoBg,    border: C.infoBorder,    text: C.info,    label: 'In Review'     },
  enrolling:        { bg: C.purpleBg,  border: C.purpleBorder,  text: C.purple,  label: 'Enrolling'     },
};

const PROGRAM_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  summer_26:         { label: 'Summer 2026',     bg: C.warningBg,  text: C.warning },
  school_year_26_27: { label: 'School Year',     bg: C.infoBg,     text: C.info    },
  both:              { label: 'Both Programs',   bg: C.purpleBg,   text: C.purple  },
  homeschool_drop_in:{ label: 'Homeschool',      bg: C.accentLight, text: C.accent },
};

const DEMO_APPLICATIONS = [
  { id: 'a1',  childName: 'Emma Richardson',  preferredName: null,   age: 7,  grade: '2nd', program: 'school_year_26_27', parent: 'Sarah Richardson',  email: 'sarah.r@email.com',  status: 'enrolled',    approved: true,  submitted: 'Nov 14, 2025' },
  { id: 'a2',  childName: 'Marcus Park',      preferredName: 'Marc', age: 8,  grade: '3rd', program: 'both',              parent: 'Jason Park',        email: 'jpark@email.com',    status: 'in_review',   approved: false, submitted: 'Mar 30, 2026' },
  { id: 'a3',  childName: 'Sofia Mendez',     preferredName: null,   age: 8,  grade: '3rd', program: 'school_year_26_27', parent: 'Luis Mendez',       email: 'lmendez@email.com',  status: 'in_review',   approved: false, submitted: 'Apr 1, 2026'  },
  { id: 'a4',  childName: 'Liam Torres',      preferredName: null,   age: 9,  grade: '4th', program: 'both',              parent: 'Miguel Torres',     email: 'mig.t@email.com',    status: 'enrolled',    approved: true,  submitted: 'Dec 3, 2025'  },
  { id: 'a5',  childName: 'Isabelle Clarke',  preferredName: 'Izzy', age: 11, grade: '6th', program: 'school_year_26_27', parent: 'Stephanie Clarke',  email: 'sclarke@email.com',  status: 'enrolling',   approved: true,  submitted: 'Mar 18, 2026' },
  { id: 'a6',  childName: 'Tyler Watkins',    preferredName: null,   age: 9,  grade: '4th', program: 'both',              parent: 'Jerome Watkins',    email: 'jwatkins@email.com', status: 'enrolled',    approved: true,  submitted: 'Dec 20, 2025' },
  { id: 'a7',  childName: 'Grace Hammond',    preferredName: null,   age: 7,  grade: '2nd', program: 'school_year_26_27', parent: 'Alicia Hammond',    email: 'ahammond@email.com', status: 'in_review',   approved: false, submitted: 'Apr 2, 2026'  },
  { id: 'a8',  childName: 'Chidera Okonkwo',  preferredName: 'Chi',  age: 8,  grade: '3rd', program: 'both',              parent: 'Kevin Okonkwo',     email: 'kokonkwo@email.com', status: 'in_progress', approved: false, submitted: 'Apr 4, 2026'  },
  { id: 'a9',  childName: 'Kai Simmons',      preferredName: null,   age: 11, grade: '6th', program: 'school_year_26_27', parent: 'Rachel Simmons',    email: 'rsimmons@email.com', status: 'enrolling',   approved: true,  submitted: 'Mar 22, 2026' },
  { id: 'a10', childName: 'Noah Foster',      preferredName: null,   age: 5,  grade: 'K',   program: 'summer_26',         parent: 'Diana Foster',      email: 'diana@email.com',    status: 'enrolled',    approved: true,  submitted: 'Jan 15, 2026' },
];

// ─── Phase 2 demo data ────────────────────────────────────────────────────────

type DemoParent = {
  id: string; name: string; initials: string; color: string;
  g1Phone: string; g1WorkPhone: string; g1Preferred: string; g1LivesWith: boolean; g1Custody: boolean;
  g2Name: string | null; g2Relationship: string | null; g2Email: string | null; g2Phone: string | null;
  children: { name: string; dob: string }[];
  applications: { childName: string; program: string; status: string; approved: boolean; submitted: string }[];
};

const DEMO_PARENTS: DemoParent[] = [
  {
    id: 'p1', name: 'Sarah Richardson', initials: 'SR', color: '#5E7C68',
    g1Phone: '(512) 555-0101', g1WorkPhone: '(512) 555-0102', g1Preferred: 'Cell', g1LivesWith: true, g1Custody: true,
    g2Name: 'Tom Richardson', g2Relationship: 'Father', g2Email: 'tom.r@email.com', g2Phone: '(512) 555-0103',
    children: [{ name: 'Emma Richardson', dob: 'Mar 12, 2017' }],
    applications: [{ childName: 'Emma Richardson', program: 'school_year_26_27', status: 'enrolled', approved: true, submitted: 'Nov 14, 2025' }],
  },
  {
    id: 'p2', name: 'Miguel Torres', initials: 'MT', color: '#38BDF8',
    g1Phone: '(737) 555-0204', g1WorkPhone: '(737) 555-0205', g1Preferred: 'Cell', g1LivesWith: true, g1Custody: true,
    g2Name: 'Ana Torres', g2Relationship: 'Mother', g2Email: 'ana.t@email.com', g2Phone: '(737) 555-0206',
    children: [{ name: 'Liam Torres', dob: 'Jun 5, 2015' }],
    applications: [{ childName: 'Liam Torres', program: 'both', status: 'enrolled', approved: true, submitted: 'Dec 3, 2025' }],
  },
  {
    id: 'p3', name: 'Diana Foster', initials: 'DF', color: '#F59E0B',
    g1Phone: '(512) 555-0142', g1WorkPhone: '', g1Preferred: 'Cell', g1LivesWith: true, g1Custody: true,
    g2Name: null, g2Relationship: null, g2Email: null, g2Phone: null,
    children: [{ name: 'Noah Foster', dob: 'Sep 22, 2019' }],
    applications: [{ childName: 'Noah Foster', program: 'summer_26', status: 'enrolled', approved: true, submitted: 'Jan 15, 2026' }],
  },
  {
    id: 'p4', name: 'Stephanie Clarke', initials: 'SC', color: '#8B5CF6',
    g1Phone: '(512) 555-0317', g1WorkPhone: '(512) 555-0318', g1Preferred: 'Email', g1LivesWith: false, g1Custody: true,
    g2Name: 'Derek Clarke', g2Relationship: 'Father', g2Email: 'derek.c@email.com', g2Phone: '(512) 555-0319',
    children: [{ name: 'Isabelle Clarke', dob: 'Jan 30, 2013' }],
    applications: [{ childName: 'Isabelle Clarke', program: 'school_year_26_27', status: 'enrolling', approved: true, submitted: 'Mar 18, 2026' }],
  },
  {
    id: 'p5', name: 'Kevin Okonkwo', initials: 'KO', color: '#22C55E',
    g1Phone: '(737) 555-0609', g1WorkPhone: '(737) 555-0610', g1Preferred: 'Work', g1LivesWith: true, g1Custody: true,
    g2Name: 'Adaeze Okonkwo', g2Relationship: 'Mother', g2Email: 'adaeze.o@email.com', g2Phone: '(737) 555-0611',
    children: [{ name: 'Chidera Okonkwo', dob: 'Nov 8, 2016' }],
    applications: [{ childName: 'Chidera Okonkwo', program: 'both', status: 'in_progress', approved: false, submitted: 'Apr 4, 2026' }],
  },
  {
    id: 'p6', name: 'Rachel Simmons', initials: 'RS', color: '#EF4444',
    g1Phone: '(512) 555-0483', g1WorkPhone: '', g1Preferred: 'Cell', g1LivesWith: true, g1Custody: true,
    g2Name: null, g2Relationship: null, g2Email: null, g2Phone: null,
    children: [{ name: 'Kai Simmons', dob: 'Feb 14, 2013' }, { name: 'Jade Simmons', dob: 'Aug 3, 2016' }],
    applications: [
      { childName: 'Kai Simmons', program: 'school_year_26_27', status: 'enrolling', approved: true, submitted: 'Mar 22, 2026' },
      { childName: 'Jade Simmons', program: 'summer_26', status: 'in_review', approved: false, submitted: 'Apr 1, 2026' },
    ],
  },
];

type DemoStudent = {
  id: string; name: string; initials: string; color: string;
  grade: string; dob: string; parent: string; program: string;
  hasAllergies: boolean; hasMedical: boolean; hasEmergencyMeds: boolean; needsAide: boolean;
  allergies: string; medicalConditions: string; emergencyMeds: string; aideDetails: string;
  learningStyle: string; strengths: string; challenges: string; regulationStrategies: string; specialInterests: string;
  medications: { name: string; type: 'daily' | 'emergency'; dosage: string; physician: string }[];
  authorizedPickup: { name: string; relationship: string; phone: string }[];
};

const DEMO_STUDENTS_P2: DemoStudent[] = [
  {
    id: 'st1', name: 'Emma Richardson', initials: 'ER', color: '#5E7C68',
    grade: '2nd', dob: 'Mar 12, 2017', parent: 'Sarah Richardson', program: 'school_year_26_27',
    hasAllergies: false, hasMedical: false, hasEmergencyMeds: false, needsAide: false,
    allergies: '', medicalConditions: '', emergencyMeds: '', aideDetails: '',
    learningStyle: 'Visual and kinesthetic — learns best through hands-on projects and diagrams.',
    strengths: 'Creative writing, art, collaborative group work.',
    challenges: 'Transitions between activities; benefits from 5-minute warnings.',
    regulationStrategies: 'Deep breathing exercises, quiet corner with fidget tools.',
    specialInterests: 'Dinosaurs, painting, building with blocks.',
    medications: [],
    authorizedPickup: [{ name: 'Tom Richardson', relationship: 'Father', phone: '(512) 555-0103' }],
  },
  {
    id: 'st2', name: 'Liam Torres', initials: 'LT', color: '#38BDF8',
    grade: '4th', dob: 'Jun 5, 2015', parent: 'Miguel Torres', program: 'both',
    hasAllergies: true, hasMedical: false, hasEmergencyMeds: false, needsAide: false,
    allergies: 'Tree nuts (peanuts OK). Carries EpiPen, kept in classroom emergency kit.',
    medicalConditions: '', emergencyMeds: '', aideDetails: '',
    learningStyle: 'Auditory learner — benefits from verbal instructions and read-alouds.',
    strengths: 'Math, debate, leadership in group settings.',
    challenges: 'Sitting still for extended periods; movement breaks help significantly.',
    regulationStrategies: 'Scheduled movement breaks every 45 minutes, fidget band on chair.',
    specialInterests: 'Soccer, robotics, cooking.',
    medications: [],
    authorizedPickup: [
      { name: 'Ana Torres', relationship: 'Mother', phone: '(737) 555-0206' },
      { name: 'Grandma Rosa', relationship: 'Grandmother', phone: '(737) 555-0299' },
    ],
  },
  {
    id: 'st3', name: 'Ava Chen', initials: 'AC', color: '#EC4899',
    grade: '1st', dob: 'May 20, 2018', parent: 'Jennifer Chen', program: 'summer_26',
    hasAllergies: true, hasMedical: true, hasEmergencyMeds: true, needsAide: false,
    allergies: 'Dairy and eggs. Must avoid all products containing these.',
    medicalConditions: 'Mild asthma — managed with daily inhaler. No restrictions on outdoor activities.',
    emergencyMeds: 'Albuterol inhaler. Administer if wheezing or difficulty breathing. Call parent immediately.',
    aideDetails: '',
    learningStyle: 'Visual learner — loves charts, color-coding, and illustrated books.',
    strengths: 'Reading comprehension, music, empathy toward peers.',
    challenges: 'Anxiety in loud/crowded environments; quiet space available as needed.',
    regulationStrategies: 'Noise-canceling headphones available, sensory corner access.',
    specialInterests: 'Piano, butterflies, gardening.',
    medications: [
      { name: 'Albuterol (Rescue Inhaler)', type: 'emergency', dosage: '2 puffs as needed', physician: 'Dr. Lisa Park' },
      { name: 'Flovent (Daily Controller)', type: 'daily', dosage: '1 puff morning & evening', physician: 'Dr. Lisa Park' },
    ],
    authorizedPickup: [{ name: 'David Chen', relationship: 'Father', phone: '(512) 555-0221' }],
  },
  {
    id: 'st4', name: 'Noah Foster', initials: 'NF', color: '#F59E0B',
    grade: 'K', dob: 'Sep 22, 2019', parent: 'Diana Foster', program: 'summer_26',
    hasAllergies: false, hasMedical: false, hasEmergencyMeds: false, needsAide: true,
    allergies: '', medicalConditions: '', emergencyMeds: '',
    aideDetails: 'Receiving support for social-emotional development and self-regulation. Works with Ms. Kim 1:1 for 30 min/day.',
    learningStyle: 'Kinesthetic — learns through play-based and tactile activities.',
    strengths: 'Imaginative play, spatial reasoning, kind toward animals.',
    challenges: 'Peer conflict resolution; working on turn-taking and sharing.',
    regulationStrategies: 'Emotion chart, calm-down corner, visual schedule.',
    specialInterests: 'Trucks, dinosaurs, water play.',
    medications: [],
    authorizedPickup: [
      { name: 'Grandpa Joe', relationship: 'Grandfather', phone: '(512) 555-0155' },
    ],
  },
  {
    id: 'st5', name: 'Sophia Patel', initials: 'SP', color: '#A78BFA',
    grade: '3rd', dob: 'Dec 7, 2016', parent: 'Priya Patel', program: 'school_year_26_27',
    hasAllergies: false, hasMedical: false, hasEmergencyMeds: false, needsAide: false,
    allergies: '', medicalConditions: '', emergencyMeds: '', aideDetails: '',
    learningStyle: 'Reading/writing learner — thrives with written instructions and journaling.',
    strengths: 'Math, storytelling, independent research projects.',
    challenges: 'Public speaking; building confidence in verbal sharing with group.',
    regulationStrategies: 'Journaling, peer partner for group sharing.',
    specialInterests: 'Astronomy, Indian classical dance, mystery novels.',
    medications: [],
    authorizedPickup: [{ name: 'Raj Patel', relationship: 'Father', phone: '(512) 555-0392' }],
  },
  {
    id: 'st6', name: 'Isabelle Clarke', initials: 'IC', color: '#8B5CF6',
    grade: '6th', dob: 'Jan 30, 2013', parent: 'Stephanie Clarke', program: 'school_year_26_27',
    hasAllergies: false, hasMedical: true, hasEmergencyMeds: false, needsAide: false,
    allergies: '',
    medicalConditions: 'Type 1 Diabetes — self-monitors blood glucose. Has glucagon kit in office. Parents notified for readings below 70.',
    emergencyMeds: '', aideDetails: '',
    learningStyle: 'Mixed — auditory for concepts, writing for processing.',
    strengths: 'Leadership, debate, advanced math, organizing group projects.',
    challenges: 'Perfectionism; can become frustrated when work isn\'t "perfect".',
    regulationStrategies: 'Growth mindset check-ins, incremental goal setting.',
    specialInterests: 'Law, debate club, competitive chess, baking.',
    medications: [
      { name: 'Glucagon Emergency Kit', type: 'emergency', dosage: 'Per protocol', physician: 'Dr. Maria Santos' },
    ],
    authorizedPickup: [
      { name: 'Derek Clarke', relationship: 'Father', phone: '(512) 555-0319' },
      { name: 'Aunt Bev', relationship: 'Aunt', phone: '(512) 555-0320' },
    ],
  },
  {
    id: 'st7', name: 'Tyler Watkins', initials: 'TW', color: '#22C55E',
    grade: '4th', dob: 'Apr 11, 2015', parent: 'Jerome Watkins', program: 'both',
    hasAllergies: false, hasMedical: false, hasEmergencyMeds: false, needsAide: false,
    allergies: '', medicalConditions: '', emergencyMeds: '', aideDetails: '',
    learningStyle: 'Visual-spatial — thrives with maps, diagrams, and project-based learning.',
    strengths: 'Science, hands-on experiments, helping younger students.',
    challenges: 'Reading fluency; currently working with reading specialist twice a week.',
    regulationStrategies: 'Movement breaks, choice in seating (standing desk available).',
    specialInterests: 'Minecraft, basketball, cooking shows.',
    medications: [],
    authorizedPickup: [
      { name: 'Keisha Watkins', relationship: 'Mother', phone: '(737) 555-0650' },
    ],
  },
  {
    id: 'st8', name: 'Chidera Okonkwo', initials: 'CO', color: '#F97316',
    grade: '3rd', dob: 'Nov 8, 2016', parent: 'Kevin Okonkwo', program: 'both',
    hasAllergies: false, hasMedical: false, hasEmergencyMeds: false, needsAide: false,
    allergies: '', medicalConditions: '', emergencyMeds: '', aideDetails: '',
    learningStyle: 'Social learner — learns best through discussion, peer collaboration, and teaching others.',
    strengths: 'Verbal communication, storytelling, mathematics.',
    challenges: 'Focus during independent quiet work; benefits from low-distraction seating.',
    regulationStrategies: 'Preferential seating near teacher, short task chunking.',
    specialInterests: 'African history, soccer, card games.',
    medications: [],
    authorizedPickup: [
      { name: 'Adaeze Okonkwo', relationship: 'Mother', phone: '(737) 555-0611' },
      { name: 'Uncle Emeka', relationship: 'Uncle', phone: '(737) 555-0612' },
    ],
  },
];

type ProgramTeacher = { id: string; name: string; initials: string; classroom: string; studentIds: string[] };
type DemoProgram = { id: string; name: string; teachers: ProgramTeacher[] };

const DEMO_PROGRAMS_P2: DemoProgram[] = [
  {
    id: 'summer_26', name: 'Summer 2026',
    teachers: [
      { id: 't1', name: 'Ms. Taylor Reyes',  initials: 'TR', classroom: 'Room A (Pre-K – 2nd)',  studentIds: ['st1', 'st3', 'st4', 'st5'] },
      { id: 't2', name: 'Mr. James Kim',     initials: 'JK', classroom: 'Room B (3rd – 6th)',    studentIds: ['st2', 'st7', 'st8'] },
    ],
  },
  {
    id: 'school_year_26_27', name: 'School Year 26–27',
    teachers: [
      { id: 't3', name: 'Ms. Taylor Reyes',  initials: 'TR', classroom: 'Primary (K – 2nd)',     studentIds: ['st1', 'st4'] },
      { id: 't4', name: 'Ms. Nicole Park',   initials: 'NP', classroom: 'Elementary (3rd – 4th)',studentIds: ['st2', 'st5', 'st7'] },
      { id: 't5', name: 'Mr. David Osei',    initials: 'DO', classroom: 'Middle (5th – 6th)',    studentIds: ['st6', 'st8'] },
    ],
  },
  {
    id: 'homeschool_drop_in', name: 'Homeschool Drop-In',
    teachers: [
      { id: 't6', name: 'Ms. Carla Nguyen', initials: 'CN', classroom: 'Mixed Ages',             studentIds: ['st3', 'st5', 'st7', 'st8'] },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────

type Message = { id: string; senderId: 'admin' | 'parent'; text: string; time: string };
type Conversation = { id: string; name: string; initials: string; color: string; lastMsg: string; time: string; unread: number; messages: Message[] };

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1', name: 'Sarah Richardson', initials: 'SR', color: '#5E7C68',
    lastMsg: 'Emma did so well today!', time: '2m ago', unread: 2,
    messages: [
      { id: 'm1', senderId: 'parent', text: "Hi! Just wanted to check in on Emma's progress this week.", time: '9:02 AM' },
      { id: 'm2', senderId: 'admin',  text: "Emma has been doing wonderfully! She's really engaged during reading time.", time: '9:15 AM' },
      { id: 'm3', senderId: 'parent', text: 'That\'s so great to hear. She talks about school every evening.', time: '9:18 AM' },
      { id: 'm4', senderId: 'admin',  text: "She's a joy to have. We'll send a full update in the newsletter Friday.", time: '9:22 AM' },
      { id: 'm5', senderId: 'parent', text: 'Emma did so well today!', time: '10:45 AM' },
    ],
  },
  {
    id: 'c2', name: 'Miguel Torres', initials: 'MT', color: '#38BDF8',
    lastMsg: 'Question about the field trip form', time: '1h ago', unread: 1,
    messages: [
      { id: 'm1', senderId: 'parent', text: 'Hello, I had a question about the upcoming field trip permission form.', time: '8:30 AM' },
      { id: 'm2', senderId: 'admin',  text: 'Hi Miguel! The form was emailed last Thursday. Let me resend it now.', time: '8:45 AM' },
      { id: 'm3', senderId: 'parent', text: 'Question about the field trip form', time: '9:05 AM' },
    ],
  },
  {
    id: 'c3', name: 'Diana Foster', initials: 'DF', color: '#F59E0B',
    lastMsg: 'Thanks for the quick reply!', time: '3h ago', unread: 0,
    messages: [
      { id: 'm1', senderId: 'parent', text: "Is Noah's summer program orientation confirmed for May 20th?", time: 'Yesterday' },
      { id: 'm2', senderId: 'admin',  text: 'Yes! Orientation is confirmed — May 20th at 9 AM in the main hall.', time: 'Yesterday' },
      { id: 'm3', senderId: 'parent', text: 'Thanks for the quick reply!', time: 'Yesterday' },
    ],
  },
  {
    id: 'c4', name: 'Stephanie Clarke', initials: 'SC', color: '#8B5CF6',
    lastMsg: 'When does enrollment close?', time: '1d ago', unread: 0,
    messages: [
      { id: 'm1', senderId: 'parent', text: 'Hi — when does enrollment close for school year 26–27?', time: 'Apr 5' },
      { id: 'm2', senderId: 'admin',  text: "Enrollment closes April 30th. Izzy's spot is already secured!", time: 'Apr 5' },
      { id: 'm3', senderId: 'parent', text: 'When does enrollment close?', time: 'Apr 6' },
    ],
  },
  {
    id: 'c5', name: 'Jason Park', initials: 'JP', color: '#22C55E',
    lastMsg: 'Sounds good, see you then.', time: '2d ago', unread: 0,
    messages: [
      { id: 'm1', senderId: 'parent', text: 'Can we schedule a tour for next week?', time: 'Apr 3' },
      { id: 'm2', senderId: 'admin',  text: 'Absolutely! How does Tuesday at 10 AM work?', time: 'Apr 3' },
      { id: 'm3', senderId: 'parent', text: 'Sounds good, see you then.', time: 'Apr 3' },
    ],
  },
];

// ─── Shared primitives ─────────────────────────────────────────────────────────

function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: C.r.lg,
        boxShadow: C.shadowCard,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: C.textTertiary }}>
      {children}
    </p>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? { bg: C.elevated, border: C.border, text: C.textTertiary, label: status };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full"
      style={{ backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function ProgramBadge({ program }: { program: string }) {
  const p = PROGRAM_LABELS[program] ?? { label: program, bg: C.elevated, text: C.textTertiary };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      {p.label}
    </span>
  );
}

// ─── Dashboard components ─────────────────────────────────────────────────────

function StatCard({ title, value, delta, deltaPositive, icon, delay = 0 }: {
  title: string; value: string; delta?: string; deltaPositive?: boolean; icon?: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className="relative overflow-hidden"
      style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: C.r.lg,
        padding: '20px',
        boxShadow: C.shadowCard,
      }}
    >
      {icon && (
        <div className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: C.accentGlow }}>
          <span style={{ color: C.accent }}>{icon}</span>
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>{title}</p>
      <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: C.textPrimary }}>{value}</p>
      {delta && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs font-semibold" style={{ color: deltaPositive ? C.success : C.error }}>
            {deltaPositive ? '▲' : '▼'} {delta}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function RevenueAreaChart() {
  const W = 480, H = 160;
  const PAD = { top: 12, right: 16, bottom: 28, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const revData = DEMO_MONTHLY_REVENUE.map(m => m.revenue);
  const expData = DEMO_MONTHLY_REVENUE.map(m => m.expenses);
  const maxVal = Math.max(...revData, ...expData);
  const xStep = innerW / (DEMO_MONTHLY_REVENUE.length - 1);
  const toY = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;
  const toX = (i: number) => PAD.left + i * xStep;
  const revPoints = revData.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const expPoints = expData.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const revPath = revData.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
  const revArea = `${revPath} L${toX(revData.length - 1)},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`;
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="adminRevGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={toY(tick)} x2={PAD.left + innerW} y2={toY(tick)} stroke={C.border} strokeDasharray="3 3" strokeWidth="1" />
          <text x={PAD.left - 6} y={toY(tick) + 4} textAnchor="end" fontSize="9" fill={C.textTertiary}>
            {tick > 0 ? `$${Math.round(tick / 1000)}k` : ''}
          </text>
        </g>
      ))}
      <path d={revArea} fill="url(#adminRevGrad)" />
      <polyline points={expPoints} fill="none" stroke={C.border} strokeWidth="1.5" strokeDasharray="4 3" />
      <polyline points={revPoints} fill="none" stroke={C.accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {DEMO_MONTHLY_REVENUE.map((m, i) => (
        <text key={m.month} x={toX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill={C.textTertiary}>{m.month}</text>
      ))}
    </svg>
  );
}

function ProgressRing({ value, label, sublabel, color, delay = 0 }: {
  value: number; label: string; sublabel?: string; color: string; delay?: number;
}) {
  const size = 56, strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(value, 100) / 100);
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={strokeWidth} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
            strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, delay, ease: 'easeOut' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold tabular-nums" style={{ fontSize: '11px', color: C.textPrimary }}>{value}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{label}</p>
        {sublabel && <p className="text-xs mt-0.5" style={{ color: C.textTertiary }}>{sublabel}</p>}
      </div>
    </div>
  );
}

const DOT_COLORS: Record<string, string> = {
  purple: '#8B5CF6', success: '#22C55E', info: '#38BDF8', warning: '#F59E0B', danger: '#EF4444',
};

function ActivityFeed() {
  return (
    <Card style={{ padding: '20px' }}>
      <SectionLabel>Recent Activity</SectionLabel>
      <div className="relative pl-4" style={{ borderLeft: `2px solid ${C.border}` }}>
        {DEMO_ACTIVITY.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="relative flex items-start gap-3 mb-4 last:mb-0"
          >
            <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: DOT_COLORS[event.color] ?? C.textTertiary }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug" style={{ color: C.textSecondary }}>{event.text}</p>
            </div>
            <span className="text-[11px] flex-shrink-0" style={{ color: C.textTertiary }}>{event.time}</span>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

function FunnelWidget() {
  const max = FUNNEL_STAGES[0].count;
  return (
    <Card style={{ padding: '20px' }}>
      <SectionLabel>Enrollment Pipeline</SectionLabel>
      <div className="space-y-3">
        {FUNNEL_STAGES.map((stage, i) => {
          const pct = Math.round((stage.count / max) * 100);
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: C.textTertiary }}>{stage.label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color: C.textPrimary }}>{stage.count}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  style={{ backgroundColor: stage.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function UpcomingEventsWidget() {
  const TYPE_COLORS: Record<string, string> = {
    event: C.accent, deadline: C.error, internal: C.textTertiary,
  };
  return (
    <Card style={{ padding: '20px' }}>
      <SectionLabel>Upcoming</SectionLabel>
      <div className="space-y-3">
        {DEMO_EVENTS.map((ev) => {
          const d = new Date(ev.date);
          const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
          const day = d.getDate();
          return (
            <div key={ev.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center"
                style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '8px', color: C.textTertiary, fontWeight: 700, lineHeight: 1 }}>{month}</span>
                <span style={{ fontSize: '14px', color: C.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>{day}</span>
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium leading-snug truncate" style={{ color: C.textPrimary }}>{ev.title}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: TYPE_COLORS[ev.type] ?? C.textTertiary }}>{ev.type}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Dashboard page ────────────────────────────────────────────────────────────

function DashboardPage() {
  const KPIS = [
    { title: 'Revenue YTD',   value: '$47,320',  delta: '18% vs last year', pos: true,  icon: <DollarSign className="w-4 h-4" /> },
    { title: 'Enrolled',      value: '24',        delta: '+4 this cycle',    pos: true,  icon: <Users className="w-4 h-4" /> },
    { title: 'Active Leads',  value: '37',        delta: '+12 this month',   pos: true,  icon: <TrendingUp className="w-4 h-4" /> },
    { title: 'In Review',     value: '8',         delta: 'Applications',     pos: false, icon: <ClipboardList className="w-4 h-4" /> },
    { title: 'Avg Tuition',   value: '$1,972/mo', delta: '+$140 vs Q3',      pos: true,  icon: <BarChart2 className="w-4 h-4" /> },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>Sagefield School — Spring / Summer 2026</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {KPIS.map((kpi, i) => (
          <StatCard key={kpi.title} title={kpi.title} value={kpi.value} delta={kpi.delta} deltaPositive={kpi.pos} icon={kpi.icon} delay={i * 0.05} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card style={{ padding: '20px' }}>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Revenue vs Expenses</SectionLabel>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: C.accent }} />
                  <span style={{ color: C.textTertiary }}>Revenue</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ borderColor: C.border }} />
                  <span style={{ color: C.textTertiary }}>Expenses</span>
                </span>
              </div>
            </div>
            <RevenueAreaChart />
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card style={{ padding: '20px' }}>
            <SectionLabel>Enrollment Capacity</SectionLabel>
            <div className="space-y-5">
              <ProgressRing value={90} label="Summer 2026"      sublabel="18 / 20 enrolled" color={C.accent} delay={0.3} />
              <ProgressRing value={64} label="School Year 26–27" sublabel="14 / 22 enrolled" color={C.info}   delay={0.4} />
              <div className="flex items-center gap-4 pt-1">
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold tabular-nums"
                  style={{ border: `5px solid ${C.warning}`, backgroundColor: C.warningBg, color: C.warning }}>
                  31
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: C.textPrimary }}>Waitlist</p>
                  <p className="text-xs" style={{ color: C.textTertiary }}>Families waiting</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ActivityFeed />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <FunnelWidget />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <UpcomingEventsWidget />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Leads page ────────────────────────────────────────────────────────────────

const LEAD_FILTERS = [
  { key: 'all',              label: 'All',           count: 37 },
  { key: 'new',              label: 'New',           count: 14 },
  { key: 'contacted',        label: 'Contacted',     count: 9  },
  { key: 'application_sent', label: 'App Sent',      count: 6  },
  { key: 'enrolled',         label: 'Enrolled',      count: 6  },
  { key: 'lost',             label: 'Lost',          count: 2  },
];

const LEAD_TAGS = ['Summer 2026', 'School Year', 'Both', 'Financial Aid', 'Homeschool'];

function LeadDetailPanel({ lead, onClose }: { lead: typeof DEMO_LEADS[0]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="absolute top-0 right-0 bottom-0 w-80 flex flex-col overflow-hidden"
      style={{ backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10 }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>{lead.name}</h3>
        <button onClick={onClose} className="p-1 rounded" style={{ color: C.textTertiary }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Contact</p>
          <p className="text-sm" style={{ color: C.textSecondary }}>{lead.email}</p>
          <p className="text-sm" style={{ color: C.textSecondary }}>{lead.phone}</p>
        </div>
        {lead.childName && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Child</p>
            <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{lead.childName}</p>
            <p className="text-xs" style={{ color: C.textTertiary }}>Age {lead.childAge}</p>
          </div>
        )}
        {lead.message && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Message</p>
            <p className="text-sm leading-relaxed" style={{ color: C.textSecondary }}>{lead.message}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Status</p>
          <StatusBadge status={lead.status} />
        </div>
        {lead.tags.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded-full"
                  style={{ backgroundColor: C.accentLight, color: C.accent }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Admin Notes</p>
          <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textTertiary, fontStyle: 'italic' }}>
            Add a note...
          </div>
        </div>
      </div>
      <div className="px-5 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <button className="w-full py-2 text-sm font-semibold rounded-lg transition-colors"
          style={{ backgroundColor: C.accentLight, color: C.accent }}>
          Send Application Link
        </button>
      </div>
    </motion.div>
  );
}

function LeadsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<typeof DEMO_LEADS[0] | null>(null);

  const filtered = DEMO_LEADS.filter(l => {
    const statusMatch = activeFilter === 'all' || l.status === activeFilter;
    const tagMatch = !activeTag || l.tags.includes(activeTag);
    return statusMatch && tagMatch;
  });

  return (
    <div className="h-full flex flex-col relative">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Leads</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>Waitlist signups and contact submissions</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {LEAD_FILTERS.map(f => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all"
            style={{
              backgroundColor: activeFilter === f.key ? C.accent : C.elevated,
              color: activeFilter === f.key ? '#fff' : C.textSecondary,
              border: `1px solid ${activeFilter === f.key ? C.accent : C.border}`,
            }}>
            {f.label}
            <span className="text-[10px] font-bold opacity-70">{f.count}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {LEAD_TAGS.map(tag => (
          <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-full transition-all"
            style={{
              backgroundColor: activeTag === tag ? C.accentLight : 'transparent',
              color: activeTag === tag ? C.accent : C.textTertiary,
              border: `1px solid ${activeTag === tag ? C.accent : C.border}`,
            }}>
            {tag}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Type', 'Name', 'Contact', 'Child', 'Message', 'Status', 'Tags', 'Date'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: C.textTertiary }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <motion.tr key={lead.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedLead(lead)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{ backgroundColor: lead.type === 'waitlist' ? C.accentLight : C.purpleBg, color: lead.type === 'waitlist' ? C.accent : C.purple }}>
                      {lead.type === 'waitlist' ? 'Waitlist' : 'Contact'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: C.textPrimary }}>{lead.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p style={{ color: C.textSecondary }}>{lead.email}</p>
                    <p className="text-xs" style={{ color: C.textTertiary }}>{lead.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    {lead.childName
                      ? <><p style={{ color: C.textSecondary }}>{lead.childName}</p><p className="text-xs" style={{ color: C.textTertiary }}>Age {lead.childAge}</p></>
                      : <span style={{ color: C.textTertiary }}>—</span>}
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="truncate text-xs" style={{ color: C.textTertiary }}>
                      {lead.message ?? '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {lead.tags.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-[9px] font-medium rounded-full"
                          style={{ backgroundColor: C.accentLight, color: C.accent }}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{lead.date}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {selectedLead && <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Applications page ─────────────────────────────────────────────────────────

type AppView = 'table' | 'kanban' | 'pipeline';

function AppDetailPanel({ app, onClose }: { app: typeof DEMO_APPLICATIONS[0]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="absolute top-0 right-0 bottom-0 w-80 flex flex-col overflow-hidden"
      style={{ backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10 }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>{app.childName}</h3>
          {app.preferredName && <p className="text-xs" style={{ color: C.textTertiary }}>Goes by "{app.preferredName}"</p>}
        </div>
        <button onClick={onClose} className="p-1 rounded" style={{ color: C.textTertiary }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Grade', value: app.grade },
            { label: 'Age', value: `${app.age} yrs` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-3" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.textTertiary }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Program</p>
          <ProgramBadge program={app.program} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Status</p>
          <StatusBadge status={app.status} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Guardian</p>
          <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{app.parent}</p>
          <p className="text-xs" style={{ color: C.textTertiary }}>{app.email}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Submitted</p>
          <p className="text-sm" style={{ color: C.textSecondary }}>{app.submitted}</p>
        </div>
        {app.approved && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: C.successBg, border: `1px solid ${C.successBorder}` }}>
            <CheckCircle className="w-4 h-4" style={{ color: C.success }} />
            <span className="text-xs font-semibold" style={{ color: C.success }}>Approved</span>
          </div>
        )}
      </div>
      <div className="px-5 py-4 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <button className="flex-1 py-2 text-xs font-semibold rounded-lg"
          style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }}>
          Approve
        </button>
        <button className="flex-1 py-2 text-xs font-semibold rounded-lg"
          style={{ backgroundColor: C.errorBg, color: C.error, border: `1px solid ${C.errorBorder}` }}>
          Deny
        </button>
      </div>
    </motion.div>
  );
}

const KANBAN_COLS = [
  { key: 'in_progress', label: 'In Progress', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'in_review',   label: 'In Review',   icon: <AlertCircle className="w-3.5 h-3.5" /> },
  { key: 'enrolling',   label: 'Enrolling',   icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: 'enrolled',    label: 'Enrolled',    icon: <CheckCircle className="w-3.5 h-3.5" /> },
];

function ApplicationsPage() {
  const [view, setView] = useState<AppView>('table');
  const [selectedApp, setSelectedApp] = useState<typeof DEMO_APPLICATIONS[0] | null>(null);

  const viewButtons: { key: AppView; icon: React.ReactNode; label: string }[] = [
    { key: 'table',    icon: <Table className="w-3.5 h-3.5" />,   label: 'Table'    },
    { key: 'kanban',   icon: <LayoutGrid className="w-3.5 h-3.5" />, label: 'Kanban'   },
    { key: 'pipeline', icon: <GitBranch className="w-3.5 h-3.5" />, label: 'Pipeline' },
  ];

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Applications</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>{DEMO_APPLICATIONS.length} applications total</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
          {viewButtons.map(b => (
            <button key={b.key} onClick={() => setView(b.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{
                backgroundColor: view === b.key ? C.surface : 'transparent',
                color: view === b.key ? C.textPrimary : C.textTertiary,
                boxShadow: view === b.key ? C.shadowCard : 'none',
              }}>
              {b.icon}{b.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'table' && (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
            <Card className="h-full overflow-hidden">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Child', 'Parent', 'Age / Grade', 'Program', 'Status', 'Approved', 'Submitted', ''].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: C.textTertiary }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_APPLICATIONS.map((app, i) => (
                      <motion.tr key={app.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: C.textPrimary }}>{app.childName}</p>
                          {app.preferredName && <p className="text-xs" style={{ color: C.textTertiary }}>"{app.preferredName}"</p>}
                        </td>
                        <td className="px-4 py-3">
                          <p style={{ color: C.textSecondary }}>{app.parent}</p>
                          <p className="text-xs" style={{ color: C.textTertiary }}>{app.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p style={{ color: C.textSecondary }}>{app.age} yrs</p>
                          <p className="text-xs" style={{ color: C.textTertiary }}>{app.grade}</p>
                        </td>
                        <td className="px-4 py-3"><ProgramBadge program={app.program} /></td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                        <td className="px-4 py-3">
                          {app.approved
                            ? <span className="text-xs font-semibold" style={{ color: C.success }}>✓ Approved</span>
                            : <span style={{ color: C.textTertiary }}>—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{app.submitted}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelectedApp(app)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors"
                            style={{ backgroundColor: C.elevated, color: C.textSecondary, border: `1px solid ${C.border}` }}>
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {view === 'kanban' && (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex gap-4 flex-1 overflow-x-auto pb-2">
            {KANBAN_COLS.map(col => {
              const apps = DEMO_APPLICATIONS.filter(a => a.status === col.key);
              const s = STATUS_COLORS[col.key];
              return (
                <div key={col.key} className="flex-shrink-0 w-64 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span style={{ color: s?.text ?? C.textTertiary }}>{col.icon}</span>
                    <span className="text-xs font-semibold" style={{ color: C.textSecondary }}>{col.label}</span>
                    <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: C.textTertiary }}>{apps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {apps.map((app, i) => (
                      <motion.div key={app.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        onClick={() => setSelectedApp(app)}
                        className="cursor-pointer rounded-xl p-3 transition-colors"
                        style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderStrong)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                        <p className="text-sm font-semibold mb-1" style={{ color: C.textPrimary }}>{app.childName}</p>
                        <p className="text-xs mb-2" style={{ color: C.textTertiary }}>{app.parent}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ProgramBadge program={app.program} />
                          <span className="text-[10px]" style={{ color: C.textTertiary }}>{app.grade}</span>
                        </div>
                      </motion.div>
                    ))}
                    {apps.length === 0 && (
                      <div className="rounded-xl p-4 text-center" style={{ border: `1px dashed ${C.border}` }}>
                        <p className="text-xs" style={{ color: C.textTertiary }}>No applications</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {view === 'pipeline' && (
          <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
            <Card style={{ padding: '32px' }}>
              <SectionLabel>Enrollment Pipeline</SectionLabel>
              <div className="space-y-5 mt-4">
                {FUNNEL_STAGES.map((stage, i) => {
                  const max = FUNNEL_STAGES[0].count;
                  const pct = Math.round((stage.count / max) * 100);
                  const convPct = i > 0 ? Math.round((stage.count / FUNNEL_STAGES[i - 1].count) * 100) : 100;
                  return (
                    <div key={stage.label}>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="w-24 text-xs font-semibold" style={{ color: C.textSecondary }}>{stage.label}</span>
                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                          <motion.div className="h-full rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                            style={{ backgroundColor: stage.color }} />
                        </div>
                        <span className="w-8 text-sm font-bold tabular-nums text-right" style={{ color: C.textPrimary }}>{stage.count}</span>
                        {i > 0 && (
                          <span className="w-16 text-xs text-right" style={{ color: C.textTertiary }}>
                            {convPct}% conv.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Leads', value: '37', color: C.accent },
                  { label: 'Conversion Rate', value: '65%', color: C.success },
                  { label: 'Avg. Time to Enroll', value: '18 days', color: C.info },
                  { label: 'Revenue Pipeline', value: '$86k', color: C.warning },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-4 text-center"
                    style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                    <p className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="text-xs mt-1" style={{ color: C.textTertiary }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedApp && <AppDetailPanel app={selectedApp} onClose={() => setSelectedApp(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Messages page ─────────────────────────────────────────────────────────────

function MessagesPage() {
  const [activeConv, setActiveConv] = useState<Conversation>(DEMO_CONVERSATIONS[0]);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [activeConv]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Messages</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>Parent conversations</p>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl flex" style={{ border: `1px solid ${C.border}` }}>
        {/* Conversation list */}
        <div className="w-72 flex-shrink-0 flex flex-col" style={{ borderRight: `1px solid ${C.border}`, backgroundColor: C.surface }}>
          <div className="p-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
              <Search className="w-3.5 h-3.5" style={{ color: C.textTertiary }} />
              <span className="text-xs" style={{ color: C.textTertiary }}>Search conversations...</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {DEMO_CONVERSATIONS.map(conv => (
              <button key={conv.id} onClick={() => setActiveConv(conv)}
                className="w-full flex items-start gap-3 p-4 text-left transition-colors"
                style={{
                  backgroundColor: activeConv.id === conv.id ? C.elevated : 'transparent',
                  borderBottom: `1px solid ${C.border}`,
                }}
                onMouseEnter={e => { if (activeConv.id !== conv.id) e.currentTarget.style.backgroundColor = C.elevated; }}
                onMouseLeave={e => { if (activeConv.id !== conv.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: conv.color + '22', color: conv.color }}>
                  {conv.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium" style={{ color: C.textPrimary }}>{conv.name}</span>
                    <span className="text-[10px]" style={{ color: C.textTertiary }}>{conv.time}</span>
                  </div>
                  <p className="text-xs truncate" style={{ color: C.textTertiary }}>{conv.lastMsg}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: C.accent, color: '#fff' }}>
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col" style={{ backgroundColor: C.bg }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: C.surface }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: activeConv.color + '22', color: activeConv.color }}>
              {activeConv.initials}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{activeConv.name}</p>
              <p className="text-xs" style={{ color: C.textTertiary }}>Parent</p>
            </div>
          </div>
          <div ref={threadRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeConv.messages.map((msg, i) => {
              const isAdmin = msg.senderId === 'admin';
              return (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isAdmin && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ backgroundColor: activeConv.color + '22', color: activeConv.color }}>
                      {activeConv.initials}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        backgroundColor: isAdmin ? C.accent : C.elevated,
                        color: isAdmin ? '#fff' : C.textPrimary,
                        borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] px-1" style={{ color: C.textTertiary }}>{msg.time}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          <div className="p-4" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.surface }}>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
              <span className="flex-1 text-sm" style={{ color: C.textTertiary }}>Type a message...</span>
              <button className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: C.accent, color: '#fff' }}>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Parents page ─────────────────────────────────────────────────────────────

function YesNoChip({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full"
      style={{
        backgroundColor: value ? C.successBg : C.errorBg,
        border: `1px solid ${value ? C.successBorder : C.errorBorder}`,
        color: value ? C.success : C.error,
      }}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="text-xs flex-shrink-0" style={{ color: C.textTertiary }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: C.textPrimary }}>{value ?? '—'}</span>
    </div>
  );
}

function ParentDetailPanel({ parent, onClose }: { parent: DemoParent; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="absolute top-0 right-0 bottom-0 w-84 flex flex-col overflow-hidden"
      style={{ width: 340, backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10 }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: parent.color + '22', color: parent.color }}>
            {parent.initials}
          </div>
          <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>{parent.name}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded" style={{ color: C.textTertiary }}><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Guardian 1 */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Guardian 1</p>
          <div>
            <DetailField label="Cell Phone" value={parent.g1Phone} />
            {parent.g1WorkPhone && <DetailField label="Work Phone" value={parent.g1WorkPhone} />}
            <DetailField label="Preferred Contact" value={parent.g1Preferred} />
            <DetailField label="Lives with Child" value={<YesNoChip value={parent.g1LivesWith} />} />
            <DetailField label="Has Custody" value={<YesNoChip value={parent.g1Custody} />} />
          </div>
        </div>
        {/* Guardian 2 */}
        {parent.g2Name && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Guardian 2</p>
            <DetailField label="Name" value={parent.g2Name} />
            <DetailField label="Relationship" value={parent.g2Relationship} />
            <DetailField label="Email" value={parent.g2Email} />
            <DetailField label="Cell Phone" value={parent.g2Phone} />
          </div>
        )}
        {/* Children */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>
            Children ({parent.children.length})
          </p>
          <div className="space-y-2">
            {parent.children.map(child => (
              <div key={child.name} className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: parent.color + '22', color: parent.color }}>
                  {child.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{child.name}</p>
                  <p className="text-xs" style={{ color: C.textTertiary }}>DOB: {child.dob}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Applications */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>
            Applications
          </p>
          <div className="space-y-2">
            {parent.applications.map((app, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-semibold mb-2" style={{ color: C.textPrimary }}>{app.childName}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <ProgramBadge program={app.program} />
                  <StatusBadge status={app.status} />
                  {app.approved && (
                    <span className="text-[10px] font-semibold" style={{ color: C.success }}>✓ Approved</span>
                  )}
                </div>
                <p className="text-[10px] mt-2" style={{ color: C.textTertiary }}>Submitted {app.submitted}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ParentsPage() {
  const [selected, setSelected] = useState<DemoParent | null>(null);
  return (
    <div className="h-full flex flex-col relative">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Parents</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>{DEMO_PARENTS.length} parent accounts</p>
      </div>
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Name', 'G1 Phone', 'G2 Name', 'Relationship', 'G2 Email', 'G2 Phone', 'Children', ''].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: C.textTertiary }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_PARENTS.map((p, i) => (
                <motion.tr key={p.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: p.color + '22', color: p.color }}>
                        {p.initials}
                      </div>
                      <span className="font-medium" style={{ color: C.textPrimary }}>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{p.g1Phone}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{p.g2Name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{p.g2Relationship ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{p.g2Email ?? '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{p.g2Phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold tabular-nums" style={{ color: C.textPrimary }}>{p.children.length}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(p)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md"
                      style={{ backgroundColor: C.elevated, color: C.textSecondary, border: `1px solid ${C.border}` }}>
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <AnimatePresence>
        {selected && <ParentDetailPanel parent={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Students page ─────────────────────────────────────────────────────────────

const HEALTH_FLAGS = [
  { key: 'hasAllergies',    label: 'Allergies',          color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  { key: 'hasMedical',      label: 'Medical Conditions', color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  { key: 'hasEmergencyMeds',label: 'Emergency Meds',     color: '#F97316', bg: 'rgba(249,115,22,0.1)'  },
  { key: 'needsAide',       label: 'Needs Aide',         color: '#38BDF8', bg: 'rgba(56,189,248,0.1)'  },
] as const;

function StudentDetailPanel({ student, onClose }: { student: DemoStudent; onClose: () => void }) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const flags = HEALTH_FLAGS.filter(f => student[f.key]);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden"
      style={{ width: 360, backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: student.color + '22', color: student.color }}>
            {student.initials}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>{student.name}</p>
            <p className="text-xs" style={{ color: C.textTertiary }}>{student.grade} · {student.parent}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded" style={{ color: C.textTertiary }}><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Health flags */}
        {flags.length > 0 && (
          <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            {flags.map(f => (
              <span key={f.key} className="px-2 py-1 text-[10px] font-semibold rounded-full"
                style={{ backgroundColor: f.bg, color: f.color }}>
                ⚠ {f.label}
              </span>
            ))}
          </div>
        )}
        {/* Quick-access collapsible sections */}
        <div style={{ borderBottom: `1px solid ${C.border}` }}>
          {[
            {
              key: 'immunizations', label: 'Immunizations',
              content: (
                <div className="space-y-1.5">
                  {['MMR_2024.pdf', 'Varicella_2023.pdf', 'Flu_Shot_2025.pdf'].map(f => (
                    <div key={f} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                      style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                      <span style={{ color: C.textSecondary }}>{f}</span>
                      <span style={{ color: C.textTertiary }}>View</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: 'medications', label: 'Medications',
              content: student.medications.length > 0 ? (
                <div className="space-y-2">
                  {student.medications.map(m => (
                    <div key={m.name} className="p-3 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold" style={{ color: C.textPrimary }}>{m.name}</p>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full"
                          style={{ backgroundColor: m.type === 'emergency' ? C.errorBg : C.successBg, color: m.type === 'emergency' ? C.error : C.success }}>
                          {m.type}
                        </span>
                      </div>
                      <p className="text-[11px]" style={{ color: C.textTertiary }}>{m.dosage} · {m.physician}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs" style={{ color: C.textTertiary }}>No medications on file</p>,
            },
            {
              key: 'pickup', label: 'Authorized Pickup',
              content: (
                <div className="space-y-2">
                  {student.authorizedPickup.map(p => (
                    <div key={p.name} className="p-3 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                      <p className="text-xs font-semibold" style={{ color: C.textPrimary }}>{p.name}</p>
                      <p className="text-[11px]" style={{ color: C.textTertiary }}>{p.relationship} · {p.phone}</p>
                    </div>
                  ))}
                </div>
              ),
            },
          ].map(section => (
            <div key={section.key}>
              <button
                onClick={() => setOpenSection(openSection === section.key ? null : section.key)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold transition-colors"
                style={{ color: C.textSecondary }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                {section.label}
                <ChevronRight className="w-3.5 h-3.5 transition-transform" style={{ transform: openSection === section.key ? 'rotate(90deg)' : 'none', color: C.textTertiary }} />
              </button>
              <AnimatePresence>
                {openSection === section.key && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div className="px-5 pb-4">{section.content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        {/* Info cards */}
        <div className="p-5 space-y-4">
          {[
            {
              title: 'Student Info',
              fields: [
                { label: 'Full Name', value: student.name },
                { label: 'Grade', value: student.grade },
                { label: 'Date of Birth', value: student.dob },
                { label: 'Parent', value: student.parent },
                { label: 'Special Interests', value: student.specialInterests },
              ],
            },
            {
              title: 'Medical',
              fields: [
                { label: 'Allergies', value: student.hasAllergies ? student.allergies : 'None' },
                { label: 'Medical Conditions', value: student.hasMedical ? student.medicalConditions : 'None' },
                { label: 'Emergency Meds', value: student.hasEmergencyMeds ? student.emergencyMeds : 'None' },
              ],
            },
            {
              title: 'Support Needs',
              fields: [
                { label: 'Needs Aide', value: <YesNoChip value={student.needsAide} /> },
                { label: 'Aide Details', value: student.needsAide ? student.aideDetails : '—' },
              ],
            },
            {
              title: 'Learning Profile',
              fields: [
                { label: 'Learning Style', value: student.learningStyle },
                { label: 'Strengths', value: student.strengths },
                { label: 'Challenges', value: student.challenges },
                { label: 'Regulation Strategies', value: student.regulationStrategies },
              ],
            },
          ].map(card => (
            <div key={card.title} className="rounded-xl p-4" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>{card.title}</p>
              {card.fields.map(f => (
                <DetailField key={f.label} label={f.label} value={f.value} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function StudentsPage() {
  const [selected, setSelected] = useState<DemoStudent | null>(null);
  return (
    <div className="h-full flex flex-col relative">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Students</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>{DEMO_STUDENTS_P2.length} enrolled students</p>
      </div>
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Name', 'Grade', 'DOB', 'Parent', 'Program', 'Flags', ''].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: C.textTertiary }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_STUDENTS_P2.map((s, i) => {
                const flags = HEALTH_FLAGS.filter(f => s[f.key]);
                return (
                  <motion.tr key={s.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    style={{ borderBottom: `1px solid ${C.border}` }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{ backgroundColor: s.color + '22', color: s.color }}>
                          {s.initials}
                        </div>
                        <span className="font-medium" style={{ color: C.textPrimary }}>{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{s.grade}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{s.dob}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{s.parent}</td>
                    <td className="px-4 py-3"><ProgramBadge program={s.program} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {flags.map(f => (
                          <span key={f.key} className="w-2 h-2 rounded-full flex-shrink-0" title={f.label}
                            style={{ backgroundColor: f.color }} />
                        ))}
                        {flags.length === 0 && <span style={{ color: C.textTertiary }}>—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(s)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md"
                        style={{ backgroundColor: C.elevated, color: C.textSecondary, border: `1px solid ${C.border}` }}>
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <AnimatePresence>
        {selected && <StudentDetailPanel student={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Programs page ─────────────────────────────────────────────────────────────

function ProgramsPage() {
  const [activeProgram, setActiveProgram] = useState<DemoProgram>(DEMO_PROGRAMS_P2[0]);
  const [activeTeacherId, setActiveTeacherId] = useState(DEMO_PROGRAMS_P2[0].teachers[0].id);
  const [selectedStudent, setSelectedStudent] = useState<DemoStudent | null>(null);

  const activeTeacher = activeProgram.teachers.find(t => t.id === activeTeacherId) ?? activeProgram.teachers[0];
  const teacherStudents = activeTeacher.studentIds.map(id => DEMO_STUDENTS_P2.find(s => s.id === id)).filter(Boolean) as DemoStudent[];
  const totalStudents = activeProgram.teachers.reduce((sum, t) => sum + t.studentIds.length, 0);

  const switchProgram = (prog: DemoProgram) => {
    setActiveProgram(prog);
    setActiveTeacherId(prog.teachers[0].id);
    setSelectedStudent(null);
  };

  return (
    <div className="h-full flex gap-4 relative">
      {/* Left sub-nav */}
      <div className="w-44 flex-shrink-0 flex flex-col gap-1 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: C.textTertiary }}>Programs</p>
        {DEMO_PROGRAMS_P2.map(prog => {
          const active = activeProgram.id === prog.id;
          const count = prog.teachers.reduce((s, t) => s + t.studentIds.length, 0);
          return (
            <button key={prog.id} onClick={() => switchProgram(prog)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: active ? C.accentLight : 'transparent',
                color: active ? C.accent : C.textSecondary,
                borderLeft: `2px solid ${active ? C.accent : 'transparent'}`,
              }}>
              <span className="block truncate">{prog.name}</span>
              <span className="text-[10px]" style={{ color: active ? C.accentDark : C.textTertiary }}>{count} students</span>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>{activeProgram.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>{totalStudents} students enrolled</p>
        </div>

        {/* Teacher tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {activeProgram.teachers.map(teacher => {
            const active = activeTeacherId === teacher.id;
            return (
              <button key={teacher.id} onClick={() => setActiveTeacherId(teacher.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  backgroundColor: active ? C.accentLight : C.elevated,
                  border: `1px solid ${active ? C.accent : C.border}`,
                  color: active ? C.accent : C.textSecondary,
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: active ? C.accent : C.border, color: active ? '#fff' : C.textTertiary }}>
                  {teacher.initials}
                </div>
                <div className="text-left">
                  <p>{teacher.name}</p>
                  <p className="text-[10px] opacity-70">{teacher.classroom}</p>
                </div>
                <span className="ml-1 tabular-nums" style={{ color: active ? C.accentDark : C.textTertiary }}>
                  {teacher.studentIds.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Student grid */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTeacherId}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {teacherStudents.map((student, i) => (
              <motion.div key={student.id}
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedStudent(student)}
                className="cursor-pointer rounded-xl p-4 flex flex-col items-center text-center transition-colors"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.borderStrong)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-3"
                  style={{ backgroundColor: student.color + '22', color: student.color }}>
                  {student.initials}
                </div>
                <p className="text-sm font-semibold leading-tight mb-1" style={{ color: C.textPrimary }}>{student.name}</p>
                <p className="text-xs" style={{ color: C.textTertiary }}>{student.grade}</p>
                <p className="text-[10px] mt-0.5" style={{ color: C.textTertiary }}>{student.dob}</p>
                {HEALTH_FLAGS.some(f => student[f.key]) && (
                  <div className="flex items-center gap-1 mt-2">
                    {HEALTH_FLAGS.filter(f => student[f.key]).map(f => (
                      <span key={f.key} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} title={f.label} />
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {teacherStudents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-sm" style={{ color: C.textTertiary }}>No students assigned</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedStudent && <StudentDetailPanel student={selectedStudent} onClose={() => setSelectedStudent(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Phase 3 demo data ────────────────────────────────────────────────────────

const DEMO_TRANSACTIONS = [
  { id: 't1',  payerName: 'Sarah Richardson',  payerEmail: 'sarah.r@email.com',  childName: 'Emma Richardson',  amount: 1800, type: 'tuition',      status: 'succeeded',  date: 'Apr 1, 2026',  program: 'school_year', method: 'card', stripeId: 'pi_3OxK...aA1b' },
  { id: 't2',  payerName: 'Miguel Torres',     payerEmail: 'mig.t@email.com',    childName: 'Liam Torres',      amount: 900,  type: 'deposit',      status: 'succeeded',  date: 'Mar 29, 2026', program: 'both',        method: 'card', stripeId: 'pi_3OxJ...bB2c' },
  { id: 't3',  payerName: 'Jennifer Chen',     payerEmail: 'jchen@email.com',    childName: 'Ava Chen',         amount: 900,  type: 'tuition',      status: 'succeeded',  date: 'Apr 1, 2026',  program: 'summer',      method: 'card', stripeId: 'pi_3OxI...cC3d' },
  { id: 't4',  payerName: 'Priya Patel',       payerEmail: 'ppatel@email.com',   childName: 'Raj Patel',        amount: 1800, type: 'tuition',      status: 'succeeded',  date: 'Apr 1, 2026',  program: 'school_year', method: 'ach',  stripeId: 'pi_3OxH...dD4e' },
  { id: 't5',  payerName: 'Jerome Watkins',    payerEmail: 'jwatkins@email.com', childName: 'Tyler Watkins',    amount: 500,  type: 'registration', status: 'succeeded',  date: 'Mar 25, 2026', program: 'both',        method: 'card', stripeId: 'pi_3OxG...eE5f' },
  { id: 't6',  payerName: 'Diana Foster',      payerEmail: 'diana@email.com',    childName: 'Noah Foster',      amount: 900,  type: 'tuition',      status: 'succeeded',  date: 'Apr 1, 2026',  program: 'summer',      method: 'card', stripeId: 'pi_3OxF...fF6g' },
  { id: 't7',  payerName: 'Kevin Johnson',     payerEmail: 'kjohnson@email.com', childName: 'Mia Johnson',      amount: 1800, type: 'tuition',      status: 'succeeded',  date: 'Apr 1, 2026',  program: 'school_year', method: 'card', stripeId: 'pi_3OxE...gG7h' },
  { id: 't8',  payerName: 'Tara Williams',     payerEmail: 'twilliams@email.com',childName: 'Lucas Williams',   amount: 900,  type: 'deposit',      status: 'succeeded',  date: 'Mar 28, 2026', program: 'both',        method: 'card', stripeId: 'pi_3OxD...hH8i' },
  { id: 't9',  payerName: 'Mark Davis',        payerEmail: 'mdavis@email.com',   childName: 'Harper Davis',     amount: 1800, type: 'tuition',      status: 'succeeded',  date: 'Apr 1, 2026',  program: 'school_year', method: 'card', stripeId: 'pi_3OxC...iI9j' },
  { id: 't10', payerName: 'Grace Thompson',    payerEmail: 'gthompson@email.com',childName: 'Aiden Thompson',   amount: 900,  type: 'tuition',      status: 'succeeded',  date: 'Apr 1, 2026',  program: 'summer',      method: 'ach',  stripeId: 'pi_3OxB...jJ0k' },
  { id: 't11', payerName: 'David Wright',      payerEmail: 'dwright@email.com',  childName: 'Mason Wright',     amount: 900,  type: 'tuition',      status: 'processing', date: 'Apr 5, 2026',  program: 'both',        method: 'ach',  stripeId: 'pi_3OxA...kK1l' },
  { id: 't12', payerName: 'Angela Lee',        payerEmail: 'alee@email.com',     childName: 'Sebastian Lee',    amount: 1800, type: 'tuition',      status: 'failed',     date: 'Apr 2, 2026',  program: 'both',        method: 'card', stripeId: 'pi_3Ox9...lL2m' },
];

const TX_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  tuition:      { bg: C.accentLight, text: C.accent },
  deposit:      { bg: C.infoBg,      text: C.info   },
  registration: { bg: C.purpleBg,    text: C.purple  },
};
const TX_STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  succeeded:  { bg: C.successBg, border: C.successBorder, text: C.success },
  processing: { bg: C.warningBg, border: C.warningBorder, text: C.warning },
  failed:     { bg: C.errorBg,   border: C.errorBorder,   text: C.error   },
};

type TuitionItem = { label: string; state: 'paid' | 'sent' | 'unpaid'; date?: string };
type ChecklistParent = { id: string; name: string; initials: string; color: string; upToDate: boolean; summer: TuitionItem[]; schoolYear: TuitionItem[] };

const DEMO_CHECKLIST: ChecklistParent[] = [
  {
    id: 'cp1', name: 'Sarah Richardson', initials: 'SR', color: '#5E7C68', upToDate: true,
    summer: [
      { label: 'Registration Fee', state: 'paid', date: 'Jan 15' },
      ...Array.from({ length: 12 }, (_, i) => ({ label: `Week ${i + 1}`, state: i < 8 ? 'paid' as const : 'unpaid' as const, date: i < 8 ? `May ${10 + i * 7 > 31 ? (10 + i * 7) - 31 : 10 + i * 7}` : undefined })),
    ],
    schoolYear: [
      { label: 'Registration Fee', state: 'paid', date: 'Nov 1' },
      { label: 'Supply Fee', state: 'paid', date: 'Nov 1' },
      ...['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => ({ label: `${m} Tuition`, state: i < 6 ? 'paid' as const : i === 6 ? 'sent' as const : 'unpaid' as const, date: i < 6 ? `${m} 1` : undefined })),
    ],
  },
  {
    id: 'cp2', name: 'Miguel Torres', initials: 'MT', color: '#38BDF8', upToDate: false,
    summer: [
      { label: 'Registration Fee', state: 'paid', date: 'Dec 20' },
      ...Array.from({ length: 12 }, (_, i) => ({ label: `Week ${i + 1}`, state: i < 5 ? 'paid' as const : i === 5 ? 'sent' as const : 'unpaid' as const, date: i < 5 ? `May ${10 + i * 7}` : undefined })),
    ],
    schoolYear: [
      { label: 'Registration Fee', state: 'paid', date: 'Dec 1' },
      { label: 'Supply Fee', state: 'paid', date: 'Dec 1' },
      ...['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => ({ label: `${m} Tuition`, state: i < 5 ? 'paid' as const : 'unpaid' as const, date: i < 5 ? `${m} 1` : undefined })),
    ],
  },
  {
    id: 'cp3', name: 'Diana Foster', initials: 'DF', color: '#F59E0B', upToDate: true,
    summer: [
      { label: 'Registration Fee', state: 'paid', date: 'Jan 15' },
      ...Array.from({ length: 12 }, (_, i) => ({ label: `Week ${i + 1}`, state: i < 10 ? 'paid' as const : 'unpaid' as const, date: i < 10 ? `May ${10 + i * 7 > 62 ? (10 + i * 7) - 62 : 10 + i * 7}` : undefined })),
    ],
    schoolYear: [],
  },
  {
    id: 'cp4', name: 'Jerome Watkins', initials: 'JW', color: '#22C55E', upToDate: true,
    summer: [
      { label: 'Registration Fee', state: 'paid', date: 'Feb 10' },
      ...Array.from({ length: 12 }, (_, i) => ({ label: `Week ${i + 1}`, state: 'paid' as const, date: `May ${10 + i * 7 > 62 ? 'Jun' : 'May'} ${(10 + i * 7) % 31 || 31}` })),
    ],
    schoolYear: [
      { label: 'Registration Fee', state: 'paid', date: 'Feb 10' },
      { label: 'Supply Fee', state: 'paid', date: 'Feb 10' },
      ...['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map((m, i) => ({ label: `${m} Tuition`, state: 'paid' as const, date: `${m} 1` })),
    ],
  },
];

const BUDGET_CATS = [
  { name: 'Personnel',        emoji: '👥', planned: 24000, actual: 17280, color: C.accent      },
  { name: 'Facilities',       emoji: '🏫', planned: 8400,  actual: 4872,  color: C.info        },
  { name: 'Program Supplies', emoji: '📚', planned: 3200,  actual: 2912,  color: C.warning     },
  { name: 'Operations',       emoji: '⚙️', planned: 4800,  actual: 2112,  color: C.purple      },
  { name: 'Marketing',        emoji: '📣', planned: 2000,  actual: 600,   color: C.accentBright},
  { name: 'Other',            emoji: '📦', planned: 1600,  actual: 240,   color: C.textTertiary},
];

const DEMO_EXPENSES = [
  { id: 'ex1',  category: 'Personnel',        description: 'Teacher salaries — March',       amount: 5800,  date: 'Mar 31, 2026', receipt: 'payroll_mar.pdf'    },
  { id: 'ex2',  category: 'Facilities',       description: 'Monthly rent',                   amount: 1400,  date: 'Apr 1, 2026',  receipt: 'rent_apr.pdf'       },
  { id: 'ex3',  category: 'Program Supplies', description: 'Art & craft materials Q2',        amount: 487,   date: 'Mar 28, 2026', receipt: 'michaels_receipt.pdf'},
  { id: 'ex4',  category: 'Operations',       description: 'Liability insurance — Q2',       amount: 620,   date: 'Apr 1, 2026',  receipt: 'insurance_q2.pdf'   },
  { id: 'ex5',  category: 'Personnel',        description: 'Aide support hours — March',     amount: 1280,  date: 'Mar 31, 2026', receipt: 'aide_mar.pdf'       },
  { id: 'ex6',  category: 'Marketing',        description: 'Spring flyer printing',          amount: 180,   date: 'Mar 22, 2026', receipt: 'print_shop.pdf'     },
  { id: 'ex7',  category: 'Facilities',       description: 'Utilities — March',              amount: 312,   date: 'Mar 31, 2026', receipt: null                 },
  { id: 'ex8',  category: 'Program Supplies', description: 'Curriculum workbooks',           amount: 224,   date: 'Mar 15, 2026', receipt: 'curriculum.pdf'     },
  { id: 'ex9',  category: 'Operations',       description: 'Software subscriptions (Zoom, G Suite)', amount: 89, date: 'Apr 1, 2026', receipt: null             },
  { id: 'ex10', category: 'Personnel',        description: 'Staff professional development', amount: 400,   date: 'Mar 20, 2026', receipt: 'pd_workshop.pdf'    },
];

const DEMO_INCOME = [
  { id: 'in1', source: 'Tuition',    description: 'April tuition — school year families',   amount: 21600, date: 'Apr 1, 2026',  program: 'school_year_26_27' },
  { id: 'in2', source: 'Tuition',    description: 'April tuition — summer families',        amount: 8100,  date: 'Apr 1, 2026',  program: 'summer_26'         },
  { id: 'in3', source: 'Tuition',    description: 'March tuition — school year families',   amount: 21600, date: 'Mar 1, 2026',  program: 'school_year_26_27' },
  { id: 'in4', source: 'Deposit',    description: 'Enrollment deposits — spring cycle',     amount: 3500,  date: 'Mar 18, 2026', program: 'both'              },
  { id: 'in5', source: 'Tuition',    description: 'Feb tuition — school year families',     amount: 19800, date: 'Feb 1, 2026',  program: 'school_year_26_27' },
  { id: 'in6', source: 'Donation',   description: 'Annual fund contribution — Anonymous',   amount: 2500,  date: 'Mar 10, 2026', program: ''                  },
  { id: 'in7', source: 'Tuition',    description: 'Jan tuition — school year families',     amount: 19800, date: 'Jan 1, 2026',  program: 'school_year_26_27' },
  { id: 'in8', source: 'Donation',   description: 'Spring gala proceeds',                   amount: 4200,  date: 'Feb 22, 2026', program: ''                  },
];

type CalEvent = { id: string; title: string; date: string; color: string; category: string; isAllDay: boolean; startTime?: string; endTime?: string; program: string };

const DEMO_CAL_EVENTS: CalEvent[] = [
  { id: 'ce1',  title: 'Staff Planning Meeting',          date: '2026-04-07', color: '#5E7C68', category: 'Staff Meeting',   isAllDay: false, startTime: '08:30', endTime: '10:00', program: 'both'         },
  { id: 'ce2',  title: 'Q2 Newsletter Deadline',          date: '2026-04-09', color: '#EF4444', category: 'Deadline',        isAllDay: true,  program: 'both'         },
  { id: 'ce3',  title: 'Campus Family Open Day',          date: '2026-04-12', color: '#F59E0B', category: 'Parent Event',    isAllDay: false, startTime: '10:00', endTime: '13:00', program: 'both'         },
  { id: 'ce4',  title: 'Info Session',                    date: '2026-04-18', color: '#38BDF8', category: 'Parent Event',    isAllDay: false, startTime: '18:00', endTime: '19:30', program: 'both'         },
  { id: 'ce5',  title: 'School Year Enrollment Closes',   date: '2026-04-30', color: '#EF4444', category: 'Deadline',        isAllDay: true,  program: 'school_year_26_27' },
  { id: 'ce6',  title: 'Teacher Training Day',            date: '2026-04-14', color: '#8B5CF6', category: 'Staff Meeting',   isAllDay: true,  program: 'both'         },
  { id: 'ce7',  title: 'Spring Field Trip',               date: '2026-04-22', color: '#22C55E', category: 'Field Trip',      isAllDay: false, startTime: '09:00', endTime: '14:00', program: 'school_year_26_27' },
  { id: 'ce8',  title: 'Summer Program Orientation',      date: '2026-05-20', color: '#5E7C68', category: 'Parent Event',    isAllDay: false, startTime: '09:00', endTime: '11:00', program: 'summer_26'    },
  { id: 'ce9',  title: 'Summer Program Begins',           date: '2026-05-26', color: '#22C55E', category: 'Academic',        isAllDay: true,  program: 'summer_26'    },
  { id: 'ce10', title: 'End-of-Year Showcase',            date: '2026-05-08', color: '#F59E0B', category: 'Parent Event',    isAllDay: false, startTime: '14:00', endTime: '17:00', program: 'school_year_26_27' },
  { id: 'ce11', title: 'Parent-Teacher Conferences',      date: '2026-04-16', color: '#38BDF8', category: 'Academic',        isAllDay: false, startTime: '13:00', endTime: '18:00', program: 'both'         },
  { id: 'ce12', title: 'Board Meeting',                   date: '2026-04-21', color: '#525252', category: 'Internal',        isAllDay: false, startTime: '17:00', endTime: '19:00', program: 'both'         },
  { id: 'ce13', title: 'Spring Break Begins',             date: '2026-04-10', color: '#8B5CF6', category: 'Holiday',         isAllDay: true,  program: 'school_year_26_27' },
  { id: 'ce14', title: 'Spring Break Ends',               date: '2026-04-17', color: '#8B5CF6', category: 'Holiday',         isAllDay: true,  program: 'school_year_26_27' },
  { id: 'ce15', title: 'Supply Order Deadline',           date: '2026-04-25', color: '#EF4444', category: 'Deadline',        isAllDay: true,  program: 'both'         },
  { id: 'ce16', title: 'Open House',                      date: '2026-04-25', color: '#F59E0B', category: 'Parent Event',    isAllDay: false, startTime: '11:00', endTime: '14:00', program: 'both'         },
  { id: 'ce17', title: 'Staff Appreciation Day',          date: '2026-05-01', color: '#22C55E', category: 'Internal',        isAllDay: true,  program: 'both'         },
  { id: 'ce18', title: 'Graduation Ceremony',             date: '2026-05-15', color: '#5E7C68', category: 'Academic',        isAllDay: false, startTime: '10:00', endTime: '12:00', program: 'school_year_26_27' },
];

const DEMO_EMAILS = [
  { id: 'em1', to: 'All Summer 2026 Families', from: 'admin@sagefield.co', subject: 'Summer 2026 Orientation — May 20th Details', preview: 'We are excited to welcome your family to our Summer 2026 orientation on May 20th at 9 AM...', date: '2 days ago', body: `<p>Dear Summer 2026 Families,</p><p>We are thrilled to welcome you to our Summer 2026 Orientation on <strong>May 20th at 9:00 AM</strong> in the Main Hall.</p><p>Please bring a valid photo ID and your signed enrollment forms. Light refreshments will be provided.</p><p>If you have any questions, please do not hesitate to reach out.</p><p>Warm regards,<br/>Sagefield Admin Team</p>`, attachments: ['orientation_agenda.pdf'] },
  { id: 'em2', to: 'sarah.r@email.com', from: 'admin@sagefield.co', subject: 'Emma Richardson — April Progress Update', preview: 'We wanted to share a quick update on Emma\'s wonderful progress this month...', date: '4 days ago', body: `<p>Dear Sarah,</p><p>We wanted to share a quick update on Emma's wonderful progress this month. She has been an absolute joy in the classroom — her reading fluency has improved significantly, and she's been a kind leader during group activities.</p><p>We look forward to celebrating her growth at our end-of-year showcase!</p><p>Best,<br/>Ms. Taylor Reyes</p>`, attachments: [] },
  { id: 'em3', to: 'All Enrolled Families', from: 'admin@sagefield.co', subject: 'April Newsletter — Spring Events & Updates', preview: 'Spring is here! Check out our upcoming events, curriculum highlights, and important dates...', date: '1 week ago', body: `<p>Dear Sagefield Families,</p><h3>🌸 Spring Events</h3><ul><li>April 22 — Spring Field Trip</li><li>April 25 — Open House (11 AM – 2 PM)</li><li>May 8 — End-of-Year Showcase</li></ul><h3>📚 Curriculum Spotlight</h3><p>This month we're exploring nature journaling and community helpers. Students have been amazing!</p><p>Thank you for your continued support.</p><p>The Sagefield Team</p>`, attachments: ['april_newsletter.pdf', 'spring_calendar.pdf'] },
  { id: 'em4', to: 'diana@email.com', from: 'admin@sagefield.co', subject: 'Re: Noah Foster — Summer Enrollment Confirmation', preview: 'Hi Diana, confirming that Noah\'s enrollment for Summer 2026 is complete...', date: '1 week ago', body: `<p>Hi Diana,</p><p>Great news — Noah's Summer 2026 enrollment is officially confirmed! Here's a summary:</p><ul><li><strong>Program:</strong> Summer 2026</li><li><strong>Start Date:</strong> May 26, 2026</li><li><strong>Classroom:</strong> Room A (Pre-K – 2nd)</li><li><strong>Teacher:</strong> Ms. Taylor Reyes</li></ul><p>We can't wait to see Noah flourish this summer!</p><p>Warm regards,<br/>Sagefield Admin</p>`, attachments: [] },
  { id: 'em5', to: 'All School Year Families', from: 'admin@sagefield.co', subject: 'Important: Enrollment Closing April 30th', preview: 'A reminder that open enrollment for School Year 2026–27 closes on April 30th...', date: '2 weeks ago', body: `<p>Dear School Year Families,</p><p>This is a friendly reminder that <strong>open enrollment for School Year 2026–27 closes on April 30th</strong>.</p><p>If you have friends or family interested in Sagefield, please share our enrollment link before the deadline.</p><p>Current families: your spots are secured — no action needed.</p><p>Thank you!</p>`, attachments: [] },
  { id: 'em6', to: 'kokonkwo@email.com', from: 'admin@sagefield.co', subject: 'Chidera Okonkwo — Application Status Update', preview: 'We\'ve received Chidera\'s application and our team is currently reviewing it...', date: '2 weeks ago', body: `<p>Dear Kevin,</p><p>Thank you for submitting Chidera's application for the School Year 2026–27 program.</p><p>Our admissions team is currently reviewing the application. We aim to follow up within 5–7 business days.</p><p>In the meantime, feel free to reach out with any questions.</p><p>Best,<br/>Sagefield Admissions</p>`, attachments: [] },
  { id: 'em7', to: 'All Families', from: 'admin@sagefield.co', subject: 'Open House Reminder — April 25th', preview: 'Just a reminder about our Open House this Saturday from 11 AM to 2 PM...', date: '3 weeks ago', body: `<p>Dear Sagefield Community,</p><p>Don't forget — our <strong>Spring Open House is this Saturday, April 25th from 11 AM to 2 PM</strong>!</p><p>Tours, Q&A with teachers, student art displays, and light refreshments.</p><p>Bring a friend who's curious about Sagefield — we'd love to meet them.</p><p>See you there!</p>`, attachments: [] },
  { id: 'em8', to: 'All Staff', from: 'admin@sagefield.co', subject: 'Staff Meeting Recap — April 7th', preview: 'Thanks everyone for a productive planning session. Here are the key takeaways...', date: '1 month ago', body: `<p>Team,</p><p>Thank you for a great planning session! Key decisions from today:</p><ul><li>Summer curriculum finalized — workbooks ordered</li><li>Field trip date confirmed: April 22nd</li><li>Teacher appreciation week: May 4–8</li><li>End-of-year showcase: May 8th at 2 PM</li></ul><p>Action items sent individually. See you next week!</p>`, attachments: ['meeting_notes.pdf'] },
];

const DEMO_OPEN_HOUSE_RSVPS = [
  { id: 'oh1', name: 'Brian Thornton',   email: 'bthornton@email.com',  phone: '(737) 555-0225', adults: 2, children: 2, notes: 'Referred by Emma Richardson family.' },
  { id: 'oh2', name: 'Sandra Cho',       email: 'sandcho@email.com',    phone: '(512) 555-0735', adults: 1, children: 1, notes: '' },
  { id: 'oh3', name: 'Henry Walsh',      email: 'hwalsh@email.com',     phone: '(737) 555-0265', adults: 2, children: 3, notes: 'Interested in financial aid options.' },
  { id: 'oh4', name: 'Alicia Hammond',   email: 'ahammond@email.com',   phone: '(512) 555-0523', adults: 1, children: 1, notes: '' },
  { id: 'oh5', name: 'Kevin Okonkwo',    email: 'kokonkwo@email.com',   phone: '(737) 555-0609', adults: 2, children: 2, notes: 'Application already submitted.' },
  { id: 'oh6', name: 'Jessica Huang',    email: 'jhuang@email.com',     phone: '(512) 555-0695', adults: 2, children: 1, notes: 'Very interested after campus tour.' },
  { id: 'oh7', name: 'Marcus Webb',      email: 'mwebb@email.com',      phone: '(737) 555-0781', adults: 1, children: 2, notes: '' },
  { id: 'oh8', name: 'Stephanie Cole',   email: 'scole@email.com',      phone: '(512) 555-0867', adults: 2, children: 1, notes: 'Met us at the school fair.' },
];

const DEMO_TOUR_BOOKINGS = [
  { id: 'tb1', date: 'Apr 8, 2026',  time: '10:00 AM', firstName: 'Linda',   lastName: 'Nakamura',  email: 'lnakamura@email.com',  childName: 'Yuki Nakamura',   grade: '2nd', status: 'completed'  },
  { id: 'tb2', date: 'Apr 10, 2026', time: '11:00 AM', firstName: 'Gregory', lastName: 'Moss',      email: 'gmoss@email.com',      childName: 'Theo Moss',       grade: 'K',   status: 'completed'  },
  { id: 'tb3', date: 'Apr 15, 2026', time: '9:30 AM',  firstName: 'Natalie', lastName: 'Cruz',      email: 'ncruz@email.com',      childName: 'Marco Cruz',      grade: '1st', status: 'confirmed'  },
  { id: 'tb4', date: 'Apr 18, 2026', time: '10:00 AM', firstName: 'David',   lastName: 'Park',      email: 'dpark@email.com',      childName: 'Ella Park',       grade: '3rd', status: 'confirmed'  },
  { id: 'tb5', date: 'Apr 22, 2026', time: '2:00 PM',  firstName: 'Carmen',  lastName: 'Vega',      email: 'cvega@email.com',      childName: 'Leo Vega',        grade: '1st', status: 'pending'    },
  { id: 'tb6', date: 'Apr 25, 2026', time: '11:00 AM', firstName: 'Thomas',  lastName: 'Reed',      email: 'treed@email.com',      childName: 'Finn Reed',       grade: 'K',   status: 'pending'    },
];

const DEMO_INFO_RSVPS = [
  { id: 'ir1', firstName: 'Brian',    lastName: 'Thornton',  email: 'bthornton@email.com',  phone: '(737) 555-0225', programs: ['Summer 2026', 'School Year'],             children: [{ name: 'Oliver', age: 6 }],                    hearAboutUs: 'Friend referral'   },
  { id: 'ir2', firstName: 'Sandra',   lastName: 'Cho',       email: 'sandcho@email.com',    phone: '(512) 555-0735', programs: ['School Year'],                              children: [{ name: 'Mina', age: 8 }],                      hearAboutUs: 'Google search'     },
  { id: 'ir3', firstName: 'Henry',    lastName: 'Walsh',     email: 'hwalsh@email.com',     phone: '(737) 555-0265', programs: ['Summer 2026'],                              children: [{ name: 'Jack', age: 5 }, { name: 'Sam', age: 7 }], hearAboutUs: 'School fair'    },
  { id: 'ir4', firstName: 'David',    lastName: 'Park',      email: 'dpark@email.com',      phone: '(737) 555-0093', programs: ['Homeschool Drop-In'],                       children: [{ name: 'Ella', age: 9 }],                      hearAboutUs: 'Instagram'         },
  { id: 'ir5', firstName: 'Jessica',  lastName: 'Huang',     email: 'jhuang@email.com',     phone: '(512) 555-0695', programs: ['School Year', 'Homeschool Drop-In'],        children: [{ name: 'Mia', age: 7 }],                       hearAboutUs: 'Campus tour'       },
  { id: 'ir6', firstName: 'Marcus',   lastName: 'Webb',      email: 'mwebb@email.com',      phone: '(737) 555-0781', programs: ['Summer 2026'],                              children: [{ name: 'Aiden', age: 5 }, { name: 'Zoe', age: 8 }], hearAboutUs: 'Word of mouth'  },
];

const DEMO_FAQ = [
  { q: 'What ages do you serve?', a: 'We serve children from Pre-K (age 4) through 6th grade (age 12). Our mixed-age classrooms are intentionally designed to foster peer mentorship and collaboration.' },
  { q: 'What is your teacher-to-student ratio?', a: 'We maintain a 1:6 ratio in our primary classrooms (Pre-K – 2nd) and a 1:8 ratio in our elementary classrooms (3rd – 6th). Aides are assigned based on individual student needs.' },
  { q: 'Do you offer financial aid or scholarships?', a: 'Yes. Sagefield offers need-based financial assistance for up to 20% of our enrollment. Applications are reviewed on a rolling basis. Contact us to receive the financial aid form.' },
  { q: 'What curriculum approach does Sagefield use?', a: 'We blend Montessori principles with project-based learning. Students develop academic skills through hands-on inquiry, meaningful projects, and self-directed exploration guided by experienced educators.' },
  { q: 'How does the enrollment process work?', a: 'Families submit an application through our portal. Our admissions team reviews each application and reaches out within 5–7 business days. Accepted families are invited to complete enrollment and pay the registration fee to secure their spot.' },
];

// ─── Transactions page ─────────────────────────────────────────────────────────

function TransactionsPage() {
  const [tab, setTab] = useState<'all' | 'checklist'>('all');
  const [selectedTx, setSelectedTx] = useState<typeof DEMO_TRANSACTIONS[0] | null>(null);
  const [selectedParent, setSelectedParent] = useState<ChecklistParent>(DEMO_CHECKLIST[0]);
  const [openSection, setOpenSection] = useState<'summer' | 'schoolYear'>('summer');

  const fmt = (cents: number) => `$${cents.toLocaleString()}`;

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Transactions</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>{DEMO_TRANSACTIONS.length} total payments</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
          {[{ key: 'all', label: 'All Transactions' }, { key: 'checklist', label: 'Tuition Checklist' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'all' | 'checklist')}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{ backgroundColor: tab === t.key ? C.surface : 'transparent', color: tab === t.key ? C.textPrimary : C.textTertiary, boxShadow: tab === t.key ? C.shadowCard : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'all' && (
          <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
            <Card className="h-full overflow-hidden">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Type', 'Status', 'Payer', 'Child', 'Amount', 'Method', 'Date'].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_TRANSACTIONS.map((tx, i) => {
                      const tc = TX_TYPE_COLORS[tx.type] ?? { bg: C.elevated, text: C.textTertiary };
                      const sc = TX_STATUS_COLORS[tx.status] ?? { bg: C.elevated, border: C.border, text: C.textTertiary };
                      return (
                        <motion.tr key={tx.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                          onClick={() => setSelectedTx(tx)}
                          className="cursor-pointer"
                          style={{ borderBottom: `1px solid ${C.border}` }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize" style={{ backgroundColor: tc.bg, color: tc.text }}>{tx.type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize" style={{ backgroundColor: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>{tx.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm" style={{ color: C.textPrimary }}>{tx.payerName}</p>
                            <p className="text-xs" style={{ color: C.textTertiary }}>{tx.payerEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{tx.childName}</td>
                          <td className="px-4 py-3 text-sm font-bold tabular-nums" style={{ color: C.textPrimary }}>{fmt(tx.amount)}</td>
                          <td className="px-4 py-3 text-xs uppercase" style={{ color: C.textTertiary }}>{tx.method}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{tx.date}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
            {/* Transaction detail panel */}
            <AnimatePresence>
              {selectedTx && (
                <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute top-0 right-0 bottom-0 flex flex-col overflow-hidden"
                  style={{ width: 320, backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10 }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>Transaction Detail</h3>
                    <button onClick={() => setSelectedTx(null)} style={{ color: C.textTertiary }}><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="rounded-xl p-4" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                      <p className="text-2xl font-bold tabular-nums mb-1" style={{ color: C.textPrimary }}>${selectedTx.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize" style={{ backgroundColor: TX_TYPE_COLORS[selectedTx.type]?.bg, color: TX_TYPE_COLORS[selectedTx.type]?.text }}>{selectedTx.type}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize" style={{ backgroundColor: TX_STATUS_COLORS[selectedTx.status]?.bg, border: `1px solid ${TX_STATUS_COLORS[selectedTx.status]?.border}`, color: TX_STATUS_COLORS[selectedTx.status]?.text }}>{selectedTx.status}</span>
                      </div>
                    </div>
                    <div>
                      <DetailField label="Payer" value={selectedTx.payerName} />
                      <DetailField label="Email" value={selectedTx.payerEmail} />
                      <DetailField label="Child" value={selectedTx.childName} />
                      <DetailField label="Program" value={selectedTx.program} />
                      <DetailField label="Method" value={<span className="uppercase">{selectedTx.method}</span>} />
                      <DetailField label="Date" value={selectedTx.date} />
                    </div>
                    <div className="rounded-lg p-3" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Stripe ID</p>
                      <p className="text-xs font-mono" style={{ color: C.textSecondary }}>{selectedTx.stripeId}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {tab === 'checklist' && (
          <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex gap-4 overflow-hidden">
            {/* Parent list */}
            <Card className="w-64 flex-shrink-0 overflow-y-auto">
              {DEMO_CHECKLIST.map(parent => (
                <button key={parent.id} onClick={() => setSelectedParent(parent)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                  style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: selectedParent.id === parent.id ? C.elevated : 'transparent' }}
                  onMouseEnter={e => { if (selectedParent.id !== parent.id) e.currentTarget.style.backgroundColor = C.elevated; }}
                  onMouseLeave={e => { if (selectedParent.id !== parent.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: parent.color + '22', color: parent.color }}>{parent.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: C.textPrimary }}>{parent.name}</p>
                    <span className="text-[10px] font-semibold" style={{ color: parent.upToDate ? C.success : C.warning }}>
                      {parent.upToDate ? '✓ Up to date' : '⚠ Awaiting'}
                    </span>
                  </div>
                </button>
              ))}
            </Card>

            {/* Checklist */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {([['summer', 'Summer 2026', selectedParent.summer], ['schoolYear', 'School Year 26–27', selectedParent.schoolYear]] as [string, string, TuitionItem[]][])
                .filter(([, , items]) => items.length > 0)
                .map(([key, label, items]) => {
                  const paid = items.filter(i => i.state === 'paid').length;
                  const isOpen = openSection === key;
                  return (
                    <Card key={key} style={{ overflow: 'hidden' }}>
                      <button className="w-full flex items-center justify-between px-5 py-4 transition-colors"
                        onClick={() => setOpenSection(isOpen ? ('schoolYear' as 'summer' | 'schoolYear') : (key as 'summer' | 'schoolYear'))}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold" style={{ color: C.textPrimary }}>{label}</span>
                          <span className="text-xs" style={{ color: C.textTertiary }}>{paid} / {items.length} paid</span>
                        </div>
                        <ChevronRight className="w-4 h-4 transition-transform" style={{ color: C.textTertiary, transform: isOpen ? 'rotate(90deg)' : 'none' }} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                            <div className="px-5 pb-4 space-y-2">
                              {items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{
                                      backgroundColor: item.state === 'paid' ? C.successBg : item.state === 'sent' ? C.warningBg : 'transparent',
                                      border: `2px solid ${item.state === 'paid' ? C.success : item.state === 'sent' ? C.warning : C.border}`,
                                    }}>
                                    {item.state === 'paid' && <span style={{ color: C.success, fontSize: 10, fontWeight: 700 }}>✓</span>}
                                    {item.state === 'sent' && <span style={{ color: C.warning, fontSize: 8 }}>●</span>}
                                  </div>
                                  <span className="flex-1 text-sm" style={{ color: item.state === 'paid' ? C.textSecondary : C.textPrimary }}>{item.label}</span>
                                  {item.date && <span className="text-xs" style={{ color: C.textTertiary }}>{item.date}</span>}
                                  {item.state === 'unpaid' && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: C.elevated, color: C.textTertiary, border: `1px solid ${C.border}` }}>Send</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Budget page ───────────────────────────────────────────────────────────────

type BudgetTab = 'overview' | 'expenses' | 'revenue' | 'analysis';

function BudgetRing({ cat, delay }: { cat: typeof BUDGET_CATS[0]; delay: number }) {
  const pct = Math.round((cat.actual / cat.planned) * 100);
  const size = 64, sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  const over = cat.actual > cat.planned;
  const diff = Math.abs(cat.planned - cat.actual);
  return (
    <div className="rounded-xl p-4 flex flex-col items-center text-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="relative mb-3" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={sw} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={over ? C.error : cat.color}
            strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay, ease: 'easeOut' }}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: 18 }}>{cat.emoji}</span>
        </div>
      </div>
      <p className="text-xs font-semibold mb-1 leading-tight" style={{ color: C.textSecondary }}>{cat.name}</p>
      <p className="text-xl font-bold tabular-nums" style={{ color: over ? C.error : cat.color }}>{pct}%</p>
      <p className="text-[10px] mt-1" style={{ color: C.textTertiary }}>
        ${cat.actual.toLocaleString()} / ${cat.planned.toLocaleString()}
      </p>
      <span className="mt-2 px-2 py-0.5 text-[9px] font-bold rounded-full"
        style={{ backgroundColor: over ? C.errorBg : C.successBg, color: over ? C.error : C.success }}>
        {over ? `▲ $${diff.toLocaleString()} over` : `▼ $${diff.toLocaleString()} left`}
      </span>
    </div>
  );
}

function BudgetPage() {
  const [tab, setTab] = useState<BudgetTab>('overview');
  const [selectedExp, setSelectedExp] = useState<typeof DEMO_EXPENSES[0] | null>(null);

  const tabs: { key: BudgetTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'revenue',  label: 'Revenue'  },
    { key: 'analysis', label: 'Analysis' },
  ];

  const totalRevenue = DEMO_INCOME.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = DEMO_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Budget</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>Fiscal Year 2025–2026</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              style={{ backgroundColor: tab === t.key ? C.surface : 'transparent', color: tab === t.key ? C.textPrimary : C.textTertiary, boxShadow: tab === t.key ? C.shadowCard : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Revenue',   value: '$47,320', color: C.success },
                { label: 'Total Expenses',  value: '$31,840', color: C.error   },
                { label: 'Net Profit',      value: '$15,480', color: C.accent  },
                { label: 'Burn Rate',       value: '$2,653/mo', color: C.warning },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: C.textTertiary }}>{s.label}</p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                </motion.div>
              ))}
            </div>
            <Card style={{ padding: '20px' }}>
              <div className="flex items-center justify-between mb-4">
                <SectionLabel>Revenue vs Expenses</SectionLabel>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: C.accent }} /><span style={{ color: C.textTertiary }}>Revenue</span></span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block border-t border-dashed" style={{ borderColor: C.border }} /><span style={{ color: C.textTertiary }}>Expenses</span></span>
                </div>
              </div>
              <RevenueAreaChart />
            </Card>
            <div>
              <SectionLabel>Category Spending</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {BUDGET_CATS.map((cat, i) => <BudgetRing key={cat.name} cat={cat} delay={i * 0.08} />)}
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'expenses' && (
          <motion.div key="expenses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden relative">
            <Card className="h-full overflow-hidden">
              <div className="overflow-x-auto h-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Category', 'Description', 'Amount', 'Date', 'Receipt'].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_EXPENSES.map((exp, i) => (
                      <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedExp(exp)} className="cursor-pointer"
                        style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: C.accentLight, color: C.accent }}>{exp.category}</span></td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{exp.description}</td>
                        <td className="px-4 py-3 text-sm font-bold tabular-nums" style={{ color: C.error }}>{fmt(exp.amount)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{exp.date}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: exp.receipt ? C.info : C.textTertiary }}>{exp.receipt ?? '—'}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <AnimatePresence>
              {selectedExp && (
                <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute top-0 right-0 bottom-0 flex flex-col" style={{ width: 300, backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10 }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>Expense Detail</h3>
                    <button onClick={() => setSelectedExp(null)} style={{ color: C.textTertiary }}><X className="w-4 h-4" /></button>
                  </div>
                  <div className="flex-1 p-5 space-y-4">
                    <div className="rounded-xl p-4" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: C.error }}>{fmt(selectedExp.amount)}</p>
                      <p className="text-xs mt-1" style={{ color: C.textTertiary }}>{selectedExp.category}</p>
                    </div>
                    <DetailField label="Description" value={selectedExp.description} />
                    <DetailField label="Date" value={selectedExp.date} />
                    <DetailField label="Receipt" value={selectedExp.receipt ?? '—'} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {tab === 'revenue' && (
          <motion.div key="revenue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Summer Revenue',      value: '$' + DEMO_INCOME.filter(i => i.program === 'summer_26').reduce((s,i)=>s+i.amount,0).toLocaleString(), color: C.warning },
                { label: 'School Year Revenue', value: '$' + DEMO_INCOME.filter(i => i.program === 'school_year_26_27').reduce((s,i)=>s+i.amount,0).toLocaleString(), color: C.info },
                { label: 'Donations',           value: '$' + DEMO_INCOME.filter(i => i.source === 'Donation').reduce((s,i)=>s+i.amount,0).toLocaleString(), color: C.success },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: C.textTertiary }}>{s.label}</p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Source', 'Description', 'Amount', 'Date', 'Program'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEMO_INCOME.map((inc, i) => (
                    <motion.tr key={inc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: `1px solid ${C.border}` }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                      <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: C.successBg, color: C.success }}>{inc.source}</span></td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{inc.description}</td>
                      <td className="px-4 py-3 text-sm font-bold tabular-nums" style={{ color: C.success }}>{fmt(inc.amount)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{inc.date}</td>
                      <td className="px-4 py-3">{inc.program ? <ProgramBadge program={inc.program} /> : <span style={{ color: C.textTertiary }}>—</span>}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        )}

        {tab === 'analysis' && (
          <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto space-y-5">
            <Card style={{ padding: '24px' }}>
              <SectionLabel>Planned vs Actual by Category</SectionLabel>
              <div className="space-y-4 mt-2">
                {BUDGET_CATS.map((cat, i) => {
                  const maxVal = Math.max(...BUDGET_CATS.map(c => c.planned));
                  const pPct = (cat.planned / maxVal) * 100;
                  const aPct = (cat.actual / maxVal) * 100;
                  const over = cat.actual > cat.planned;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold" style={{ color: C.textSecondary }}>{cat.emoji} {cat.name}</span>
                        <span className="text-xs" style={{ color: over ? C.error : C.success }}>{over ? '▲' : '▼'} ${Math.abs(cat.planned - cat.actual).toLocaleString()}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-14 text-right" style={{ color: C.textTertiary }}>Planned</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pPct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }} style={{ backgroundColor: C.border, opacity: 0.6, border: `1px solid ${cat.color}` }} />
                          </div>
                          <span className="text-[10px] w-16 tabular-nums" style={{ color: C.textTertiary }}>{fmt(cat.planned)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-14 text-right" style={{ color: C.textTertiary }}>Actual</span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${aPct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 + 0.1 }} style={{ backgroundColor: over ? C.error : cat.color }} />
                          </div>
                          <span className="text-[10px] w-16 tabular-nums" style={{ color: over ? C.error : C.textPrimary }}>{fmt(cat.actual)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Category', 'Planned', 'Actual', 'Variance', 'Status'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BUDGET_CATS.map(cat => {
                    const over = cat.actual > cat.planned;
                    const diff = cat.actual - cat.planned;
                    return (
                      <tr key={cat.name} style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: C.textPrimary }}>{cat.emoji} {cat.name}</td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: C.textSecondary }}>{fmt(cat.planned)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums" style={{ color: C.textPrimary }}>{fmt(cat.actual)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums font-semibold" style={{ color: over ? C.error : C.success }}>{over ? '+' : '-'}{fmt(Math.abs(diff))}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ backgroundColor: over ? C.errorBg : C.successBg, color: over ? C.error : C.success }}>
                            {over ? 'Over budget' : 'Under budget'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Calendar page ─────────────────────────────────────────────────────────────

const CAL_COLORS: Record<string, string> = {
  '#5E7C68': 'Sage', '#38BDF8': 'Sky', '#EF4444': 'Rose',
  '#F59E0B': 'Marigold', '#8B5CF6': 'Lavender', '#22C55E': 'Moss',
  '#F97316': 'Clay', '#525252': 'Slate',
};

function CalendarPage() {
  const today = new Date(2026, 3, 22); // Apr 22, 2026
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1));
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [programFilter, setProgramFilter] = useState<string>('all');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const filteredEvents = DEMO_CAL_EVENTS.filter(e =>
    programFilter === 'all' || e.program === programFilter || e.program === 'both'
  );

  const eventsForDate = (dateStr: string) => filteredEvents.filter(e => e.date === dateStr);

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const days: { date: Date | null; isCurrentMonth: boolean; day: number }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const cellDay = i - firstDay + 1;
    if (i < firstDay) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - firstDay + i + 1), isCurrentMonth: false, day: prevMonthDays - firstDay + i + 1 });
    } else if (cellDay > daysInMonth) {
      days.push({ date: new Date(year, month + 1, cellDay - daysInMonth), isCurrentMonth: false, day: cellDay - daysInMonth });
    } else {
      days.push({ date: new Date(year, month, cellDay), isCurrentMonth: true, day: cellDay });
    }
  }

  const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isToday = (d: Date) => fmtDate(d) === fmtDate(today);

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Calendar</h1>
          <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>School events and scheduling</p>
        </div>
        <button onClick={() => { setSelectedEvent(null); setShowEventPanel(true); }}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg"
          style={{ backgroundColor: C.accent, color: '#fff' }}>
          + Add Event
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textSecondary }}>
            ‹
          </button>
          <span className="px-3 text-sm font-semibold" style={{ color: C.textPrimary, minWidth: 140, textAlign: 'center' }}>{monthName}</span>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textSecondary }}>
            ›
          </button>
        </div>
        <button onClick={() => setCurrentMonth(new Date(2026, 3, 1))}
          className="px-3 py-1.5 text-xs font-medium rounded-lg"
          style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textSecondary }}>
          Today
        </button>
        <div className="ml-auto flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
          {[{ key: 'all', label: 'All' }, { key: 'summer_26', label: 'Summer' }, { key: 'school_year_26_27', label: 'School Year' }].map(f => (
            <button key={f.key} onClick={() => setProgramFilter(f.key)}
              className="px-2.5 py-1 text-xs font-medium rounded-md transition-all"
              style={{ backgroundColor: programFilter === f.key ? C.surface : 'transparent', color: programFilter === f.key ? C.textPrimary : C.textTertiary }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-7" style={{ borderBottom: `1px solid ${C.border}` }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="flex-1 overflow-y-auto grid grid-cols-7" style={{ gridAutoRows: 'minmax(80px, 1fr)' }}>
          {days.map((cell, i) => {
            const dateStr = cell.date ? fmtDate(cell.date) : '';
            const dayEvents = cell.date ? eventsForDate(dateStr) : [];
            const todayCell = cell.date ? isToday(cell.date) : false;
            return (
              <div key={i} className="relative p-1.5 flex flex-col gap-0.5 transition-colors"
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? `1px solid ${C.border}` : 'none',
                  borderBottom: i < days.length - 7 ? `1px solid ${C.border}` : 'none',
                  backgroundColor: !cell.isCurrentMonth ? C.bg : 'transparent',
                }}
                onMouseEnter={e => { if (cell.isCurrentMonth) e.currentTarget.style.backgroundColor = C.elevated; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = !cell.isCurrentMonth ? C.bg : 'transparent'; }}>
                <div className="flex items-center justify-end mb-0.5">
                  <span className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full`}
                    style={{
                      color: todayCell ? '#fff' : cell.isCurrentMonth ? C.textSecondary : C.textTertiary,
                      backgroundColor: todayCell ? C.accent : 'transparent',
                      fontWeight: todayCell ? 700 : undefined,
                    }}>
                    {cell.day}
                  </span>
                </div>
                {dayEvents.slice(0, 2).map(ev => (
                  <button key={ev.id} onClick={() => { setSelectedEvent(ev); setShowEventPanel(true); }}
                    className="w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate transition-opacity hover:opacity-80"
                    style={{ backgroundColor: ev.color + '30', color: ev.color }}>
                    {ev.isAllDay ? '' : ev.startTime ? ev.startTime.replace(':','') + ' ' : ''}{ev.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <span className="text-[9px] px-1" style={{ color: C.textTertiary }}>+{dayEvents.length - 2} more</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Event panel */}
      <AnimatePresence>
        {showEventPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
              onClick={() => setShowEventPanel(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
              style={{ width: 360, backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, boxShadow: C.shadowMedium }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: C.textPrimary }}>
                  {selectedEvent ? selectedEvent.title : 'New Event'}
                </h3>
                <button onClick={() => setShowEventPanel(false)} style={{ color: C.textTertiary }}><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selectedEvent ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedEvent.color }} />
                      <span className="text-xs font-semibold" style={{ color: C.textSecondary }}>{selectedEvent.category}</span>
                    </div>
                    <DetailField label="Date" value={selectedEvent.date} />
                    <DetailField label="All Day" value={<YesNoChip value={selectedEvent.isAllDay} trueLabel="Yes" falseLabel="No" />} />
                    {!selectedEvent.isAllDay && <DetailField label="Time" value={`${selectedEvent.startTime} – ${selectedEvent.endTime}`} />}
                    <DetailField label="Program" value={selectedEvent.program === 'both' ? 'All Programs' : selectedEvent.program} />
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {Object.entries(CAL_COLORS).map(([hex]) => (
                        <div key={hex} className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                          style={{ backgroundColor: hex, outline: selectedEvent.color === hex ? `2px solid ${C.textPrimary}` : 'none', outlineOffset: 2 }} />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {[
                      { label: 'Event Title', placeholder: 'e.g. Staff Meeting', type: 'input' },
                      { label: 'Date', placeholder: 'YYYY-MM-DD', type: 'input' },
                      { label: 'Category', placeholder: 'Select...', type: 'input' },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs font-semibold mb-1.5" style={{ color: C.textTertiary }}>{f.label}</p>
                        <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textTertiary }}>{f.placeholder}</div>
                      </div>
                    ))}
                    <div>
                      <p className="text-xs font-semibold mb-2" style={{ color: C.textTertiary }}>Color</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {Object.entries(CAL_COLORS).map(([hex, name]) => (
                          <div key={hex} className="w-5 h-5 rounded-full cursor-pointer transition-transform hover:scale-110" title={name}
                            style={{ backgroundColor: hex }} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="px-5 py-4 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
                <button className="flex-1 py-2 text-sm font-semibold rounded-lg" style={{ backgroundColor: C.accent, color: '#fff' }}>
                  {selectedEvent ? 'Update' : 'Save'}
                </button>
                <button onClick={() => setShowEventPanel(false)} className="px-4 py-2 text-sm font-medium rounded-lg"
                  style={{ backgroundColor: C.elevated, color: C.textSecondary, border: `1px solid ${C.border}` }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Emails page ───────────────────────────────────────────────────────────────

function EmailsPage() {
  const [selected, setSelected] = useState<typeof DEMO_EMAILS[0] | null>(null);
  return (
    <div className="h-full flex flex-col relative">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: C.textPrimary }}>Emails</h1>
        <p className="text-sm mt-0.5" style={{ color: C.textTertiary }}>Sent emails via Sagefield admin</p>
      </div>
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['To', 'Subject', 'Preview', 'Date'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_EMAILS.map((email, i) => (
                <motion.tr key={email.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(email)} className="cursor-pointer"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <td className="px-4 py-3 max-w-[140px]"><p className="text-xs font-medium truncate" style={{ color: C.textPrimary }}>{email.to}</p></td>
                  <td className="px-4 py-3 max-w-[200px]"><p className="text-xs font-medium truncate" style={{ color: C.textSecondary }}>{email.subject}</p></td>
                  <td className="px-4 py-3 max-w-[260px]"><p className="text-xs truncate" style={{ color: C.textTertiary }}>{email.preview}</p></td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: C.textTertiary }}>{email.date}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 flex flex-col"
            style={{ width: 400, backgroundColor: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 10 }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-semibold truncate pr-4" style={{ color: C.textPrimary }}>{selected.subject}</h3>
              <button onClick={() => setSelected(null)} style={{ color: C.textTertiary, flexShrink: 0 }}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4 space-y-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <DetailField label="To"   value={selected.to}   />
                <DetailField label="From" value={selected.from} />
                <DetailField label="Date" value={selected.date} />
              </div>
              <div className="p-5">
                <div className="prose prose-sm max-w-none rounded-xl p-4 text-sm leading-relaxed"
                  style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textSecondary }}
                  dangerouslySetInnerHTML={{ __html: selected.body }} />
                {selected.attachments.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Attachments</p>
                    <div className="space-y-1.5">
                      {selected.attachments.map(a => (
                        <div key={a} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                          style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textSecondary }}>
                          📎 {a}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Marketing page ────────────────────────────────────────────────────────────

type MarketingTab = 'openhouse' | 'tours' | 'infosession' | 'faq';

function MiniCalendar({ blockedDates }: { blockedDates: string[] }) {
  const [month, setMonth] = useState(new Date(2026, 3, 1));
  const year = month.getFullYear(), m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  const fmtD = (d: number) => `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => setMonth(new Date(year, m - 1, 1))} style={{ color: C.textTertiary }}>‹</button>
        <span className="text-xs font-semibold" style={{ color: C.textPrimary }}>{month.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => setMonth(new Date(year, m + 1, 1))} style={{ color: C.textTertiary }}>›</button>
      </div>
      <div className="grid grid-cols-7 px-2 py-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-center text-[9px] py-1 font-semibold" style={{ color: C.textTertiary }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          const blocked = day ? blockedDates.includes(fmtD(day)) : false;
          return (
            <div key={i} className="flex items-center justify-center w-full aspect-square">
              {day && (
                <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs"
                  style={{ backgroundColor: blocked ? C.errorBg : 'transparent', color: blocked ? C.error : C.textSecondary, fontWeight: blocked ? 700 : undefined, border: blocked ? `1px solid ${C.errorBorder}` : 'none' }}>
                  {day}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TOUR_STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: C.successBg, text: C.success, label: 'Confirmed' },
  completed:  { bg: C.accentLight, text: C.accent,  label: 'Completed' },
  pending:    { bg: C.warningBg,  text: C.warning,  label: 'Pending'   },
  cancelled:  { bg: C.errorBg,    text: C.error,    label: 'Cancelled' },
};

function MarketingPage() {
  const [tab, setTab] = useState<MarketingTab>('openhouse');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const subNav: { key: MarketingTab; label: string; sub: string }[] = [
    { key: 'openhouse',   label: 'Open House',    sub: 'Apr 25'         },
    { key: 'tours',       label: 'Campus Tours',  sub: 'Manage'         },
    { key: 'infosession', label: 'Info Session',  sub: 'Apr 18 RSVPs'   },
    { key: 'faq',         label: 'Session FAQ',   sub: 'Apr 18 prep'    },
  ];

  const totalAdults    = DEMO_OPEN_HOUSE_RSVPS.reduce((s, r) => s + r.adults, 0);
  const totalChildren  = DEMO_OPEN_HOUSE_RSVPS.reduce((s, r) => s + r.children, 0);
  const infoChildren   = DEMO_INFO_RSVPS.reduce((s, r) => s + r.children.length, 0);

  const blockedDates = ['2026-04-10', '2026-04-14', '2026-04-22'];

  return (
    <div className="h-full flex gap-4">
      {/* Left sub-nav */}
      <div className="w-44 flex-shrink-0 flex flex-col gap-1 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: C.textTertiary }}>Marketing</p>
        {subNav.map(item => {
          const active = tab === item.key;
          return (
            <button key={item.key} onClick={() => setTab(item.key)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: active ? C.accentLight : 'transparent', color: active ? C.accent : C.textSecondary, borderLeft: `2px solid ${active ? C.accent : 'transparent'}` }}>
              <span className="block">{item.label}</span>
              <span className="text-[10px]" style={{ color: active ? C.accentDark : C.textTertiary }}>{item.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === 'openhouse' && (
            <motion.div key="oh" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold" style={{ color: C.textPrimary }}>Open House</h1>
                <p className="text-sm" style={{ color: C.textTertiary }}>Saturday, April 25 · 11 AM – 2 PM</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'RSVPs',            value: DEMO_OPEN_HOUSE_RSVPS.length, color: C.accent  },
                  { label: 'Adults',           value: totalAdults,                   color: C.info    },
                  { label: 'Children',         value: totalChildren,                 color: C.warning },
                  { label: 'Total Attendees',  value: totalAdults + totalChildren,   color: C.success },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: C.textTertiary }}>{s.label}</p>
                    <p className="text-3xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <Card>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Name', 'Email', 'Phone', 'Adults', 'Children', 'Notes', ''].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_OPEN_HOUSE_RSVPS.map((r, i) => (
                      <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="px-4 py-3 font-medium text-xs" style={{ color: C.textPrimary }}>{r.name}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{r.email}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{r.phone}</td>
                        <td className="px-4 py-3 text-xs text-center font-bold" style={{ color: C.textPrimary }}>{r.adults}</td>
                        <td className="px-4 py-3 text-xs text-center font-bold" style={{ color: C.textPrimary }}>{r.children}</td>
                        <td className="px-4 py-3 text-xs max-w-[140px]"><p className="truncate" style={{ color: C.textTertiary }}>{r.notes || '—'}</p></td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg cursor-pointer transition-colors"
                            style={{ backgroundColor: C.accentLight, color: C.accent }}>Send Reminder</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}

          {tab === 'tours' && (
            <motion.div key="tours" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold" style={{ color: C.textPrimary }}>Campus Tours</h1>
                <p className="text-sm" style={{ color: C.textTertiary }}>Manage tour availability and bookings</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.textTertiary }}>Blocked Dates</p>
                  <MiniCalendar blockedDates={blockedDates} />
                </div>
                <Card style={{ padding: '16px' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Block a Date</p>
                  {['Date', 'Time Slot', 'Reason'].map(f => (
                    <div key={f} className="mb-3">
                      <p className="text-xs mb-1" style={{ color: C.textTertiary }}>{f}</p>
                      <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}`, color: C.textTertiary }}>
                        {f === 'Time Slot' ? 'Select time...' : f === 'Date' ? 'YYYY-MM-DD' : 'e.g. Staff meeting'}
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-2 text-xs font-semibold rounded-lg mt-1" style={{ backgroundColor: C.accent, color: '#fff' }}>Add Block</button>
                </Card>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.textTertiary }}>Tour Bookings</p>
                <Card>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        {['Date', 'Time', 'Name', 'Email', 'Child', 'Grade', 'Status'].map(col => (
                          <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_TOUR_BOOKINGS.map((t, i) => {
                        const s = TOUR_STATUS_MAP[t.status];
                        return (
                          <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            style={{ borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                            <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{t.date}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{t.time}</td>
                            <td className="px-4 py-3 text-xs font-medium" style={{ color: C.textPrimary }}>{t.firstName} {t.lastName}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{t.email}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{t.childName}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{t.grade}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </div>
            </motion.div>
          )}

          {tab === 'infosession' && (
            <motion.div key="info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <h1 className="text-xl font-semibold" style={{ color: C.textPrimary }}>Info Session RSVPs</h1>
                <p className="text-sm" style={{ color: C.textTertiary }}>April 18, 2026 · 6:00 – 7:30 PM</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'RSVPs',    value: DEMO_INFO_RSVPS.length, color: C.accent },
                  { label: 'Children', value: infoChildren,            color: C.info   },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: C.textTertiary }}>{s.label}</p>
                    <p className="text-3xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <Card>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                      {['Name', 'Email', 'Phone', 'Programs', 'Children', 'Hear About Us'].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.textTertiary }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_INFO_RSVPS.map((r, i) => (
                      <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <td className="px-4 py-3 text-xs font-medium" style={{ color: C.textPrimary }}>{r.firstName} {r.lastName}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{r.email}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textSecondary }}>{r.phone}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {r.programs.map(p => (
                              <span key={p} className="px-1.5 py-0.5 text-[9px] font-semibold rounded-full" style={{ backgroundColor: C.accentLight, color: C.accent }}>{p}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-center font-bold" style={{ color: C.textPrimary }}>{r.children.length}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.textTertiary }}>{r.hearAboutUs}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </motion.div>
          )}

          {tab === 'faq' && (
            <motion.div key="faq" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="mb-4">
                <h1 className="text-xl font-semibold" style={{ color: C.textPrimary }}>Session FAQ</h1>
                <p className="text-sm" style={{ color: C.textTertiary }}>Common questions for the April 18th info session</p>
              </div>
              {DEMO_FAQ.map((item, i) => (
                <Card key={i} style={{ overflow: 'hidden' }}>
                  <button className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.elevated)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <span className="text-sm font-semibold" style={{ color: C.textPrimary }}>{item.q}</span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0 ml-3 transition-transform"
                      style={{ color: C.textTertiary, transform: openFaq === i ? 'rotate(90deg)' : 'none' }} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <p className="px-5 pb-5 text-sm leading-relaxed" style={{ color: C.textSecondary }}>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Impersonate ──────────────────────────────────────────────────────────────

const DEMO_IMPERSONATE_PARENTS = [
  {
    id: 'ip1', name: 'Sarah Richardson', email: 'sarah.r@email.com', initials: 'SR', color: '#5E7C68',
    children: [{ name: 'Emma Richardson', grade: 'Elementary (K–5)', initials: 'ER', color: '#7FA888' }],
    program: 'summer_26', programLabel: 'Summer 2026', status: 'Enrolled',
    startDate: 'May 26, 2026', teacher: 'Ms. Taylor Reyes',
    nextPayment: { amount: '$420', dueDate: 'May 1, 2026' },
    lastPayment: { amount: '$420', date: 'Apr 1, 2026' },
  },
  {
    id: 'ip2', name: 'Michael & Diana Foster', email: 'diana@email.com', initials: 'DF', color: '#38BDF8',
    children: [{ name: 'Noah Foster', grade: 'Pre-K', initials: 'NF', color: '#60B4E0' }],
    program: 'summer_26', programLabel: 'Summer 2026', status: 'Enrolled',
    startDate: 'May 26, 2026', teacher: 'Ms. Paige Sun',
    nextPayment: { amount: '$380', dueDate: 'May 1, 2026' },
    lastPayment: { amount: '$380', date: 'Apr 1, 2026' },
  },
  {
    id: 'ip3', name: 'James & Priya Patel', email: 'priya.p@email.com', initials: 'PP', color: '#F59E0B',
    children: [
      { name: 'Aiden Patel', grade: 'Elementary (K–5)', initials: 'AP', color: '#F5A623' },
      { name: 'Leah Patel', grade: 'Pre-K', initials: 'LP', color: '#F5C66A' },
    ],
    program: 'school_year_26_27', programLabel: 'School Year 26–27', status: 'Enrolled',
    startDate: 'Sep 8, 2026', teacher: 'Ms. Nicole Park',
    nextPayment: { amount: '$760', dueDate: 'May 1, 2026' },
    lastPayment: { amount: '$760', date: 'Apr 1, 2026' },
  },
  {
    id: 'ip4', name: 'Kevin Okonkwo', email: 'kokonkwo@email.com', initials: 'KO', color: '#8B5CF6',
    children: [{ name: 'Chidera Okonkwo', grade: 'Pre-K', initials: 'CO', color: '#A78BFA' }],
    program: 'school_year_26_27', programLabel: 'School Year 26–27', status: 'Active',
    startDate: 'Sep 8, 2026', teacher: 'Ms. Taylor Reyes',
    nextPayment: { amount: '$420', dueDate: 'May 1, 2026' },
    lastPayment: { amount: '$420', date: 'Apr 1, 2026' },
  },
];

type ImpersonateParent = typeof DEMO_IMPERSONATE_PARENTS[number];

function ImpersonatePage() {
  const [selected, setSelected] = useState<ImpersonateParent | null>(null);

  return (
    <div className="flex h-full min-h-[560px] gap-0" style={{ border: `1px solid ${C.border}`, borderRadius: C.r.lg, overflow: 'hidden', backgroundColor: C.surface }}>
      {/* Left panel — parent list */}
      <div className="flex-shrink-0 overflow-y-auto" style={{ width: 280, borderRight: `1px solid ${C.border}` }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textQuaternary }}>Enrolled Families</p>
        </div>
        {DEMO_IMPERSONATE_PARENTS.map(parent => {
          const isActive = selected?.id === parent.id;
          return (
            <button
              key={parent.id}
              onClick={() => setSelected(isActive ? null : parent)}
              className="w-full text-left transition-colors duration-150"
              style={{
                padding: '12px 16px',
                backgroundColor: isActive ? C.accentLight : 'transparent',
                borderLeft: `2px solid ${isActive ? C.accent : 'transparent'}`,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: parent.color + '22', color: parent.color }}>
                  {parent.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: isActive ? C.accent : C.textPrimary }}>{parent.name}</p>
                  <p className="text-xs truncate" style={{ color: C.textTertiary }}>{parent.email}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parent.children.map(c => (
                      <span key={c.name} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: C.accentLight, color: C.accent }}>
                        {c.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: C.textTertiary }}>
            <Eye className="w-10 h-10" style={{ opacity: 0.3 }} />
            <p className="text-sm" style={{ color: C.textTertiary }}>Select a parent to preview their dashboard</p>
          </div>
        ) : (
          <>
            {/* "Viewing as" bar */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ backgroundColor: C.accentLight, borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" style={{ color: C.accent }} />
                <span className="text-sm font-semibold" style={{ color: C.accent }}>Viewing as {selected.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: C.accent + '22', color: C.accent }}>
                  {selected.programLabel}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: C.textSecondary, backgroundColor: C.elevated, border: `1px solid ${C.border}` }}
              >
                <X className="w-3 h-3" /> Exit
              </button>
            </div>

            {/* Portal preview */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ backgroundColor: C.bg }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textQuaternary }}>Parent Portal Preview</p>

              {/* Enrollment status card */}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textQuaternary }}>Enrollment</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }}>
                    {selected.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs" style={{ color: C.textQuaternary }}>Program</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: C.textPrimary }}>{selected.programLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: C.textQuaternary }}>Start Date</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: C.textPrimary }}>{selected.startDate}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs" style={{ color: C.textQuaternary }}>Lead Teacher</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: C.textPrimary }}>{selected.teacher}</p>
                  </div>
                </div>
              </div>

              {/* Children */}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textQuaternary }}>Children</p>
                <div className="space-y-2">
                  {selected.children.map(child => (
                    <div key={child.name} className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: child.color + '22', color: child.color }}>
                          {child.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{child.name}</p>
                          <p className="text-xs" style={{ color: C.textTertiary }}>{child.grade}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ backgroundColor: C.accentLight, color: C.accent }}>
                        View Profile
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing */}
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textQuaternary }}>Billing</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: C.textQuaternary }}>Next Payment</p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: C.textPrimary }}>{selected.nextPayment.amount}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.textTertiary }}>Due {selected.nextPayment.dueDate}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: C.accent, color: '#fff' }}>
                    Pay Now
                  </button>
                </div>
                <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                  <p className="text-xs" style={{ color: C.textTertiary }}>
                    Last payment: <span style={{ color: C.textSecondary }}>{selected.lastPayment.amount}</span> on {selected.lastPayment.date}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Coming soon stub ─────────────────────────────────────────────────────────

function ComingSoonPage({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
        style={{ backgroundColor: C.accentLight }}>
        <span style={{ color: C.accent, fontSize: 28 }}>✦</span>
      </div>
      <h2 className="text-lg font-semibold" style={{ color: C.textPrimary }}>{name}</h2>
      <p className="text-sm max-w-xs" style={{ color: C.textTertiary }}>
        This page is part of Phase 3. Full admin functionality coming soon.
      </p>
      <span className="px-3 py-1.5 text-xs font-semibold rounded-full"
        style={{ backgroundColor: C.accentLight, color: C.accent }}>
        Phase 3
      </span>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

type ActivePage = 'dashboard' | 'leads' | 'applications' | 'messages'
  | 'parents' | 'students' | 'programs' | 'transactions' | 'budget'
  | 'calendar' | 'emails' | 'marketing' | 'impersonate';

interface NavItem {
  key: ActivePage | string;
  name: string;
  icon: React.ReactNode;
  phase1?: boolean;
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { key: 'dashboard',    name: 'Dashboard',    icon: <LayoutDashboard className="w-4 h-4" />, phase1: true },
      { key: 'leads',        name: 'Leads',        icon: <TrendingUp className="w-4 h-4" />,       phase1: true },
      { key: 'parents',      name: 'Parents',      icon: <Users className="w-4 h-4" />,        phase1: true },
      { key: 'students',     name: 'Students',     icon: <GraduationCap className="w-4 h-4" />, phase1: true },
      { key: 'programs',     name: 'Programs',     icon: <BookOpen className="w-4 h-4" />,      phase1: true },
      { key: 'applications', name: 'Applications', icon: <ClipboardList className="w-4 h-4" />, phase1: true },
      { key: 'transactions', name: 'Transactions', icon: <CreditCard className="w-4 h-4" />, phase1: true },
    ],
  },
  {
    label: 'Tools',
    items: [
      { key: 'budget',    name: 'Budget',    icon: <DollarSign className="w-4 h-4" />,  phase1: true },
      { key: 'messages',  name: 'Messages',  icon: <MessageSquare className="w-4 h-4" />, phase1: true },
      { key: 'calendar',  name: 'Calendar',  icon: <CalendarDays className="w-4 h-4" />, phase1: true },
      { key: 'emails',    name: 'Emails',    icon: <Mail className="w-4 h-4" />,         phase1: true },
      { key: 'marketing',   name: 'Marketing',   icon: <Megaphone className="w-4 h-4" />,   phase1: true },
      { key: 'impersonate', name: 'Impersonate', icon: <Eye className="w-4 h-4" />,         phase1: true },
    ],
  },
  {
    label: 'External',
    items: [
      { key: 'teacher', name: 'Teacher View', icon: <School className="w-4 h-4" /> },
    ],
  },
];

function Sidebar({ activePage, onNavigate, isExpanded, onToggleExpand }: {
  activePage: string;
  onNavigate: (page: ActivePage) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <motion.aside
      animate={{ width: isExpanded ? 224 : 52 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full flex-shrink-0 overflow-hidden"
      style={{ backgroundColor: '#141414', borderRight: `1px solid #262626` }}
    >
      {/* Logo */}
      <div className="flex items-center overflow-hidden"
        style={{
          borderBottom: `1px solid #262626`,
          padding: isExpanded ? '20px 16px' : '20px 0',
          justifyContent: isExpanded ? 'flex-start' : 'center',
          gap: isExpanded ? '12px' : 0,
        }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: C.accentLight }}>
          <span style={{ color: C.accent, fontSize: 14, fontWeight: 700 }}>S</span>
        </div>
        {isExpanded && (
          <div>
            <div className="text-sm font-semibold" style={{ color: C.textPrimary }}>Sagefield</div>
            <div className="text-xs" style={{ color: C.textTertiary }}>Admin Portal</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto space-y-5" style={{ padding: isExpanded ? '16px 12px' : '16px 6px' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {isExpanded && (
              <div className="text-xs font-semibold uppercase tracking-wider px-3 mb-1.5"
                style={{ color: C.textQuaternary }}>
                {group.label}
              </div>
            )}
            {!isExpanded && group.label !== 'Main' && (
              <div style={{ height: '1px', backgroundColor: C.border, margin: '0 6px 8px' }} />
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = activePage === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key as ActivePage)}
                    title={!isExpanded ? item.name : undefined}
                    className="w-full flex items-center gap-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative"
                    style={{
                      padding: isExpanded ? '8px 12px' : '8px',
                      justifyContent: isExpanded ? 'flex-start' : 'center',
                      backgroundColor: active ? C.accentLight : 'transparent',
                      color: active ? C.accent : item.phase1 ? C.textTertiary : C.textQuaternary,
                      borderLeft: isExpanded ? (active ? `2px solid ${C.accent}` : '2px solid transparent') : 'none',
                      opacity: item.phase1 || active ? 1 : 0.5,
                    }}
                  >
                    <span style={{ color: active ? C.accent : item.phase1 ? C.textTertiary : C.textQuaternary, flexShrink: 0 }}>
                      {item.icon}
                    </span>
                    {isExpanded && (
                      <>
                        <span className="flex-1 truncate">{item.name}</span>
                        {!item.phase1 && item.key !== 'teacher' && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: C.elevated, color: C.textQuaternary }}>
                            P2
                          </span>
                        )}
                        {item.key === 'teacher' && (
                          <ChevronRight className="w-3 h-3 opacity-40 flex-shrink-0" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid #262626`, padding: isExpanded ? '16px' : '12px 6px' }}>
        <button onClick={onToggleExpand}
          className="w-full flex items-center transition-colors duration-150 mb-3"
          style={{
            justifyContent: isExpanded ? 'flex-start' : 'center',
            gap: isExpanded ? '10px' : 0,
            padding: isExpanded ? '6px 8px' : '6px',
            borderRadius: C.r.md,
            border: 'none',
            backgroundColor: 'transparent',
            color: C.textTertiary,
            cursor: 'pointer',
          }}>
          {isExpanded
            ? <PanelLeftClose className="w-4 h-4 flex-shrink-0" />
            : <PanelLeftOpen className="w-4 h-4 flex-shrink-0" />}
          {isExpanded && <span className="text-xs font-medium">Collapse</span>}
        </button>
        <div className="flex items-center" style={{ justifyContent: isExpanded ? 'flex-start' : 'center', gap: isExpanded ? '12px' : 0 }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: C.accentLight, color: C.accent }}>
            A
          </div>
          {isExpanded && (
            <span className="text-xs truncate flex-1" style={{ color: C.textTertiary }}>
              admin@sagefield.co
            </span>
          )}
        </div>
        {isExpanded && (
          <button className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg mt-3 transition-colors"
            style={{ color: C.textSecondary, backgroundColor: C.elevated, border: `1px solid ${C.border}` }}>
            Sign out
          </button>
        )}
      </div>
    </motion.aside>
  );
}

// ─── Root component ────────────────────────────────────────────────────────────

export function AdminDashboardDemo() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [isExpanded, setIsExpanded] = useState(false);

  const PAGE_NAMES: Record<string, string> = {
    transactions: 'Transactions', budget: 'Budget', calendar: 'Calendar',
    emails: 'Emails', marketing: 'Marketing', teacher: 'Teacher View',
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':    return <DashboardPage />;
      case 'leads':        return <LeadsPage />;
      case 'applications': return <ApplicationsPage />;
      case 'messages':     return <MessagesPage />;
      case 'parents':      return <ParentsPage />;
      case 'students':     return <StudentsPage />;
      case 'programs':     return <ProgramsPage />;
      case 'transactions': return <TransactionsPage />;
      case 'budget':       return <BudgetPage />;
      case 'calendar':     return <CalendarPage />;
      case 'emails':       return <EmailsPage />;
      case 'marketing':    return <MarketingPage />;
      case 'impersonate':  return <ImpersonatePage />;
      default:             return <ComingSoonPage name={PAGE_NAMES[activePage] ?? activePage} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: C.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => setActivePage(page)}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(v => !v)}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-xl mx-auto p-6 h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
