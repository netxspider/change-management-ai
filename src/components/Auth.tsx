import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { KeyRound, Mail, Lock, Shield } from 'lucide-react';

interface AuthProps {
  onSignIn: () => void;
}

export function Auth({ onSignIn }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      // First, attempt to sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        setMessage("Successfully signed up! You can now sign in.");
        // Reset form
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // After successful sign in, check for MFA factors
        const { data: { factors } } = await supabase.auth.mfa.listFactors();
        
        if (factors && factors.length === 0) {
          // If no MFA is set up, enroll now
          const { data: factor, error: mfaError } = await supabase.auth.mfa.enroll({
            factorType: 'totp'
          });

          if (mfaError) throw mfaError;

          if (factor) {
            setFactorId(factor.id);
            setQrCode(factor.totp.qr_code);
            setShowMFASetup(true);
          }
        } else if (factors && factors.length > 0) {
          // If MFA is already set up, show verification
          setFactorId(factors[0].id);
          setShowMFASetup(true);
        } else {
          onSignIn();
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    try {
      setLoading(true);
      setError(null);

      if (factorId) {
        const { error } = await supabase.auth.mfa.challenge({ factorId });
        if (error) throw error;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          code: verifyCode,
        });

        if (verifyError) throw verifyError;
      }

      onSignIn();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            {showMFASetup ? 'Setup MFA' : 'Sign in to your account'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {!showMFASetup ? (
          <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Processing...' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-blue-600 rounded-md text-blue-600 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? 'Processing...' : 'Sign up'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            {qrCode && (
              <div className="flex justify-center bg-white p-4 rounded-lg">
                <QRCodeSVG value={qrCode} size={200} />
              </div>
            )}
            <p className="text-gray-300 text-center">
              {qrCode 
                ? 'Scan the QR code with your authenticator app and enter the code below'
                : 'Enter your authenticator code to sign in'}
            </p>
            <div>
              <label htmlFor="mfa-code" className="sr-only">MFA Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="mfa-code"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter MFA code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handleVerifyMFA}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}