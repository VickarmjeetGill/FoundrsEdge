'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, CheckCircle, ChevronLeft, ChevronRight, 
  TrendingUp, Award, Zap, Building2, Users, BookOpen, 
  ArrowRight, ShieldAlert, ArrowLeft, RefreshCw, Calendar, Check
} from 'lucide-react';
import { getProfile } from '@/app/actions/profile';
import { submitScorecard, getScorecardHistory, updateScorecardGoals } from '@/app/actions/scorecard';

const CATEGORIES = [
  'Networking',
  'Awards',
  'Directory',
  'Matchmaking',
  'Opportunities'
];

const QUESTIONS = [
  {
    id: 'stage',
    category: 'Profile',
    text: 'What stage is your business at right now?',
    options: [
      { value: 1, label: 'Just an idea, haven\'t launched yet' },
      { value: 2, label: 'Launched, under 1 year in' },
      { value: 3, label: '1 to 3 years in, finding my footing' },
      { value: 4, label: '3+ years in, established and growing' },
      { value: 5, label: 'Scaling or thinking about my next chapter' }
    ]
  },
  {
    id: 'challenges',
    category: 'Profile',
    text: 'What\'s your biggest challenge right now?',
    options: [
      { value: 1, label: 'Getting new customers or clients' },
      { value: 2, label: 'Cash flow or funding' },
      { value: 3, label: 'Time management, I\'m doing everything myself' },
      { value: 4, label: 'Finding the right people to connect with or hire' },
      { value: 5, label: 'Standing out from competitors' },
      { value: 6, label: 'Not sure yet, still figuring it out' }
    ]
  },
  {
    id: 'networking',
    category: 'Networking',
    text: 'How are you currently growing your network?',
    options: [
      { value: 1, label: 'I\'m not really networking right now' },
      { value: 2, label: 'A few online groups or social media' },
      { value: 3, label: 'Occasional events, nothing consistent' },
      { value: 4, label: 'I have a solid group of peers I check in with regularly' },
      { value: 5, label: 'I\'m well connected and mostly looking to give back or mentor' }
    ]
  },
  {
    id: 'awards',
    category: 'Awards',
    text: 'Have you ever been recognized for your work publicly?',
    options: [
      { value: 1, label: 'No, never' },
      { value: 2, label: 'I\'m don\'t really think about awards or recognition' },
      { value: 3, label: 'I\'ve been nominated or applied before but didn\'t win' },
      { value: 4, label: 'Yes, locally or within my industry' },
      { value: 5, label: 'Yes, multiple times' }
    ]
  },
  {
    id: 'suppliers',
    category: 'Directory',
    text: 'When you need a service or supplier for your business, how do you usually find one?',
    options: [
      { value: 1, label: 'I didn\'t know there was a curated option for this' },
      { value: 2, label: 'Google or general online search' },
      { value: 3, label: 'I don\'t need outside services often' },
      { value: 4, label: 'Ask around in my network' },
      { value: 5, label: 'I already have a go-to list' }
    ]
  },
  {
    id: 'connections',
    category: 'Matchmaking',
    text: 'What kind of connections would help your business most right now?',
    options: [
      { value: 1, label: 'Investors or funding sources' },
      { value: 2, label: 'Potential customers or clients' },
      { value: 3, label: 'Potential partners or collaborators' },
      { value: 4, label: 'Mentors or people further ahead of me' },
      { value: 5, label: 'Other entrepreneurs at a similar stage' }
    ]
  },
  {
    id: 'opportunities',
    category: 'Opportunities',
    text: 'How do you usually find new opportunities (grants, partnerships, speaking, etc.)?',
    options: [
      { value: 1, label: 'What opportunities?' },
      { value: 2, label: 'I don\'t actively look, I hear about things by chance' },
      { value: 3, label: 'I rely on my network to tell me' },
      { value: 4, label: 'I follow a few newsletters or social accounts' },
      { value: 5, label: 'I have a system for tracking this' }
    ]
  },
  {
    id: 'success',
    category: 'Profile',
    text: 'What does success look like for you in the next 12 months?',
    options: [
      { value: 1, label: 'Getting my business off the ground' },
      { value: 2, label: 'Steady, sustainable income' },
      { value: 3, label: 'Meaningful growth or expansion' },
      { value: 4, label: 'Building a strong team or community around my business' },
      { value: 5, label: 'Positioning myself as a known name in my industry' }
    ]
  }
];

