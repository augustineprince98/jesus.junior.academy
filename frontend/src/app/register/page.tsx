'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registrationApi } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  GraduationCap,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Jesus Junior Academy</h1>
          <p className="text-gray-600">Digital Campus Registration</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 'success' ? (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your account is pending admin approval. You will be notified once your account is activated.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => setStep('check')}
                  className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
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
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Register
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-2">Check Registration Status</h2>
              <p className="text-gray-600 mb-6">Enter your phone number to check your approval status.</p>

              <form onSubmit={handleCheckStatus} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={checkPhone}
                    onChange={(e) => setCheckPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit Phone Number"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {statusResult && (
                  <div className={`p-4 rounded-xl ${
                    statusResult.status === 'APPROVED'
                      ? 'bg-green-50 border border-green-200'
                      : statusResult.status === 'REJECTED'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <p className={`font-semibold ${
                      statusResult.status === 'APPROVED'
                        ? 'text-green-800'
                        : statusResult.status === 'REJECTED'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                    }`}>
                      Status: {statusResult.status}
                    </p>
                    <p className={`text-sm mt-1 ${
                      statusResult.status === 'APPROVED'
                        ? 'text-green-600'
                        : statusResult.status === 'REJECTED'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      {statusResult.message}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Checking...' : 'Check Status'}
                </button>
              </form>
            </div>
          ) : (
            /* Registration Form */
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Create Account</h2>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit Phone Number"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    maxLength={10}
                    pattern="[0-9]{10}"
                  />
                </div>

                {/* Email (optional) */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('PARENT')}
                      className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                        role === 'PARENT'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Parent
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('STUDENT')}
                      className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                        role === 'STUDENT'
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      Student
                    </button>
                  </div>
                </div>

                {/* Student-specific fields */}
                {role === 'STUDENT' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm font-medium text-blue-800">Student Information</p>

                    {/* Class Selection */}
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={classId || ''}
                        onChange={(e) => setClassId(Number(e.target.value) || null)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white appearance-none"
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
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="Father's Name *"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Mother's Name */}
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="Mother's Name *"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                            gender === g
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  By registering, your account will be reviewed by the school administration. You will be notified once approved.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Register
                    </>
                  )}
                </button>
              </form>

              {/* Links */}
              <div className="mt-6 text-center space-y-2">
                <button
                  onClick={() => setStep('check')}
                  className="text-sm text-gray-600 hover:text-primary-600"
                >
                  Check registration status
                </button>
                <div>
                  <span className="text-sm text-gray-600">Already have an account? </span>
                  <button
                    onClick={() => router.push('/login')}
                    className="text-sm text-primary-600 font-semibold hover:text-primary-700"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
