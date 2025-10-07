import { motion } from 'framer-motion';
import { Clock, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const PendingApprovalPage = () => {
  const { user, userProfile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Clock className="w-10 h-10 text-yellow-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-center text-gray-800 mb-3"
          >
            Account Pending Approval
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-600 mb-8"
          >
            Your account has been created successfully and is awaiting approval from an administrator.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-50 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-tg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  Status: <span className="font-medium text-yellow-600">{userProfile?.status}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800 mb-1">What happens next?</p>
                  <p>An administrator will review your account and approve access. You'll receive an email notification once your account is activated.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              Check Status
            </button>

            <button
              onClick={signOut}
              className="w-full py-3 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <p className="text-center text-xs text-gray-500">
              Need help? Contact your system administrator
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