const STAGE_MESSAGES: Record<number, { headline: string; body: string }> = {
  1: {
    headline: 'You\'re at the starting line. Let\'s get you set up right.',
    body: 'Every founder starts here. The moves that matter most right now are the ones that save you time and mistakes later. Here\'s where to start:'
  },
  2: {
    headline: 'You\'ve launched. Now let\'s build momentum.',
    body: 'The first year is about proving things work and finding your people. Here\'s what\'s going to help most right now:'
  },
  3: {
    headline: 'You\'re finding your footing, let\'s tighten it up.',
    body: 'You\'ve got real traction. The next step is filling the gaps that are quietly slowing you down. Here\'s where to focus:'
  },
  4: {
    headline: 'You\'ve built something real. Let\'s help it grow.',
    body: 'At this stage it\'s less about the basics and more about who you\'re connected to and how visible you are. Here\'s what fits:'
  },
  5: {
    headline: 'You\'re playing a bigger game now.',
    body: 'You\'re past the early hustle. What matters now is positioning, partnerships, and the people around you. Here\'s what\'s worth your time:'
  }
};

export default function ScorecardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'welcome' | 'quiz' | 'results'>('welcome');
  
  // Quiz states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  // Results animation states
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Goal Form States
  const [goals, setGoals] = useState({
    connections: 3,
    events: 2,
    directory: 1,
    opportunities: 2,
    awards: 1,
    accountability: 1,
    revenue: '',
    custom: ''
  });
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);

  // Authenticate user & load history
  const loadData = async () => {
    try {
      setLoading(true);
      const prof = await getProfile();
      if (!prof.success) {
        router.push('/login');
        return;
      }
      
      const histRes = await getScorecardHistory();
      if (histRes.success && histRes.submissions) {
        setHistory(histRes.submissions);
        if (histRes.submissions.length > 0) {
          const latest = histRes.submissions[0];
          setCurrentView('results');
          // Load saved goals if present
          if (latest.goals) {
            setGoals(prev => ({ ...prev, ...(latest.goals as any) }));
            setGoalsSaved(true);
          } else {
            // Set defaults based on Q1 Stage answer
            const stageAns = (latest.answers as any[]).find(a => a.questionId === 'stage')?.score || 1;
            if (stageAns >= 3) {
              setGoals({
                connections: 5,
                events: 4,
                directory: 3,
                opportunities: 4,
                awards: 2,
                accountability: 2,
                revenue: '',
                custom: ''
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const latestSubmission = history[0];
  const previousSubmission = history[1];

  // Start animated score counter when results view is triggered
  useEffect(() => {
    if (currentView === 'results' && latestSubmission) {
      setAnimatedScore(0);
      let start = 0;
      const end = latestSubmission.score;
      if (end === 0) {
        setAnimatedScore(0);
        return;
      }
      const duration = 1200; // ms
      const stepTime = Math.abs(Math.floor(duration / end));
      const timer = setInterval(() => {
        start += 1;
        setAnimatedScore(start);
        if (start >= end) {
          clearInterval(timer);
        }
      }, Math.max(stepTime, 10));
      return () => clearInterval(timer);
    }
  }, [currentView, latestSubmission]);

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f9f9f7' }}>
        <div style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: '#e7b605', margin: '0 auto 16px' }} />
          <p style={{ color: '#9a9585', fontSize: '14px' }}>Loading your Scorecard Assessment...</p>
        </div>
      </div>
    );
  }

  const handleStartQuiz = () => {
    // Reset answers
    const initialAnswers: Record<string, number> = {};
    QUESTIONS.forEach(q => {
      initialAnswers[q.id] = 0;
    });
    setAnswers(initialAnswers);
    setCurrentQuestionIdx(0);
    setCurrentView('quiz');
  };

  const handleSelectOption = (value: number) => {
    const q = QUESTIONS[currentQuestionIdx];
    setAnswers(prev => ({ ...prev, [q.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Calculate scores based ONLY on capabilities (Marketing, Sales, Leadership, Systems)
      let totalScoreVal = 0;
      let capabilityCount = 0;
      const categoryTotals: Record<string, number> = {};
      const categoryCounts: Record<string, number> = {};

      CATEGORIES.forEach(cat => {
        categoryTotals[cat] = 0;
        categoryCounts[cat] = 0;
      });

      const formattedAnswers = QUESTIONS.map(q => {
        const val = answers[q.id] || 3;
        if (CATEGORIES.includes(q.category)) {
          totalScoreVal += val;
          capabilityCount += 1;
          categoryTotals[q.category] += val;
          categoryCounts[q.category] += 1;
        }
        return { questionId: q.id, category: q.category, score: val };
      });

      // Calculate final overall percentage (0-100) based on capabilities
      const overallPercentage = capabilityCount > 0 
        ? Math.round((totalScoreVal / (capabilityCount * 5)) * 100) 
        : 0;

      // Calculate individual category percentages (0-100)
      const categoriesPercentage: Record<string, number> = {};
      CATEGORIES.forEach(cat => {
        const count = categoryCounts[cat] || 1;
        categoriesPercentage[cat] = Math.round((categoryTotals[cat] / (count * 5)) * 100);
      });

      const res = await submitScorecard(overallPercentage, formattedAnswers, categoriesPercentage);
      if (res.success) {
        // Refresh local history list
        const updatedHistory = [res.submission, ...history];
        setHistory(updatedHistory);
        setGoalsSaved(false); // Reset goal save banner for new submission
        
        // Initialize default goals based on Q1 stage selection
        const stageAns = answers['stage'] || 1;
        if (stageAns >= 3) {
          setGoals({
            connections: 5,
            events: 4,
            directory: 3,
            opportunities: 4,
            awards: 2,
            accountability: 2,
            revenue: '',
            custom: ''
          });
        } else {
          setGoals({
            connections: 3,
            events: 2,
            directory: 1,
            opportunities: 2,
            awards: 1,
            accountability: 1,
            revenue: '',
            custom: ''
          });
        }
        
        setCurrentView('results');
      } else {
        alert(res.error || 'Failed to submit scorecard');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGoals = async () => {
    if (!latestSubmission) return;
    setSavingGoals(true);
    try {
      const res = await updateScorecardGoals(latestSubmission.id, goals);
      if (res.success) {
        setGoalsSaved(true);
      } else {
        alert(res.error || 'Failed to save goals');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving goals.');
    } finally {
      setSavingGoals(false);
    }
  };

  const activeQuestion = QUESTIONS[currentQuestionIdx];
  const progressPercent = Math.round(((currentQuestionIdx) / QUESTIONS.length) * 100);
  const currentAnswer = answers[activeQuestion?.id] || 0;

  // Compile recommendations based on mapping logic from answers list
  const getRecommendations = () => {
    if (!latestSubmission) return [];
    const answersList = latestSubmission.answers as any[];
    const recs: { title: string; desc: string; type: string }[] = [];

    const getAnswerLabel = (qId: string) => {
      const ans = answersList.find(a => a.questionId === qId);
      if (!ans) return '';
      const qObj = QUESTIONS.find(q => q.id === qId);
      const opt = qObj?.options.find(o => o.value === ans.score);
      return opt ? opt.label : '';
    };

    const challengeAns = getAnswerLabel('challenges');
    const networkingAns = getAnswerLabel('networking');
    const awardsAns = getAnswerLabel('awards');
    const supplierAns = getAnswerLabel('suppliers');
    const oppsAns = getAnswerLabel('opportunities');

    // 1. Map challenge (Q2)
    if (challengeAns.includes('Getting new customers')) {
      recs.push({
        type: 'Marketing & Sales',
        title: 'Vetted Lead Gen Playbooks',
        desc: 'Explore our curated marketing templates and lead conversion strategies in the Resource Hub.'
      });
    } else if (challengeAns.includes('Cash flow')) {
      recs.push({
        type: 'Funding & Grants',
        title: 'Calgary Funding & Grants Directory',
        desc: 'Access direct listings of active government grants, tax incentives, and seed capital opportunities.'
      });
    } else if (challengeAns.includes('Time management')) {
      recs.push({
        type: 'Accountability Groups',
        title: 'Peer Accountability Circles',
        desc: 'Join a bi-weekly accountability check-in group with 4-5 other founders to stay on track.'
      });
    } else if (challengeAns.includes('Finding the right people')) {
      recs.push({
        type: 'Member Matchmaking',
        title: 'Curated Intros & Matches',
        desc: 'Review your personalized "My Matches" feed on the dashboard to connect with ideal partners and hires.'
      });
    } else if (challengeAns.includes('Standing out')) {
      recs.push({
        type: 'Positioning & Branding',
        title: 'Branding & Positioning Masterclass',
        desc: 'Read our guide on building a unique value proposition that separates you from market competitors.'
      });
    } else {
      recs.push({
        type: 'Roadmap Tasks',
        title: 'Foundational Onboarding Tasks',
        desc: 'Follow the step-by-step checklist on your roadmap to gain clarity on your business priorities.'
      });
    }

    // 2. Map networking (Q3)
    if (networkingAns.includes('not really') || networkingAns.includes('A few online') || networkingAns.includes('Occasional events')) {
      recs.push({
        type: 'Networking',
        title: 'Upcoming Calgary Founders Mixer',
        desc: 'Attend our next in-person networking social. View details and RSVP directly in the Events tab.'
      });
    } else {
      recs.push({
        type: 'Mentorship',
        title: 'Become a Founders Edge Mentor',
        desc: 'Share your expertise. Register to guide early-stage founders and build your leadership profile.'
      });
    }

    // 3. Map awards (Q4)
    if (awardsAns.includes('No, never') || awardsAns.includes('don\'t really think')) {
      recs.push({
        type: 'Awards & Recognition',
        title: 'Open Awards Cycle Nomination',
        desc: 'Calgary Business Innovation Awards are open! Submit your nomination to gain valuable credibility.'
      });
    } else if (awardsAns.includes('nominated or applied before')) {
      recs.push({
        type: 'Awards & Recognition',
        title: 'Refine and Re-submit Nomination',
        desc: 'Refine your application materials and re-apply for this year\'s awards cycle.'
      });
    }

    // 4. Map suppliers (Q5) if length < 3
    if (recs.length < 3 && (supplierAns.includes('Google') || supplierAns.includes('didn\'t know'))) {
      recs.push({
        type: 'Business Directory',
        title: 'Browse Vetted Member Suppliers',
        desc: 'Stop searching blindly. Find trusted, platform-vetted Calgary suppliers in the Business Directory.'
      });
    }

    // 5. Map opportunities (Q7) if length < 3
    if (recs.length < 3 && (oppsAns.includes('What opportunities') || oppsAns.includes('don\'t actively look'))) {
      recs.push({
        type: 'Opportunities Feed',
        title: 'Track Calgary Business Opportunities',
        desc: 'Check out the Opportunities tab for speaker applications, municipal procurement, and grants.'
      });
    }

    // Fallback if under 3
    while (recs.length < 3) {
      recs.push({
        type: 'Business Connections',
        title: 'Connect with Calgary Founders',
        desc: 'Explore the Owner Network to connect with local peers matching your industry.'
      });
    }

    return recs.slice(0, 3);
  };

  // Get Q1 Stage code to select the customized Completion Message
  const getStageMessage = () => {
    if (!latestSubmission) return STAGE_MESSAGES[1];
    const stageAns = (latestSubmission.answers as any[]).find(a => a.questionId === 'stage')?.score || 1;
    return STAGE_MESSAGES[stageAns] || STAGE_MESSAGES[1];
  };

  const stageMsg = getStageMessage();

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f7', paddingBottom: '80px' }}>
      
      {/* Top Banner Navigation */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e0d8', height: 64, display: 'flex', alignItems: 'center', padding: '0 40px' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: '#5a5650', fontSize: '14px', fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </header>

      <main style={{ maxWidth: '800px', margin: '40px auto 0', padding: '0 20px', boxSizing: 'border-box' }}>
        
        {/* Welcome View */}
        {currentView === 'welcome' && (
          <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '40px', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(231,182,5,0.1)', padding: '6px 12px', color: '#9b7011', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px' }}>
              <Sparkles size={14} /> Founder Assessment
            </div>
            
            <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '32px', color: '#2a2820', margin: '0 0 16px 0', lineHeight: 1.2 }}>
              Foundrs Edge Entrepreneur Scorecard
            </h1>
            
            <p style={{ fontFamily: 'Noto Serif, serif', fontSize: '16px', color: '#5a5650', lineHeight: 1.8, marginBottom: '32px' }}>
              Find your edge. Answer a few quick questions and get a personalized business health score plus the resources, connections, and opportunities that fit where you&apos;re at right now.
              <br /><br />
              Takes about 2 minutes. No fluff, just what&apos;s actually useful for your stage.
            </p>

            <button onClick={handleStartQuiz} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', fontSize: '15px', cursor: 'pointer', border: 'none' }}>
              Start Scorecard <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Quiz View */}
        {currentView === 'quiz' && activeQuestion && (
          <div>
            {/* Progress indicator */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#9a9585', marginBottom: '8px', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span>Question {currentQuestionIdx + 1} of {QUESTIONS.length}</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div style={{ height: '6px', background: '#e2e0d8', width: '100%', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPercent}%`, background: '#e7b605', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              
              {/* Question Category */}
              <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9b7011', marginBottom: '12px', background: 'rgba(231,182,5,0.08)', padding: '4px 8px' }}>
                {activeQuestion.category}
              </span>

              {/* Question Text */}
              <h2 style={{ fontFamily: 'Noto Serif, serif', fontSize: '20px', color: '#2a2820', margin: '0 0 32px 0', lineHeight: 1.6 }}>
                {activeQuestion.text}
              </h2>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
                {activeQuestion.options.map(option => {
                  const isSelected = currentAnswer === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelectOption(option.value)}
                      style={{
                        textAlign: 'left',
                        padding: '16px 20px',
                        border: isSelected ? '2px solid #e7b605' : '1px solid #e2e0d8',
                        background: isSelected ? 'rgba(231,182,5,0.02)' : '#fff',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#9b7011' : '#5a5650',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? '6px solid #e7b605' : '2px solid #b8b4ae',
                        background: '#fff',
                        flexShrink: 0
                      }} />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0efe9', paddingTop: '24px' }}>
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={handlePrev}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 20px',
                    border: '1px solid #e2e0d8',
                    background: 'transparent',
                    color: currentQuestionIdx === 0 ? '#ccc' : '#5a5650',
                    cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: '13px'
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                {currentQuestionIdx < QUESTIONS.length - 1 ? (
                  <button
                    disabled={currentAnswer === 0}
                    onClick={handleNext}
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '10px 24px',
                      fontSize: '13px',
                      cursor: currentAnswer === 0 ? 'not-allowed' : 'pointer',
                      opacity: currentAnswer === 0 ? 0.5 : 1
                    }}
                  >
                    Next Question <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    disabled={currentAnswer === 0 || isSubmitting}
                    onClick={handleSubmit}
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 28px',
                      fontSize: '13px',
                      background: '#27ae60',
                      borderColor: '#27ae60',
                      color: '#fff',
                      cursor: currentAnswer === 0 || isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: currentAnswer === 0 || isSubmitting ? 0.5 : 1
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete & Reveal Score ✓'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {currentView === 'results' && latestSubmission && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Top Score Reveal Card */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '40px', textAlign: 'center', position: 'relative' }}>
              <h2 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '24px', margin: '0 0 8px 0', color: '#2a2820' }}>
                Your Business Health Score
              </h2>
              <p style={{ margin: '0 auto 32px', fontSize: '14px', color: '#9a9585', maxWidth: '450px', fontFamily: 'Noto Serif, serif' }}>
                Here is your calculated maturity level across core operational pillars.
              </p>

              {/* Animated Circle Score */}
              <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {/* SVG Progress Ring */}
                <svg style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)', width: '180px', height: '180px' }}>
                  <circle cx="90" cy="90" r="78" stroke="#f0efe9" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="90" 
                    cy="90" 
                    r="78" 
                    stroke="#e7b605" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={490} 
                    strokeDashoffset={490 - (490 * animatedScore) / 100}
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                </svg>
                <span style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'DM Sans, sans-serif', color: '#2a2820', lineHeight: 1 }}>
                  {animatedScore}%
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
                  Health Score
                </span>
              </div>

              {/* Score History Comparison Widget */}
              {previousSubmission && (() => {
                const diff = latestSubmission.score - previousSubmission.score;
                if (diff > 0) {
                  return (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', padding: '8px 16px', borderRadius: '24px', fontSize: '13px', color: '#27ae60', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
                      <TrendingUp size={15} /> 
                      Your score improved by {diff}% (from {previousSubmission.score}% to {latestSubmission.score}%)!
                    </div>
                  );
                } else if (diff < 0) {
                  return (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.2)', padding: '8px 16px', borderRadius: '24px', fontSize: '13px', color: '#e67e22', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
                      Your score changed from {previousSubmission.score}% to {latestSubmission.score}%.
                    </div>
                  );
                } else {
                  return (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(90,86,80,0.08)', border: '1px solid rgba(90,86,80,0.2)', padding: '8px 16px', borderRadius: '24px', fontSize: '13px', color: '#5a5650', fontWeight: 700, fontFamily: 'DM Sans, sans-serif', marginBottom: '24px' }}>
                      Your score is steady at {latestSubmission.score}%.
                    </div>
                  );
                }
              })()}

              {/* Retake Button */}
              <div>
                <button onClick={handleStartQuiz} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: '1px solid #e2e0d8', background: 'transparent', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px', color: '#5a5650', cursor: 'pointer' }}>
                  <RefreshCw size={12} /> Retake Scorecard
                </button>
              </div>
            </div>

            {/* Stage-Specific Completion Message */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px' }}>
              <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9b7011', marginBottom: '12px' }}>
                Your Roadmap Opener
              </span>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 900, fontSize: '22px', margin: '0 0 12px 0', color: '#2a2820' }}>
                {stageMsg.headline}
              </h3>
              <p style={{ margin: 0, fontSize: '15px', color: '#5a5650', fontFamily: 'Noto Serif, serif', lineHeight: 1.7 }}>
                {stageMsg.body}
              </p>
            </div>

            {/* Category Breakdown Charts */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px' }}>
              <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', margin: '0 0 24px 0', color: '#2a2820' }}>
                Core Capabilities Breakdown
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(latestSubmission.categories as Record<string, number>).map(([cat, score]) => (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#5a5650', marginBottom: '6px', fontFamily: 'DM Sans, sans-serif' }}>
                      <span>{cat}</span>
                      <span>{score}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#f0efe9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${score}%`, background: score < 50 ? '#c0392b' : score < 75 ? '#e67e22' : '#27ae60', borderRadius: '4px', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations: Next Steps */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px', borderLeft: '4px solid #e7b605' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '20px' }}>
                <Sparkles size={18} style={{ color: '#e7b605' }} />
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', margin: 0, color: '#2a2820' }}>
                  Here&apos;s where to start.
                </h3>
              </div>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif', lineHeight: 1.6 }}>
                Based on your answers, here&apos;s what&apos;s going to move the needle most for you right now:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {getRecommendations().map((rec, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: '#fafaf9', padding: '16px', border: '1px solid #e2e0d8' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(231,182,5,0.1)', color: '#9b7011', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, flexShrink: 0, fontFamily: 'DM Sans, sans-serif' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#2a2820', marginBottom: 4, fontFamily: 'DM Sans, sans-serif' }}>
                        [{rec.type}] {rec.title}
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#5a5650', lineHeight: 1.5, fontFamily: 'Noto Serif, serif' }}>
                        {rec.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '24px', borderTop: '1px solid #f0efe9', paddingTop: '20px', fontSize: '13px', color: '#9a9585', fontFamily: 'Noto Serif, serif', fontStyle: 'italic', textAlign: 'center' }}>
                &ldquo;This isn&apos;t a one-and-done. Come back anytime your business changes and we&apos;ll adjust what we recommend.&rdquo;
              </div>
            </div>

            {/* Goal Setting Section */}
            <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '8px' }}>
                <CheckCircle size={18} style={{ color: '#27ae60' }} />
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', margin: 0, color: '#2a2820' }}>
                  Set Your Goals
                </h3>
              </div>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif', lineHeight: 1.5 }}>
                Now let&apos;s set some goals. Pick what you want to accomplish and we&apos;ll help you track it as you go.
              </p>

              {goalsSaved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)', color: '#27ae60', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
                  <Check size={16} /> Your goals are set. We&apos;ll check in and show your progress every time you come back.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Connections Target</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>Connect with</span>
                    <input type="number" min="0" value={goals.connections} onChange={e => setGoals(p => ({ ...p, connections: parseInt(e.target.value) || 0 }))} style={{ width: '60px', padding: '8px', border: '1px solid #e2e0d8', textAlign: 'center', fontSize: '14px', fontWeight: 700 }} />
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>new entrepreneurs</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Events Target</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>Attend</span>
                    <input type="number" min="0" value={goals.events} onChange={e => setGoals(p => ({ ...p, events: parseInt(e.target.value) || 0 }))} style={{ width: '60px', padding: '8px', border: '1px solid #e2e0d8', textAlign: 'center', fontSize: '14px', fontWeight: 700 }} />
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>events this quarter</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Mentors to Find</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '13px', color: '#5a5650' }}>Find</span>
                      <input type="number" min="0" value={goals.awards} onChange={e => setGoals(p => ({ ...p, awards: parseInt(e.target.value) || 0 }))} style={{ width: '60px', padding: '6px', border: '1px solid #e2e0d8', textAlign: 'center' }} />
                      <span style={{ fontSize: '13px', color: '#5a5650' }}>mentor(s)</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Mentorship Output</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '13px', color: '#5a5650' }}>Mentor</span>
                      <input type="number" min="0" value={goals.accountability} onChange={e => setGoals(p => ({ ...p, accountability: parseInt(e.target.value) || 0 }))} style={{ width: '60px', padding: '6px', border: '1px solid #e2e0d8', textAlign: 'center' }} />
                      <span style={{ fontSize: '13px', color: '#5a5650' }}>founder(s)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Directory Usage</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>Use directory to find</span>
                    <input type="number" min="0" value={goals.directory} onChange={e => setGoals(p => ({ ...p, directory: parseInt(e.target.value) || 0 }))} style={{ width: '60px', padding: '8px', border: '1px solid #e2e0d8', textAlign: 'center', fontSize: '14px', fontWeight: 700 }} />
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>new suppliers or partners</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Opportunities Target</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>Apply to</span>
                    <input type="number" min="0" value={goals.opportunities} onChange={e => setGoals(p => ({ ...p, opportunities: parseInt(e.target.value) || 0 }))} style={{ width: '60px', padding: '8px', border: '1px solid #e2e0d8', textAlign: 'center', fontSize: '14px', fontWeight: 700 }} />
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>opportunities from feed</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Monthly Revenue Milestone</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>Reach</span>
                    <input type="text" placeholder="$10,000" value={goals.revenue} onChange={e => setGoals(p => ({ ...p, revenue: e.target.value }))} style={{ width: '120px', padding: '8px', border: '1px solid #e2e0d8', fontSize: '14px', fontWeight: 700 }} />
                    <span style={{ fontSize: '14px', color: '#5a5650', fontFamily: 'Noto Serif, serif' }}>in monthly revenue</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#9a9585', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Custom Target Goal</label>
                  <input type="text" placeholder="e.g. Build and launch our beta MVP" value={goals.custom} onChange={e => setGoals(p => ({ ...p, custom: e.target.value }))} style={{ width: '100%', padding: '10px', border: '1px solid #e2e0d8', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f0efe9', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'Noto Serif, serif' }}>
                  Set as many or as few as you want. Update anytime.
                </span>
                <button 
                  onClick={handleSaveGoals} 
                  disabled={savingGoals}
                  className="btn-primary" 
                  style={{ padding: '12px 28px', fontSize: '13px', cursor: 'pointer', border: 'none' }}
                >
                  {savingGoals ? 'Saving...' : 'Save my goals'}
                </button>
              </div>
            </div>

            {/* Scorecard History Log */}
            {history.length > 1 && (
              <div style={{ background: '#fff', border: '1px solid #e2e0d8', padding: '32px' }}>
                <h3 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 800, fontSize: '18px', margin: '0 0 16px 0', color: '#2a2820' }}>
                  Submission History
                </h3>
                <div style={{ borderTop: '1px solid #f0efe9' }}>
                  {history.map((sub, idx) => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: idx < history.length - 1 ? '1px solid #f0efe9' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#9a9585', fontFamily: 'DM Sans, sans-serif' }}>
                          {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#2a2820', fontFamily: 'DM Sans, sans-serif' }}>
                        {sub.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
