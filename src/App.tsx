import { useEffect, useState, FormEvent, DragEvent, useRef, ChangeEvent } from 'react';
import { upload } from '@vercel/blob/client';
import { 
  Settings, 
  CheckCircle, 
  ExternalLink, 
  FileText, 
  Send, 
  RefreshCw, 
  Trash2, 
  Info, 
  User, 
  BookOpen, 
  Lightbulb,
  Lock,
  Upload,
  Link as LinkIcon,
  Youtube,
  X,
  Eye,
  Save,
  Check,
  Briefcase,
  Trophy,
  Activity,
  Plus,
  Award,
  Calendar
} from 'lucide-react';

interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: string;
  college: string;
  course: string;
  gradYear: string;
  partner: string;
  domain: string;
  appName: string;
  ideaDesc: string;
  problem: string;
  unique: string;
  timestamp: string;
  liveLink: string;
  pdfUrl: string;
  ytLink: string;
}

interface AppSettings {
  heroTitle: string;
  heroSub: string;
  heroCompany: string;
  badgeText: string;
  rewardTitle: string;
  prize1: string;
  prize1Desc: string;
  prize2: string;
  prize2Desc: string;
  prize3: string;
  prize3Desc: string;
  prize4: string;
  prize4Desc: string;
  prize5: string;
  prize5Desc: string;
  aboutTitle: string;
  aboutBody: string;
  phase1Title: string;
  phase1Desc: string;
  phase2Title: string;
  phase2Desc: string;
  phase3Title: string;
  phase3Desc: string;
}

interface Certificate {
  certNumber: string;
  name: string;
  issueDate: string;
  projectName: string;
}

