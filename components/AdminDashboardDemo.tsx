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
  | 'calendar' | 'emails' | 'marketing';

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
      { key: 'transactions', name: 'Transactions', icon: <CreditCard className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { key: 'budget',    name: 'Budget',    icon: <DollarSign className="w-4 h-4" /> },
      { key: 'messages',  name: 'Messages',  icon: <MessageSquare className="w-4 h-4" />, phase1: true },
      { key: 'calendar',  name: 'Calendar',  icon: <CalendarDays className="w-4 h-4" /> },
      { key: 'emails',    name: 'Emails',    icon: <Mail className="w-4 h-4" /> },
      { key: 'marketing', name: 'Marketing', icon: <Megaphone className="w-4 h-4" /> },
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
