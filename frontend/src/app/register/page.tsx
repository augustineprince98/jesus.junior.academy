'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registrationApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  BookOpen,
  Calendar,
  ArrowRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

type RegistrationStep = 'form' | 'success' | 'check';

interface SchoolClass {
  id: number;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<RegistrationStep>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('PARENT');

  // Student-specific state
  const [classId, setClassId] = useState<number | null>(null);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Check status state
  const [checkPhone, setCheckPhone] = useState('');
  const [statusResult, setStatusResult] = useState<{ status: string; message: string } | null>(null);

  // Load classes when role changes to STUDENT
  useEffect(() => {
    if (role === 'STUDENT' && classes.length === 0) {
      loadClasses();
    }
  }, [role]);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const result = await registrationApi.getClasses();
      // Ensure classes is always an array
      setClasses(Array.isArray(result?.classes) ? result.classes : []);
    } catch (err) {
      console.error('Failed to load classes:', err);
      setClasses([]); // Set empty array on error
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Additional validation for students
    if (role === 'STUDENT') {
      if (!classId) {
        setError('Please select your class');
        return;
      }
      if (!fatherName.trim()) {
        setError("Father's name is required");
        return;
      }
      if (!motherName.trim()) {
        setError("Mother's name is required");
        return;
      }
    }

    try {
      setLoading(true);
      await registrationApi.register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        email: email.trim() || undefined,
        role,
        class_id: role === 'STUDENT' ? classId || undefined : undefined,
        dob: role === 'STUDENT' && dob ? dob : undefined,
        gender: role === 'STUDENT' && gender ? gender : undefined,
        father_name: role === 'STUDENT' ? fatherName.trim() : undefined,
        mother_name: role === 'STUDENT' ? motherName.trim() : undefined,
      });
      setStep('success');
    } catch (err: any) {
      const errorMessage = typeof err.detail === 'string' ? err.detail :
        err.message ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusResult(null);

    const cleanPhone = checkPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      const result = await registrationApi.checkStatus(checkPhone.trim());
      setStatusResult(result);
    } catch (err: any) {
      const errorMessage = typeof err.detail === 'string' ? err.detail :
        err.message ||
        'Could not find registration';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dots" />

      {/* Glow orbs */}
      <div className="glow-orb glow-orb-blue w-[400px] h-[400px] -top-20 -right-20 opacity-20" />
      <div className="glow-orb glow-orb-gold w-[300px] h-[300px] bottom-20 -left-20 opacity-15" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="icon-circle icon-circle-lg icon-circle-accent mx-auto mb-6">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="font-bambi text-lg sm:text-2xl text-[var(--text-primary)] mb-2 whitespace-nowrap">JESUS JUNIOR ACADEMY</h1>
          <p className="text-[var(--text-secondary)] text-sm tracking-wide">Digital Campus Registration</p>
        </div>

        {/* Card */}
        <div className="gradient-border p-8 md:p-10">
          {step === 'success' ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="icon-circle icon-circle-lg icon-circle-gold mx-auto mb-6"
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Registration Successful!</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Your account is pending admin approval. You will be notified once your account is activated.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full btn btn-primary py-4 flex items-center justify-center gap-2"
                >
                  Go to Login
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStep('check')}
                  className="w-full py-3 border border-[var(--glass-border)] text-[var(--text-secondary)] rounded-xl font-semibold hover:bg-[var(--glass-hover)] transition-colors"
                >
                  Check Status
                </button>
              </div>
            </motion.div>
          ) : step === 'check' ? (
            /* Check Status Form */
            <div>
              <button
                onClick={() => setStep('form')}
                className="flex items-center gap-2 text-white/40 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Register
              </button>

              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Check Registration Status</h2>
              <p className="text-[var(--text-secondary)] mb-6">Enter your phone number to check your approval status.</p>

              <form onSubmit={handleCheckStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="tel"
                      value={checkPhone}
                      onChange={(e) => setCheckPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit Phone Number"
                      className="input pl-12"
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  </motion.div>
                )}

                {statusResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl ${statusResult.status === 'APPROVED'
                        ? 'bg-green-500/10 border border-green-500/30'
                        : statusResult.status === 'REJECTED'
                          ? 'bg-red-500/10 border border-red-500/30'
                          : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}
                  >
                    <p className={`font-semibold ${statusResult.status === 'APPROVED'
                        ? 'text-green-400'
                        : statusResult.status === 'REJECTED'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}>
                      Status: {statusResult.status}
                    </p>
                    <p className={`text-sm mt-1 ${statusResult.status === 'APPROVED'
                        ? 'text-green-400/70'
                        : statusResult.status === 'REJECTED'
                          ? 'text-red-400/70'
                          : 'text-yellow-400/70'
                      }`}>
                      {statusResult.message}
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full btn btn-primary py-4 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Registration Form */
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">Create Account</h2>

              <form onSubmit={handleRegister} className="space-y-5" autoComplete="off">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="input pl-12"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit phone number"
                      className="input pl-12 pr-16"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      autoComplete="off"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/30">
                      {phone.length}/10
                    </span>
                  </div>
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Email <span className="text-[var(--text-secondary)]/70">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      type="text"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="input pl-12"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">I am a:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('PARENT')}
                      className={`py-3 px-4 rounded-xl border font-medium transition-all ${role === 'PARENT'
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                          : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/20'
                        }`}
                    >
                      Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`py-3 px-4 rounded-xl border font-medium transition-all ${role === 'STUDENT'
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]'
                          : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/20'
                        }`}
                    >
                      Student
                    </button>
                  </div>
                </div>

                {/* Student-specific fields */}
                {role === 'STUDENT' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--glass-border)]"
                  >
                    <p className="text-sm font-medium text-[var(--accent-blue)]">Student Information</p>

                    {/* Class Selection */}
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <select
                        value={classId || ''}
                        onChange={(e) => setClassId(Number(e.target.value) || null)}
                        className="input pl-12 appearance-none"
                        disabled={loadingClasses}
                      >
                        <option value="">
                          {loadingClasses ? 'Loading classes...' : 'Select Class *'}
                        </option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Father's Name */}
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="Father's Name *"
                        className="input pl-12"
                      />
                    </div>

                    {/* Mother's Name */}
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Mother's Name *"
                        className="input pl-12"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="input pl-12"
                        placeholder="Date of Birth"
                      />
                    </div>

                    {/* Gender */}
                    <div className="grid grid-cols-3 gap-2">
                      {['Male', 'Female', 'Other'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${gender === g
                              ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                              : 'border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/20'
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="input pl-12 pr-12"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="input pl-12"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  </motion.div>
                )}

                <p className="text-sm text-white/30">
                  By registering, your account will be reviewed by the school administration. You will be notified once approved.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full btn btn-primary py-4 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Register
                    </>
                  )}
                </button>
              </form>

              {/* Links */}
              <div className="mt-8 pt-8 border-t border-white/10 text-center space-y-3">
                <button
                  onClick={() => setStep('check')}
                  className="text-sm text-white/30 hover:text-white transition-colors"
                >
                  Check registration status
                </button>
                <div>
                  <span className="text-sm text-[var(--text-secondary)]">Already have an account? </span>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-sm text-[var(--accent-blue)] font-semibold hover:text-[var(--text-primary)] transition-colors"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
          Protected by Jesus Junior Academy Administration
        </p>
      </motion.div>
    </main>
  );
}