export default function App() {
  const [success, setSuccess] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    heroTitle: "Build Real AI Apps. Win Real Rewards.",
    heroSub: "A project-based internship where your idea becomes a product. Brainstorm, build, and potentially launch on the Play Store — with mentors by your side.",
    heroCompany: "TM Software Solutions · A Unit of TM Asset Management",
    badgeText: "Applications Open — 8 to 10 Days Window",
    rewardTitle: "Rewards & Recognition",
    prize1: "₹3000",
    prize1Desc: "1st Place Cash Prize",
    prize2: "₹2000",
    prize2Desc: "2nd Place Cash Prize",
    prize3: "₹1000",
    prize3Desc: "3rd Place Cash Prize",
    prize4: "₹400",
    prize4Desc: "Next 7 places each",
    prize5: "₹200",
    prize5Desc: "Gift Cards for All Participants",
    aboutTitle: "Turn Your Idea Into a Working App",
    aboutBody: "We're inviting motivated students to transform creative ideas into real-world AI applications. Every successful app started as just an idea — this is your chance to take action, gain hands-on experience, and potentially launch on the Google Play Store.",
    phase1Title: "Ideathon",
    phase1Desc: "Brainstorm unique AI-powered app ideas solving real problems in education or any domain. Ideas must be practical, innovative, and capable of attracting real users.",
    phase2Title: "Mentorship & Refinement",
    phase2Desc: "Selected ideas are reviewed by TM Software mentors who guide participants in refining concepts, improving feasibility, and shaping them into viable products.",
    phase3Title: "App Development",
    phase3Desc: "Build end-to-end using React, Node.js, and modern AI tools like Google AI Studio. Strong apps may be published on the Google Play Store."
  });

  // Admin and Auth State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editedSettings, setEditedSettings] = useState<AppSettings>({ ...settings });

  // Passcode changing state
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');

  // Routing State
  const [currentPath, setCurrentPath] = useState(window.location.pathname.toLowerCase().replace(/\/$/, ""));

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.toLowerCase().replace(/\/$/, ""));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.toLowerCase().replace(/\/$/, ""));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-verify from URL query parameters (e.g. ?number=TM-2026-001)
  useEffect(() => {
    if (currentPath === '/verifycertificates') {
      const params = new URLSearchParams(window.location.search);
      const queryCert = params.get('number') || params.get('cert') || params.get('id');
      if (queryCert) {
        setVerifyCertNumber(queryCert);
        setIsVerifying(true);
        setVerifyError(null);
        setVerifiedCert(null);
        setHasVerified(true);
        fetch(`/api/certificates/${encodeURIComponent(queryCert.trim())}`)
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || 'Verification request failed');
            }
            return res.json();
          })
          .then((data) => {
            if (data.found && data.certificate) {
              setVerifiedCert(data.certificate);
            } else {
              setVerifyError('No genuine certificate found matching this certificate number. Please verify and try again.');
            }
          })
          .catch((err) => {
            setVerifyError(err.message || 'Verification service error. Please try again.');
          })
          .finally(() => {
            setIsVerifying(false);
          });
      }
    }
  }, [currentPath]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    college: '',
    course: '',
    gradYear: '',
    partner: '',
    domain: '',
    appName: '',
    ideaDesc: '',
    problem: '',
    unique: '',
    liveLink: '',
    pdfUrl: '',
    ytLink: ''
  });

  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Certificate State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyCertNumber, setVerifyCertNumber] = useState('');
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);

  // Admin Certificates Management State
  const [adminCertificates, setAdminCertificates] = useState<Certificate[]>([]);
  const [newCertNumber, setNewCertNumber] = useState('');
  const [newCertName, setNewCertName] = useState('');
  const [newCertDate, setNewCertDate] = useState('');
  const [newCertProject, setNewCertProject] = useState('');
  const [isAddingCert, setIsAddingCert] = useState(false);

  const fetchCertificates = () => {
    fetch('/api/certificates')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAdminCertificates(data);
        }
      })
      .catch(err => console.error("Failed to fetch certificates:", err));
  };

  // Load submissions and settings
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 80);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(el => observer.observe(el));

    // Fetch initial submissions
    fetch('/api/submissions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubmissions(data);
        }
      })
      .catch(err => console.error("Failed to fetch initial submissions:", err));

    // Fetch dynamic settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
          setEditedSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Failed to fetch settings:", err));

    // Fetch verifiable certificates
    fetchCertificates();
  }, []);

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ passcode: adminPasscode })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Incorrect passcode');
        }
        return res.json();
      })
      .then(() => {
        setIsAdminLoggedIn(true);
        setShowAdminLogin(false);
        setShowAdminPanel(true);
        setAdminPasscode('');
      })
      .catch((err) => {
        alert(err.message || 'Incorrect passcode. Try "admin123" if first time.');
      });
  };

  const handleChangePasscode = (e: FormEvent) => {
    e.preventDefault();
    if (newPasscode !== confirmPasscode) {
      alert("New passcodes do not match!");
      return;
    }
    if (newPasscode.trim().length < 4) {
      alert("New passcode must be at least 4 characters long!");
      return;
    }

    fetch('/api/admin/change-passcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPasscode, newPasscode })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update passcode');
        }
        return res.json();
      })
      .then(() => {
        alert("Passcode updated successfully!");
        setCurrentPasscode('');
        setNewPasscode('');
        setConfirmPasscode('');
      })
      .catch((err) => {
        alert(err.message || "Could not change passcode");
      });
  };

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editedSettings)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(editedSettings);
          alert('Settings updated successfully!');
        } else {
          alert('Failed to save settings');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error updating settings');
      });
  };

  const handleVerifyCertificate = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyCertNumber.trim()) return;

    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedCert(null);
    setHasVerified(true);

    fetch(`/api/certificates/${encodeURIComponent(verifyCertNumber.trim())}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Verification request failed');
        }
        return res.json();
      })
      .then((data) => {
        if (data.found && data.certificate) {
          setVerifiedCert(data.certificate);
        } else {
          setVerifyError('No genuine certificate found matching this certificate number. Please verify and try again.');
        }
      })
      .catch((err) => {
        setVerifyError(err.message || 'Verification service error. Please try again.');
      })
      .finally(() => {
        setIsVerifying(false);
      });
  };

  const handleAddCertificate = (e: FormEvent) => {
    e.preventDefault();
    if (!newCertNumber.trim() || !newCertName.trim() || !newCertDate.trim() || !newCertProject.trim()) {
      alert("All certificate fields are required.");
      return;
    }

    setIsAddingCert(true);
    fetch('/api/certificates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        certNumber: newCertNumber.trim(),
        name: newCertName.trim(),
        issueDate: newCertDate.trim(),
        projectName: newCertProject.trim()
      })
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to add certificate');
        }
        return res.json();
      })
      .then(() => {
        alert("Certificate added successfully!");
        setNewCertNumber('');
        setNewCertName('');
        setNewCertDate('');
        setNewCertProject('');
        fetchCertificates();
      })
      .catch((err) => {
        alert(err.message || "Failed to add certificate");
      })
      .finally(() => {
        setIsAddingCert(false);
      });
  };

  const handleDeleteCertificate = (certNumber: string) => {
    if (!confirm(`Are you sure you want to delete certificate ${certNumber}?`)) {
      return;
    }

    fetch(`/api/certificates/${encodeURIComponent(certNumber)}`, {
      method: 'DELETE'
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to delete certificate');
        }
        return res.json();
      })
      .then(() => {
        fetchCertificates();
      })
      .catch((err) => {
        alert(err.message || "Failed to delete certificate");
      });
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = [
      'name', 'email', 'phone', 'age', 'college', 'course', 
      'gradYear', 'domain', 'appName', 'ideaDesc', 'problem', 'unique'
    ];
    
    for (const key of requiredFields) {
      if (!formData[key as keyof typeof formData].trim()) {
        alert(`Please fill in all required fields.`);
        return;
      }
    }

    if (parseInt(formData.age) < 18) {
      alert('You must be at least 18 years old to participate.');
      return;
    }

    // Submit to SQLite backend
    fetch('/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Failed to submit idea');
        }
        return res.json();
      })
      .then((newSubmission) => {
        const updatedSubmissions = [newSubmission, ...submissions];
        setSubmissions(updatedSubmissions);
        setSuccess(true);
        
        // Scroll to success message
        setTimeout(() => {
          const el = document.getElementById('register');
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      })
      .catch((err) => {
        console.error(err);
        alert('Could not submit application: ' + err.message);
      });
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      age: '',
      college: '',
      course: '',
      gradYear: '',
      partner: '',
      domain: '',
      appName: '',
      ideaDesc: '',
      problem: '',
      unique: '',
      liveLink: '',
      pdfUrl: '',
      ytLink: ''
    });
    setUploadedFileName('');
    setSuccess(false);
  };

  const handleDeleteSubmission = (id: string) => {
    if (confirm('Delete this submission?')) {
      fetch(`/api/submissions/${id}`, {
        method: 'DELETE'
      })
        .then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Failed to delete');
          }
          const updated = submissions.filter(s => s.id !== id);
          setSubmissions(updated);
        })
        .catch((err) => {
          console.error(err);
          alert('Could not delete submission: ' + err.message);
        });
    }
  };

  // Drag and drop / file upload helpers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      return;
    }

    setIsUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload"
      });
      setFormData(prev => ({ ...prev, pdfUrl: blob.url }));
      setUploadedFileName(file.name);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  if (currentPath === '/verifycertificates') {
    return (
      <div className="min-h-screen bg-[#fafdfa] text-gray-800 flex flex-col justify-between selection:bg-[#c0e8ca]">
        {/* Standalone navigation bar */}
        <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button 
              onClick={() => navigateTo('/')}
              className="flex items-center gap-2 text-[#1a4f2e] font-syne font-bold text-base sm:text-lg cursor-pointer hover:opacity-85 bg-transparent border-0"
            >
              <span>🌿</span>
              <span>TM Software Solutions</span>
            </button>
            <button 
              onClick={() => navigateTo('/')}
              className="font-syne font-bold text-xs sm:text-sm text-[#2e8b4a] hover:text-[#1a4f2e] transition-all cursor-pointer bg-[#eefcf2] border border-[#c0e8ca] px-3.5 py-1.5 rounded-full"
            >
              ← Back to Main Page
            </button>
          </div>
        </header>

        {/* Standalone Main Content */}
        <main className="flex-1 py-12 px-4 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-[#c0e8ca]">
            {/* Header */}
            <div className="bg-[#1a4f2e] text-white px-6 py-8 text-center space-y-2">
              <div className="flex justify-center">
                <div className="bg-white/10 p-3 rounded-full">
                  <Award className="text-[#a3e2b7]" size={36} />
                </div>
              </div>
              <h1 className="font-syne font-bold text-xl sm:text-2xl leading-tight">TM Certificate Verification</h1>
              <p className="text-xs sm:text-sm text-[#a3e2b7] max-w-md mx-auto">
                Official secure registry for verifying authentic student internship completion certificates issued by TM Software Solutions.
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Form to Search */}
              <form onSubmit={handleVerifyCertificate} className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Enter Certificate Number
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={verifyCertNumber}
                    onChange={(e) => setVerifyCertNumber(e.target.value)}
                    placeholder="e.g. TM-2026-001"
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2e8b4a] font-mono text-sm tracking-wider"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={isVerifying}
                    className="bg-[#2e8b4a] hover:bg-[#1a4f2e] text-white px-6 py-3.5 rounded-xl font-syne font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : 'Verify Certificate'}
                  </button>
                </div>
              </form>

              {/* Status and Results */}
              {isVerifying && (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={40} className="animate-spin text-[#2e8b4a]" />
                  <p className="text-sm text-gray-500 font-medium">Querying digital registry database...</p>
                </div>
              )}

              {/* Success Result */}
              {!isVerifying && verifiedCert && (
                <div className="space-y-4">
                  <div className="bg-[#eefcf2] border border-[#a3e2b7] p-4 rounded-xl flex items-start gap-3">
                    <CheckCircle className="text-[#2e8b4a] shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-[#1a4f2e]">Genuine Certificate Verified</h4>
                      <p className="text-xs text-[#2e8b4a] mt-0.5">This certificate is genuine and officially registered in our systems.</p>
                    </div>
                  </div>

                  {/* Certificate Graphic */}
                  <div className="border-4 border-double border-[#1a4f2e]/20 p-6 rounded-2xl bg-[#fafdfa] relative overflow-hidden select-none">
                    {/* Watermark Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
                      <Award size={260} />
                    </div>

                    <div className="border border-[#1a4f2e]/10 p-4 space-y-4 text-center">
                      <div className="flex justify-center mb-1">
                        <Award size={36} className="text-[#2e8b4a]" />
                      </div>
                      
                      <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-gray-400">
                        TM Software Solutions
                      </div>
                      
                      <div className="text-xl font-serif text-[#1a4f2e] italic">
                        Certificate of Internship Completion
                      </div>

                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        This document serves as verification that the following student has successfully completed their software engineering & AI development internship.
                      </p>

                      <div className="py-3 border-y border-gray-100 my-4 space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Recipient Name:</span>
                          <span className="col-span-2 font-bold text-gray-800">{verifiedCert.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Project / App:</span>
                          <span className="col-span-2 font-semibold text-gray-800 italic">"{verifiedCert.projectName}"</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Issue Date:</span>
                          <span className="col-span-2 font-medium text-gray-700">{verifiedCert.issueDate}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Certificate No:</span>
                          <span className="col-span-2 font-mono font-bold text-[#2e8b4a]">{verifiedCert.certNumber}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-4">
                        <div className="text-left">
                          <div className="text-[9px] text-[#2e8b4a] font-bold uppercase tracking-wider bg-[#eefcf2] px-2 py-0.5 rounded border border-[#a3e2b7] inline-block">
                            ✓ Genuine Certificate
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif text-xs italic border-b border-gray-300 pb-1 px-4 inline-block text-gray-700">
                            Authorized Signatory
                          </div>
                          <div className="text-[8px] text-gray-400 uppercase mt-1">
                            TM Software Solutions
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Result */}
              {!isVerifying && hasVerified && verifyError && (
                <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-3">
                  <X className="text-red-500 shrink-0 mt-0.5 bg-red-100 p-0.5 rounded-full" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Verification Failed</h4>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">{verifyError}</p>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Please double-check the spelling, format, and ensure it matches the layout of your certificate (e.g., <code className="font-mono bg-white px-1 border border-gray-200">TM-2026-001</code>).
                    </p>
                  </div>
                </div>
              )}

              {/* Help text when page first opens and no verification has happened yet */}
              {!isVerifying && !hasVerified && (
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-start gap-3">
                  <Info className="text-gray-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">Verification Instructions</h4>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      All internship certificates issued by TM Software Solutions include a unique verification number. Enter this number above to verify its authenticity, date of issue, and associated project.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="bg-gray-50 border-t border-gray-100 py-6 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} TM Software Solutions. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <>
      {/* Floating Verify Certificate Button */}
      <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
        <button 
          id="verify-cert-btn"
          onClick={() => {
            navigateTo('/verifycertificates');
            setVerifyCertNumber('');
            setVerifiedCert(null);
            setVerifyError(null);
            setHasVerified(false);
          }}
          className="bg-white/95 backdrop-blur-sm border border-[#c0e8ca] hover:border-[#2e8b4a] text-[#1a4f2e] hover:text-white hover:bg-[#2e8b4a] shadow-lg font-syne font-bold px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-all text-xs sm:text-sm cursor-pointer group"
        >
          <Award size={16} className="text-[#2e8b4a] group-hover:text-white" />
          Verify Certificate
        </button>
      </div>

      {/* Verify Certificate Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-[10000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[#c0e8ca] relative my-8">
            {/* Header */}
            <div className="bg-[#1a4f2e] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="text-[#a3e2b7]" size={24} />
                <div>
                  <h3 className="font-syne font-bold text-lg leading-tight">TM Certificate Verification</h3>
                  <p className="text-xs text-[#a3e2b7]">Verify genuine TM Software Solutions certificates</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Form to Search */}
              <form onSubmit={handleVerifyCertificate} className="space-y-3">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Enter Certificate Number
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={verifyCertNumber}
                    onChange={(e) => setVerifyCertNumber(e.target.value)}
                    placeholder="e.g. TM-2026-001"
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2e8b4a] font-mono text-sm tracking-wider"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={isVerifying}
                    className="bg-[#2e8b4a] hover:bg-[#1a4f2e] text-white px-6 py-3 rounded-xl font-syne font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : 'Verify'}
                  </button>
                </div>
              </form>

              {/* Status and Results */}
              {isVerifying && (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={36} className="animate-spin text-[#2e8b4a]" />
                  <p className="text-sm text-gray-500 font-medium">Verifying with secure registry...</p>
                </div>
              )}

              {/* Success Result */}
              {!isVerifying && verifiedCert && (
                <div className="space-y-4">
                  <div className="bg-[#eefcf2] border border-[#a3e2b7] p-4 rounded-xl flex items-start gap-3">
                    <CheckCircle className="text-[#2e8b4a] shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="text-sm font-bold text-[#1a4f2e]">Genuine Certificate Verified</h4>
                      <p className="text-xs text-[#2e8b4a] mt-0.5">This certificate is genuine and officially issued by TM Software Solutions.</p>
                    </div>
                  </div>

                  {/* Simulated Certificate Graphic */}
                  <div className="border-4 border-double border-[#1a4f2e]/20 p-6 rounded-2xl bg-[#fafdfa] relative overflow-hidden select-none">
                    {/* Watermark Logo */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-12">
                      <Award size={260} />
                    </div>

                    <div className="border border-[#1a4f2e]/10 p-4 space-y-4 text-center">
                      <div className="flex justify-center mb-1">
                        <Award size={36} className="text-[#2e8b4a]" />
                      </div>
                      
                      <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-gray-400">
                        TM Software Solutions
                      </div>
                      
                      <div className="text-xl font-serif text-[#1a4f2e] italic">
                        Certificate of Internship Completion
                      </div>

                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        This document serves as verification that the following student has successfully completed their software engineering & AI development internship.
                      </p>

                      <div className="py-3 border-y border-gray-100 my-4 space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Recipient Name:</span>
                          <span className="col-span-2 font-bold text-gray-800">{verifiedCert.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Project / App:</span>
                          <span className="col-span-2 font-semibold text-gray-800 italic">"{verifiedCert.projectName}"</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Issue Date:</span>
                          <span className="col-span-2 font-medium text-gray-700">{verifiedCert.issueDate}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-left text-xs">
                          <span className="text-gray-400">Certificate No:</span>
                          <span className="col-span-2 font-mono font-bold text-[#2e8b4a]">{verifiedCert.certNumber}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-4">
                        <div className="text-left">
                          <div className="text-[9px] text-[#2e8b4a] font-bold uppercase tracking-wider bg-[#eefcf2] px-2 py-0.5 rounded border border-[#a3e2b7] inline-block">
                            ✓ Genuine Certificate
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif text-xs italic border-b border-gray-300 pb-1 px-4 inline-block text-gray-700">
                            Authorized Signatory
                          </div>
                          <div className="text-[8px] text-gray-400 uppercase mt-1">
                            TM Software Solutions
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Result */}
              {!isVerifying && hasVerified && verifyError && (
                <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-3">
                  <X className="text-red-500 shrink-0 mt-0.5 bg-red-100 p-0.5 rounded-full" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Verification Failed</h4>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">{verifyError}</p>
                    <p className="text-[11px] text-gray-500 mt-2">
                      Please double-check the spelling, format, and ensure it matches the layout of your certificate (e.g., <code className="font-mono bg-white px-1 border border-gray-200">TM-2026-001</code>).
                    </p>
                  </div>
                </div>
              )}

              {/* Help text when modal first opens and no verification has happened yet */}
              {!isVerifying && !hasVerified && (
                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-start gap-3">
                  <Info className="text-gray-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">Verification Instructions</h4>
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      All internship certificates issued by TM Software Solutions include a unique verification number. Enter this number above to verify its authenticity, date of issue, and associated project.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end">
              <button 
                onClick={() => setShowVerifyModal(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs sm:text-sm font-syne font-semibold transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <span className="leaf-deco l1">🌿</span>
        <span className="leaf-deco l2">🍃</span>
        <span className="leaf-deco l3">🌱</span>
        <span className="leaf-deco l4">🍀</span>

        <div className="badge">
          <div className="badge-dot"></div> {settings.badgeText}
        </div>
        <div className="hero-company">{settings.heroCompany}</div>
        <h1 className="hero-headline" dangerouslySetInnerHTML={{ __html: settings.heroTitle.replace(/AI Apps\.|Real Rewards\./g, '<em>$&</em>') }}></h1>
        <p className="hero-sub">{settings.heroSub}</p>
        <div className="hero-cta">
          <a href="#register" className="btn-primary">Register Your Idea →</a>
          <a href="#about" className="btn-secondary">Learn More</a>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          <span className="ticker-item">{settings.prize1} First Prize</span>
          <span className="ticker-item">Internship Certificate</span>
          <span className="ticker-item">Letter of Recommendation</span>
          <span className="ticker-item">{settings.prize5} Gift Card for All</span>
          <span className="ticker-item">Google Play Store Launch</span>
          <span className="ticker-item">Industry Mentorship</span>
          <span className="ticker-item">{settings.prize1} First Prize</span>
          <span className="ticker-item">Internship Certificate</span>
          <span className="ticker-item">Letter of Recommendation</span>
          <span className="ticker-item">{settings.prize5} Gift Card for All</span>
          <span className="ticker-item">Google Play Store Launch</span>
          <span className="ticker-item">Industry Mentorship</span>
        </div>
      </div>

      {/* REWARDS */}
      <div className="reward-strip">
        <div className="strip-label">{settings.rewardTitle}</div>
        <div className="prizes">
          <div className="prize-card">
            <div className="prize-rank">🥇 1st Place</div>
            <div className="prize-amt">{settings.prize1}</div>
            <div className="prize-note">{settings.prize1Desc}</div>
          </div>
          <div className="prize-card">
            <div className="prize-rank">🥈 2nd Place</div>
            <div className="prize-amt">{settings.prize2}</div>
            <div className="prize-note">{settings.prize2Desc}</div>
          </div>
          <div className="prize-card">
            <div className="prize-rank">🥉 3rd Place</div>
            <div className="prize-amt">{settings.prize3}</div>
            <div className="prize-note">{settings.prize3Desc}</div>
          </div>
          <div className="prize-card">
            <div className="prize-rank">⭐ Next 7</div>
            <div className="prize-amt">{settings.prize4}</div>
            <div className="prize-note">{settings.prize4Desc}</div>
          </div>
          <div className="prize-card">
            <div className="prize-rank">🎁 All Participants</div>
            <div className="prize-amt">{settings.prize5}</div>
            <div className="prize-note">{settings.prize5Desc}</div>
          </div>
        </div>
      </div>

      {/* ABOUT */}
      <div id="about" className="section">
        <div className="section-label reveal">About the Program</div>
        <h2 className="section-title reveal">{settings.aboutTitle}</h2>
        <p className="section-body reveal">{settings.aboutBody}</p>

        <div className="phases">
          <div className="phase-card reveal">
            <div className="phase-num">01</div>
            <div className="phase-title">{settings.phase1Title}</div>
            <p className="phase-desc">{settings.phase1Desc}</p>
          </div>
          <div className="phase-card reveal">
            <div className="phase-num">02</div>
            <div className="phase-title">{settings.phase2Title}</div>
            <p className="phase-desc">{settings.phase2Desc}</p>
          </div>
          <div className="phase-card reveal">
            <div className="phase-num">03</div>
            <div className="phase-title">{settings.phase3Title}</div>
            <p className="phase-desc">{settings.phase3Desc}</p>
          </div>
        </div>
      </div>

      {/* BENEFITS */}
      <div style={{background: '#f0fbf3', padding: '0 0 80px'}}>
        <div className="section" style={{paddingTop: 0}}>
          <div className="section-label reveal">What You'll Gain</div>
          <h2 className="section-title reveal">Built for Your Growth</h2>
          <div className="benefits-grid">
            <div className="benefit-item reveal">
              <span className="benefit-icon">🤖</span>
              <span className="benefit-text">Hands-on experience with cutting-edge AI tools and app development</span>
            </div>
            <div className="benefit-item reveal">
              <span className="benefit-icon">💡</span>
              <span className="benefit-text">Product thinking, idea validation & real-world problem solving skills</span>
            </div>
            <div className="benefit-item reveal">
              <span className="benefit-icon">👥</span>
              <span className="benefit-text">Work directly with industry mentors and receive practical guidance</span>
            </div>
            <div className="benefit-item reveal">
              <span className="benefit-icon">📁</span>
              <span className="benefit-text">Portfolio-worthy project that strengthens your resume and career</span>
            </div>
            <div className="benefit-item reveal">
              <span className="benefit-icon">📜</span>
              <span className="benefit-text">Internship Participation Certificate + Letter of Recommendation</span>
            </div>
            <div className="benefit-item reveal">
              <span className="benefit-icon">🚀</span>
              <span className="benefit-text">Chance to launch your app on Google Play Store</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORM WRAPPER */}
      <div id="register" className="form-wrapper">
        <div className="form-inner">
          <div className="form-header">
            <div className="section-label reveal" style={{justifyContent: 'center', display: 'flex'}}>Register Now</div>
            <h2 className="section-title reveal" style={{textAlign: 'center'}}>Submit Your Idea</h2>
            <p className="section-body reveal" style={{margin: '0 auto', textAlign: 'center'}}>
              Fill in your details below. You have 8–10 days to brainstorm, research, and refine before submitting.
            </p>
          </div>

          <div className="form-card reveal">
            {!success ? (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* PERSONAL DETAILS */}
                <div className="form-section-head">
                  <User size={18} className="text-[#2e8b4a]" />
                  Personal Details
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Full Name <span>*</span></label>
                    <input 
                      type="text" 
                      placeholder="Your full name" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="field">
                    <label>Email Address <span>*</span></label>
                    <input 
                      type="email" 
                      placeholder="you@example.com" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Phone Number <span>*</span></label>
                    <input 
                      type="tel" 
                      placeholder="+91 XXXXXXXXXX" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="field">
                    <label>Age <span>*</span></label>
                    <input 
                      type="number" 
                      placeholder="Must be 18+" 
                      min="18" 
                      required
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                </div>

                <hr className="form-divider" />

                {/* ACADEMIC DETAILS */}
                <div className="form-section-head">
                  <BookOpen size={18} className="text-[#2e8b4a]" />
                  Academic Details
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>College / University Name <span>*</span></label>
                    <input 
                      type="text" 
                      placeholder="Your institution name" 
                      required
                      value={formData.college}
                      onChange={e => setFormData({...formData, college: e.target.value})}
                    />
                  </div>
                  <div className="field">
                    <label>Enrolled Course <span>*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. B.Tech CS, BCA, MCA" 
                      required
                      value={formData.course}
                      onChange={e => setFormData({...formData, course: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Graduation Year <span>*</span></label>
                    <select 
                      required
                      value={formData.gradYear}
                      onChange={e => setFormData({...formData, gradYear: e.target.value})}
                    >
                      <option value="">Select year</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028</option>
                      <option value="2029">2029</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Partner's Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="Team partner's email (if any)" 
                      value={formData.partner}
                      onChange={e => setFormData({...formData, partner: e.target.value})}
                    />
                  </div>
                </div>

                <hr className="form-divider" />

                {/* YOUR APP IDEA */}
                <div className="form-section-head">
                  <Lightbulb size={18} className="text-[#2e8b4a]" />
                  Your App Idea
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Field / Domain <span>*</span></label>
                    <select 
                      required
                      value={formData.domain}
                      onChange={e => setFormData({...formData, domain: e.target.value})}
                    >
                      <option value="">Select domain</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Finance">Finance</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Rural / Tier 2-3 Cities">Rural / Tier 2-3 Cities</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>App Name / Title <span>*</span></label>
                    <input 
                      type="text" 
                      placeholder="What will you call it?" 
                      required
                      value={formData.appName}
                      onChange={e => setFormData({...formData, appName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Describe Your Idea <span>*</span></label>
                  <textarea 
                    placeholder="Give us a clear overview of your app idea..." 
                    required
                    value={formData.ideaDesc}
                    onChange={e => setFormData({...formData, ideaDesc: e.target.value})}
                  />
                </div>
                <div className="field">
                  <label>What Problem Does It Solve? <span>*</span></label>
                  <textarea 
                    placeholder="What pain point or gap in the market does your app address?" 
                    required
                    value={formData.problem}
                    onChange={e => setFormData({...formData, problem: e.target.value})}
                  />
                </div>
                <div className="field">
                  <label>Uniqueness / How Is It Different? <span>*</span></label>
                  <textarea 
                    placeholder="What makes your idea stand out from existing solutions?" 
                    required
                    style={{minHeight: '90px'}}
                    value={formData.unique}
                    onChange={e => setFormData({...formData, unique: e.target.value})}
                  />
                </div>

                <hr className="form-divider" />

                {/* ADDED PROJECT DETAILS */}
                <div className="form-section-head">
                  <Briefcase size={18} className="text-[#2e8b4a]" />
                  Project Files & Links (Optional)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Upload Component */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#1a4f2e] uppercase mb-2">Project PDF</label>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
                        isDragging 
                          ? 'border-[#3aaf5c] bg-[#f0fbf3]' 
                          : 'border-[#c0e8ca] bg-[#fdfefd] hover:bg-[#f6fcf8]'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="application/pdf" 
                        className="hidden" 
                      />
                      {isUploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="animate-spin text-[#3aaf5c]" size={28} />
                          <p className="text-xs font-semibold text-[#1a4f2e]">Uploading PDF...</p>
                        </div>
                      ) : uploadedFileName ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle className="text-[#3aaf5c]" size={28} />
                          <p className="text-xs font-bold text-[#1a4f2e] max-w-[200px] truncate">{uploadedFileName}</p>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Click or drag to replace</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="text-[#3aaf5c]" size={28} />
                          <p className="text-xs font-bold text-[#1a4f2e]">Drag & Drop Project PDF</p>
                          <span className="text-[10px] text-gray-400">or click to browse files (max 10MB)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Links */}
                  <div className="space-y-4">
                    <div className="field mb-0">
                      <label className="flex items-center gap-1.5"><LinkIcon size={14} /> Live Project URL</label>
                      <input 
                        type="url" 
                        placeholder="https://yourproject.com" 
                        value={formData.liveLink}
                        onChange={e => setFormData({...formData, liveLink: e.target.value})}
                      />
                    </div>
                    <div className="field mb-0">
                      <label className="flex items-center gap-1.5"><Youtube size={14} /> Video Pitch / YouTube Link</label>
                      <input 
                        type="url" 
                        placeholder="https://youtube.com/watch?v=..." 
                        value={formData.ytLink}
                        onChange={e => setFormData({...formData, ytLink: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="submit-btn flex items-center justify-center gap-2 mt-6">
                  <Send size={18} />
                  Submit My Application 🚀
                </button>
                <p className="form-note">By submitting, you confirm you are 18+ years of age.<br/>You may team up with 1 partner — inform us via email.</p>
              </form>
            ) : (
              // SUCCESS STATE
              <div className="text-center py-12 px-4">
                <div className="text-6xl mb-6">🌱</div>
                <h3 className="text-2xl font-bold font-syne text-[#1a4f2e] mb-4">You're In! Application Received.</h3>
                <p className="text-[#2d5a3d] max-w-lg mx-auto mb-8 leading-relaxed">
                  Thank you for joining the TM Software AI Internship. We'll review your idea and get in touch soon. Start refining — the best ideas come from persistent thinking.
                </p>
                <button 
                  onClick={handleResetForm}
                  className="px-6 py-2.5 rounded-full font-medium bg-[#1a4f2e] hover:bg-[#2e8b4a] text-white transition-all text-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  Submit Another Idea
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative">
        <span className="footer-logo">TM Software Solutions</span>
        A unit of <strong>TM Asset Management Pvt. Ltd.</strong><br/>
        For queries, reply to your invitation email.<br/><br/>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-2">
          <span style={{fontSize: '0.75rem', opacity: 0.4}}>© 2025 TM Asset Management Pvt. Ltd. · All Rights Reserved</span>
          
          <button 
            onClick={() => {
              if (isAdminLoggedIn) {
                setShowAdminPanel(true);
              } else {
                setShowAdminLogin(true);
              }
            }}
            className="text-xs bg-white/10 hover:bg-white/20 text-[#a8f0b8] font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer border border-[#a8f0b8]/20"
          >
            <Lock size={12} />
            {isAdminLoggedIn ? "Employee Dashboard" : "Employee Login"}
          </button>
        </div>
      </footer>

      {/* ADMIN LOGIN MODAL */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#c0e8ca] shadow-2xl relative">
            <button 
              onClick={() => setShowAdminLogin(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="p-3 bg-[#f0fbf3] w-fit rounded-full mx-auto mb-4 border border-[#c5ecd0] text-[#2e8b4a]">
                <Lock size={28} />
              </div>
              <h3 className="text-xl font-bold font-syne text-[#1a4f2e]">Admin Access Only</h3>
              <p className="text-xs text-[#2d5a3d] mt-1">Please enter your passcode below to manage settings & submissions.</p>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="field">
                <label>Admin Passcode</label>
                <input 
                  type="password" 
                  placeholder="Enter passcode (e.g. admin123)" 
                  value={adminPasscode}
                  onChange={e => setAdminPasscode(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-lg"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="submit-btn w-full">
                Verify Passcode & Enter
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULL ADMIN DASHBOARD CONTROL PANEL */}
      {showAdminPanel && isAdminLoggedIn && (
        <div className="fixed inset-0 bg-black/60 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] border border-[#c0e8ca] shadow-2xl relative flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-[#1a4f2e] text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings size={24} />
                <div>
                  <h3 className="font-syne font-bold text-lg leading-tight">TM Software Solutions Admin Portal</h3>
                  <p className="text-xs text-[#a8f0b8]/80">Manage application content, update program details, and review submissions</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setIsAdminLoggedIn(false);
                    setShowAdminPanel(false);
                  }}
                  className="text-xs font-bold text-white bg-red-600/80 hover:bg-red-700 px-3.5 py-1.5 rounded-full transition-all cursor-pointer"
                >
                  Logout
                </button>
                <button 
                  onClick={() => setShowAdminPanel(false)}
                  className="text-white hover:opacity-80 p-1.5 bg-white/10 rounded-full cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Dashboard Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f9fdfa] grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Manage Settings / Copywriting */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-[#c0e8ca] shadow-sm">
                  <h4 className="font-syne font-bold text-base text-[#1a4f2e] mb-4 flex items-center gap-1.5">
                    <Save size={18} /> Configure Website Copy
                  </h4>
                  <form onSubmit={handleSaveSettings} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="field">
                      <label>Badge Banner Text</label>
                      <input 
                        type="text" 
                        value={editedSettings.badgeText}
                        onChange={e => setEditedSettings({...editedSettings, badgeText: e.target.value})}
                      />
                    </div>
                    <div className="field">
                      <label>Company Branding</label>
                      <input 
                        type="text" 
                        value={editedSettings.heroCompany}
                        onChange={e => setEditedSettings({...editedSettings, heroCompany: e.target.value})}
                      />
                    </div>
                    <div className="field">
                      <label>Hero Title</label>
                      <input 
                        type="text" 
                        value={editedSettings.heroTitle}
                        onChange={e => setEditedSettings({...editedSettings, heroTitle: e.target.value})}
                      />
                    </div>
                    <div className="field">
                      <label>Hero Subtitle</label>
                      <textarea 
                        value={editedSettings.heroSub}
                        onChange={e => setEditedSettings({...editedSettings, heroSub: e.target.value})}
                        className="text-xs"
                      />
                    </div>

                    <div className="border-t border-gray-100 my-4 pt-4">
                      <h5 className="font-bold text-xs text-[#1a4f2e] uppercase mb-3">Rewards & Prizes Settings</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="field">
                          <label>1st Prize Amount</label>
                          <input 
                            type="text" 
                            value={editedSettings.prize1}
                            onChange={e => setEditedSettings({...editedSettings, prize1: e.target.value})}
                          />
                        </div>
                        <div className="field">
                          <label>2nd Prize Amount</label>
                          <input 
                            type="text" 
                            value={editedSettings.prize2}
                            onChange={e => setEditedSettings({...editedSettings, prize2: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="field">
                          <label>3rd Prize Amount</label>
                          <input 
                            type="text" 
                            value={editedSettings.prize3}
                            onChange={e => setEditedSettings({...editedSettings, prize3: e.target.value})}
                          />
                        </div>
                        <div className="field">
                          <label>Participation Reward</label>
                          <input 
                            type="text" 
                            value={editedSettings.prize5}
                            onChange={e => setEditedSettings({...editedSettings, prize5: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-4 pt-4">
                      <h5 className="font-bold text-xs text-[#1a4f2e] uppercase mb-3">About Program Text</h5>
                      <div className="field">
                        <label>About Heading</label>
                        <input 
                          type="text" 
                          value={editedSettings.aboutTitle}
                          onChange={e => setEditedSettings({...editedSettings, aboutTitle: e.target.value})}
                        />
                      </div>
                      <div className="field">
                        <label>About Paragraph</label>
                        <textarea 
                          value={editedSettings.aboutBody}
                          onChange={e => setEditedSettings({...editedSettings, aboutBody: e.target.value})}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <button type="submit" className="submit-btn w-full mt-4 flex items-center justify-center gap-1.5">
                      <Check size={18} />
                      Save Configurations
                    </button>
                  </form>
                </div>

                {/* Change Passcode Card */}
                <div className="bg-white p-6 rounded-2xl border border-[#c0e8ca] shadow-sm">
                  <h4 className="font-syne font-bold text-base text-[#1a4f2e] mb-4 flex items-center gap-1.5">
                    <Lock size={18} /> Change Admin Passcode
                  </h4>
                  <form onSubmit={handleChangePasscode} className="space-y-4">
                    <div className="field">
                      <label>Current Passcode</label>
                      <input 
                        type="password" 
                        value={currentPasscode} 
                        onChange={e => setCurrentPasscode(e.target.value)}
                        placeholder="Enter current passcode"
                        required
                        className="font-mono text-sm text-center tracking-widest"
                      />
                    </div>
                    <div className="field">
                      <label>New Passcode</label>
                      <input 
                        type="password" 
                        value={newPasscode} 
                        onChange={e => setNewPasscode(e.target.value)}
                        placeholder="Min 4 characters"
                        required
                        className="font-mono text-sm text-center tracking-widest"
                      />
                    </div>
                    <div className="field">
                      <label>Confirm New Passcode</label>
                      <input 
                        type="password" 
                        value={confirmPasscode} 
                        onChange={e => setConfirmPasscode(e.target.value)}
                        placeholder="Re-enter new passcode"
                        required
                        className="font-mono text-sm text-center tracking-widest"
                      />
                    </div>
                    <button type="submit" className="submit-btn w-full flex items-center justify-center gap-1.5 bg-[#2e8b4a] hover:bg-[#1a4f2e] text-white transition-all">
                      <RefreshCw size={14} className="animate-none" />
                      Update Passcode
                    </button>
                  </form>
                </div>

                {/* Manage Verifiable Certificates Card */}
                <div className="bg-white p-6 rounded-2xl border border-[#c0e8ca] shadow-sm">
                  <h4 className="font-syne font-bold text-base text-[#1a4f2e] mb-4 flex items-center gap-1.5">
                    <Award size={18} /> Verifiable Certificates ({adminCertificates.length})
                  </h4>
                  
                  {/* Form to add certificate */}
                  <form onSubmit={handleAddCertificate} className="space-y-3 pb-5 border-b border-gray-100 mb-5">
                    <p className="text-[11px] text-gray-500 font-medium">Issue and registry new student certificate:</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="field">
                        <label>Certificate Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. TM-2026-001" 
                          value={newCertNumber}
                          onChange={e => setNewCertNumber(e.target.value)}
                          required
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="field">
                        <label>Issue Date</label>
                        <input 
                          type="text" 
                          placeholder="YYYY-MM-DD" 
                          value={newCertDate}
                          onChange={e => setNewCertDate(e.target.value)}
                          required
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label>Recipient Name</label>
                      <input 
                        type="text" 
                        placeholder="Full name of student" 
                        value={newCertName}
                        onChange={e => setNewCertName(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    <div className="field">
                      <label>App / Project Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. AI Coding Companion" 
                        value={newCertProject}
                        onChange={e => setNewCertProject(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isAddingCert}
                      className="submit-btn w-full flex items-center justify-center gap-1.5 bg-[#2e8b4a] hover:bg-[#1a4f2e] text-white transition-all text-xs"
                    >
                      {isAddingCert ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <Plus size={12} />
                      )}
                      Add to Verifiable Registry
                    </button>
                  </form>

                  {/* List of existing certificates */}
                  <div>
                    <h5 className="font-bold text-xs text-[#1a4f2e] uppercase mb-3">Registered Certificates</h5>
                    {adminCertificates.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-4">No certificates registered yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[25vh] overflow-y-auto pr-1">
                        {adminCertificates.map((cert) => (
                          <div key={cert.certNumber} className="flex items-start justify-between gap-2 p-2.5 bg-gray-50 hover:bg-[#f2fdf5] rounded-xl border border-gray-100 transition-all text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[#2e8b4a] bg-[#eefcf2] px-1.5 py-0.5 rounded text-[10px]">
                                  {cert.certNumber}
                                </span>
                                <span className="font-bold text-gray-700">{cert.name}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 italic">Project: "{cert.projectName}"</p>
                              <p className="text-[10px] text-gray-400">Issued: {cert.issueDate}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleDeleteCertificate(cert.certNumber)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all shrink-0 cursor-pointer"
                              title="Delete Certificate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Manage Submissions */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="bg-white p-6 rounded-2xl border border-[#c0e8ca] shadow-sm flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h4 className="font-syne font-bold text-base text-[#1a4f2e] flex items-center gap-1.5">
                      <Trophy size={18} /> Submissions Queue ({submissions.length})
                    </h4>
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded-full uppercase tracking-wider font-bold">SQLite Realtime DB</span>
                  </div>

                  {submissions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl">
                      <Briefcase size={36} className="text-gray-300 mb-2" />
                      <p className="text-sm font-semibold text-gray-500">No submissions found</p>
                      <p className="text-xs text-gray-400 max-w-[240px] mt-1">When students complete the native interactive form on your page, entries will appear here.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 pr-2 space-y-4 max-h-[65vh]">
                      {submissions.map((sub, idx) => (
                        <div key={sub.id} className="pt-4 first:pt-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-green-100 text-[#1a4f2e] font-bold px-2 py-0.5 rounded">
                                  #{submissions.length - idx}
                                </span>
                                <h5 className="font-bold text-sm text-[#1a4f2e]">{sub.name}</h5>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {sub.email} · {sub.phone} · {sub.age} y/o
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {sub.college} ({sub.course}, {sub.gradYear})
                              </p>
                            </div>
                            <button 
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                              title="Delete Submission"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="mt-3 bg-[#f2fdf5] border border-[#e0fbe8] p-4 rounded-xl space-y-2">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <p className="text-xs font-bold text-[#1a4f2e]">
                                {sub.appName} <span className="text-xs font-normal text-gray-500">({sub.domain})</span>
                              </p>
                              <p className="text-[10px] text-gray-400">{sub.timestamp}</p>
                            </div>
                            
                            <p className="text-xs text-[#2d5a3d]"><strong>Idea Overview:</strong> {sub.ideaDesc}</p>
                            <p className="text-xs text-[#2d5a3d]"><strong>Problem Solved:</strong> {sub.problem}</p>
                            <p className="text-xs text-[#2d5a3d]"><strong>Unique Value:</strong> {sub.unique}</p>

                            {/* Optional elements list */}
                            {(sub.liveLink || sub.pdfUrl || sub.ytLink) && (
                              <div className="pt-2 border-t border-[#c5ecd0] mt-2 flex flex-wrap gap-3">
                                {sub.pdfUrl && (
                                  <a 
                                    href={sub.pdfUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs font-bold text-[#1a4f2e] bg-[#d4f5d4] hover:bg-[#b5f0c6] px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
                                  >
                                    <FileText size={12} />
                                    Project PDF
                                  </a>
                                )}
                                {sub.liveLink && (
                                  <a 
                                    href={sub.liveLink} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs font-bold text-[#1a4f2e] bg-[#d4f5d4] hover:bg-[#b5f0c6] px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
                                  >
                                    <LinkIcon size={12} />
                                    Live App
                                  </a>
                                )}
                                {sub.ytLink && (
                                  <a 
                                    href={sub.ytLink} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
                                  >
                                    <Youtube size={12} />
                                    Video pitch
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
